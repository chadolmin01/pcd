// 사용자 의사결정 성향 분석 시스템 v2
// 5축 분석 + 행동 패턴 + AI 종합 프로필

// ============================================
// 타입 정의
// ============================================

export interface DecisionRecord {
  id: string;
  ideaId: string;                  // 검증 세션 ID
  ideaCategory: string;            // AI가 분류한 카테고리
  round: number;                   // 몇 번째 라운드
  persona: 'Developer' | 'Designer' | 'VC';
  perspectiveId: string;           // 선택한 관점 ID
  perspectiveLabel: string;        // 선택한 관점 라벨
  questionTopic: string;           // 질문 주제 (기술스택, 수익모델 등)
  options: string[];               // 제시된 선택지들 (관점 라벨들)
  selected: string;                // 선택한 것
  type: 'option_select' | 'custom_input';  // 선택 vs 직접 입력
  responseTimeSec: number;         // 응답 시간 (초)
  timestamp: string;
}

export interface AxisScores {
  speedVsQuality: number;          // -1(완성도) ~ +1(실행속도)
  marketVsProduct: number;         // -1(제품지향) ~ +1(시장지향)
  receptiveVsIndependent: number;  // -1(독립형) ~ +1(수용형)
  techVsBusiness: number;          // -1(비즈니스) ~ +1(기술중심)
  riskSeekingVsAvoiding: number;   // -1(회피) ~ +1(추구)
}

export interface BehaviorPattern {
  customInputRatio: number;        // 직접 입력 비율 (0~1)
  avgResponseTimeSec: number;      // 평균 응답 시간
  personaAcceptance: {             // 페르소나별 수용률
    Developer: number;
    Designer: number;
    VC: number;
  };
  roundsCompleted: number;         // 완료한 라운드 수
  totalDecisions: number;          // 총 결정 수
  sessionsCount: number;           // 세션 수
}

export interface FounderProfile {
  founderType: string;             // "빠른 실행형 제품 중심 창업자"
  axes: AxisScores;
  strengths: string[];
  blindSpots: string[];
  idealCofounder: string;
  matchingTags: string[];
  generatedAt: string;
  recordsCount?: number;           // 프로파일 생성 시 사용된 레코드 수
}

export interface DecisionAnalysis {
  records: DecisionRecord[];
  axisScores: AxisScores;
  behaviorPattern: BehaviorPattern;
  profile: FounderProfile | null;
}

// ============================================
// 관점별 축 영향도 매핑
// ============================================

