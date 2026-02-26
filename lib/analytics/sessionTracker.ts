'use client';

// Types (duplicated from components/idea-validator/types to avoid circular dependencies)
type PersonaRole = 'Developer' | 'Designer' | 'VC' | 'Marketer' | 'Legal' | 'PM' | 'CTO' | 'CFO' | 'EndUser' | 'Operations' | 'System';
type InteractionMode = 'individual' | 'discussion';

interface ScorecardItem {
  current: number;
  max: number;
  filled: boolean;
}

interface Scorecard {
  problemDefinition: ScorecardItem;
  solution: ScorecardItem;
  marketAnalysis: ScorecardItem;
  revenueModel: ScorecardItem;
  differentiation: ScorecardItem;
  logicalConsistency: ScorecardItem;
  feasibility: ScorecardItem;
  feedbackReflection: ScorecardItem;
  totalScore: number;
}

// Types
interface ScoreHistoryEntry {
  turn: number;
  score: number;
  delta: number;
  timestamp: number;
}

interface PersonaEngagement {
  [persona: string]: {
    adviceShown: number;
    adviceReflected: number;
  };
}

interface AnalyticsSessionState {
  sessionId: string;
  sessionHash: string;
  validationLevel: 'sketch' | 'mvp' | 'defense';
  personas: PersonaRole[];
  interactionMode: InteractionMode;
  turnCount: number;
  scoreHistory: ScoreHistoryEntry[];
  adviceShownCount: number;
  adviceReflectedCount: number;
  personaEngagement: PersonaEngagement;
  sessionStart: number;
  lastSyncedAt: number;
  isDirty: boolean;
  // SECURITY FIX 2.2: Version for optimistic concurrency control
  version: number;
}

interface PendingAnalytics {
  sessionHash: string;
  data: Record<string, unknown>;
  timestamp: number;
}

// Constants
const STORAGE_KEY = 'analytics_session';
const PENDING_STORAGE_KEY = 'analytics_pending';
const DEBOUNCE_MS = 5000;
const PENDING_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_IDEA_TEXT_LENGTH = 500; // Limit sensitive data exposure

// SECURITY FIX 4.1: Environment-aware logging
// Only log detailed messages in development
const isDev = process.env.NODE_ENV === 'development';

function debugLog(message: string, ...args: unknown[]): void {
  if (isDev) {
    console.log(`[Analytics] ${message}`, ...args);
  }
}

function debugWarn(message: string): void {
  if (isDev) {
    console.warn(`[Analytics] ${message}`);
  }
}

function debugError(message: string): void {
  // Always log errors but without sensitive details in production
  if (isDev) {
    console.error(`[Analytics] ${message}`);
  }
}

// Module-level state
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// Event handler references (for proper cleanup)
let beforeUnloadHandler: (() => void) | null = null;
let visibilityChangeHandler: (() => void) | null = null;

// SECURITY FIX 2.2: Pending initialization promise to prevent race conditions
let pendingInitialization: Promise<string | null> | null = null;
let initializationSessionId: string | null = null;

/**
 * Validate session state structure
 */
function isValidSessionState(data: unknown): data is AnalyticsSessionState {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.sessionId === 'string' &&
    typeof obj.sessionHash === 'string' &&
    typeof obj.validationLevel === 'string' &&
    Array.isArray(obj.personas) &&
    typeof obj.turnCount === 'number' &&
    Array.isArray(obj.scoreHistory)
  );
}

/**
 * Get current state from sessionStorage
 */
function getStoredState(): AnalyticsSessionState | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    if (!isValidSessionState(parsed)) {
      console.warn('[Analytics] Invalid session state, clearing');
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Save state to sessionStorage
 */
function saveState(state: AnalyticsSessionState): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('[Analytics] Failed to save state:', e);
  }
}

/**
 * SECURITY FIX 2.2: Atomic state update with optimistic concurrency control
 * Prevents race conditions by checking version before update
 * @returns true if update succeeded, false if state was modified by another operation
 */
