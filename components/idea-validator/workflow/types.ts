// Workflow Step Types
export type WorkflowStep = 'goal-select' | 'quick-persona' | 'quick-level' | 'quick-validation' | 'quick-result' | 'program-select' | 'idea-refine' | 'application-form' | 'validation' | 'prd' | 'business-plan' | 'export' | 'portfolio' | 'idea-detail' | 'new-version' | 'version-compare' | 'gap-analysis';

// Workflow Mode
export type WorkflowMode = 'quick' | 'full' | null;

export interface WorkflowStepConfig {
  id: WorkflowStep;
  title: string;
  titleKo: string;
  description: string;
  icon: string;
  isOptional?: boolean;
}

// 빠른 검증 워크플로우 스텝
export const QUICK_WORKFLOW_STEPS: WorkflowStepConfig[] = [
  {
    id: 'quick-persona',
    title: 'Persona Selection',
    titleKo: '페르소나 선택',
    description: '검증에 참여할 AI 전문가를 선택하세요',
    icon: 'Users',
  },
  {
    id: 'quick-level',
    title: 'Level Selection',
    titleKo: '난이도 선택',
    description: '검증 깊이를 선택하세요',
    icon: 'Layers',
  },
  {
    id: 'quick-validation',
    title: 'Validation',
    titleKo: '아이디어 검증',
    description: 'AI 전문가와 대화하며 아이디어를 검증합니다',
    icon: 'MessageSquare',
  },
  {
    id: 'quick-result',
    title: 'Result',
    titleKo: '결과 확인',
    description: '검증 결과를 확인하세요',
    icon: 'CheckCircle',
  },
];

// 지원사업 준비 워크플로우 스텝
export const FULL_WORKFLOW_STEPS: WorkflowStepConfig[] = [
  {
    id: 'program-select',
    title: 'Program Selection',
    titleKo: '지원사업 선택',
    description: '지원할 정부 지원사업을 선택하세요',
    icon: 'Building2',
  },
  {
    id: 'idea-refine',
    title: 'Idea Refinement',
    titleKo: '아이디어 다듬기',
    description: 'AI와 대화하며 선택한 아이디어를 다듬습니다',
    icon: 'MessageSquare',
  },
  {
    id: 'application-form',
    title: 'Application Form',
    titleKo: '지원서 작성',
    description: '지원서 양식에 맞춰 내용을 작성합니다',
    icon: 'FileText',
  },
  {
    id: 'export',
    title: 'Export',
    titleKo: '내보내기',
    description: 'PDF, 피치덱, 랜딩페이지 등으로 내보냅니다',
    icon: 'Download',
  },
];

// 기본 워크플로우 스텝 (하위 호환성)
export const WORKFLOW_STEPS = FULL_WORKFLOW_STEPS;

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
  questions: ValidationQuestion[]; // 평가항목별 검증 질문
}

// 평가항목별 검증 질문
export interface ValidationQuestion {
  id: string;
  question: string; // AI가 물어볼 질문
  purpose: string; // 이 질문의 목적 (내부용)
  evaluationCriteria: string[]; // 평가 기준
  followUpHints: string[]; // 후속 질문 힌트
}

// ChatInterface에서 사용하는 확장 타입 (섹션 정보 포함)
export interface ProgramQuestion extends ValidationQuestion {
  sectionId: string;
  sectionTitle: string;
}

