export type PersonaRole = 'Developer' | 'Designer' | 'VC' | 'Marketer' | 'Legal' | 'PM' | 'CTO' | 'CFO' | 'EndUser' | 'Operations' | 'System';

// 인터랙션 모드: 개별 조언 vs 토론
export type InteractionMode = 'individual' | 'discussion';

// 토론 모드에서 각 턴의 메시지
export interface DiscussionTurn {
  persona: PersonaRole;
  message: string;
  replyTo?: PersonaRole | null;  // 누구에게 답하는지 (null이면 아이디어에 대한 첫 발언)
  tone: 'agree' | 'disagree' | 'question' | 'suggestion' | 'neutral';
}

// 페르소나 프리셋 정의
export interface PersonaPreset {
  id: PersonaRole;
  name: string;
  nameKo: string;
  description: string;
  detailDescription: string; // 모달용 상세 설명
  checkPoints: string[]; // 검토 포인트 목록
  icon: string; // lucide icon name
  color: string; // tailwind color classes
}

export const PERSONA_PRESETS: PersonaPreset[] = [
  {
    id: 'Developer',
    name: 'Developer',
    nameKo: '개발자',
    description: '기술적 실현 가능성, 아키텍처, 개발 비용을 검토합니다.',
    detailDescription: '시니어 풀스택 개발자의 관점에서 아이디어를 분석합니다. 기술 스택 선택, 시스템 아키텍처, MVP 개발 범위, 기술 부채 등을 종합적으로 검토하여 실현 가능한 개발 계획을 제시합니다.',
    checkPoints: ['기술 스택 적합성', '개발 복잡도 예측', 'MVP 범위 설정', '확장성 고려', '기술 부채 리스크'],
    icon: 'Cpu',
    color: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  {
    id: 'Designer',
    name: 'Designer',
    nameKo: '디자이너',
    description: 'UX/UI, 사용자 경험, 브랜드 일관성을 검토합니다.',
    detailDescription: '프로덕트 디자이너의 관점에서 사용자 경험을 분석합니다. 사용자 여정, 인터페이스 설계, 접근성, 브랜드 아이덴티티를 고려하여 사용자 중심의 제품 설계 방향을 제안합니다.',
    checkPoints: ['사용자 여정 설계', 'UI/UX 복잡도', '접근성 고려', '브랜드 일관성', '경쟁 서비스 대비 차별점'],
    icon: 'Paintbrush',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  {
    id: 'VC',
    name: 'VC',
    nameKo: '투자자',
    description: '시장성, 수익 모델, 성장 잠재력을 검토합니다.',
    detailDescription: '벤처캐피탈 파트너의 관점에서 투자 매력도를 분석합니다. 시장 규모, 경쟁 환경, 수익 모델의 지속 가능성, 팀 역량, 성장 잠재력을 종합적으로 평가합니다.',
    checkPoints: ['TAM/SAM/SOM 분석', '경쟁 우위 확보', '수익 모델 검증', '스케일업 가능성', '투자 회수 시나리오'],
    icon: 'DollarSign',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    id: 'Marketer',
    name: 'Marketer',
    nameKo: '마케터',
    description: 'GTM 전략, 고객 획득, 브랜딩을 검토합니다.',
    detailDescription: '그로스 마케터의 관점에서 시장 진입 전략을 분석합니다. 타겟 고객 정의, 고객 획득 채널, CAC/LTV 예측, 바이럴 가능성을 검토하여 효과적인 마케팅 전략을 제안합니다.',
    checkPoints: ['타겟 고객 명확성', 'CAC/LTV 예측', '채널 전략', '바이럴 포인트', '브랜드 포지셔닝'],
    icon: 'Megaphone',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    id: 'Legal',
    name: 'Legal',
    nameKo: '법률 전문가',
    description: '규제, 컴플라이언스, 법적 리스크를 검토합니다.',
    detailDescription: '스타트업 전문 변호사의 관점에서 법적 리스크를 분석합니다. 개인정보보호, 산업 규제, 지적재산권, 계약 관계 등 법적 쟁점을 사전에 파악하여 리스크를 최소화합니다.',
    checkPoints: ['개인정보보호법 준수', '산업별 규제 확인', '지적재산권 보호', '이용약관 설계', '책임 제한 조항'],
    icon: 'Scale',
    color: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  {
    id: 'PM',
    name: 'PM',
    nameKo: '프로덕트 매니저',
    description: '제품 로드맵, 우선순위, 사용자 니즈를 검토합니다.',
    detailDescription: '시니어 PM의 관점에서 제품 전략을 분석합니다. 사용자 문제 정의, 기능 우선순위, 로드맵 설계, 성공 지표 정의를 통해 제품의 방향성을 명확히 합니다.',
    checkPoints: ['문제-해결 적합성', '기능 우선순위', 'MVP 정의', '성공 지표(KPI)', '로드맵 타당성'],
    icon: 'ClipboardList',
    color: 'bg-violet-50 text-violet-700 border-violet-200',
  },
  {
    id: 'CTO',
    name: 'CTO',
    nameKo: 'CTO',
    description: '기술 전략, 확장성, 보안을 검토합니다.',
    detailDescription: '스타트업 CTO의 관점에서 기술 전략을 분석합니다. 기술 선택의 장기적 영향, 팀 빌딩 전략, 보안 아키텍처, 인프라 확장성을 고려한 기술 로드맵을 제시합니다.',
    checkPoints: ['기술 스택 장기 전략', '보안 아키텍처', '확장성 설계', '기술 팀 빌딩', '기술 부채 관리'],
    icon: 'Server',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    id: 'CFO',
    name: 'CFO',
    nameKo: 'CFO',
    description: '재무 모델, 번레이트, 수익성을 검토합니다.',
    detailDescription: '스타트업 CFO의 관점에서 재무 건전성을 분석합니다. 초기 비용 구조, 번레이트 예측, 손익분기점, 자금 조달 전략을 검토하여 지속 가능한 재무 계획을 수립합니다.',
    checkPoints: ['초기 비용 추정', '번레이트 예측', '손익분기점 분석', '자금 조달 시나리오', '유닛 이코노믹스'],
    icon: 'Calculator',
    color: 'bg-lime-50 text-lime-700 border-lime-200',
  },
  {
    id: 'EndUser',
    name: 'End User',
    nameKo: '최종 사용자',
    description: '실제 사용자 관점에서 편의성과 가치를 검토합니다.',
    detailDescription: '실제 타겟 사용자의 관점에서 제품 가치를 분석합니다. 일상에서의 사용 시나리오, 기존 솔루션 대비 장점, 지불 의향, 추천 가능성을 현실적으로 평가합니다.',
    checkPoints: ['실제 사용 시나리오', '기존 대안 비교', '지불 의향(WTP)', '추천 의향(NPS)', '습관 형성 가능성'],
    icon: 'User',
    color: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  {
    id: 'Operations',
    name: 'Operations',
    nameKo: '운영 전문가',
    description: '운영 효율성, 프로세스, 확장 가능성을 검토합니다.',
    detailDescription: 'COO의 관점에서 운영 가능성을 분석합니다. 일상 운영 프로세스, 고객 지원 체계, 파트너십 관리, 품질 관리 시스템을 검토하여 효율적인 운영 체계를 설계합니다.',
    checkPoints: ['운영 프로세스 설계', '고객 지원 체계', '품질 관리 시스템', '파트너십 관리', '운영 확장성'],
    icon: 'Settings',
    color: 'bg-stone-100 text-stone-600 border-stone-200',
  },
];

// 기본 선택 페르소나
export const DEFAULT_PERSONAS: PersonaRole[] = ['Developer', 'Designer', 'VC'];

// 서브 관점별 조언
export interface PerspectiveAdvice {
  perspectiveId: string;      // 관점 ID (e.g., 'security', 'speed')
  perspectiveLabel: string;   // 관점 라벨 (e.g., '보안', '개발속도')
  content: string;            // 해당 관점에서의 조언
  suggestedActions?: string[]; // 구체적인 실행 방안
  isReflected?: boolean;      // 이 조언을 선택했는지
  reflectedText?: string;     // 사용자가 작성한 결정
}

export interface PersonaResponse {
  role: PersonaRole;
  name: string;
  avatar: string;
  content: string;            // 기존 호환성을 위해 유지 (첫 번째 조언 또는 요약)
  tone: 'Critical' | 'Skeptical' | 'Analytical' | 'Neutral' | 'Supportive'; // Added Supportive for Level 1
  suggestedActions?: string[]; // AI provided actionable options
  isReflected?: boolean; // Tracks if user accepted this advice
  reflectedText?: string; // The actual text the user decided to reflect (editable)
  // 새로운 필드: 서브 관점별 조언
  perspectives?: PerspectiveAdvice[];  // AI가 선택한 3개 관점별 조언
}

export interface AnalysisMetrics {
  score: number; // 0-100 overall
  developerScore: number;
  designerScore: number;
  vcScore: number;
  keyRisks: string[]; // List of accumulated risks
  keyStrengths: string[]; // List of validated strengths
  summary: string; // Brief status summary
}

// 입력 관련성 판단 결과
export interface InputRelevance {
  isRelevant: boolean;
  reason?: string;
  warningMessage?: string;
}

export interface AnalysisResult {
  responses: PersonaResponse[];
  metrics: AnalysisMetrics;
  ideaCategory?: string;  // AI가 분류한 아이디어 카테고리 (핀테크, 헬스케어 등)
  scorecard?: Scorecard;           // Progressive scorecard (신규)
  categoryUpdates?: CategoryUpdate[]; // 이번 턴의 점수 변동 내역 (신규)
  discussion?: DiscussionTurn[];   // 토론 모드일 때 페르소나 간 대화
  inputRelevance?: InputRelevance; // 입력 관련성 판단 (신규)
  warning?: string;                // 경고 메시지 (신규)
}

// 개별 의견 (병렬 호출 결과)
export interface PersonaOpinion {
  persona: string;
  message: string;
  tone?: 'positive' | 'concern' | 'neutral';  // 긍정/우려/중립
}

// 결정 멘트
export interface ClosingRemark {
  persona: string;
  message: string;
}

// 대기 중 대화
export interface WaitingMessage {
  persona: string;
  message: string;
}

export interface ChatMessage {
  id: string;
  isUser: boolean;
  text?: string;
  responses?: PersonaResponse[]; // AI responses come as a set of persona comments
  discussion?: DiscussionTurn[]; // 토론 모드일 때 페르소나 간 대화
  opinions?: PersonaOpinion[]; // 병렬 모드: 개별 의견
  closingRemarks?: ClosingRemark[]; // 병렬 모드: 결정 멘트
  waitingMessages?: WaitingMessage[]; // 병렬 모드: 합성 대기 중 대화
  timestamp: number;
  isStreaming?: boolean; // 스트리밍 중인지 여부
  streamPhase?: 'opinions' | 'closing' | 'waiting' | 'discussion' | 'final'; // 스트리밍 단계
}

export interface PersonaScores {
  developer: number;
  designer: number;
  vc: number;
}

export interface ActionItems {
  developer: string[];
  designer: string[];
  vc: string[];
}

// New Structured Data Types for Rich UI
export interface PrdFeature {
  name: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  effort: 'Low' | 'Medium' | 'High';
}

export interface PrdStructure {
  projectName: string;
  version: string;
  tagline: string;
  overview: string;
  targetAudience: string[];
  coreFeatures: PrdFeature[];
  techStack: string[];
  successMetrics: string[];
  userFlow: string; // Keep as simple text or steps
}

export interface JdStructure {
  roleTitle: string;
  department: string; // e.g., Engineering, Design
  companyIntro: string;
  responsibilities: string[];
  qualifications: string[];
  preferred: string[];
  benefits: string[];
}

export interface Artifacts {
  prd: PrdStructure; // Changed from string to object
  jd: JdStructure;   // Changed from string to object
  score: number;
  ideaSummary: string; // Summary of the idea
  personaScores: PersonaScores; // Breakdown of scores
  actionPlan: ActionItems; // Concrete to-do list
}

export enum AppState {
  ONBOARDING = 'ONBOARDING',
  SELECTION = 'SELECTION',
  CHAT = 'CHAT',
  RESULT = 'RESULT',
  WORKFLOW = 'WORKFLOW', // 지원사업 준비 워크플로우 모드
}

export interface OnboardingData {
  name: string;
  organization: string;
  email: string;
  privacyConsent: boolean;
}

export enum ValidationLevel {
  SKETCH = 'SKETCH',   // Level 1: Idea Sketch (Fast/Beginner)
  MVP = 'MVP',         // Level 2: MVP Building (Standard)
  DEFENSE = 'DEFENSE', // Level 3: Investor Defense (Pro/Hardcore)
}

// ============================================
// Progressive Scorecard System
// ============================================

export type ScorecardCategory =
  | 'problemDefinition'
  | 'solution'
  | 'marketAnalysis'
  | 'revenueModel'
  | 'differentiation'
  | 'logicalConsistency'
  | 'feasibility'
  | 'feedbackReflection';

export interface CategoryScore {
  current: number;  // 현재 점수
  max: number;      // 최대 점수
  filled: boolean;  // 0보다 큰지 여부
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

export interface CategoryUpdate {
  category: ScorecardCategory;
  delta: number;    // 증가 점수 (양수만)
  reason: string;   // 한글 설명
}

// ============================================
// Reflection History System (2026 Staff-level)
// ============================================

// 사용자가 선택한 반영 사항 (확장)
export interface StagedReflection {
  role: PersonaRole;
  reflectedText: string;
  turn: number;                           // 어떤 턴에서 결정되었는지
  impactScore?: 'low' | 'medium' | 'high'; // 영향도 (향후 LLM이 평가)
  linkedCategories?: ScorecardCategory[]; // 연관된 스코어카드 카테고리
}

// 점수 변화 추적
export interface ScoreEvolution {
  category: ScorecardCategory;
  turn: number;
  from: number;
  to: number;
  delta: number;
  reason: string;
}

// 카테고리 메타데이터
export const SCORECARD_CATEGORIES: Record<ScorecardCategory, { nameKo: string; max: number; description: string }> = {
  problemDefinition: { nameKo: '문제 정의', max: 15, description: '해결하려는 문제의 명확성' },
  solution: { nameKo: '솔루션', max: 15, description: '제안하는 해결책의 구체성' },
  marketAnalysis: { nameKo: '시장 분석', max: 10, description: '타겟 시장과 경쟁 환경' },
  revenueModel: { nameKo: '수익 모델', max: 10, description: '수익화 전략의 현실성' },
  differentiation: { nameKo: '차별화', max: 10, description: '경쟁 대비 차별점' },
  logicalConsistency: { nameKo: '논리 일관성', max: 15, description: '전체 스토리의 논리성' },
  feasibility: { nameKo: '실현 가능성', max: 15, description: '기술/자원 제약 내 실현성' },
  feedbackReflection: { nameKo: '피드백 반영', max: 10, description: '전문가 조언 수용 및 개선' },
};

// 빈 스코어카드 생성 함수
export function createEmptyScorecard(): Scorecard {
  return {
    problemDefinition: { current: 0, max: 15, filled: false },
    solution: { current: 0, max: 15, filled: false },
    marketAnalysis: { current: 0, max: 10, filled: false },
    revenueModel: { current: 0, max: 10, filled: false },
    differentiation: { current: 0, max: 10, filled: false },
    logicalConsistency: { current: 0, max: 15, filled: false },
    feasibility: { current: 0, max: 15, filled: false },
    feedbackReflection: { current: 0, max: 10, filled: false },
    totalScore: 0,
  };
}

// 마일스톤 시스템
export interface LevelRequirement {
  totalScore: number;
  minimumPerCategory: Partial<Record<ScorecardCategory, number>>;
}

export const LEVEL_REQUIREMENTS: Record<'sketch' | 'mvp' | 'defense', LevelRequirement> = {
  sketch: {
    totalScore: 40,
    minimumPerCategory: {
      problemDefinition: 5,
      solution: 5
    }
  },
  mvp: {
    totalScore: 65,
    minimumPerCategory: {
      problemDefinition: 4,
      solution: 4,
      marketAnalysis: 4,
      revenueModel: 4,
      differentiation: 4,
      logicalConsistency: 4,
      feasibility: 4,
      feedbackReflection: 4
    }
  },
  defense: {
    totalScore: 85,
    minimumPerCategory: {
      problemDefinition: 7,
      solution: 7,
      marketAnalysis: 7,
      revenueModel: 7,
      differentiation: 7,
      logicalConsistency: 7,
      feasibility: 7,
      feedbackReflection: 7
    }
  }
};

// 레벨 달성 여부 체크 함수
export function checkLevelEligibility(
  scorecard: Scorecard,
  level: 'sketch' | 'mvp' | 'defense'
): {
  eligible: boolean;
  totalPassed: boolean;
  failingCategories: ScorecardCategory[];
} {
  const req = LEVEL_REQUIREMENTS[level];
  const totalPassed = scorecard.totalScore >= req.totalScore;

  const failingCategories: ScorecardCategory[] = [];
  Object.entries(req.minimumPerCategory).forEach(([cat, min]) => {
    const category = cat as ScorecardCategory;
    if (scorecard[category].current < (min as number)) {
      failingCategories.push(category);
    }
  });

  return {
    eligible: totalPassed && failingCategories.length === 0,
    totalPassed,
    failingCategories
  };
}

// ============================================
// Business Plan Synthesis (종합 결과물)
// ============================================

export interface BusinessPlanBasicInfo {
  itemName: string;           // 아이템명
  oneLiner: string;           // 한 줄 설명
  targetCustomer: string;     // 타겟 고객
  industry: string;           // 산업 분류
  fundingAmount?: number;     // 신청 금액 (선택)
  templateType?: string;      // 템플릿 타입 (선택)
}

export interface ProblemSection {
  market_status: string;      // 시장 현황
  problem_definition: string; // 핵심 문제점
  development_necessity: string; // 개발 필요성
}

export interface SolutionSection {
  development_plan: string;   // 솔루션 개요 + 개발 로드맵
  differentiation: string;    // 차별화 포인트
  competitiveness: string;    // 경쟁력 분석
}

export interface ScaleupSection {
  business_model: string;     // 수익 모델
  market_size: string;        // 시장 규모 (TAM/SAM/SOM)
  roadmap: string;            // 사업화 로드맵
}

export interface TeamSection {
  founder: string;            // 대표자 프로필
  team_members: string;       // 팀 구성원
  team_synergy: string;       // 팀 시너지
}

export interface BusinessPlanSectionData {
  problem: ProblemSection;
  solution: SolutionSection;
  scaleup: ScaleupSection;
  team: TeamSection;
}

export interface ScheduleItem {
  no: string;
  content: string;            // 개발 내용
  period: string;             // 기간 (예: "25.03 ~ 25.05")
  detail: string;             // 상세 내용
}

export interface BudgetItem {
  category: string;           // 비용 항목 (재료비, 인건비 등)
  detail: string;             // 상세 내용
  amount: string;             // 금액 (문자열)
}

export interface TeamTableItem {
  no: string;
  position: string;           // 직책
  role: string;               // 역할
  capability: string;         // 역량/경력
  status: string;             // 상태 (완료/예정)
}

export interface PartnerItem {
  no: string;
  name: string;               // 기관명
  capability: string;         // 보유 역량
  plan: string;               // 협력 계획
  period: string;             // 시기
}

// 최종 사업계획서 데이터 구조
export interface BusinessPlanData {
  basicInfo: BusinessPlanBasicInfo;
  sectionData: BusinessPlanSectionData;
  schedule: ScheduleItem[];
  budget: BudgetItem[];
  teamTable: TeamTableItem[];
  partners: PartnerItem[];
  // 메타데이터
  generatedAt: string;
  scorecard: Scorecard;
  validationScore: number;
}
