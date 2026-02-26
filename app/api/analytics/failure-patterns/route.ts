import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/supabase';
import { checkRateLimit, getRateLimitHeaders, createRateLimitError } from '@/lib/rate-limit';
import { timingSafeEqual, createHash } from 'crypto';

/**
 * SECURITY FIX 2.5: Constant-time comparison WITHOUT length oracle
 * Pads both tokens to fixed length to prevent timing attacks on length
 */
const TOKEN_BUFFER_SIZE = 128; // Fixed buffer size for constant-time comparison

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.ANALYTICS_API_TOKEN;

  if (!expectedToken) {
    console.warn('[Security] ANALYTICS_API_TOKEN not configured');
    return false;
  }

  const providedToken = authHeader?.replace('Bearer ', '') || '';

  // SECURITY FIX: Pad both tokens to fixed length to prevent length oracle
  // This ensures comparison takes constant time regardless of input length
  const providedBuffer = Buffer.alloc(TOKEN_BUFFER_SIZE, 0);
  const expectedBuffer = Buffer.alloc(TOKEN_BUFFER_SIZE, 0);

  // Copy tokens into fixed-size buffers (truncated if too long)
  Buffer.from(providedToken.slice(0, TOKEN_BUFFER_SIZE)).copy(providedBuffer);
  Buffer.from(expectedToken.slice(0, TOKEN_BUFFER_SIZE)).copy(expectedBuffer);

  try {
    // Constant-time comparison of padded buffers
    const buffersEqual = timingSafeEqual(providedBuffer, expectedBuffer);

    // Also verify lengths match (checked AFTER constant-time comparison)
    // This prevents length oracle while still rejecting wrong-length tokens
    return buffersEqual && providedToken.length === expectedToken.length;
  } catch {
    return false;
  }
}

interface DropoffDistribution {
  point: string;
  count: number;
  percentage: number;
}

interface ScoreCompletionRate {
  scoreRange: string;
  totalSessions: number;
  completedSessions: number;
  completionRate: number;
}

interface CategorySuccessRate {
  category: string;
  totalSessions: number;
  completedSessions: number;
  averageFinalScore: number;
  successRate: number;
}

interface FailurePatternsReport {
  period: {
    start: string;
    end: string;
  };
  totalSessions: number;
  completedSessions: number;
  abandonedSessions: number;
  overallCompletionRate: number;
  dropoffDistribution: DropoffDistribution[];
  scoreCompletionRates: ScoreCompletionRate[];
  categorySuccessRates: CategorySuccessRate[];
  levelBreakdown: {
    level: string;
    sessions: number;
    completionRate: number;
    averageScore: number;
  }[];
  engagementMetrics: {
    averageTurnCount: number;
    averageAdviceReflectionRate: number;
    topPerformingPersonas: {
      persona: string;
      reflectionRate: number;
    }[];
  };
}

// Constants for validation
const MAX_DAYS = 365;
const MIN_DAYS = 1;

/**
 * GET /api/analytics/failure-patterns
 * Get failure pattern analysis report
 */