function atomicUpdateState(
  sessionId: string,
  expectedVersion: number,
  updater: (state: AnalyticsSessionState) => AnalyticsSessionState
): boolean {
  const currentState = getStoredState();

  // Verify session ID and version match
  if (!currentState || currentState.sessionId !== sessionId) {
    return false;
  }

  if (currentState.version !== expectedVersion) {
    console.warn('[Analytics] Concurrent modification detected, retrying...');
    return false;
  }

  // Apply update with incremented version
  const newState = updater(currentState);
  newState.version = expectedVersion + 1;
  saveState(newState);
  return true;
}

/**
 * SECURITY FIX 2.2: Retry atomic update with backoff
 */
function atomicUpdateWithRetry(
  sessionId: string,
  updater: (state: AnalyticsSessionState) => AnalyticsSessionState,
  maxRetries: number = 3
): boolean {
  for (let i = 0; i < maxRetries; i++) {
    const currentState = getStoredState();
    if (!currentState || currentState.sessionId !== sessionId) {
      return false;
    }

    if (atomicUpdateState(sessionId, currentState.version, updater)) {
      return true;
    }

    // Brief delay before retry (exponential backoff)
    const delay = Math.pow(2, i) * 10;
    const start = Date.now();
    while (Date.now() - start < delay) {
      // Busy wait (synchronous delay for atomic operation)
    }
  }

  console.error('[Analytics] Failed to update state after retries');
  return false;
}

/**
 * Build payload for API request with defensive defaults
 */
function buildPayload(state: AnalyticsSessionState, completionStatus?: string) {
  return {
    sessionHash: state.sessionHash,
    validationLevel: state.validationLevel,
    personas: state.personas ?? [],
    interactionMode: state.interactionMode,
    turnCount: state.turnCount ?? 0,
    scoreHistory: state.scoreHistory ?? [],
    adviceShownCount: state.adviceShownCount ?? 0,
    adviceReflectedCount: state.adviceReflectedCount ?? 0,
    personaEngagement: state.personaEngagement ?? {},
    sessionStart: state.sessionStart,
    ...(completionStatus && { completionStatus }),
  };
}

/**
 * Sync state to server with debouncing
 * Uses fresh state read to avoid stale closure issues
 */
function syncToServer(immediate = false): void {
  const initialState = getStoredState();
  if (!initialState?.isDirty) return;

  const doSync = async () => {
    // Always read fresh state to avoid stale closure issues
    const freshState = getStoredState();
    if (!freshState || !freshState.isDirty || !freshState.sessionHash) return;

    try {
      const response = await fetch('/api/analytics/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(freshState)),
      });

      if (response.ok) {
        // Re-read to avoid overwriting concurrent changes
        const latestState = getStoredState();
        if (latestState && latestState.sessionId === freshState.sessionId) {
          latestState.lastSyncedAt = Date.now();
          latestState.isDirty = false;
          saveState(latestState);
        }
      }
    } catch (e) {
      console.error('[Analytics] Sync failed:', e);
    }
  };

  if (immediate) {
    doSync();
    return;
  }

  // Debounced sync
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(doSync, DEBOUNCE_MS);
}

/**
 * Cleanup event handlers
 */
function cleanupDropoffHandler(): void {
  if (typeof window === 'undefined') return;

  if (beforeUnloadHandler) {
    window.removeEventListener('beforeunload', beforeUnloadHandler);
    beforeUnloadHandler = null;
  }
  if (visibilityChangeHandler) {
    document.removeEventListener('visibilitychange', visibilityChangeHandler);
    visibilityChangeHandler = null;
  }
}

/**
 * Setup beforeunload handler for dropoff tracking
 * Stores handler references at module level for proper cleanup
 */
