import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/supabase';
import { extractCategories } from '@/lib/analytics/categoryExtractor';
import { checkRateLimit, getClientIP, getRateLimitHeaders, createRateLimitError } from '@/lib/rate-limit';
import { createHmac, randomBytes } from 'crypto';

/**
 * SECURITY FIX 1.2: Get hash salt - FAIL HARD if missing in production
 * No fallback values allowed to prevent predictable hash attacks
 */
function getHashSalt(): string {
  const salt = process.env.ANALYTICS_HASH_SALT;

  if (!salt) {
    if (process.env.NODE_ENV === 'production') {
      // CRITICAL: Halt operation, do not use fallback
      throw new Error('ANALYTICS_HASH_SALT is required in production');
    }
    // Development only - still logged as warning
    console.warn('[Security] Using dev salt - NOT FOR PRODUCTION');
    return 'dev-only-salt-never-use-in-production-' + process.pid;
  }

  // Validate salt strength (minimum 32 characters)
  if (salt.length < 32) {
    console.error('[Security] ANALYTICS_HASH_SALT should be at least 32 characters');
  }

  return salt;
}

/**
 * SECURITY FIX 1.3: Generate client fingerprint from request
 * Binds session to client identity to prevent hijacking
 */
function generateClientFingerprint(request: NextRequest): string {
  const ip = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const salt = getHashSalt();

  // HMAC prevents length extension attacks
  return createHmac('sha256', salt)
    .update(`${ip}|${userAgent}`)
    .digest('hex');
}

/**
 * SECURITY FIX 1.1: Generate secure session hash using HMAC-SHA256
 * - Uses server-generated nonce (not client timestamp)
 * - Includes client fingerprint for binding
 * - HMAC prevents length extension attacks
 */
function generateSecureSessionHash(
  sessionId: string,
  clientFingerprint: string
): string {
  const salt = getHashSalt();
  const serverNonce = randomBytes(16).toString('hex'); // Server-controlled entropy
  const timestamp = Date.now(); // Server timestamp, not client

  return createHmac('sha256', salt)
    .update(`${sessionId}|${clientFingerprint}|${serverNonce}|${timestamp}`)
    .digest('hex');
}

/**
 * Validate session hash format (64 hex characters)
 */
function isValidSessionHash(hash: string): boolean {
  return typeof hash === 'string' && /^[a-f0-9]{64}$/.test(hash);
}

/**
 * Validate sessionId format
 */
function isValidSessionId(sessionId: unknown): sessionId is string {
  return typeof sessionId === 'string' && sessionId.length > 0 && sessionId.length <= 100;
}

/**
 * Validate timestamp is a reasonable number
 */
function isValidTimestamp(timestamp: unknown): timestamp is number {
  if (typeof timestamp !== 'number' || isNaN(timestamp)) return false;
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return false;

  // Must be within reasonable range (not more than 1 day in future or 1 year in past)
  const now = Date.now();
  const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
  const oneDayFuture = now + 24 * 60 * 60 * 1000;

  return timestamp >= oneYearAgo && timestamp <= oneDayFuture;
}

/**
 * Validate personas array
 */
function isValidPersonas(personas: unknown): personas is string[] {
  return Array.isArray(personas) && personas.every(p => typeof p === 'string');
}

/**
 * POST /api/analytics/session
 * Handle session analytics data
 *
 * SECURITY: All sessions are bound to client fingerprint
 */