// 각 관점이 5축에 미치는 영향 (-1 ~ +1)
const PERSPECTIVE_AXIS_MAPPING: Record<string, Partial<AxisScores>> = {
  // Developer 관점들
  'security': { speedVsQuality: -0.3, riskSeekingVsAvoiding: -0.4, techVsBusiness: 0.3 },
  'speed': { speedVsQuality: 0.5, riskSeekingVsAvoiding: 0.3, techVsBusiness: 0.2 },
  'scalability': { speedVsQuality: -0.2, marketVsProduct: 0.2, techVsBusiness: 0.3 },
  'data-structure': { speedVsQuality: -0.2, techVsBusiness: 0.4, marketVsProduct: -0.1 },
  'infra-cost': { marketVsProduct: 0.2, riskSeekingVsAvoiding: -0.2, techVsBusiness: 0.2 },
  'api-design': { techVsBusiness: 0.3, marketVsProduct: 0.1, speedVsQuality: -0.1 },
  'realtime': { techVsBusiness: 0.3, marketVsProduct: -0.1, speedVsQuality: -0.2 },
  'offline': { marketVsProduct: -0.2, techVsBusiness: 0.2, riskSeekingVsAvoiding: -0.1 },
  'ai-ml': { techVsBusiness: 0.4, speedVsQuality: -0.3, riskSeekingVsAvoiding: 0.2 },
  'location': { techVsBusiness: 0.2, marketVsProduct: -0.1, speedVsQuality: 0.1 },
  'integration': { marketVsProduct: 0.2, techVsBusiness: 0.2, speedVsQuality: -0.1 },
  'performance': { speedVsQuality: -0.3, techVsBusiness: 0.3, marketVsProduct: -0.1 },

  // Designer 관점들
  'usability': { marketVsProduct: -0.3, speedVsQuality: -0.1, techVsBusiness: -0.2 },
  'aesthetics': { marketVsProduct: -0.4, speedVsQuality: -0.2, techVsBusiness: -0.3 },
  'accessibility': { marketVsProduct: -0.2, riskSeekingVsAvoiding: -0.2, techVsBusiness: -0.2 },
  'onboarding': { marketVsProduct: 0.1, speedVsQuality: 0.1, techVsBusiness: -0.2 },
  'gamification': { marketVsProduct: -0.1, riskSeekingVsAvoiding: 0.2, techVsBusiness: -0.1 },
  'mobile-first': { speedVsQuality: 0.1, marketVsProduct: 0.1, techVsBusiness: -0.1 },
  'simplicity': { speedVsQuality: 0.3, marketVsProduct: -0.2, techVsBusiness: -0.1 },
  'personalization': { marketVsProduct: -0.2, techVsBusiness: 0.1, speedVsQuality: -0.2 },
  'emotional': { marketVsProduct: -0.4, techVsBusiness: -0.3, riskSeekingVsAvoiding: 0.1 },
  'consistency': { speedVsQuality: -0.2, marketVsProduct: -0.1, techVsBusiness: -0.1 },
  'feedback': { marketVsProduct: -0.1, receptiveVsIndependent: 0.2, techVsBusiness: -0.1 },
  'trust': { riskSeekingVsAvoiding: -0.3, marketVsProduct: 0.1, techVsBusiness: -0.2 },

  // VC 관점들
  'revenue': { marketVsProduct: 0.4, techVsBusiness: -0.4, riskSeekingVsAvoiding: 0.1 },
  'market-size': { marketVsProduct: 0.5, techVsBusiness: -0.3, riskSeekingVsAvoiding: 0.2 },
  'moat': { marketVsProduct: 0.2, riskSeekingVsAvoiding: -0.1, techVsBusiness: -0.2 },
  'unit-economics': { marketVsProduct: 0.3, techVsBusiness: -0.3, riskSeekingVsAvoiding: -0.2 },
  'timing': { riskSeekingVsAvoiding: 0.3, marketVsProduct: 0.3, speedVsQuality: 0.2 },
  'team': { receptiveVsIndependent: 0.1, marketVsProduct: 0.1, techVsBusiness: -0.1 },
  'network-effect': { marketVsProduct: 0.4, techVsBusiness: -0.1, riskSeekingVsAvoiding: 0.2 },
  'retention': { marketVsProduct: 0.2, techVsBusiness: -0.2, speedVsQuality: -0.1 },
  'exit': { marketVsProduct: 0.4, techVsBusiness: -0.3, riskSeekingVsAvoiding: 0.3 },
  'regulation': { riskSeekingVsAvoiding: -0.4, marketVsProduct: 0.1, techVsBusiness: -0.2 },
  'global': { marketVsProduct: 0.4, riskSeekingVsAvoiding: 0.3, speedVsQuality: -0.1 },
  'viral': { marketVsProduct: 0.3, riskSeekingVsAvoiding: 0.2, speedVsQuality: 0.2 },
};

// ============================================
// 저장소 키
// ============================================

const STORAGE_KEY = 'draft_decision_records_v2';
const SESSION_KEY = 'draft_current_session_v2';
const PROFILE_KEY = 'draft_founder_profile';

// ============================================
// 세션 관리
// ============================================

export function getCurrentSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export function startNewSession(): string {
  if (typeof window === 'undefined') return '';
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem(SESSION_KEY, sessionId);
  // 현재 세션의 라운드 카운터 초기화
  sessionStorage.setItem('draft_current_round', '0');
  return sessionId;
}

