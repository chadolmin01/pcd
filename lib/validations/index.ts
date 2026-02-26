/**
 * Validation 모듈 - API 요청/응답 검증
 */

// 요청 스키마 (외부 입력 검증)
export {
  LevelSchema,
  PersonaSchema,
  ScorecardSchema,
  InteractionModeSchema,
  AnalyzeRequestSchema,
  SynthesizeRequestSchema,
  GenerateArtifactsRequestSchema,
  validateRequest,
  createErrorResponse,
} from './api-schemas';

export type {
  Level,
  Persona,
  InteractionMode,
  AnalyzeRequest,
  SynthesizeRequest,
  GenerateArtifactsRequest,
} from './api-schemas';

// 응답 스키마 (AI 응답 검증)
export {
  PerspectiveSchema,
  PersonaResponseSchema,
  MetricsSchema,
  InputRelevanceSchema,
  ScorecardResponseSchema,
  CategoryUpdateSchema,
  AnalyzeResponseSchema,
  BusinessPlanResponseSchema,
  OpinionChunkSchema,
  DiscussionTurnSchema,
  safeJsonParse,
  extractAndParseJson,
  parseStreamChunk,
} from './response-schemas';

export type {
  AnalyzeResponse,
  BusinessPlanResponse,
  DiscussionTurn,
  ParseResult,
} from './response-schemas';

// 스코어카드 점수 보정 유틸리티
export {
  applyScoreCorrections,
  preValidateInput,
} from './score-corrections';

export type {
  CategoryUpdateItem,
  ParsedWithScorecard,
  InputRelevance,
  ScoreCorrectionResult,
} from './score-corrections';