export async function POST(request: NextRequest) {
  // Rate limiting using existing infrastructure
  const ip = getClientIP(request);
  const rateLimitResult = checkRateLimit(`analytics:${ip}`, 'anonymous');

  if (!rateLimitResult.allowed) {
    return NextResponse.json(createRateLimitError(rateLimitResult), {
      status: 429,
      headers: getRateLimitHeaders(rateLimitResult),
    });
  }

  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch (e) {
    if (e instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to parse request body' },
      { status: 400 }
    );
  }

  try {
    // SECURITY FIX 1.2: Fail fast if salt missing in production
    getHashSalt(); // Will throw in production if not configured

    const supabase = createServerClient();

    // SECURITY FIX 1.3: Generate client fingerprint for binding
    const clientFingerprint = generateClientFingerprint(request);

    // Handle initialization
    if (body.action === 'initialize') {
      return handleInitialize(supabase, body, clientFingerprint);
    }

    // Handle regular updates - validate client fingerprint
    return handleUpdate(supabase, body, clientFingerprint);
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';

    // SECURITY: Don't expose internal error details
    if (errorMessage.includes('ANALYTICS_HASH_SALT')) {
      console.error('[CRITICAL] Missing required environment variable');
      return NextResponse.json(
        { error: 'Service configuration error' },
        { status: 503 }
      );
    }

    console.error('[Analytics API] Error:', errorMessage);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle session initialization
 * SECURITY FIX 1.1 & 1.3: Secure hash generation with client binding
 */
async function handleInitialize(
  supabase: ReturnType<typeof createServerClient>,
  body: Record<string, unknown>,
  clientFingerprint: string
) {
  const { sessionId, validationLevel, personas, interactionMode, sessionStart } = body;

  // Validate sessionId (SECURITY: restrict format to prevent injection)
  if (!isValidSessionId(sessionId)) {
    return NextResponse.json(
      { error: 'Invalid or missing sessionId' },
      { status: 400 }
    );
  }

  // Validate validation level
  if (typeof validationLevel !== 'string' || !['sketch', 'mvp', 'defense'].includes(validationLevel)) {
    return NextResponse.json(
      { error: 'Invalid validation level' },
      { status: 400 }
    );
  }

  // Validate personas (SECURITY: limit array size)
  if (!isValidPersonas(personas)) {
    return NextResponse.json(
      { error: 'Invalid personas array' },
      { status: 400 }
    );
  }
  if ((personas as string[]).length > 10) {
    return NextResponse.json(
      { error: 'Too many personas (max 10)' },
      { status: 400 }
    );
  }

  // Validate interaction mode
  if (interactionMode !== undefined &&
      (typeof interactionMode !== 'string' || !['individual', 'discussion'].includes(interactionMode))) {
    return NextResponse.json(
      { error: 'Invalid interaction mode' },
      { status: 400 }
    );
  }

  // Validate sessionStart timestamp
  if (!isValidTimestamp(sessionStart)) {
    return NextResponse.json(
      { error: 'Invalid sessionStart timestamp' },
      { status: 400 }
    );
  }

  // SECURITY FIX 1.1: Generate secure session hash (server-controlled nonce)
  const sessionHash = generateSecureSessionHash(sessionId, clientFingerprint);

  // SECURITY FIX 1.3: Store client fingerprint for session binding
  const { error } = await supabase.from('session_analytics').insert({
    session_hash: sessionHash,
    client_fingerprint: clientFingerprint, // Bind session to client
    validation_level: validationLevel,
    personas: personas,
    interaction_mode: interactionMode || 'individual',
    session_start: new Date(sessionStart as number).toISOString(),
    completion_status: 'in_progress',
  });

  if (error) {
    // SECURITY: Don't expose database error details
    console.error('[Analytics API] Insert error:', error.code);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }

  return NextResponse.json({ sessionHash });
}

/**
 * Handle session updates
 * SECURITY FIX 1.3: Validate client fingerprint before allowing updates
 */
async function handleUpdate(
  supabase: ReturnType<typeof createServerClient>,
  body: Record<string, unknown>,
  clientFingerprint: string
) {
  const { sessionHash, completionStatus } = body;

  // Validate session hash
  if (!isValidSessionHash(sessionHash as string)) {
    return NextResponse.json(
      { error: 'Invalid session hash' },
      { status: 400 }
    );
  }

  // SECURITY FIX 1.3: Verify session belongs to this client
  const { data: sessionData, error: lookupError } = await supabase
    .from('session_analytics')
    .select('client_fingerprint')
    .eq('session_hash', sessionHash)
    .single();

  if (lookupError || !sessionData) {
    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    );
  }

  // SECURITY: Constant-time comparison would be ideal, but fingerprint mismatch
  // already reveals session existence. The real protection is that attacker
  // cannot predict the fingerprint without access to the same IP + User-Agent
  if (sessionData.client_fingerprint && sessionData.client_fingerprint !== clientFingerprint) {
    // Log potential hijacking attempt
    console.warn('[Security] Session fingerprint mismatch - potential hijacking attempt');
    return NextResponse.json(
      { error: 'Session validation failed' },
      { status: 403 }
    );
  }

  // Build update object with type validation
  const updateData: Record<string, unknown> = {};

  // Validate and add turnCount
  if (body.turnCount !== undefined) {
    if (typeof body.turnCount !== 'number' || body.turnCount < 0 || !Number.isInteger(body.turnCount)) {
      return NextResponse.json({ error: 'Invalid turnCount' }, { status: 400 });
    }
    updateData.turn_count = body.turnCount;
  }

  // Validate and add scoreHistory
  if (body.scoreHistory !== undefined) {
    if (!Array.isArray(body.scoreHistory)) {
      return NextResponse.json({ error: 'Invalid scoreHistory' }, { status: 400 });
    }
    updateData.score_history = body.scoreHistory;
  }

  // Validate and add adviceShownCount
  if (body.adviceShownCount !== undefined) {
    if (typeof body.adviceShownCount !== 'number' || body.adviceShownCount < 0) {
      return NextResponse.json({ error: 'Invalid adviceShownCount' }, { status: 400 });
    }
    updateData.advice_shown_count = body.adviceShownCount;
  }

  // Validate and add adviceReflectedCount
  if (body.adviceReflectedCount !== undefined) {
    if (typeof body.adviceReflectedCount !== 'number' || body.adviceReflectedCount < 0) {
      return NextResponse.json({ error: 'Invalid adviceReflectedCount' }, { status: 400 });
    }
    updateData.advice_reflected_count = body.adviceReflectedCount;
  }

  // Add personaEngagement (object type, minimal validation)
  if (body.personaEngagement !== undefined) {
    if (typeof body.personaEngagement !== 'object' || body.personaEngagement === null) {
      return NextResponse.json({ error: 'Invalid personaEngagement' }, { status: 400 });
    }
    updateData.persona_engagement = body.personaEngagement;
  }

  // Add dropoffPoint
  if (body.dropoffPoint !== undefined) {
    if (typeof body.dropoffPoint !== 'string') {
      return NextResponse.json({ error: 'Invalid dropoffPoint' }, { status: 400 });
    }
    updateData.dropoff_point = body.dropoffPoint;
  }

  // Validate and add finalScore
  if (body.finalScore !== undefined) {
    if (typeof body.finalScore !== 'number' || body.finalScore < 0 || body.finalScore > 100) {
      return NextResponse.json({ error: 'Invalid finalScore' }, { status: 400 });
    }
    updateData.final_score = body.finalScore;
  }

  // Handle completion status
  if (completionStatus !== undefined) {
    if (typeof completionStatus !== 'string' ||
        !['in_progress', 'completed', 'abandoned', 'error'].includes(completionStatus)) {
      return NextResponse.json(
        { error: 'Invalid completion status' },
        { status: 400 }
      );
    }
    updateData.completion_status = completionStatus;

    // Set session end time for terminal states
    if (completionStatus !== 'in_progress') {
      updateData.session_end = new Date().toISOString();
    }
  }

  // Extract categories for completed sessions
  if (completionStatus === 'completed' && body._ideaTextForCategoryExtraction) {
    if (typeof body._ideaTextForCategoryExtraction === 'string') {
      try {
        const summary = typeof body._summaryForCategoryExtraction === 'string'
          ? body._summaryForCategoryExtraction
          : undefined;

        const result = await extractCategories(
          body._ideaTextForCategoryExtraction,
          summary
        );
        updateData.idea_categories = result.categories;
      } catch (e) {
        console.error('[Analytics API] Category extraction failed:', e);
        updateData.idea_categories = ['Other'];
      }
    }
  }

  // Update session record (already validated existence above)
  const { error } = await supabase
    .from('session_analytics')
    .update(updateData)
    .eq('session_hash', sessionHash)
    .eq('client_fingerprint', clientFingerprint); // Double-check binding

  if (error) {
    // SECURITY: Don't expose database error details
    console.error('[Analytics API] Update error:', error.code);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
