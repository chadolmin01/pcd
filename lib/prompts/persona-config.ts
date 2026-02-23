/**
 * 페르소나 설정 및 카테고리 매핑
 */

export interface CategoryScore {
  current: number;
  max: number;
  filled: boolean;
}

export interface Scorecard {
  problemDefinition: CategoryScore;
  solution: CategoryScore;
  marketAnalysis: CategoryScore;
  revenueModel: CategoryScore;
  differentiation: CategoryScore;
  logicalConsistency: CategoryScore;
  feasibility: CategoryScore;
  feedbackReflection: CategoryScore;
  totalScore: number;
}

export const CATEGORY_INFO: Record<string, { nameKo: string; max: number }> = {
  problemDefinition: { nameKo: '문제 정의', max: 15 },
  solution: { nameKo: '솔루션', max: 15 },
  marketAnalysis: { nameKo: '시장 분석', max: 10 },
  revenueModel: { nameKo: '수익 모델', max: 10 },
  differentiation: { nameKo: '차별화', max: 10 },
  logicalConsistency: { nameKo: '논리 일관성', max: 15 },
  feasibility: { nameKo: '실현 가능성', max: 15 },
  feedbackReflection: { nameKo: '피드백 반영', max: 10 },
};

export const PERSONA_CATEGORY_MAP: Record<string, { primary: string[]; secondary: string[] }> = {
  Developer: {
    primary: ['solution', 'feasibility'],
    secondary: ['differentiation'],
  },
  Designer: {
    primary: ['solution', 'problemDefinition'],
    secondary: ['differentiation'],
  },
  VC: {
    primary: ['marketAnalysis', 'revenueModel'],
    secondary: ['differentiation', 'logicalConsistency'],
  },
  Marketer: {
    primary: ['marketAnalysis', 'differentiation'],
    secondary: ['revenueModel'],
  },
  Legal: {
    primary: ['feasibility', 'logicalConsistency'],
    secondary: ['differentiation'],
  },
  PM: {
    primary: ['problemDefinition', 'solution'],
    secondary: ['logicalConsistency'],
  },
  CTO: {
    primary: ['solution', 'feasibility'],
    secondary: ['logicalConsistency'],
  },
  CFO: {
    primary: ['revenueModel', 'feasibility'],
    secondary: ['marketAnalysis'],
  },
  EndUser: {
    primary: ['problemDefinition'],
    secondary: ['solution', 'differentiation'],
  },
  Operations: {
    primary: ['feasibility', 'logicalConsistency'],
    secondary: ['solution'],
  },
};

export const PERSONA_DESCRIPTIONS: Record<string, { nameKo: string; role: string; focus: string }> = {
  Developer: {
    nameKo: '개발자',
    role: '기술 전문가',
    focus: '기술적 실현 가능성, 아키텍처 설계, 개발 비용, 기술 스택, 개발 기간을 검토합니다.',
  },
  Designer: {
    nameKo: '디자이너',
    role: 'UX/UI 전문가',
    focus: '사용자 경험, UI 디자인, 브랜드 일관성, 사용성, 접근성을 검토합니다.',
  },
  VC: {
    nameKo: '투자자',
    role: '벤처 캐피탈리스트',
    focus: '시장성, 수익 모델, 성장 잠재력, 경쟁 우위, 투자 매력도를 검토합니다.',
  },
  Marketer: {
    nameKo: '마케터',
    role: '마케팅 전문가',
    focus: 'GTM 전략, 고객 획득 비용(CAC), 브랜딩, 마케팅 채널, 바이럴 가능성을 검토합니다.',
  },
  Legal: {
    nameKo: '법률 전문가',
    role: '법률 고문',
    focus: '규제 준수, 개인정보보호, 지적재산권, 법적 리스크, 컴플라이언스를 검토합니다.',
  },
  PM: {
    nameKo: '프로덕트 매니저',
    role: 'PM',
    focus: '제품 로드맵, 기능 우선순위, 사용자 니즈, 제품-시장 적합성(PMF)을 검토합니다.',
  },
  CTO: {
    nameKo: 'CTO',
    role: '기술 임원',
    focus: '기술 전략, 시스템 확장성, 보안, 기술 부채, 팀 구성을 검토합니다.',
  },
  CFO: {
    nameKo: 'CFO',
    role: '재무 임원',
    focus: '재무 모델, 번레이트, 수익성, 자금 조달, 재무 리스크를 검토합니다.',
  },
  EndUser: {
    nameKo: '최종 사용자',
    role: '타겟 고객',
    focus: '실제 사용 편의성, 문제 해결 여부, 가격 적정성, 구매 의향을 검토합니다.',
  },
  Operations: {
    nameKo: '운영 전문가',
    role: '운영 담당자',
    focus: '운영 효율성, 프로세스 최적화, 확장 가능성, 고객 지원 체계를 검토합니다.',
  },
};

export const ALLOWED_PERSPECTIVE_IDS: Record<string, { id: string; labelKo: string }[]> = {
  Developer: [
    { id: 'security', labelKo: '보안 우선' },
    { id: 'speed', labelKo: '빠른 출시' },
    { id: 'scalability', labelKo: '확장성' },
    { id: 'data-structure', labelKo: '데이터 구조' },
    { id: 'infra-cost', labelKo: '인프라 비용' },
    { id: 'api-design', labelKo: 'API 설계' },
    { id: 'realtime', labelKo: '실시간 처리' },
    { id: 'offline', labelKo: '오프라인 지원' },
    { id: 'ai-ml', labelKo: 'AI/ML 활용' },
    { id: 'location', labelKo: '위치 기반' },
    { id: 'integration', labelKo: '외부 연동' },
    { id: 'performance', labelKo: '성능 최적화' },
  ],
  Designer: [
    { id: 'usability', labelKo: '사용성' },
    { id: 'aesthetics', labelKo: '심미성' },
    { id: 'accessibility', labelKo: '접근성' },
    { id: 'onboarding', labelKo: '온보딩' },
    { id: 'gamification', labelKo: '게임화' },
    { id: 'mobile-first', labelKo: '모바일 우선' },
    { id: 'simplicity', labelKo: '단순함' },
    { id: 'personalization', labelKo: '개인화' },
    { id: 'emotional', labelKo: '감성 디자인' },
    { id: 'consistency', labelKo: '일관성' },
    { id: 'feedback', labelKo: '피드백 UX' },
    { id: 'trust', labelKo: '신뢰감' },
  ],
  VC: [
    { id: 'revenue', labelKo: '수익 모델' },
    { id: 'market-size', labelKo: '시장 규모' },
    { id: 'moat', labelKo: '진입장벽' },
    { id: 'unit-economics', labelKo: '유닛 이코노믹스' },
    { id: 'timing', labelKo: '시장 타이밍' },
    { id: 'team', labelKo: '팀 역량' },
    { id: 'network-effect', labelKo: '네트워크 효과' },
    { id: 'retention', labelKo: '리텐션' },
    { id: 'exit', labelKo: '엑싯 전략' },
    { id: 'regulation', labelKo: '규제 환경' },
    { id: 'global', labelKo: '글로벌 확장' },
    { id: 'viral', labelKo: '바이럴 성장' },
  ],
};

export const SCORECARD_CATEGORIES = [
  'problemDefinition', 'solution', 'marketAnalysis', 'revenueModel',
  'differentiation', 'logicalConsistency', 'feasibility', 'feedbackReflection'
] as const;

export type ScorecardCategory = typeof SCORECARD_CATEGORIES[number];

export const TARGET_SCORES: Record<string, number> = {
  sketch: 40,
  mvp: 65,
  investor: 85,
};