// 소요시간 계산 상수
export const MINUTES_PER_QUESTION = 2;
export const MIN_ESTIMATED_MINUTES = 10;

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
      questions: [
        {
          id: 'problem-1',
          question: '해결하고자 하는 문제가 무엇인가요? 이 문제를 겪는 사람들은 현재 어떻게 대처하고 있나요?',
          purpose: '문제 정의 및 현재 대안 파악',
          evaluationCriteria: ['문제의 구체성', '대상 고객 명확성', '현재 대안의 한계'],
          followUpHints: ['문제의 심각성', '발생 빈도', '경제적 손실'],
        },
        {
          id: 'problem-2',
          question: '이 문제가 발생하는 시장의 현황은 어떤가요? 시장 규모와 성장 추세를 알고 계신가요?',
          purpose: '시장 현황 분석',
          evaluationCriteria: ['시장 규모 인지', '성장 트렌드 파악', '규제 환경 이해'],
          followUpHints: ['국내외 시장 비교', '관련 정책 동향'],
        },
      ],
    },
    {
      id: 'solution',
      title: 'Solution & Feasibility',
      titleKo: '실현가능성',
      fields: ['개발계획', '차별성', '경쟁력'],
      mapFrom: ['scorecard.solution', 'scorecard.differentiation', 'prd.coreFeatures'],
      weight: 30,
      questions: [
        {
          id: 'solution-1',
          question: '이 문제를 어떻게 해결하실 건가요? 핵심 기능이나 서비스를 구체적으로 설명해주세요.',
          purpose: '솔루션 구체화',
          evaluationCriteria: ['솔루션의 명확성', '기술적 실현 가능성', '핵심 가치 제안'],
          followUpHints: ['MVP 범위', '기술 스택', '개발 일정'],
        },
        {
          id: 'solution-2',
          question: '기존 경쟁 서비스와 비교해서 어떤 점이 다른가요? 왜 고객이 기존 서비스 대신 이 서비스를 선택할까요?',
          purpose: '차별화 포인트 확인',
          evaluationCriteria: ['경쟁사 분석', '차별화 요소', '진입 장벽'],
          followUpHints: ['가격 경쟁력', '기술적 우위', '사용자 경험'],
        },
        {
          id: 'solution-3',
          question: '이 솔루션을 개발하기 위한 구체적인 계획이 있나요? 필요한 자원과 일정은 어떻게 되나요?',
          purpose: '실현 가능성 검토',
          evaluationCriteria: ['개발 로드맵', '필요 자원', '리스크 관리'],
          followUpHints: ['팀 역량', '외부 협력', '자금 계획'],
        },
      ],
    },
    {
      id: 'growth',
      title: 'Growth Strategy',
      titleKo: '성장전략',
      fields: ['비즈니스 모델', 'TAM/SAM/SOM', '사업화 로드맵'],
      mapFrom: ['scorecard.revenueModel', 'businessPlan.scaleup'],
      weight: 25,
      questions: [
        {
          id: 'growth-1',
          question: '어떻게 수익을 창출할 계획인가요? 고객이 비용을 지불하는 포인트는 어디인가요?',
          purpose: '수익 모델 확인',
          evaluationCriteria: ['수익 모델 명확성', '가격 전략', '수익원 다양성'],
          followUpHints: ['구독/일회성', '직접/간접 수익', '마진 구조'],
        },
        {
          id: 'growth-2',
          question: '목표 시장의 규모는 어느 정도인가요? 전체 시장(TAM), 유효 시장(SAM), 초기 목표 시장(SOM)을 구분해서 설명해주세요.',
          purpose: '시장 규모 분석',
          evaluationCriteria: ['TAM/SAM/SOM 이해', '시장 진입 전략', '점유율 목표'],
          followUpHints: ['경쟁 강도', '고객 획득 비용', '성장 목표'],
        },
        {
          id: 'growth-3',
          question: '사업을 어떻게 확장해 나갈 계획인가요? 1년, 3년 후의 모습을 그려주세요.',
          purpose: '성장 로드맵 확인',
          evaluationCriteria: ['단계별 목표', '확장 전략', 'KPI 설정'],
          followUpHints: ['신규 시장', '제품 확장', '파트너십'],
        },
      ],
    },
    {
      id: 'team',
      title: 'Team Composition',
      titleKo: '팀구성',
      fields: ['대표자 역량', '팀원 구성', '팀 시너지'],
      mapFrom: ['onboarding.userData', 'jd.roles'],
      weight: 20,
      questions: [
        {
          id: 'team-1',
          question: '이 사업을 추진하기에 적합한 경험이나 역량이 있으신가요? 관련 분야 경력이나 성과가 있다면 알려주세요.',
          purpose: '대표자 역량 확인',
          evaluationCriteria: ['관련 경험', '전문성', '실행력'],
          followUpHints: ['이전 창업 경험', '업계 네트워크', '기술 역량'],
        },
        {
          id: 'team-2',
          question: '현재 팀 구성은 어떻게 되어 있나요? 부족한 역량은 어떻게 보완할 계획인가요?',
          purpose: '팀 구성 및 보완 계획',
          evaluationCriteria: ['역할 분담', '역량 균형', '채용 계획'],
          followUpHints: ['핵심 인력', '외부 자문', '파트너 협력'],
        },
      ],
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
      questions: [
        {
          id: 'problem-1',
          question: '현재 운영 중인 사업에서 해결하고자 하는 핵심 문제는 무엇인가요? 고객이 겪는 페인포인트를 구체적으로 설명해주세요.',
          purpose: '사업 문제 정의',
          evaluationCriteria: ['문제의 시급성', '고객 페인포인트', '시장 니즈'],
          followUpHints: ['고객 인터뷰 결과', '시장 반응', '경쟁 현황'],
        },
        {
          id: 'problem-2',
          question: '목표 시장은 어디인가요? B2B인지 B2C인지, 타겟 고객군을 명확히 정의해주세요.',
          purpose: '목표 시장 정의',
          evaluationCriteria: ['타겟 명확성', '시장 세분화', '고객 프로파일'],
          followUpHints: ['고객 규모', '구매력', '접근 채널'],
        },
      ],
    },
    {
      id: 'solution',
      title: 'Solution',
      titleKo: '해결방안',
      fields: ['핵심기술', '차별성', '지식재산권'],
      mapFrom: ['scorecard.solution', 'scorecard.differentiation', 'prd.techStack'],
      weight: 25,
      questions: [
        {
          id: 'solution-1',
          question: '어떤 기술이나 방법으로 문제를 해결하고 있나요? 핵심 기술의 특징과 장점을 설명해주세요.',
          purpose: '핵심 기술 확인',
          evaluationCriteria: ['기술 혁신성', '기술 성숙도', '적용 가능성'],
          followUpHints: ['특허 현황', 'R&D 역량', '기술 로드맵'],
        },
        {
          id: 'solution-2',
          question: '경쟁사 대비 기술적 차별점은 무엇인가요? 특허나 지식재산권 보유 현황을 알려주세요.',
          purpose: '기술 차별화 및 IP 현황',
          evaluationCriteria: ['기술 우위', 'IP 보호', '모방 장벽'],
          followUpHints: ['특허 출원/등록', '영업비밀', '기술 인증'],
        },
      ],
    },
    {
      id: 'feasibility',
      title: 'Feasibility',
      titleKo: '실현가능성',
      fields: ['개발일정', '자금계획', '리스크관리'],
      mapFrom: ['scorecard.feasibility', 'businessPlan.schedule', 'businessPlan.budget'],
      weight: 20,
      questions: [
        {
          id: 'feasibility-1',
          question: '향후 1년간 개발 및 사업화 일정은 어떻게 계획하고 있나요? 주요 마일스톤을 알려주세요.',
          purpose: '개발 일정 확인',
          evaluationCriteria: ['일정 현실성', '마일스톤 명확성', '리소스 배분'],
          followUpHints: ['우선순위', '병목 구간', '대안 계획'],
        },
        {
          id: 'feasibility-2',
          question: '사업 추진에 필요한 자금 규모와 용도는 어떻게 되나요? 자금 조달 계획도 설명해주세요.',
          purpose: '자금 계획 확인',
          evaluationCriteria: ['자금 규모', '용도 적정성', '조달 계획'],
          followUpHints: ['자기 자본', '투자 유치', '정부 지원'],
        },
        {
          id: 'feasibility-3',
          question: '사업 추진 시 예상되는 주요 리스크는 무엇인가요? 어떻게 대응할 계획인가요?',
          purpose: '리스크 관리 확인',
          evaluationCriteria: ['리스크 인식', '대응 전략', '회복 탄력성'],
          followUpHints: ['기술 리스크', '시장 리스크', '운영 리스크'],
        },
      ],
    },
    {
      id: 'growth',
      title: 'Growth Strategy',
      titleKo: '성장전략',
      fields: ['비즈니스 모델', '시장진입전략', '매출계획'],
      mapFrom: ['scorecard.revenueModel', 'businessPlan.scaleup'],
      weight: 20,
      questions: [
        {
          id: 'growth-1',
          question: '현재 비즈니스 모델은 무엇인가요? 매출이 발생하고 있다면 주요 수익원을 설명해주세요.',
          purpose: '비즈니스 모델 확인',
          evaluationCriteria: ['수익 모델', '매출 현황', '수익성'],
          followUpHints: ['단가', '거래 규모', '재구매율'],
        },
        {
          id: 'growth-2',
          question: '시장 진입 및 확대 전략은 무엇인가요? 마케팅과 영업 계획을 설명해주세요.',
          purpose: '시장 전략 확인',
          evaluationCriteria: ['진입 전략', '채널 전략', '고객 획득'],
          followUpHints: ['CAC', 'LTV', '전환율'],
        },
        {
          id: 'growth-3',
          question: '향후 3년간 매출 목표와 근거는 무엇인가요?',
          purpose: '매출 계획 확인',
          evaluationCriteria: ['목표 현실성', '성장률', '근거 타당성'],
          followUpHints: ['시장 점유율', '고객 수', '객단가'],
        },
      ],
    },
    {
      id: 'team',
      title: 'Team',
      titleKo: '팀역량',
      fields: ['대표자', '핵심인력', '외부협력'],
      mapFrom: ['onboarding.userData', 'businessPlan.team'],
      weight: 15,
      questions: [
        {
          id: 'team-1',
          question: '대표자와 핵심 팀원의 관련 경력과 역량을 소개해주세요.',
          purpose: '팀 역량 확인',
          evaluationCriteria: ['전문성', '경험', '실적'],
          followUpHints: ['창업 경험', '업계 경력', '학력/자격'],
        },
        {
          id: 'team-2',
          question: '외부 협력 네트워크(멘토, 자문, 파트너사 등)가 있나요?',
          purpose: '외부 협력 현황',
          evaluationCriteria: ['네트워크', '협력 관계', '지원 체계'],
          followUpHints: ['투자자', '대기업', '연구기관'],
        },
      ],
    },
  ],
};

