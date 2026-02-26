/**
 * Gemini Structured Outputs용 JSON Schema
 *
 * 프롬프트에서 JSON 템플릿 제거 → API 레벨에서 스키마 강제
 * 토큰 60% 절감 + 파싱 에러 0%
 */

import { SchemaType, Schema } from '@google/generative-ai';

// ============================================
// 스코어카드 카테고리 상수
// ============================================

export const SCORECARD_MAX_VALUES = {
  problemDefinition: 15,
  solution: 15,
  marketAnalysis: 10,
  revenueModel: 10,
  differentiation: 10,
  logicalConsistency: 15,
  feasibility: 15,
  feedbackReflection: 10,
} as const;

export const SCORECARD_CATEGORIES = Object.keys(SCORECARD_MAX_VALUES) as Array<keyof typeof SCORECARD_MAX_VALUES>;

// ============================================
// 공통 스키마 빌더
// ============================================

const CategoryScoreSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    current: { type: SchemaType.NUMBER, description: '현재 점수' },
    max: { type: SchemaType.NUMBER, description: '최대 점수' },
    filled: { type: SchemaType.BOOLEAN, description: '채워짐 여부' },
  },
  required: ['current', 'max', 'filled'],
};

const PerspectiveSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    perspectiveId: { type: SchemaType.STRING, description: '관점 ID' },
    perspectiveLabel: { type: SchemaType.STRING, description: '관점 한글 라벨' },
    content: { type: SchemaType.STRING, description: '조언 내용 2-3문장' },
    suggestedActions: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: '실행 방안',
    },
  },
  required: ['perspectiveId', 'perspectiveLabel', 'content'],
};

const PersonaResponseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    role: { type: SchemaType.STRING, description: '페르소나 역할 (Developer, Designer, VC 등)' },
    name: { type: SchemaType.STRING, description: '페르소나 한글 이름' },
    content: { type: SchemaType.STRING, description: '핵심 피드백 1문장' },
    tone: { type: SchemaType.STRING, description: '톤 (Analytical, Supportive 등)' },
    perspectives: {
      type: SchemaType.ARRAY,
      items: PerspectiveSchema,
      description: '3가지 관점별 조언',
    },
  },
  required: ['role', 'name', 'content'],
};

const MetricsSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    score: { type: SchemaType.NUMBER, description: '총점' },
    developerScore: { type: SchemaType.STRING, description: '개발자 관점 점수 설명' },
    designerScore: { type: SchemaType.STRING, description: '디자이너 관점 점수 설명' },
    vcScore: { type: SchemaType.STRING, description: 'VC 관점 점수 설명' },
    keyRisks: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: '핵심 리스크',
    },
    keyStrengths: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: '핵심 강점',
    },
    summary: { type: SchemaType.STRING, description: '요약 1문장' },
  },
  required: ['score', 'keyRisks', 'keyStrengths', 'summary'],
};

const ScorecardSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    problemDefinition: CategoryScoreSchema,
    solution: CategoryScoreSchema,
    marketAnalysis: CategoryScoreSchema,
    revenueModel: CategoryScoreSchema,
    differentiation: CategoryScoreSchema,
    logicalConsistency: CategoryScoreSchema,
    feasibility: CategoryScoreSchema,
    feedbackReflection: CategoryScoreSchema,
    totalScore: { type: SchemaType.NUMBER, description: '총점 (0-100)' },
  },
  required: [
    'problemDefinition', 'solution', 'marketAnalysis', 'revenueModel',
    'differentiation', 'logicalConsistency', 'feasibility', 'feedbackReflection', 'totalScore'
  ],
};

const CategoryUpdateSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    category: { type: SchemaType.STRING, description: '카테고리명' },
    delta: { type: SchemaType.NUMBER, description: '점수 변화량' },
    reason: { type: SchemaType.STRING, description: '변화 이유' },
  },
  required: ['category', 'delta', 'reason'],
};

const DiscussionTurnSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    persona: { type: SchemaType.STRING, description: '발언자 영어 ID (Developer|Designer|VC|Marketer|Legal|PM|CTO|CFO|EndUser|Operations)' },
    message: { type: SchemaType.STRING, description: '발언 내용 2-3문장 (한국어)' },
    replyTo: { type: SchemaType.STRING, nullable: true, description: '반응 대상 영어 ID (Developer|Designer|VC 등)' },
    tone: { type: SchemaType.STRING, description: 'agree|disagree|question|suggestion|neutral' },
  },
  required: ['persona', 'message', 'tone'],
};

const InputRelevanceSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    isRelevant: { type: SchemaType.BOOLEAN, description: '입력이 관련 있는지' },
    reason: { type: SchemaType.STRING, description: '판단 근거' },
    warningMessage: { type: SchemaType.STRING, description: '관련 없을 때 안내 메시지' },
  },
  required: ['isRelevant'],
};

// ============================================
// API별 응답 스키마
// ============================================

/**
 * /analyze API 응답 스키마 (비토론 모드)
 */
export const AnalyzeResponseGeminiSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    responses: {
      type: SchemaType.ARRAY,
      items: PersonaResponseSchema,
      description: '페르소나별 응답',
    },
    metrics: MetricsSchema,
    scorecard: ScorecardSchema,
    categoryUpdates: {
      type: SchemaType.ARRAY,
      items: CategoryUpdateSchema,
      description: '카테고리별 점수 변화',
    },
    inputRelevance: InputRelevanceSchema,
  },
  required: ['responses', 'metrics', 'scorecard', 'categoryUpdates', 'inputRelevance'],
};

/**
 * /analyze API 응답 스키마 (토론 모드)
 */
export const DiscussionResponseGeminiSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    discussion: {
      type: SchemaType.ARRAY,
      items: DiscussionTurnSchema,
      description: '토론 턴들 (4-5개)',
    },
    responses: {
      type: SchemaType.ARRAY,
      items: PersonaResponseSchema,
      description: '페르소나별 최종 제안',
    },
    metrics: MetricsSchema,
    scorecard: ScorecardSchema,
    categoryUpdates: {
      type: SchemaType.ARRAY,
      items: CategoryUpdateSchema,
      description: '카테고리별 점수 변화',
    },
    inputRelevance: InputRelevanceSchema,
  },
  required: ['discussion', 'responses', 'metrics', 'scorecard', 'categoryUpdates', 'inputRelevance'],
};

/**
 * 병렬 모드 개별 의견 스키마 (Flash용 - 간단)
 */
export const IndividualOpinionGeminiSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    opinion: { type: SchemaType.STRING, description: '의견 2-3문장' },
    positive: { type: SchemaType.STRING, description: '긍정적인 점' },
    concern: { type: SchemaType.STRING, description: '우려/질문' },
  },
  required: ['opinion'],
};

/**
 * 병렬 모드 합성 스키마 (Pro용)
 */
export const SynthesisResponseGeminiSchema: Schema = DiscussionResponseGeminiSchema;