function setupDropoffHandler(): void {
  if (typeof window === 'undefined') return;

  // Clean up existing handlers first to prevent duplicates
  cleanupDropoffHandler();

  beforeUnloadHandler = () => {
    const state = getStoredState();
    if (state && state.sessionHash) {
      const dropoffPoint = state.turnCount > 0 ? `turn_${state.turnCount}` : 'before_start';
      trackDropoff(dropoffPoint);
    }
  };

  visibilityChangeHandler = () => {
    if (document.visibilityState === 'hidden') {
      const state = getStoredState();
      if (state && state.sessionHash && state.isDirty) {
        syncToServer(true); // Immediate sync
      }
    }
  };

  window.addEventListener('beforeunload', beforeUnloadHandler);
  document.addEventListener('visibilitychange', visibilityChangeHandler);
}

/**
 * Detect iOS Safari for sendBeacon workaround
 */
function isIOSSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !('MSStream' in window) &&
    /Safari/.test(navigator.userAgent);
}

/**
 * SECURITY FIX 3.4: Save analytics data to localStorage as fallback
 * - Minimizes stored data (no raw text)
 * - Enforces size limits
 * - Auto-expires old entries
 */
const MAX_PENDING_ENTRIES = 5;
const MAX_PENDING_DATA_SIZE = 1024; // 1KB per entry

function sanitizePendingData(data: Record<string, unknown>): Record<string, unknown> {
  // Only keep essential fields, remove any text content
  const safeFields = [
    'turnCount', 'finalScore', 'completionStatus', 'dropoffPoint',
    'adviceShownCount', 'adviceReflectedCount'
  ];

  const sanitized: Record<string, unknown> = {};
  for (const field of safeFields) {
    if (data[field] !== undefined) {
      sanitized[field] = data[field];
    }
  }

  // Include minimal score history (last 5 entries only)
  if (Array.isArray(data.scoreHistory)) {
    sanitized.scoreHistory = data.scoreHistory.slice(-5).map((entry: unknown) => {
      if (typeof entry === 'object' && entry !== null) {
        const e = entry as Record<string, unknown>;
        return { turn: e.turn, score: e.score };
      }
      return entry;
    });
  }

  return sanitized;
}

function savePendingAnalytics(sessionHash: string, data: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;

  try {
    let pending: PendingAnalytics[] = JSON.parse(
      localStorage.getItem(PENDING_STORAGE_KEY) || '[]'
    );

    // Remove expired entries
    const now = Date.now();
    pending = pending.filter(p => now - p.timestamp < PENDING_MAX_AGE_MS);

    // Limit number of pending entries
    if (pending.length >= MAX_PENDING_ENTRIES) {
      pending = pending.slice(-MAX_PENDING_ENTRIES + 1);
    }

    // Sanitize data before storing
    const sanitizedData = sanitizePendingData(data);

    // Check size limit
    const dataStr = JSON.stringify(sanitizedData);
    if (dataStr.length > MAX_PENDING_DATA_SIZE) {
      console.warn('[Analytics] Pending data too large, truncating');
      return;
    }

    pending.push({
      sessionHash,
      data: sanitizedData,
      timestamp: now,
    });

    localStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify(pending));
  } catch (e) {
    // SECURITY FIX 4.1: Don't expose error details
    console.error('[Analytics] Failed to save pending data');
  }
}

/**
 * Initialize analytics session
 * Called when a new validation session starts
 * SECURITY FIX 2.2: Uses atomic updates to prevent race conditions
 */
