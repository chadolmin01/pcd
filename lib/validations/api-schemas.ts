/**
 * API 요청 검증 스키마 (Zod)
 * 외부 입력의 런타임 검증 + TypeScript 타입 추론
 */

import { z } from 'zod';

// Level 타입 정의
export const LevelSchema = z.enum(['sketch', 'mvp', 'investor']);
export type Level = z.infer<typeof LevelSchema>;

// 페르소나 ID 목록
const VALID_PERSONAS = [
  'Developer', 'Designer', 'VC', 'Marketer',
  'Legal', 'PM', 'CTO', 'CFO', 'EndUser', 'Operations'
] as const;

export const PersonaSchema = z.enum(VALID_PERSONAS);
export type Persona = z.infer<typeof PersonaSchema>;

// 스코어카드 카테고리 스키마
const CategoryScoreSchema = z.object({
  current: z.number().min(0).max(15),
  max: z.number().min(0).max(15),
  filled: z.boolean(),
});

// 스코어카드 스키마
export const ScorecardSchema = z.object({
  problemDefinition: CategoryScoreSchema,
  solution: CategoryScoreSchema,
  marketAnalysis: CategoryScoreSchema,
  revenueModel: CategoryScoreSchema,
  differentiation: CategoryScoreSchema,
  logicalConsistency: CategoryScoreSchema,
  feasibility: CategoryScoreSchema,
  feedbackReflection: CategoryScoreSchema,
  totalScore: z.number().min(0).max(100),
}).nullable();

// 인터랙션 모드
export const InteractionModeSchema = z.enum(['individual', 'discussion']);
export type InteractionMode = z.infer<typeof InteractionModeSchema>;

// Staff-level Reflection History 스키마
const ScorecardCategorySchema = z.enum([
  'problemDefinition', 'solution', 'marketAnalysis', 'revenueModel',
  'differentiation', 'logicalConsistency', 'feasibility', 'feedbackReflection'
]);

export const StagedReflectionSchema = z.object({
  role: PersonaSchema,
  reflectedText: z.string().max(2000),
  turn: z.number().int().min(1).max(20),
  impactScore: z.enum(['low', 'medium', 'high']).optional(),
  linkedCategories: z.array(ScorecardCategorySchema).optional(),
});

export const ScoreEvolutionSchema = z.object({
  category: ScorecardCategorySchema,
  turn: z.number().int().min(1).max(20),
  from: z.number().min(0).max(15),
  to: z.number().min(0).max(15),
  delta: z.number().min(0).max(15),
  reason: z.string().max(500),
});

// 아이디어 검증 API 요청 스키마
export const AnalyzeRequestSchema = z.object({
  idea: z.string()
    .min(1, '아이디어를 입력해주세요')
    .max(10000, '아이디어가 너무 깁니다 (최대 10,000자)'),
  conversationHistory: z.array(z.string()).default([]),
  level: LevelSchema.default('mvp'),
  personas: z.array(PersonaSchema).min(1).max(5).default(['Developer', 'Designer', 'VC']),
  currentScorecard: ScorecardSchema.default(null),
  turnNumber: z.number().int().min(1).max(10).default(1),
  interactionMode: InteractionModeSchema.default('individual'),
  // Staff-level Reflection History (Phase 2)
  stagedReflections: z.array(StagedReflectionSchema).default([]),
  scoreEvolution: z.array(ScoreEvolutionSchema).default([]),
});

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

// 합성 API 요청 스키마
export const SynthesizeRequestSchema = z.object({
  idea: z.string().min(1).max(10000),
  opinions: z.array(z.object({
    persona: PersonaSchema,
    opinion: z.string().max(5000),
  })).min(1).max(10),
  personas: z.array(PersonaSchema).min(1).max(5),
  scorecard: ScorecardSchema,
  turnNumber: z.number().int().min(1).max(10).default(1),
  level: LevelSchema.default('mvp'),
});

export type SynthesizeRequest = z.infer<typeof SynthesizeRequestSchema>;

// 아티팩트 생성 API 요청 스키마
export const GenerateArtifactsRequestSchema = z.object({
  idea: z.string().min(1).max(10000),
  conversationHistory: z.array(z.string()).default([]),
  level: LevelSchema.default('mvp'),
  score: z.number().min(0).max(100).optional(),
});

export type GenerateArtifactsRequest = z.infer<typeof GenerateArtifactsRequestSchema>;

/**
 * 안전한 JSON 파싱 + Zod 검증
 * @param body - request.json() 결과
 * @param schema - Zod 스키마
 * @returns 검증된 데이터 또는 에러
 */
export function validateRequest<T>(
  body: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(body);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Zod 에러 메시지 포맷팅
  const messages = result.error.issues.map(issue =>
    `${issue.path.join('.')}: ${issue.message}`
  );
  return { success: false, error: messages.join(', ') };
}

/**
 * API 에러 응답 생성 헬퍼
 */
export function createErrorResponse(message: string, status: number = 400) {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { 'Content-Type': 'application/json' } }
  );
}