// 자유 양식
export const CUSTOM_PROGRAM: GovernmentProgramConfig = {
  id: 'custom',
  name: 'Custom Format',
  nameKo: '자유 양식',
  description: '특정 양식 없이 자유롭게 사업계획서를 작성합니다',
  sections: [
    {
      id: 'problem',
      title: 'Problem',
      titleKo: '문제정의',
      fields: ['시장현황', '문제 정의', '필요성'],
      mapFrom: ['scorecard.problemDefinition'],
      weight: 25,
      questions: [
        {
          id: 'problem-1',
          question: '어떤 문제를 해결하고 싶으신가요? 이 문제가 왜 중요한지 설명해주세요.',
          purpose: '문제 정의',
          evaluationCriteria: ['문제의 명확성', '중요도', '시급성'],
          followUpHints: ['대상 고객', '현재 상황', '개선 필요성'],
        },
      ],
    },
    {
      id: 'solution',
      title: 'Solution',
      titleKo: '솔루션',
      fields: ['해결방안', '핵심기능', '차별화'],
      mapFrom: ['scorecard.solution', 'scorecard.differentiation'],
      weight: 25,
      questions: [
        {
          id: 'solution-1',
          question: '문제를 어떻게 해결할 계획인가요? 핵심 아이디어나 접근 방식을 설명해주세요.',
          purpose: '솔루션 확인',
          evaluationCriteria: ['해결책 적합성', '실현 가능성', '차별화'],
          followUpHints: ['기술/방법', '기존 대안 대비 장점', '핵심 기능'],
        },
      ],
    },
    {
      id: 'market',
      title: 'Market',
      titleKo: '시장분석',
      fields: ['TAM/SAM/SOM', '경쟁분석', '진입전략'],
      mapFrom: ['scorecard.marketAnalysis'],
      weight: 25,
      questions: [
        {
          id: 'market-1',
          question: '타겟 시장과 고객은 누구인가요? 시장 규모나 경쟁 상황을 알고 계신가요?',
          purpose: '시장 분석',
          evaluationCriteria: ['시장 이해', '고객 정의', '경쟁 인식'],
          followUpHints: ['시장 규모', '경쟁사', '진입 전략'],
        },
      ],
    },
    {
      id: 'business',
      title: 'Business Model',
      titleKo: '비즈니스 모델',
      fields: ['수익모델', '가격정책', '성장전략'],
      mapFrom: ['scorecard.revenueModel'],
      weight: 25,
      questions: [
        {
          id: 'business-1',
          question: '어떻게 수익을 창출할 계획인가요? 비즈니스 모델을 설명해주세요.',
          purpose: '수익 모델',
          evaluationCriteria: ['수익 모델 명확성', '지속 가능성', '확장성'],
          followUpHints: ['가격 전략', '수익원', '성장 계획'],
        },
      ],
    },
  ],
};

export const GOVERNMENT_PROGRAMS: GovernmentProgramConfig[] = [
  PRE_STARTUP_PROGRAM,
  EARLY_STARTUP_PROGRAM,
  CUSTOM_PROGRAM,
];

// Workflow State
export interface WorkflowState {
  currentStep: WorkflowStep;
  completedSteps: WorkflowStep[];
  workflowMode: WorkflowMode;
  selectedProgram: GovernmentProgram | null;

  // 검증 단계 평가항목 진행 상태
  currentSectionIndex: number;
  completedSectionIds: string[];

  // 각 단계별 데이터
  validationData: ValidationData | null;
  prdData: PrdData | null;
  businessPlanData: BusinessPlanData | null;

  // Portfolio 관련 상태
  selectedIdeaId?: string;
  selectedVersionId?: string;
  forkFromVersionId?: string;
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
