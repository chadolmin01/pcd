/**
 * Vercel AI SDK용 Zod 스키마
 * streamObject에서 사용
 */

import { z } from 'zod';

// 토론 턴 스키마
export const DiscussionTurnSchema = z.object({
  persona: z.string().describe('발언자 영어 ID (Developer|Designer|VC|Marketer|Legal|PM|CTO|CFO|EndUser|Operations)'),
  message: z.string().describe('발언 내용 2-3문장 (한국어)'),
  replyTo: z.string().nullable().optional().describe('반응 대상 영어 ID'),
  tone: z.enum(['agree', 'disagree', 'question', 'suggestion', 'neutral']).describe('톤'),
});

// Perspective 스키마
export const PerspectiveSchema = z.object({
  perspectiveId: z.string().describe('관점 ID'),
  perspectiveLabel: z.string().describe('관점 한글 라벨'),
  content: z.string().describe('조언 내용 2-3문장'),
  suggestedActions: z.array(z.string()).optional().describe('실행 방안'),
});

// 페르소나 응답 스키마
export const PersonaResponseSchema = z.object({
  role: z.string().describe('페르소나 영어 ID'),
  name: z.string().describe('페르소나 한글명'),
  content: z.string().describe('핵심 피드백 1문장'),
  tone: z.string().optional().describe('톤'),
  perspectives: z.array(PerspectiveSchema).optional().describe('3가지 관점별 조언'),
});

// 메트릭스 스키마
export const MetricsSchema = z.object({
  score: z.number().optional().describe('총점'),
  keyRisks: z.array(z.string()).optional().describe('핵심 리스크'),
  keyStrengths: z.array(z.string()).optional().describe('핵심 강점'),
  summary: z.string().describe('종합 평가 2-3문장'),
});

// 카테고리 업데이트 스키마
export const CategoryUpdateSchema = z.object({
  category: z.string().describe('카테고리 ID'),
  delta: z.number().describe('점수 변화량'),
  reason: z.string().describe('변화 이유'),
});

// 카테고리 점수 스키마
export const CategoryScoreSchema = z.object({
  current: z.number().describe('현재 점수'),
  max: z.number().describe('최대 점수'),
  filled: z.boolean().describe('채움 여부'),
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
  totalScore: z.number().describe('총점'),
});

// 입력 관련성 스키마
export const InputRelevanceSchema = z.object({
  isRelevant: z.boolean().describe('입력이 관련 있는지'),
  reason: z.string().optional().describe('판단 근거'),
  warningMessage: z.string().optional().describe('관련 없을 때 안내 메시지'),
});

// 전체 응답 스키마
export const DiscussionResponseSchema = z.object({
  discussion: z.array(DiscussionTurnSchema).min(4).max(6).describe('토론 턴들 (4-6개)'),
  responses: z.array(PersonaResponseSchema).min(3).describe('페르소나별 최종 제안 (최소 3개)'),
  metrics: MetricsSchema.describe('종합 메트릭스'),
  scorecard: ScorecardSchema.describe('업데이트된 스코어카드'),
  categoryUpdates: z.array(CategoryUpdateSchema).describe('카테고리별 점수 변화'),
  inputRelevance: InputRelevanceSchema.optional().describe('입력 관련성'),
});

export type DiscussionResponse = z.infer<typeof DiscussionResponseSchema>;
export type DiscussionTurn = z.infer<typeof DiscussionTurnSchema>;
