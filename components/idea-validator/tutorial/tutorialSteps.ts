// Tutorial step definitions for PRD Validator

export type TutorialSection =
  | 'welcome'
  | 'level-selection'
  | 'chat-interface'
  | 'reflection-modal';

export interface TutorialStep {
  id: string;
  section: TutorialSection;
  targetSelector: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  spotlightPadding?: number;
}

// Welcome modal content (not a step, shown as modal)
export const welcomeContent = {
  title: 'Draft Validator 시작 가이드',
  subtitle: '처음이신가요? 1분이면 충분합니다',
  steps: [
    { icon: '1', label: '난이도 선택', desc: '프로젝트 단계에 맞게' },
    { icon: '2', label: '대화로 검증', desc: 'AI 페르소나와 함께' },
    { icon: '3', label: '피드백 반영', desc: '카드 클릭으로 결정' },
    { icon: '4', label: '결과 확인', desc: 'PRD와 실행계획 생성' },
  ],
};

// Level selection tutorial steps
export const levelSelectionSteps: TutorialStep[] = [
  {
    id: 'level-intro',
    section: 'level-selection',
    targetSelector: '[data-tutorial="level-cards"]',
    title: '검증 난이도 선택',
    content: '프로젝트 단계에 맞는 검증 강도를 선택하세요. 각 난이도마다 AI의 성격과 질문 방식이 달라집니다.',
    position: 'bottom',
    spotlightPadding: 16,
  },
  {
    id: 'level-sketch',
    section: 'level-selection',
    targetSelector: '[data-tutorial="level-sketch"]',
    title: 'Lv.1 Idea Sketch',
    content: '막 떠오른 아이디어를 구체화하는 단계입니다. 친절한 조력자가 가능성을 함께 탐색합니다.',
    position: 'bottom',
    spotlightPadding: 8,
  },
  {
    id: 'level-mvp',
    section: 'level-selection',
    targetSelector: '[data-tutorial="level-mvp"]',
    title: 'Lv.2 MVP Build (추천)',
    content: '핵심 기능을 정의하고 불필요한 요소를 제거합니다. 가장 많이 사용되는 모드입니다.',
    position: 'bottom',
    spotlightPadding: 8,
  },
  {
    id: 'level-defense',
    section: 'level-selection',
    targetSelector: '[data-tutorial="level-defense"]',
    title: 'Lv.3 VC Defense',
    content: '투자 심사를 시뮬레이션합니다. 공격적인 질문으로 비즈니스 모델의 허점을 찾아냅니다.',
    position: 'bottom',
    spotlightPadding: 8,
  },
];

// Chat interface tutorial steps (shown after first AI response)
export const chatInterfaceSteps: TutorialStep[] = [
  {
    id: 'chat-cards',
    section: 'chat-interface',
    targetSelector: '[data-tutorial="persona-cards"]',
    title: '피드백 카드 클릭!',
    content: '각 페르소나의 조언 카드를 클릭하면 해당 피드백을 반영할 수 있습니다. 원하는 조언을 선택해 보세요!',
    position: 'top',
    spotlightPadding: 12,
  },
  {
    id: 'chat-tokens',
    section: 'chat-interface',
    targetSelector: '[data-tutorial="chat-sidebar"]',
    title: '무료 대화 안내',
    content: '처음 5턴은 무료입니다! 충분히 체험해 보시고, 더 깊은 검증이 필요하면 토큰을 사용하세요.',
    position: 'left',
    spotlightPadding: 8,
  },
];

// Modal tutorial steps (shown when reflection modal opens)
export const modalTutorialSteps: TutorialStep[] = [
  {
    id: 'modal-intro',
    section: 'reflection-modal',
    targetSelector: '[data-tutorial="modal-content"]',
    title: '조언 반영하기',
    content: '페르소나의 조언을 검토하고 결정을 내리세요. 이 결정들이 모여 최종 PRD가 됩니다.',
    position: 'right',
    spotlightPadding: 16,
  },
  {
    id: 'modal-quick-select',
    section: 'reflection-modal',
    targetSelector: '[data-tutorial="quick-select"]',
    title: 'Quick Select',
    content: 'AI가 제안하는 실행 방안입니다. 클릭 한번으로 빠르게 선택할 수 있습니다.',
    position: 'right',
    spotlightPadding: 8,
  },
  {
    id: 'modal-custom',
    section: 'reflection-modal',
    targetSelector: '[data-tutorial="my-decision"]',
    title: '나만의 결정',
    content: '제안이 마음에 들지 않으면 직접 작성하세요. 구체적인 결정일수록 좋은 PRD가 만들어집니다.',
    position: 'right',
    spotlightPadding: 8,
  },
];

// Get all steps for a section
export const getStepsForSection = (section: TutorialSection): TutorialStep[] => {
  switch (section) {
    case 'level-selection':
      return levelSelectionSteps;
    case 'chat-interface':
      return chatInterfaceSteps;
    case 'reflection-modal':
      return modalTutorialSteps;
    default:
      return [];
  }
};