export function initializeAnalyticsSession(
  sessionId: string,
  level: 'sketch' | 'mvp' | 'defense',
  personas: PersonaRole[],
  interactionMode: InteractionMode = 'individual'
): void {
  if (typeof window === 'undefined') return;

  // Cleanup any existing session
  cleanupAnalyticsSession();

  const newState: AnalyticsSessionState = {
    sessionId,
    sessionHash: '', // Will be set by server
    validationLevel: level,
    personas,
    interactionMode,
    turnCount: 0,
    scoreHistory: [],
    adviceShownCount: 0,
    adviceReflectedCount: 0,
    personaEngagement: {},
    sessionStart: Date.now(),
    lastSyncedAt: 0,
    isDirty: true,
    version: 0, // SECURITY FIX 2.2: Initial version for concurrency control
  };

  saveState(newState);

  // SECURITY FIX 2.2: Track pending initialization to prevent race conditions
  initializationSessionId = sessionId;

  // Initialize on server and get session hash
  pendingInitialization = fetch('/api/analytics/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'initialize',
      sessionId,
      validationLevel: level,
      personas,
      interactionMode,
      sessionStart: newState.sessionStart,
    }),
  })
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      if (data.sessionHash) {
        // SECURITY FIX 2.2: Use atomic update with version check
        const updated = atomicUpdateWithRetry(sessionId, (state) => ({
          ...state,
          sessionHash: data.sessionHash,
          isDirty: false,
          lastSyncedAt: Date.now(),
        }));

        if (!updated) {
          console.warn('[Analytics] Session hash update failed - session may have changed');
        }

        return data.sessionHash;
      }
      return null;
    })
    .catch(e => {
      console.error('[Analytics] Init failed:', e);
      return null;
    })
    .finally(() => {
      // Clear pending state if this is still the current initialization
      if (initializationSessionId === sessionId) {
        pendingInitialization = null;
        initializationSessionId = null;
      }
    });

  // Setup beforeunload handler
  setupDropoffHandler();

  // Recover any pending analytics from previous sessions
  recoverAbandonedSession();
}

/**
 * SECURITY FIX 2.2: Wait for session initialization to complete
 * Call this before operations that require sessionHash
 */
export async function waitForSessionHash(): Promise<string | null> {
  if (pendingInitialization) {
    return pendingInitialization;
  }
  const state = getStoredState();
  return state?.sessionHash || null;
}

/**
 * Track turn completion with score changes
 * SECURITY FIX 2.2: Uses atomic updates to prevent race conditions
 */
export function trackTurn(
  turnNumber: number,
  newScorecard: Scorecard,
  prevScorecard: Scorecard | null,
  adviceCount: number,
  personaMap: Record<string, { shown: number; reflected: number }>
): void {
  const state = getStoredState();
  if (!state) return;

  // Calculate score delta
  const prevScore = prevScorecard?.totalScore ?? 0;
  const scoreDelta = newScorecard.totalScore - prevScore;

  // SECURITY FIX 2.2: Use atomic update with version check
  const updated = atomicUpdateWithRetry(state.sessionId, (currentState) => {
    // Add score to history with delta
    currentState.scoreHistory.push({
      turn: turnNumber,
      score: newScorecard.totalScore,
      delta: scoreDelta,
      timestamp: Date.now(),
    });

    return {
      ...currentState,
      turnCount: turnNumber,
      adviceShownCount: currentState.adviceShownCount + adviceCount,
      personaEngagement: Object.entries(personaMap).reduce(
        (acc, [persona, engagement]) => {
          if (!acc[persona]) {
            acc[persona] = { adviceShown: 0, adviceReflected: 0 };
          }
          acc[persona].adviceShown += engagement.shown;
          acc[persona].adviceReflected += engagement.reflected;
          return acc;
        },
        { ...currentState.personaEngagement }
      ),
      isDirty: true,
    };
  });

  if (updated) {
    syncToServer();
  }
}

/**
 * Track when user reflects on advice
 */
export function trackReflection(persona: string): void {
  const state = getStoredState();
  if (!state) return;

  state.adviceReflectedCount += 1;

  if (!state.personaEngagement[persona]) {
    state.personaEngagement[persona] = { adviceShown: 0, adviceReflected: 0 };
  }
  state.personaEngagement[persona].adviceReflected += 1;

  state.isDirty = true;
  saveState(state);
  syncToServer();
}

/**
 * Track session dropoff (user leaving without completion)
 * Uses sendBeacon with Blob for proper Content-Type, with localStorage fallback
 */
