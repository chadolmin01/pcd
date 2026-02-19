// 창업자 유형 정의
// Based on a16z Founder-Market Fit, Lean Startup, Big Five

import { AxisScores } from './decisionAnalyzer';

export type FounderTypeId =
  | 'blitz-builder'
  | 'lab-architect'
  | 'market-sniper'
  | 'pivot-surfer'
  | 'moat-builder'
  | 'vibe-architect';

export interface FounderType {
  id: FounderTypeId;
  emoji: string;
  name: string;
  nameKo: string;
  tagline: string;
  taglineKo: string;
  description: string;
  descriptionKo: string;
  likePerson: string;
  likeStory: string;
  likeStoryKo: string;
  traits: string[];
  traitsKo: string[];
  bestMatch: FounderTypeId;
  color: string;
  bgColor: string;
  mascotUrl?: string; // 마스코트 이미지 URL
  cardImageUrl: string; // 공유용 카드 이미지 URL
}

export const FOUNDER_TYPES: Record<FounderTypeId, FounderType> = {
  'blitz-builder': {
    id: 'blitz-builder',
    emoji: '⚡',
    name: 'Blitz Builder',
    nameKo: '블리츠 빌더',
    tagline: 'Move fast, break things.',
    taglineKo: '빠르게 움직여라, 부서지면 고쳐라.',
    description: 'Speed over perfection. Ship first, iterate later.',
    descriptionKo: '완벽보다 속도. 먼저 출시하고, 나중에 개선한다.',
    likePerson: 'Mark Zuckerberg (Facebook/Meta)',
    likeStory: "Launched first version in 2 weeks from Harvard dorm. Full of bugs, but rapid feedback loops built a 3B MAU platform.",
    likeStoryKo: "2004년 하버드 기숙사에서 2주 만에 첫 버전 런칭. 초기 버그 투성이였지만 빠른 피드백 루프로 MAU 30억 플랫폼을 만들어냄.",
    traits: ['Fast execution', 'Risk-taking', 'Market-driven'],
    traitsKo: ['빠른 실행력', '리스크 추구', '시장 지향'],
    bestMatch: 'lab-architect',
    color: '#F59E0B',
    bgColor: '#FFFBEB',
    cardImageUrl: '/img/blitz.jpeg',
  },
  'lab-architect': {
    id: 'lab-architect',
    emoji: '🔬',
    name: 'Lab Architect',
    nameKo: '랩 아키텍트',
    tagline: 'Perfect or nothing.',
    taglineKo: '완벽하거나, 아무것도 아니거나.',
    description: 'Obsessed with craft. Every detail matters.',
    descriptionKo: '장인 정신에 집착. 모든 디테일이 중요하다.',
    likePerson: 'Steve Jobs (Apple)',
    likeStory: "Delayed Macintosh launch 3 times obsessing over fonts, curves, packaging. 'Users don't know what they want until we show them.'",
    likeStoryKo: "매킨토시 출시를 3번 연기하면서까지 폰트, 곡선, 패키징 하나하나에 집착. '사용자는 우리가 보여주기 전까지 자기가 뭘 원하는지 모른다'",
    traits: ['Perfectionist', 'Product-focused', 'Independent'],
    traitsKo: ['완벽주의', '제품 중심', '독립적'],
    bestMatch: 'blitz-builder',
    color: '#8B5CF6',
    bgColor: '#F5F3FF',
    cardImageUrl: '/img/lab ar.jpeg',
  },
  'market-sniper': {
    id: 'market-sniper',
    emoji: '🎯',
    name: 'Market Sniper',
    nameKo: '마켓 스나이퍼',
    tagline: 'Follow the money.',
    taglineKo: '돈이 흐르는 곳을 따라가라.',
    description: 'Business model first. Revenue is validation.',
    descriptionKo: '비즈니스 모델 우선. 매출이 검증이다.',
    likePerson: 'Brian Chesky (Airbnb)',
    likeStory: "Founded during 2008 financial crisis. Sold cereal boxes to fund the company. Tracked 'where people actually spend money' to disrupt hospitality.",
    likeStoryKo: "2008년 금융위기 한복판에서 창업. 집세를 못 내서 시리얼 박스를 팔아 자금 마련. '사람들이 진짜 돈 쓰는 곳'을 추적해 숙박 산업을 뒤집음.",
    traits: ['Business-minded', 'Market-driven', 'Receptive'],
    traitsKo: ['비즈니스 감각', '시장 지향', '수용적'],
    bestMatch: 'lab-architect',
    color: '#10B981',
    bgColor: '#ECFDF5',
    cardImageUrl: '/img/sniper.jpeg',
  },
  'pivot-surfer': {
    id: 'pivot-surfer',
    emoji: '🌊',
    name: 'Pivot Surfer',
    nameKo: '피벗 서퍼',
    tagline: 'Ride the wave.',
    taglineKo: '파도를 타라.',
    description: 'Flexible and adaptive. Turn failures into opportunities.',
    descriptionKo: '유연하고 적응력 있게. 실패를 기회로 바꾼다.',
    likePerson: 'Stewart Butterfield (Slack)',
    likeStory: "Originally built MMORPG 'Glitch' and failed. Noticed potential in their internal communication tool, pivoted boldly to create $27.7B Slack.",
    likeStoryKo: "원래 MMORPG 게임 'Glitch'를 만들다 실패. 팀 내부 커뮤니케이션 툴에 가능성을 발견, 과감히 피벗해서 기업가치 $27.7B Slack 탄생.",
    traits: ['Flexible', 'Receptive', 'Risk-taking'],
    traitsKo: ['유연함', '수용적', '리스크 추구'],
    bestMatch: 'moat-builder',
    color: '#06B6D4',
    bgColor: '#ECFEFF',
    cardImageUrl: '/img/surfer.jpeg',
  },
  'moat-builder': {
    id: 'moat-builder',
    emoji: '🛡️',
    name: 'Moat Builder',
    nameKo: '해자 빌더',
    tagline: "Build walls they can't climb.",
    taglineKo: '넘을 수 없는 벽을 쌓아라.',
    description: 'Deep expertise. Long-term competitive advantage.',
    descriptionKo: '깊은 전문성. 장기적 경쟁 우위.',
    likePerson: 'Jensen Huang (NVIDIA)',
    likeStory: "Jumped into GPUs in 1993 when nobody cared. Dug one well for 30 years. When AI era opened, became world's #1 market cap. 'No competitor can cross our moat.'",
    likeStoryKo: "1993년 GPU라는 아무도 관심 없던 분야에 뛰어듦. 30년간 한 우물만 파서 AI 시대가 열리자 시가총액 세계 1위. '우리가 만든 해자를 넘을 수 있는 경쟁자는 없다'",
    traits: ['Tech-focused', 'Perfectionist', 'Risk-averse'],
    traitsKo: ['기술 중심', '완벽주의', '리스크 회피'],
    bestMatch: 'market-sniper',
    color: '#6366F1',
    bgColor: '#EEF2FF',
    cardImageUrl: '/img/moat builder.jpeg',
  },
  'vibe-architect': {
    id: 'vibe-architect',
    emoji: '🎨',
    name: 'Vibe Architect',
    nameKo: '바이브 아키텍트',
    tagline: 'Experience is the product.',
    taglineKo: '경험이 곧 제품이다.',
    description: 'Emotional connection. Less is more.',
    descriptionKo: '감정적 연결. 덜어내는 것이 더하는 것.',
    likePerson: 'Brian Acton (WhatsApp)',
    likeStory: "Rejected by Facebook and Twitter. Built WhatsApp with philosophy: 'No ads, simple, just messages.' Proved that removing features is the best UX. Acquired for $19B.",
    likeStoryKo: "Facebook과 Twitter에 입사 지원했다가 둘 다 탈락. '광고 없이, 심플하게, 메시지만' 철학으로 WhatsApp을 만들어 $19B에 Meta가 인수.",
    traits: ['Product-focused', 'Emotional', 'Receptive'],
    traitsKo: ['제품 중심', '감성적', '수용적'],
    bestMatch: 'market-sniper',
    color: '#EC4899',
    bgColor: '#FDF2F8',
    cardImageUrl: '/img/vibe ar.jpeg',
  },
};

