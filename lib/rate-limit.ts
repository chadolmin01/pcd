/**
 * API Rate Limiter for PRD Validator
 * main 프로젝트와 동일한 구조, PRD에 맞게 간소화
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ================================================
// Rate Limit 설정 (분당 요청 수)
// ================================================
export const RATE_LIMITS = {
  // 인증된 사용자
  authenticated: {
    requestsPerMinute: 60,
    requestsPerHour: 500,
    requestsPerDay: 5000,
  },
  // 인증되지 않은 요청 (IP 기반)
  anonymous: {
    requestsPerMinute: 10,
    requestsPerHour: 50,
    requestsPerDay: 200,
  },
  // AI API 전용 (Gemini 유료 티어 기준)
  ai: {
    requestsPerMinute: 60,   // 5 → 60 (병렬 호출 허용)
    requestsPerHour: 500,    // 30 → 500
    requestsPerDay: 5000,    // 100 → 5000
  },
  // 로그인/회원가입 전용 (남용 방지)
  register: {
    requestsPerMinute: 3,
    requestsPerHour: 10,
    requestsPerDay: 20,
  },
} as const

export type RateLimitTier = keyof typeof RATE_LIMITS

// ================================================
// 메모리 기반 Rate Limit 저장소
// ================================================
interface RateLimitEntry {
  count: number
  resetAt: number
}

interface RateLimitStore {
  minute: Map<string, RateLimitEntry>
  hour: Map<string, RateLimitEntry>
  day: Map<string, RateLimitEntry>
}

const store: RateLimitStore = {
  minute: new Map(),
  hour: new Map(),
  day: new Map(),
}

// 정리 인터벌 (5분마다 만료된 항목 정리)
let cleanupInterval: NodeJS.Timeout | null = null
let isShuttingDown = false

function startCleanup() {
  if (cleanupInterval || isShuttingDown) return

  cleanupInterval = setInterval(() => {
    const now = Date.now()

    for (const [, map] of Object.entries(store)) {
      for (const [id, entry] of (map as Map<string, RateLimitEntry>).entries()) {
        if (entry.resetAt < now) {
          (map as Map<string, RateLimitEntry>).delete(id)
        }
      }
    }
  }, 5 * 60 * 1000)

  // unref()를 호출하여 이 타이머가 Node.js 프로세스 종료를 막지 않도록 함
  if (cleanupInterval.unref) {
    cleanupInterval.unref()
  }
}

/**
 * Rate limiter 정리 함수 (테스트 및 graceful shutdown용)
 */
export function stopCleanup() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval)
    cleanupInterval = null
  }
  isShuttingDown = true
}

/**
 * 모든 rate limit 데이터 초기화 (테스트용)
 */
export function resetRateLimitStore() {
  store.minute.clear()
  store.hour.clear()
  store.day.clear()
}

// 서버 시작 시 정리 시작 + graceful shutdown 핸들러 등록
if (typeof window === 'undefined') {
  startCleanup()

  // Graceful shutdown 핸들러
  const handleShutdown = () => {
    stopCleanup()
  }

  // 프로세스 종료 시그널 처리
  process.once('SIGTERM', handleShutdown)
  process.once('SIGINT', handleShutdown)
  process.once('beforeExit', handleShutdown)
}

// ================================================
// Rate Limit 체크 결과
// ================================================
export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetAt: number
  retryAfter?: number // 초 단위
  window: 'minute' | 'hour' | 'day'
}

// ================================================
// Rate Limit 체크 함수
// ================================================
export function checkRateLimit(
  identifier: string,
  tier: RateLimitTier = 'anonymous'
): RateLimitResult {
  const now = Date.now()
  const limits = RATE_LIMITS[tier]

  // 분 단위 체크
  const minuteResult = checkWindow(
    identifier,
    'minute',
    limits.requestsPerMinute,
    60 * 1000,
    now
  )
  if (!minuteResult.allowed) {
    return minuteResult
  }

  // 시간 단위 체크
  const hourResult = checkWindow(
    identifier,
    'hour',
    limits.requestsPerHour,
    60 * 60 * 1000,
    now
  )
  if (!hourResult.allowed) {
    return hourResult
  }

  // 일 단위 체크
  const dayResult = checkWindow(
    identifier,
    'day',
    limits.requestsPerDay,
    24 * 60 * 60 * 1000,
    now
  )
  if (!dayResult.allowed) {
    return dayResult
  }

  // 모든 체크 통과 - 카운트 증가
  incrementCount(identifier, 'minute', 60 * 1000, now)
  incrementCount(identifier, 'hour', 60 * 60 * 1000, now)
  incrementCount(identifier, 'day', 24 * 60 * 60 * 1000, now)

  return minuteResult
}

function checkWindow(
  identifier: string,
  window: 'minute' | 'hour' | 'day',
  limit: number,
  windowMs: number,
  now: number
): RateLimitResult {
  const key = `${identifier}:${window}`
  const map = store[window]
  const entry = map.get(key)

  if (!entry || entry.resetAt < now) {
    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      resetAt: now + windowMs,
      window,
    }
  }

  const remaining = limit - entry.count - 1

  if (remaining < 0) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      window,
    }
  }

  return {
    allowed: true,
    limit,
    remaining,
    resetAt: entry.resetAt,
    window,
  }
}

