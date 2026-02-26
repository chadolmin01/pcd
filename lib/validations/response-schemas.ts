/**
 * AI 응답 검증 스키마 (Zod)
 * Gemini API 응답의 런타임 검증
 */

import { z } from 'zod';

// ============================================
// 공통 스키마
// ============================================

// Perspective 스키마
export const PerspectiveSchema = z.object({
  perspectiveId: z.string(),
  perspectiveLabel: z.string(),
  content: z.string(),
  suggestedActions: z.array(z.string()).optional(),
  isReflected: z.boolean().optional(),
  reflectedText: z.string().optional(),
});

// 페르소나 응답 스키마
export const PersonaResponseSchema = z.object({
  role: z.string(),
  name: z.string(),
  content: z.string(),
  tone: z.string().optional(),
  perspectives: z.array(PerspectiveSchema).optional(),
  suggestedActions: z.array(z.string()).optional(),
});

// 메트릭스 스키마
export const MetricsSchema = z.object({
  score: z.number(),
  developerScore: z.union([z.number(), z.string()]).optional(),
  designerScore: z.union([z.number(), z.string()]).optional(),
  vcScore: z.union([z.number(), z.string()]).optional(),
  keyRisks: z.array(z.string()).optional(),
  keyStrengths: z.array(z.string()).optional(),
  summary: z.string().optional(),
});

// 입력 관련성 판단 스키마
export const InputRelevanceSchema = z.object({
  isRelevant: z.boolean(),
  reason: z.string().optional(),
  warningMessage: z.string().optional(),
});

// 카테고리 점수 스키마
export const CategoryScoreSchema = z.object({
  current: z.number(),
  max: z.number(),
  filled: z.boolean(),
});

// 스코어카드 스키마
export const ScorecardResponseSchema = z.object({
  problemDefinition: CategoryScoreSchema,
  solution: CategoryScoreSchema,
  marketAnalysis: CategoryScoreSchema,
  revenueModel: CategoryScoreSchema,
  differentiation: CategoryScoreSchema,
  logicalConsistency: CategoryScoreSchema,
  feasibility: CategoryScoreSchema,
  feedbackReflection: CategoryScoreSchema,
  totalScore: z.number(),
});

// 카테고리 업데이트 스키마
export const CategoryUpdateSchema = z.object({
  category: z.string(),
  delta: z.number(),
  reason: z.string().optional(),
});

// ============================================
// 비스트리밍 API 응답 스키마
// ============================================

// /analyze API 응답
export const AnalyzeResponseSchema = z.object({
  responses: z.array(PersonaResponseSchema),
  metrics: MetricsSchema.optional(),
  scorecard: ScorecardResponseSchema.optional(),
  categoryUpdates: z.array(CategoryUpdateSchema).optional(),
  discussion: z.array(z.object({
    persona: z.string(),
    message: z.string(),
    replyTo: z.string().nullish(),  // string | null | undefined 모두 허용
    tone: z.string(),
  })).optional(),
  // 입력 관련성 판단 (엉뚱한 입력 감지)
  inputRelevance: InputRelevanceSchema.optional(),
});

export type AnalyzeResponse = z.infer<typeof AnalyzeResponseSchema>;

// /synthesize API 응답 (비즈니스 플랜)
export const BusinessPlanResponseSchema = z.object({
  basicInfo: z.object({
    itemName: z.string().optional(),
    oneLiner: z.string().optional(),
    targetCustomer: z.string().optional(),
    industry: z.string().optional(),
  }).optional(),
  sectionData: z.object({
    problem: z.object({
      market_status: z.string().optional(),
      problem_definition: z.string().optional(),
      development_necessity: z.string().optional(),
    }).optional(),
    solution: z.object({
      development_plan: z.string().optional(),
      differentiation: z.string().optional(),
      competitiveness: z.string().optional(),
    }).optional(),
    scaleup: z.object({
      business_model: z.string().optional(),
      market_size: z.string().optional(),
      roadmap: z.string().optional(),
    }).optional(),
    team: z.object({
      founder: z.string().optional(),
      team_members: z.string().optional(),
      team_synergy: z.string().optional(),
    }).optional(),
  }).optional(),
  schedule: z.array(z.object({
    no: z.string(),
    content: z.string(),
    period: z.string(),
    detail: z.string(),
  })).optional(),
  budget: z.array(z.object({
    category: z.string(),
    detail: z.string(),
    amount: z.string(),
  })).optional(),
  teamTable: z.array(z.object({
    no: z.string(),
    position: z.string(),
    role: z.string(),
    capability: z.string(),
    status: z.string(),
  })).optional(),
  partners: z.array(z.object({
    no: z.string(),
    name: z.string(),
    capability: z.string(),
    plan: z.string(),
    period: z.string(),
  })).optional(),
});

export type BusinessPlanResponse = z.infer<typeof BusinessPlanResponseSchema>;

// ============================================
// 스트리밍 API 청크 스키마
// ============================================

// 개별 의견 청크 (analyze-parallel)
export const OpinionChunkSchema = z.object({
  persona: z.string(),
  message: z.string(),
  tone: z.string().optional(),
});

// 토론 턴 청크
export const DiscussionTurnSchema = z.object({
  persona: z.string(),
  message: z.string(),
  replyTo: z.string().nullish(),  // string | null | undefined 모두 허용
  tone: z.string(),
});

export type DiscussionTurn = z.infer<typeof DiscussionTurnSchema>;

// ============================================
// 안전한 JSON 파싱 유틸리티
// ============================================

export type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; raw?: string };

/**
 * 안전한 JSON 파싱 + Zod 검증
 * @param text - JSON 문자열
 * @param schema - Zod 스키마
 * @returns 검증된 데이터 또는 에러
 */
export function safeJsonParse<T>(
  text: string,
  schema: z.ZodSchema<T>
): ParseResult<T> {
  try {
    // 1. JSON 파싱
    const parsed = JSON.parse(text);

    // 2. Zod 스키마 검증
    const result = schema.safeParse(parsed);

    if (result.success) {
      return { success: true, data: result.data };
    }

    // 검증 실패 시 상세 에러
    const errors = result.error.issues.map(i =>
      `${i.path.join('.')}: ${i.message}`
    ).join(', ');

    return { success: false, error: `스키마 검증 실패: ${errors}`, raw: text };
  } catch (e) {
    return {
      success: false,
      error: `JSON 파싱 실패: ${e instanceof Error ? e.message : 'Unknown error'}`,
      raw: text.substring(0, 500)  // 디버깅용 앞부분만
    };
  }
}

/**
 * 마크다운 코드블록에서 JSON 추출 후 파싱
 * (레거시 호환 - synthesize API용)
 */
export function extractAndParseJson<T>(
  text: string,
  schema: z.ZodSchema<T>
): ParseResult<T> {
  // 마크다운 코드블록 제거 시도
  let jsonStr = text;
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  return safeJsonParse(jsonStr, schema);
}

/**
 * 스트리밍 청크 파싱 (구분자 기반)
 */
export function parseStreamChunk<T>(
  chunk: string,
  schema: z.ZodSchema<T>
): ParseResult<T> {
  const trimmed = chunk.trim();
  if (!trimmed) {
    return { success: false, error: '빈 청크' };
  }

  return safeJsonParse(trimmed, schema);
}