// 5축 점수 → 창업자 유형 매핑
export function determineFounderType(axes: AxisScores): FounderTypeId {
  const {
    speedVsQuality,
    marketVsProduct,
    receptiveVsIndependent,
    techVsBusiness,
    riskSeekingVsAvoiding,
  } = axes;

  // 각 유형별 점수 계산
  const scores: Record<FounderTypeId, number> = {
    'blitz-builder': 0,
    'lab-architect': 0,
    'market-sniper': 0,
    'pivot-surfer': 0,
    'moat-builder': 0,
    'vibe-architect': 0,
  };

  // ⚡ Blitz Builder: 실행속도↑ 리스크추구↑ 시장지향↑
  scores['blitz-builder'] =
    speedVsQuality * 1.5 +
    riskSeekingVsAvoiding * 1.2 +
    marketVsProduct * 0.8;

  // 🔬 Lab Architect: 완성도↑ 제품지향↑ 독립형↑
  scores['lab-architect'] =
    -speedVsQuality * 1.5 +
    -marketVsProduct * 1.2 +
    -receptiveVsIndependent * 1.0;

  // 🎯 Market Sniper: 비즈니스↑ 시장지향↑ 수용형↑
  scores['market-sniper'] =
    -techVsBusiness * 1.5 +
    marketVsProduct * 1.2 +
    receptiveVsIndependent * 0.8;

  // 🌊 Pivot Surfer: 유연함↑ 수용형↑ 리스크추구↑
  scores['pivot-surfer'] =
    receptiveVsIndependent * 1.3 +
    riskSeekingVsAvoiding * 1.2 +
    speedVsQuality * 0.5;

  // 🛡️ Moat Builder: 기술중심↑ 완성도↑ 리스크회피↑
  scores['moat-builder'] =
    techVsBusiness * 1.5 +
    -speedVsQuality * 1.0 +
    -riskSeekingVsAvoiding * 1.2;

  // 🎨 Vibe Architect: 제품지향↑ 감성↑ 수용형↑
  scores['vibe-architect'] =
    -marketVsProduct * 1.3 +
    -techVsBusiness * 0.8 +
    receptiveVsIndependent * 1.0;

  // 최고 점수 유형 반환
  let maxType: FounderTypeId = 'blitz-builder';
  let maxScore = -Infinity;

  (Object.entries(scores) as [FounderTypeId, number][]).forEach(([type, score]) => {
    if (score > maxScore) {
      maxScore = score;
      maxType = type;
    }
  });

  return maxType;
}

// 유형 정보 가져오기
export function getFounderType(id: FounderTypeId): FounderType {
  return FOUNDER_TYPES[id];
}

// Best Match 유형 가져오기
export function getBestMatch(id: FounderTypeId): FounderType {
  const type = FOUNDER_TYPES[id];
  return FOUNDER_TYPES[type.bestMatch];
}

// 학술적 근거 정보
export const METHODOLOGY_REFERENCES = [
  { name: 'a16z Founder-Market Fit Theory', year: null },
  { name: 'Eric Ries, Lean Startup', year: 2011 },
  { name: 'Clayton Christensen, Innovator\'s Dilemma', year: 1997 },
  { name: 'Patrick Lencioni, Five Dysfunctions of a Team', year: 2002 },
  { name: 'Big Five Personality Model', year: 1992 },
];
