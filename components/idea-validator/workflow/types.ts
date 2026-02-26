// Workflow Step Types
export type WorkflowStep = 'validation' | 'prd' | 'business-plan' | 'export';

export interface WorkflowStepConfig {
  id: WorkflowStep;
  title: string;
  titleKo: string;
  description: string;
  icon: string;
  isOptional?: boolean;
}

export const WORKFLOW_STEPS: WorkflowStepConfig[] = [
  {
    id: 'validation',
    title: 'Idea Validation',
    titleKo: '아이디어 검증',
    description: 'AI 페르소나와 함께 아이디어를 검증하고 스코어카드를 완성하세요',
    icon: 'MessageSquare',
  },
  {
    id: 'prd',
    title: 'PRD Generation',
    titleKo: 'PRD 작성',
    description: '검증된 아이디어를 바탕으로 제품 요구사항 문서를 생성합니다',
    icon: 'FileText',
  },
  {
    id: 'business-plan',
    title: 'Business Plan',
    titleKo: '사업계획서',
    description: '정부 지원사업 양식에 맞춘 사업계획서를 작성합니다',
    icon: 'Briefcase',
  },
  {
    id: 'export',
    title: 'Export',
    titleKo: '내보내기',
    description: 'PDF, 피치덱, 랜딩페이지 등으로 내보냅니다',
    icon: 'Download',
  },
];

// 정부 지원사업 양식 타입
export type GovernmentProgram = 'pre-startup' | 'early-startup' | 'custom';

export interface GovernmentProgramConfig {
  id: GovernmentProgram;
  name: string;
  nameKo: string;
  description: string;
  sections: GovernmentSection[];
}

export interface GovernmentSection {
  id: string;
  title: string;
  titleKo: string;
  fields: string[];
  mapFrom: string[]; // 어떤 데이터에서 매핑하는지
  weight: number; // 배점
}

// 예비창업패키지 양식
export const PRE_STARTUP_PROGRAM: GovernmentProgramConfig = {
  id: 'pre-startup',
  name: 'Pre-Startup Package',
  nameKo: '예비창업패키지',
  description: '창업 아이디어를 가진 예비창업자를 위한 정부 지원사업',
  sections: [
    {
      id: 'problem',
      title: 'Problem Recognition',
      titleKo: '문제인식',
      fields: ['시장현황 분석', '문제 정의', '개발 필요성'],
      mapFrom: ['scorecard.problemDefinition', 'scorecard.marketAnalysis'],
      weight: 25,
    },
    {
      id: 'solution',
      title: 'Solution & Feasibility',
      titleKo: '실현가능성',
      fields: ['개발계획', '차별성', '경쟁력'],
      mapFrom: ['scorecard.solution', 'scorecard.differentiation', 'prd.coreFeatures'],
      weight: 30,
    },
    {
      id: 'growth',
      title: 'Growth Strategy',
      titleKo: '성장전략',
      fields: ['비즈니스 모델', 'TAM/SAM/SOM', '사업화 로드맵'],
      mapFrom: ['scorecard.revenueModel', 'businessPlan.scaleup'],
      weight: 25,
    },
    {
      id: 'team',
      title: 'Team Composition',
      titleKo: '팀구성',
      fields: ['대표자 역량', '팀원 구성', '팀 시너지'],
      mapFrom: ['onboarding.userData', 'jd.roles'],
      weight: 20,
    },
  ],
};

// 초기창업패키지 양식
export const EARLY_STARTUP_PROGRAM: GovernmentProgramConfig = {
  id: 'early-startup',
  name: 'Early Startup Package',
  nameKo: '초기창업패키지',
  description: '3년 이내 창업기업을 위한 정부 지원사업',
  sections: [
    {
      id: 'problem',
      title: 'Problem Recognition',
      titleKo: '문제인식',
      fields: ['시장현황', '문제정의', '목표시장'],
      mapFrom: ['scorecard.problemDefinition', 'scorecard.marketAnalysis'],
      weight: 20,
    },
    {
      id: 'solution',
      title: 'Solution',
      titleKo: '해결방안',
      fields: ['핵심기술', '차별성', '지식재산권'],
      mapFrom: ['scorecard.solution', 'scorecard.differentiation', 'prd.techStack'],
      weight: 25,
    },
    {
      id: 'feasibility',
      title: 'Feasibility',
      titleKo: '실현가능성',
      fields: ['개발일정', '자금계획', '리스크관리'],
      mapFrom: ['scorecard.feasibility', 'businessPlan.schedule', 'businessPlan.budget'],
      weight: 20,
    },
    {
      id: 'growth',
      title: 'Growth Strategy',
      titleKo: '성장전략',
      fields: ['비즈니스 모델', '시장진입전략', '매출계획'],
      mapFrom: ['scorecard.revenueModel', 'businessPlan.scaleup'],
      weight: 20,
    },
    {
      id: 'team',
      title: 'Team',
      titleKo: '팀역량',
      fields: ['대표자', '핵심인력', '외부협력'],
      mapFrom: ['onboarding.userData', 'businessPlan.team'],
      weight: 15,
    },
  ],
};

export const GOVERNMENT_PROGRAMS: GovernmentProgramConfig[] = [
  PRE_STARTUP_PROGRAM,
  EARLY_STARTUP_PROGRAM,
];

// Workflow State
export interface WorkflowState {
  currentStep: WorkflowStep;
  completedSteps: WorkflowStep[];
  selectedProgram: GovernmentProgram | null;

  // 각 단계별 데이터
  validationData: ValidationData | null;
  prdData: PrdData | null;
  businessPlanData: BusinessPlanData | null;
}

export interface ValidationData {
  conversationHistory: string;
  projectIdea: string;
  reflectedAdvice: string[];
  scorecard: unknown; // Scorecard type from parent
  ideaCategory: string;
  completedAt: Date;
}

export interface PrdData {
  projectName: string;
  overview: string;
  targetAudience: string;
  coreFeatures: unknown[];
  techStack: string[];
  successMetrics: unknown[];
  generatedAt: Date;
}

export interface BusinessPlanData {
  program: GovernmentProgram;
  sections: Record<string, unknown>;
  generatedAt: Date;
}