function incrementCount(
  identifier: string,
  window: 'minute' | 'hour' | 'day',
  windowMs: number,
  now: number
): void {
  const key = `${identifier}:${window}`
  const map = store[window]
  const entry = map.get(key)

  if (!entry || entry.resetAt < now) {
    map.set(key, {
      count: 1,
      resetAt: now + windowMs,
    })
  } else {
    entry.count++
  }
}

// ================================================
// Rate Limit 헤더 생성
// ================================================
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetAt / 1000).toString(),
    ...(result.retryAfter ? { 'Retry-After': result.retryAfter.toString() } : {}),
  }
}

// ================================================
// Rate Limit 에러 응답 생성
// ================================================
export function createRateLimitError(result: RateLimitResult) {
  const windowNames = {
    minute: '분',
    hour: '시간',
    day: '일',
  }

  return {
    success: false,
    error: 'Too Many Requests',
    message: `API 요청 한도를 초과했습니다. ${result.retryAfter}초 후에 다시 시도해주세요.`,
    code: 'RATE_LIMIT_EXCEEDED',
    details: {
      window: result.window,
      windowName: windowNames[result.window],
      limit: result.limit,
      resetAt: new Date(result.resetAt).toISOString(),
      retryAfter: result.retryAfter,
    },
  }
}

// ================================================
// 클라이언트 IP 가져오기
// ================================================
export function getClientIP(request: NextRequest | Request): string {
  const headers = request.headers

  // Cloudflare
  const cfIP = headers.get('cf-connecting-ip')
  if (cfIP) return cfIP

  // X-Forwarded-For (프록시/로드밸런서)
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  // X-Real-IP
  const realIP = headers.get('x-real-ip')
  if (realIP) return realIP

  return 'unknown'
}

// ================================================
// withRateLimit HOF (Higher Order Function)
// ================================================
interface RateLimitOptions {
  // AI 엔드포인트 (더 엄격한 제한)
  isAI?: boolean
  // 인증 필수 여부
  requireAuth?: boolean
  // 로그인/회원가입 엔드포인트 (남용 방지)
  isRegister?: boolean
}

/**
 * API 라우트에 Rate Limit을 적용합니다.
 *
 * @example
 * export const POST = withRateLimit(async (request) => {
 *   // ... handler logic
 * }, { isAI: true })
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<Response> | Response,
  options: RateLimitOptions = {}
): (request: NextRequest) => Promise<Response> {
  return async (request: NextRequest): Promise<Response> => {
    // 사용자 식별
    const { identifier, tier } = await getIdentifierAndTier(request, options)

    if (options.requireAuth && !identifier.startsWith('user:')) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // 엔드포인트 타입에 따른 티어 결정
    const effectiveTier = options.isRegister ? 'register' : options.isAI ? 'ai' : tier

    // Rate limit 체크
    const result = checkRateLimit(identifier, effectiveTier)
    const headers = getRateLimitHeaders(result)

    if (!result.allowed) {
      return NextResponse.json(createRateLimitError(result), {
        status: 429,
        headers,
      })
    }

    // 원래 핸들러 실행
    const response = await handler(request)

    // 응답에 Rate limit 헤더 추가
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  }
}

/**
 * 사용자 식별자와 티어를 가져옵니다.
 */
async function getIdentifierAndTier(
  request: NextRequest,
  _options: RateLimitOptions
): Promise<{ identifier: string; tier: RateLimitTier }> {
  // 인증된 사용자인지 확인
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const { data: { user } } = await supabase.auth.getUser(token)

      if (user) {
        return {
          identifier: `user:${user.id}`,
          tier: 'authenticated',
        }
      }
    }

    // 쿠키에서 세션 토큰 확인
    const accessToken = request.cookies.get('sb-access-token')?.value
    if (accessToken) {
      const { data: { user } } = await supabase.auth.getUser(accessToken)
      if (user) {
        return {
          identifier: `user:${user.id}`,
          tier: 'authenticated',
        }
      }
    }
  } catch {
    // 인증 실패 시 IP 기반으로 폴백
  }

  // 인증되지 않은 요청 - IP 기반
  const ip = getClientIP(request)
  return {
    identifier: `ip:${ip}`,
    tier: 'anonymous',
  }
}

// Legacy exports for backward compatibility
export { checkRateLimit as checkRateLimitLegacy }
export const RATE_LIMITS_LEGACY = {
  analyze: { limit: 5, windowSeconds: 60, prefix: 'analyze' },
  generateArtifacts: { limit: 3, windowSeconds: 60, prefix: 'artifacts' },
  userRegister: { limit: 5, windowSeconds: 300, prefix: 'register' },
  usageCheck: { limit: 30, windowSeconds: 60, prefix: 'usage' },
  default: { limit: 60, windowSeconds: 60, prefix: 'api' },
}