export function getCurrentRound(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(sessionStorage.getItem('draft_current_round') || '0', 10);
}

export function incrementRound(): number {
  if (typeof window === 'undefined') return 0;
  const current = getCurrentRound();
  const next = current + 1;
  sessionStorage.setItem('draft_current_round', next.toString());
  return next;
}

// ============================================
// 데이터 저장/로드
// ============================================

export function loadDecisionRecords(): DecisionRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveDecisionRecord(record: Omit<DecisionRecord, 'id' | 'timestamp'>): void {
  if (typeof window === 'undefined') return;
  const records = loadDecisionRecords();
  const newRecord: DecisionRecord = {
    ...record,
    id: `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
  };
  records.push(newRecord);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

// 한번에 여러 결정 저장 (모달에서 관점 선택 시)
export function saveDecisionBatch(
  ideaId: string,
  ideaCategory: string,
  round: number,
  persona: 'Developer' | 'Designer' | 'VC',
  questionTopic: string,
  options: string[],
  selectedPerspectiveId: string,
  selectedPerspectiveLabel: string,
  isCustomInput: boolean,
  responseTimeSec: number
): void {
  saveDecisionRecord({
    ideaId,
    ideaCategory,
    round,
    persona,
    perspectiveId: selectedPerspectiveId,
    perspectiveLabel: selectedPerspectiveLabel,
    questionTopic,
    options,
    selected: selectedPerspectiveLabel,
    type: isCustomInput ? 'custom_input' : 'option_select',
    responseTimeSec,
  });
}

// ============================================
// 축별 점수 계산
// ============================================

export function calculateAxisScores(records: DecisionRecord[]): AxisScores {
  const scores: AxisScores = {
    speedVsQuality: 0,
    marketVsProduct: 0,
    receptiveVsIndependent: 0,
    techVsBusiness: 0,
    riskSeekingVsAvoiding: 0,
  };

  if (records.length === 0) return scores;

  // 각 결정의 영향 누적
  records.forEach(record => {
    const mapping = PERSPECTIVE_AXIS_MAPPING[record.perspectiveId];
    if (mapping) {
      Object.entries(mapping).forEach(([axis, value]) => {
        scores[axis as keyof AxisScores] += value as number;
      });
    }

    // custom_input은 독립성 증가
    if (record.type === 'custom_input') {
      scores.receptiveVsIndependent -= 0.2; // 독립형 쪽으로
    }
  });

  // 정규화 (-1 ~ +1 범위로)
  Object.keys(scores).forEach(key => {
    scores[key as keyof AxisScores] = Math.max(-1, Math.min(1,
      scores[key as keyof AxisScores] / Math.max(records.length * 0.3, 1)
    ));
  });

  return scores;
}

// ============================================
// 행동 패턴 분석
// ============================================

export function analyzeBehaviorPattern(records: DecisionRecord[]): BehaviorPattern {
  if (records.length === 0) {
    return {
      customInputRatio: 0,
      avgResponseTimeSec: 0,
      personaAcceptance: { Developer: 0, Designer: 0, VC: 0 },
      roundsCompleted: 0,
      totalDecisions: 0,
      sessionsCount: 0,
    };
  }

  // Custom input 비율
  const customInputCount = records.filter(r => r.type === 'custom_input').length;
  const customInputRatio = customInputCount / records.length;

  // 평균 응답 시간
  const avgResponseTimeSec = records.reduce((sum, r) => sum + r.responseTimeSec, 0) / records.length;

  // 페르소나별 수용률 (해당 페르소나 선택 횟수 / 전체)
  const personaCounts = { Developer: 0, Designer: 0, VC: 0 };
  records.forEach(r => {
    if (r.persona in personaCounts) {
      personaCounts[r.persona]++;
    }
  });
  const personaAcceptance = {
    Developer: personaCounts.Developer / records.length,
    Designer: personaCounts.Designer / records.length,
    VC: personaCounts.VC / records.length,
  };

  // 세션 및 라운드 수
  const uniqueSessions = new Set(records.map(r => r.ideaId));
  const maxRound = Math.max(...records.map(r => r.round), 0);

  return {
    customInputRatio,
    avgResponseTimeSec,
    personaAcceptance,
    roundsCompleted: maxRound,
    totalDecisions: records.length,
    sessionsCount: uniqueSessions.size,
  };
}

// ============================================
// 프로필 저장/로드
// ============================================

export function saveFounderProfile(profile: FounderProfile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadFounderProfile(): FounderProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(PROFILE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

// ============================================
// 종합 분석
// ============================================

export function analyzeDecisions(): DecisionAnalysis {
  const records = loadDecisionRecords();
  const axisScores = calculateAxisScores(records);
  const behaviorPattern = analyzeBehaviorPattern(records);
  const profile = loadFounderProfile();

  return {
    records,
    axisScores,
    behaviorPattern,
    profile,
  };
}

// ============================================
// 간단한 프로필 생성 (AI 없이 규칙 기반)
// ============================================

export function generateSimpleProfile(
  axisScores: AxisScores,
  behaviorPattern: BehaviorPattern
): FounderProfile {
  const { speedVsQuality, marketVsProduct, techVsBusiness, riskSeekingVsAvoiding } = axisScores;

  // 창업자 타입 결정
  const typeComponents: string[] = [];

  if (speedVsQuality > 0.2) typeComponents.push('빠른 실행형');
  else if (speedVsQuality < -0.2) typeComponents.push('완성도 추구형');

  if (marketVsProduct > 0.2) typeComponents.push('시장 지향');
  else if (marketVsProduct < -0.2) typeComponents.push('제품 중심');

  if (techVsBusiness > 0.2) typeComponents.push('기술 중심');
  else if (techVsBusiness < -0.2) typeComponents.push('비즈니스 중심');

  const founderType = typeComponents.length > 0
    ? `${typeComponents.join(' ')} 창업자`
    : '균형 잡힌 창업자';

  // 강점 분석
  const strengths: string[] = [];
  if (speedVsQuality > 0.2) strengths.push('빠른 의사결정');
  if (speedVsQuality < -0.2) strengths.push('꼼꼼한 품질 관리');
  if (marketVsProduct < -0.2) strengths.push('제품 감각');
  if (marketVsProduct > 0.2) strengths.push('시장 분석력');
  if (techVsBusiness > 0.2) strengths.push('기술 이해도');
  if (techVsBusiness < -0.2) strengths.push('비즈니스 감각');
  if (riskSeekingVsAvoiding > 0.2) strengths.push('도전 정신');
  if (riskSeekingVsAvoiding < -0.2) strengths.push('신중한 리스크 관리');
  if (behaviorPattern.customInputRatio > 0.5) strengths.push('독창적 사고');
  if (behaviorPattern.avgResponseTimeSec < 5) strengths.push('직관적 판단력');
  if (behaviorPattern.avgResponseTimeSec > 15) strengths.push('깊은 분석력');

  // 약점 분석
  const blindSpots: string[] = [];
  if (speedVsQuality > 0.3) blindSpots.push('품질 관리 소홀 가능성');
  if (speedVsQuality < -0.3) blindSpots.push('출시 지연 리스크');
  if (marketVsProduct < -0.3) blindSpots.push('시장 분석 부족');
  if (marketVsProduct > 0.3) blindSpots.push('제품 디테일 간과');
  if (techVsBusiness > 0.3) blindSpots.push('수익모델 구체화 필요');
  if (techVsBusiness < -0.3) blindSpots.push('기술적 실현가능성 검토 필요');
  if (riskSeekingVsAvoiding > 0.3) blindSpots.push('리스크 과소평가 주의');
  if (riskSeekingVsAvoiding < -0.3) blindSpots.push('기회 놓칠 수 있음');

  // 이상적인 공동 창업자
  const cofounderTraits: string[] = [];
  if (speedVsQuality > 0.2) cofounderTraits.push('꼼꼼한');
  if (speedVsQuality < -0.2) cofounderTraits.push('추진력 있는');
  if (marketVsProduct < -0.2) cofounderTraits.push('시장 감각 있는');
  if (marketVsProduct > 0.2) cofounderTraits.push('제품 중심');
  if (techVsBusiness > 0.2) cofounderTraits.push('비즈니스 중심');
  if (techVsBusiness < -0.2) cofounderTraits.push('기술 중심');

  const idealCofounder = cofounderTraits.length > 0
    ? `${cofounderTraits.slice(0, 2).join(' + ')} 타입`
    : '다양한 관점을 가진 파트너';

  // 매칭 태그
  const matchingTags: string[] = [];
  if (speedVsQuality > 0) matchingTags.push('린스타트업');
  if (speedVsQuality < 0) matchingTags.push('장인정신');
  if (marketVsProduct > 0) matchingTags.push('그로스해커');
  if (marketVsProduct < 0) matchingTags.push('프로덕트러버');
  if (techVsBusiness > 0) matchingTags.push('테크파운더');
  if (techVsBusiness < 0) matchingTags.push('비즈파운더');
  if (riskSeekingVsAvoiding > 0) matchingTags.push('도전형');
  if (riskSeekingVsAvoiding < 0) matchingTags.push('안정형');
  if (behaviorPattern.customInputRatio > 0.5) matchingTags.push('독립형');
  if (behaviorPattern.avgResponseTimeSec < 5) matchingTags.push('직관형');
  if (behaviorPattern.avgResponseTimeSec > 15) matchingTags.push('분석형');

  return {
    founderType,
    axes: axisScores,
    strengths: strengths.slice(0, 4),
    blindSpots: blindSpots.slice(0, 3),
    idealCofounder,
    matchingTags: matchingTags.slice(0, 5),
    generatedAt: new Date().toISOString(),
  };
}

// ============================================
// 팀 매칭 점수 계산
// ============================================

export function calculateMatchScore(profileA: FounderProfile, profileB: FounderProfile): {
  score: number;
  complementary: string[];
  similar: string[];
} {
  const axesA = profileA.axes;
  const axesB = profileB.axes;

  // 상호보완 점수: 축이 반대일수록 높음
  let complementaryScore = 0;
  const complementary: string[] = [];
  const similar: string[] = [];

  const axisLabels: Record<keyof AxisScores, [string, string]> = {
    speedVsQuality: ['실행속도', '완성도'],
    marketVsProduct: ['시장지향', '제품지향'],
    receptiveVsIndependent: ['수용형', '독립형'],
    techVsBusiness: ['기술중심', '비즈니스중심'],
    riskSeekingVsAvoiding: ['리스크추구', '리스크회피'],
  };

  Object.keys(axesA).forEach(key => {
    const k = key as keyof AxisScores;
    const diff = Math.abs(axesA[k] - axesB[k]);
    const avg = (axesA[k] + axesB[k]) / 2;

    if (diff > 0.5) {
      complementaryScore += diff;
      const labelA = axesA[k] > 0 ? axisLabels[k][0] : axisLabels[k][1];
      const labelB = axesB[k] > 0 ? axisLabels[k][0] : axisLabels[k][1];
      complementary.push(`A는 ${labelA}, B는 ${labelB}`);
    } else if (diff < 0.2 && Math.abs(avg) > 0.3) {
      const label = avg > 0 ? axisLabels[k][0] : axisLabels[k][1];
      similar.push(`둘 다 ${label} 성향`);
    }
  });

  // 점수 정규화 (0~100)
  const score = Math.min(100, Math.round(complementaryScore * 40));

  return { score, complementary, similar };
}

// ============================================
// 초기화
// ============================================

export function resetDecisionProfile(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(PROFILE_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem('draft_current_round');
}