export function trackDropoff(point: string): void {
  const state = getStoredState();
  if (!state || !state.sessionHash) return;

  const payload: Record<string, unknown> = {
    sessionHash: state.sessionHash,
    dropoffPoint: point,
    completionStatus: 'abandoned',
    turnCount: state.turnCount,
    scoreHistory: state.scoreHistory,
    adviceShownCount: state.adviceShownCount,
    adviceReflectedCount: state.adviceReflectedCount,
    personaEngagement: state.personaEngagement,
  };

  // iOS Safari has 15-25% beacon failure rate - always use localStorage fallback
  if (isIOSSafari()) {
    savePendingAnalytics(state.sessionHash, payload);
  } else {
    // Try sendBeacon with proper Content-Type via Blob
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    const beaconSuccess = navigator.sendBeacon?.('/api/analytics/session', blob);

    if (!beaconSuccess) {
      savePendingAnalytics(state.sessionHash, payload);
    }
  }

  // Clear session state
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Track session completion with category extraction
 * Limits idea text exposure for security
 */
export async function trackCompletionWithCategories(
  finalScore: number,
  ideaText: string,
  summary?: string
): Promise<void> {
  const state = getStoredState();
  if (!state || !state.sessionHash) return;

  try {
    const response = await fetch('/api/analytics/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionHash: state.sessionHash,
        completionStatus: 'completed',
        finalScore,
        turnCount: state.turnCount,
        scoreHistory: state.scoreHistory,
        adviceShownCount: state.adviceShownCount,
        adviceReflectedCount: state.adviceReflectedCount,
        personaEngagement: state.personaEngagement,
        // Limit idea text for category extraction (discarded after extraction)
        _ideaTextForCategoryExtraction: ideaText.substring(0, MAX_IDEA_TEXT_LENGTH),
        _summaryForCategoryExtraction: summary?.substring(0, MAX_IDEA_TEXT_LENGTH),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    // Clear session state after successful completion
    cleanupAnalyticsSession();
  } catch (e) {
    console.error('[Analytics] Completion tracking failed:', e);
  }
}

/**
 * Recover abandoned session data from localStorage
 * Called at the start of new sessions
 * Uses Promise.allSettled to preserve failed entries for retry
 */
export async function recoverAbandonedSession(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const pendingStr = localStorage.getItem(PENDING_STORAGE_KEY);
    if (!pendingStr) return;

    const pending: PendingAnalytics[] = JSON.parse(pendingStr);
    if (pending.length === 0) return;

    const now = Date.now();
    const valid = pending.filter(p => now - p.timestamp < PENDING_MAX_AGE_MS);

    if (valid.length === 0) {
      localStorage.removeItem(PENDING_STORAGE_KEY);
      return;
    }

    // Try to send valid entries
    const results = await Promise.allSettled(
      valid.map(p =>
        fetch('/api/analytics/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionHash: p.sessionHash,
            ...p.data,
            _recovered: true,
          }),
        }).then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res;
        })
      )
    );

    // Keep failed entries for retry
    const stillPending = valid.filter((_, i) => results[i].status === 'rejected');

    if (stillPending.length > 0) {
      localStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify(stillPending));
    } else {
      localStorage.removeItem(PENDING_STORAGE_KEY);
    }
  } catch (e) {
    console.error('[Analytics] Failed to recover pending data:', e);
  }
}

/**
 * Cleanup analytics session resources
 * Call when session ends or component unmounts
 */
export function cleanupAnalyticsSession(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  cleanupDropoffHandler();

  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Get current session ID (for external use)
 */
export function getAnalyticsSessionId(): string | null {
  const state = getStoredState();
  return state?.sessionId || null;
}

/**
 * Check if analytics session is active
 */
export function isAnalyticsSessionActive(): boolean {
  const state = getStoredState();
  return state !== null && state.sessionHash !== '';
}