export async function GET(request: NextRequest) {
  // Auth check first
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Rate limiting for authenticated endpoint
  const tokenHash = createHash('sha256')
    .update(process.env.ANALYTICS_API_TOKEN || '')
    .digest('hex')
    .substring(0, 16);

  const rateLimitResult = checkRateLimit(`analytics-report:${tokenHash}`, 'authenticated');
  if (!rateLimitResult.allowed) {
    return NextResponse.json(createRateLimitError(rateLimitResult), {
      status: 429,
      headers: getRateLimitHeaders(rateLimitResult),
    });
  }

  try {
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days') || '30';
    const level = searchParams.get('level');

    // Validate days parameter with bounds
    const days = parseInt(daysParam, 10);
    if (isNaN(days) || days < MIN_DAYS || days > MAX_DAYS) {
      return NextResponse.json(
        { error: `Invalid days parameter (must be ${MIN_DAYS}-${MAX_DAYS})` },
        { status: 400 }
      );
    }

    // Validate level parameter if provided
    if (level && !['sketch', 'mvp', 'defense'].includes(level)) {
      return NextResponse.json(
        { error: 'Invalid level parameter' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build query with specific columns (not select('*'))
    let query = supabase
      .from('session_analytics')
      .select(`
        id,
        session_hash,
        validation_level,
        completion_status,
        dropoff_point,
        final_score,
        turn_count,
        idea_categories,
        advice_shown_count,
        advice_reflected_count,
        persona_engagement,
        score_history
      `)
      .gte('session_start', startDate.toISOString())
      .lte('session_start', endDate.toISOString());

    if (level) {
      query = query.eq('validation_level', level);
    }

    const { data: sessions, error } = await query;

    if (error) {
      // SECURITY FIX 2.3: Don't expose database error details
      console.error('[Failure Patterns API] Query error:', error.code);
      return NextResponse.json(
        { error: 'Failed to fetch data' },
        { status: 500 }
      );
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        totalSessions: 0,
        message: 'No data available for the specified period',
      });
    }

    // Build report
    const report = buildReport(sessions, startDate, endDate);

    return NextResponse.json(report, {
      headers: getRateLimitHeaders(rateLimitResult),
    });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    console.error('[Failure Patterns API] Error:', errorMessage);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Build the failure patterns report from session data
 */
function buildReport(
  sessions: Array<{
    id: string;
    session_hash: string;
    validation_level: string;
    completion_status: string;
    dropoff_point: string | null;
    final_score: number | null;
    turn_count: number;
    idea_categories: string[] | null;
    advice_shown_count: number;
    advice_reflected_count: number;
    persona_engagement: Record<string, { adviceShown: number; adviceReflected: number }> | null;
    score_history: Array<{ turn: number; score: number }> | null;
  }>,
  startDate: Date,
  endDate: Date
): FailurePatternsReport {
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter(s => s.completion_status === 'completed').length;
  const abandonedSessions = sessions.filter(s => s.completion_status === 'abandoned').length;

  // Dropoff distribution
  const dropoffCounts: Record<string, number> = {};
  sessions.forEach(s => {
    if (s.dropoff_point) {
      dropoffCounts[s.dropoff_point] = (dropoffCounts[s.dropoff_point] || 0) + 1;
    }
  });

  const dropoffDistribution: DropoffDistribution[] = Object.entries(dropoffCounts)
    .map(([point, count]) => ({
      point,
      count,
      // Guard against division by zero
      percentage: abandonedSessions > 0
        ? Math.round((count / abandonedSessions) * 100 * 10) / 10
        : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Score completion rates
  const scoreRanges = [
    { min: 0, max: 25, label: '0-25' },
    { min: 26, max: 50, label: '26-50' },
    { min: 51, max: 75, label: '51-75' },
    { min: 76, max: 100, label: '76-100' },
  ];

  const scoreCompletionRates: ScoreCompletionRate[] = scoreRanges.map(range => {
    const inRange = sessions.filter(s =>
      s.final_score !== null &&
      s.final_score >= range.min &&
      s.final_score <= range.max
    );
    const completed = inRange.filter(s => s.completion_status === 'completed');

    return {
      scoreRange: range.label,
      totalSessions: inRange.length,
      completedSessions: completed.length,
      completionRate: inRange.length > 0
        ? Math.round((completed.length / inRange.length) * 100 * 10) / 10
        : 0,
    };
  });

  // Category success rates with null safety
  const categoryStats: Record<string, { total: number; completed: number; scores: number[] }> = {};
  sessions.forEach(s => {
    const categories = s.idea_categories ?? [];
    categories.forEach(cat => {
      if (!categoryStats[cat]) {
        categoryStats[cat] = { total: 0, completed: 0, scores: [] };
      }
      categoryStats[cat].total++;
      if (s.completion_status === 'completed') {
        categoryStats[cat].completed++;
        if (s.final_score !== null) {
          categoryStats[cat].scores.push(s.final_score);
        }
      }
    });
  });

  const categorySuccessRates: CategorySuccessRate[] = Object.entries(categoryStats)
    .map(([category, stats]) => ({
      category,
      totalSessions: stats.total,
      completedSessions: stats.completed,
      averageFinalScore: stats.scores.length > 0
        ? Math.round(stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length)
        : 0,
      successRate: stats.total > 0
        ? Math.round((stats.completed / stats.total) * 100 * 10) / 10
        : 0,
    }))
    .sort((a, b) => b.totalSessions - a.totalSessions);

  // Level breakdown
  const levelStats: Record<string, { sessions: number; completed: number; scores: number[] }> = {};
  sessions.forEach(s => {
    if (!levelStats[s.validation_level]) {
      levelStats[s.validation_level] = { sessions: 0, completed: 0, scores: [] };
    }
    levelStats[s.validation_level].sessions++;
    if (s.completion_status === 'completed') {
      levelStats[s.validation_level].completed++;
      if (s.final_score !== null) {
        levelStats[s.validation_level].scores.push(s.final_score);
      }
    }
  });

  const levelBreakdown = Object.entries(levelStats).map(([level, stats]) => ({
    level,
    sessions: stats.sessions,
    completionRate: stats.sessions > 0
      ? Math.round((stats.completed / stats.sessions) * 100 * 10) / 10
      : 0,
    averageScore: stats.scores.length > 0
      ? Math.round(stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length)
      : 0,
  }));

  // Engagement metrics with null safety
  const turnCounts = sessions.map(s => s.turn_count ?? 0);
  const averageTurnCount = turnCounts.length > 0
    ? Math.round(turnCounts.reduce((a, b) => a + b, 0) / turnCounts.length * 10) / 10
    : 0;

  const reflectionRates = sessions
    .filter(s => (s.advice_shown_count ?? 0) > 0)
    .map(s => (s.advice_reflected_count ?? 0) / (s.advice_shown_count ?? 1));
  const averageAdviceReflectionRate = reflectionRates.length > 0
    ? Math.round(reflectionRates.reduce((a, b) => a + b, 0) / reflectionRates.length * 100 * 10) / 10
    : 0;

  // Persona engagement aggregation with null safety
  const personaStats: Record<string, { shown: number; reflected: number }> = {};
  sessions.forEach(s => {
    const engagement = s.persona_engagement ?? {};
    Object.entries(engagement).forEach(([persona, data]) => {
      if (!personaStats[persona]) {
        personaStats[persona] = { shown: 0, reflected: 0 };
      }
      personaStats[persona].shown += data?.adviceShown ?? 0;
      personaStats[persona].reflected += data?.adviceReflected ?? 0;
    });
  });

  const topPerformingPersonas = Object.entries(personaStats)
    .filter(([, stats]) => stats.shown > 0)
    .map(([persona, stats]) => ({
      persona,
      reflectionRate: Math.round((stats.reflected / stats.shown) * 100 * 10) / 10,
    }))
    .sort((a, b) => b.reflectionRate - a.reflectionRate)
    .slice(0, 5);

  return {
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    },
    totalSessions,
    completedSessions,
    abandonedSessions,
    overallCompletionRate: totalSessions > 0
      ? Math.round((completedSessions / totalSessions) * 100 * 10) / 10
      : 0,
    dropoffDistribution,
    scoreCompletionRates,
    categorySuccessRates,
    levelBreakdown,
    engagementMetrics: {
      averageTurnCount,
      averageAdviceReflectionRate,
      topPerformingPersonas,
    },
  };
}
