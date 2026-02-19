import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { withRateLimit } from '@/src/lib/rate-limit';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// 스코어카드 카테고리 정의
interface CategoryScore {
  current: number;
  max: number;
  filled: boolean;
}

interface Scorecard {
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

const CATEGORY_INFO: Record<string, { nameKo: string; max: number }> = {
  problemDefinition: { nameKo: '문제 정의', max: 15 },
  solution: { nameKo: '솔루션', max: 15 },
  marketAnalysis: { nameKo: '시장 분석', max: 10 },
  revenueModel: { nameKo: '수익 모델', max: 10 },
  differentiation: { nameKo: '차별화', max: 10 },
  logicalConsistency: { nameKo: '논리 일관성', max: 15 },
  feasibility: { nameKo: '실현 가능성', max: 15 },
  feedbackReflection: { nameKo: '피드백 반영', max: 10 },
};

// 6번: 페르소나 → 카테고리 매핑
const PERSONA_CATEGORY_MAP: Record<string, { primary: string[]; secondary: string[] }> = {
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

// 페르소나별 설명 및 역할
const PERSONA_DESCRIPTIONS: Record<string, { nameKo: string; role: string; focus: string }> = {
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

function getAnalyzeSystemInstruction(level: string, personas: string[]) {
  const personaDescriptions = personas
    .map((p, idx) => {
      const desc = PERSONA_DESCRIPTIONS[p];
      if (!desc) return '';
      return `${idx + 1}. "${desc.nameKo}" (${p}): ${desc.focus}`;
    })
    .filter(Boolean)
    .join('\n      ');

  const baseInstruction = `당신은 "Draft." 스타트업 아이디어 검증 엔진입니다. 사용자가 아이디어를 입력하면 선택된 ${personas.length}가지 페르소나로 응답합니다. 한국어로 응답하십시오.

선택된 페르소나:
      ${personaDescriptions}`;

  if (level === 'sketch') {
    return `${baseInstruction}

    **[Level 1: 아이디어 스케치 단계]**
    - 목표: 창업자가 아이디어를 구체화하도록 돕고 동기를 부여합니다.
    - 태도: 친절하고, 협력적이며, 이해하기 쉬운 언어를 사용하세요.
    - 제약: 답변을 짧고 명료하게(3문장 이내) 유지하세요. 어려운 전문 용어 사용을 지양하세요.`;
  } else if (level === 'investor') {
    return `${baseInstruction}

    **[Level 3: 투자자 방어(Hardcore) 단계]**
    - 목표: 창업자의 논리를 극한까지 검증하고 약점을 파고듭니다.
    - 태도: 매우 냉소적이고, 비판적이며, 전문적인 용어를 사용하세요. 봐주지 마세요.
    - 제약: 창업자가 논리적으로 방어하지 못하면 점수를 낮게 책정하세요.`;
  } else {
    return `${baseInstruction}

    **[Level 2: MVP 빌딩 단계]**
    - 목표: 현실적인 제품 출시를 위해 불필요한 기능을 덜어냅니다.
    - 태도: 논리적이고, 현실적이며, 실무 중심적입니다.
    - 제약: 현실적인 제약을 근거로 피드백을 제공하세요.`;
  }
}

function buildScorecardStatus(scorecard: Scorecard | null): string {
  const categories = [
    'problemDefinition', 'solution', 'marketAnalysis', 'revenueModel',
    'differentiation', 'logicalConsistency', 'feasibility', 'feedbackReflection'
  ] as const;

  if (!scorecard) {
    return `[현재 스코어카드 - 새 세션]
모든 카테고리가 0점입니다. 사용자의 아이디어를 분석하여 해당하는 카테고리에 점수를 부여하세요.

카테고리별 최대 점수:
- problemDefinition (문제 정의): 0/15
- solution (솔루션): 0/15
- marketAnalysis (시장 분석): 0/10
- revenueModel (수익 모델): 0/10
- differentiation (차별화): 0/10
- logicalConsistency (논리 일관성): 0/15
- feasibility (실현 가능성): 0/15
- feedbackReflection (피드백 반영): 0/10
총점: 0/100

🎯 우선 채워야 할 카테고리: 문제 정의, 솔루션, 시장 분석, 차별화`;
  }

  // 카테고리별 점수 비율 계산 (current/max)
  const categoryScores = categories.map(cat => ({
    key: cat,
    nameKo: CATEGORY_INFO[cat].nameKo,
    current: scorecard[cat].current,
    max: CATEGORY_INFO[cat].max,
    ratio: scorecard[cat].current / CATEGORY_INFO[cat].max,
    filled: scorecard[cat].filled
  }));

  // 가장 낮은 점수 비율 카테고리 찾기 (최대 3개)
  const lowestCategories = [...categoryScores]
    .sort((a, b) => a.ratio - b.ratio)
    .slice(0, 3)
    .filter(c => c.ratio < 0.7); // 70% 미만인 것만

  const emptyCategories = categories.filter(cat => !scorecard[cat].filled);
  const filledCategories = categories.filter(cat => scorecard[cat].filled);

  const statusLines = categories.map(cat => {
    const info = CATEGORY_INFO[cat];
    const score = scorecard[cat];
    const status = score.filled ? '[O]' : '[ ]';
    const isLowest = lowestCategories.some(l => l.key === cat);
    return `${status} ${info.nameKo}: ${score.current}/${score.max}${isLowest ? ' ⚠️' : ''}`;
  }).join('\n');

  // 최저 카테고리에 대한 자연스러운 질문 예시 생성
  const questionHints: Record<string, string> = {
    problemDefinition: '"이 문제를 겪는 사람이 구체적으로 어떤 상황인가요?"',
    solution: '"이걸 어떻게 해결하실 건가요?"',
    marketAnalysis: '"비슷한 서비스 중에 XX가 있는데, 거기랑 뭐가 다를까요?"',
    revenueModel: '"사용자가 돈을 내는 시점은 언제인가요?"',
    differentiation: '"경쟁 서비스 대비 이게 왜 더 나은가요?"',
    logicalConsistency: '"이 기능과 저 기능이 어떻게 연결되나요?"',
    feasibility: '"이걸 만들려면 어떤 기술이 필요할까요?"',
    feedbackReflection: '"제가 제안한 방식 중 어떤 게 마음에 드세요?"'
  };

  const lowestHints = lowestCategories
    .map(c => `- ${c.nameKo}: ${questionHints[c.key] || '관련 질문을 자연스럽게 섞어주세요'}`)
    .join('\n');

  return `[현재 스코어카드]
${statusLines}
총점: ${scorecard.totalScore}/100

🎯 [이번 턴 우선 타겟 - 자연스럽게 유도]
${lowestCategories.length > 0 ? lowestCategories.map(c => `${c.nameKo} (${c.current}/${c.max})`).join(', ') : '균형 잡힌 상태'}

💡 [자연스러운 질문 예시]
${lowestHints || '특별히 낮은 카테고리 없음'}

${emptyCategories.length > 0 ? `[빈 카테고리]
${emptyCategories.map(cat => CATEGORY_INFO[cat].nameKo).join(', ')}` : '[모든 카테고리 채워짐]'}`;
}

// 3번: Perspectives는 AI가 아이디어 맥락에서 동적 생성 (하드코딩 제거)
// 단, Founder Profile 분석을 위해 허용된 perspectiveId만 사용

// 페르소나별 허용된 perspectiveId (decisionAnalyzer.ts의 PERSPECTIVE_AXIS_MAPPING과 동기화)
const ALLOWED_PERSPECTIVE_IDS: Record<string, { id: string; labelKo: string }[]> = {
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

function buildPrompt(idea: string, historyContext: string, personas: string[], scorecard: Scorecard | null, turnNumber: number = 1, level: string = 'mvp') {
  // 현재 점수 계산
  const currentTotal = scorecard?.totalScore || 0;

  // level에 따른 목표 점수 (동적)
  const TARGET_SCORES: Record<string, number> = {
    sketch: 40,
    mvp: 65,
    investor: 85,
  };
  const targetScore = TARGET_SCORES[level] || 65;

  const remainingTurns = Math.max(1, 8 - turnNumber);
  const expectedPerTurn = Math.ceil((targetScore - currentTotal) / remainingTurns);

  // 페르소나별 담당 카테고리 정보 생성
  const personaCategoryInfo = personas.map(p => {
    const map = PERSONA_CATEGORY_MAP[p];
    const desc = PERSONA_DESCRIPTIONS[p];
    return `- ${desc?.nameKo || p}: 주로 [${map?.primary.map(c => CATEGORY_INFO[c]?.nameKo).join(', ')}] 점수를 올림, 가끔 [${map?.secondary.map(c => CATEGORY_INFO[c]?.nameKo).join(', ')}]도 가능`;
  }).join('\n');

  const scorecardStatus = buildScorecardStatus(scorecard);

  // 2번: 단계별 앵커 예시
  const progressExamples = `
**[점수 진행 예시 - 대화할수록 반드시 우상향]**
- 1턴 후: totalScore 12~18 (첫 아이디어 입력)
- 3턴 후: totalScore 30~40 (기본 컨셉 확립)
- 6턴 후: totalScore 50~65 (세부사항 구체화)
- 8턴 후: totalScore 65~80 (검증 완료)`;

  return `${historyContext}
${scorecardStatus}

사용자 입력: "${idea}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 게임 규칙: 이것은 "성장하는 게임"입니다
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**핵심 원칙:**
- 대화가 진행될수록 점수는 반드시 우상향합니다
- 유저가 어떤 답을 해도 최소 +3점은 올라갑니다
- 좋은 답변이면 +5~10점이 올라갑니다
- 매 턴마다 최소 1개 카테고리가 반드시 올라가야 합니다

**현재 상태:**
- 턴: ${turnNumber}/8
- 현재 점수: ${currentTotal}점
- 목표 점수: ${targetScore}점 (${level === 'sketch' ? 'Sketch' : level === 'investor' ? 'Defense' : 'MVP'} 등록)
- 권장 페이스: 이번 턴 +${Math.max(5, expectedPerTurn)}점 이상

${progressExamples}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 점수 증가 트리거 (구체적 조건)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| 유저 행동 | 점수 증가 |
|-----------|-----------|
| 새로운 정보 제공 (아이디어, 기능, 타겟 등) | +3~5 |
| 제시된 선택지 중 하나 선택 | +2~4 |
| 자기만의 답변 직접 작성 | +4~6 |
| 페르소나 조언을 반영해 수정/발전 | +5~8 |
| 구체적 숫자/데이터 언급 | +3~5 |

**🔔 피드백 반영 (feedbackReflection) 특별 규칙:**
- "[종합 결정 사항]" 또는 "[User ACCEPTED & DECIDED]"가 입력에 포함되면 → feedbackReflection +3~5
- 유저가 "~할게요", "~로 정했어요", "~를 선택"처럼 결정을 표명하면 → feedbackReflection +2~3
- 이 카테고리는 유저가 적극적으로 피드백을 수용할 때 올라갑니다

**절대 규칙:**
- 점수 감소는 없습니다
- 모든 카테고리 점수는 이전보다 같거나 높아야 합니다
- delta가 0인 카테고리는 categoryUpdates에 포함하지 마세요

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👥 페르소나별 담당 카테고리
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${personaCategoryInfo}

각 페르소나는 자신의 담당 카테고리 점수를 올려주세요.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 낮은 카테고리 자연스러운 유도 규칙
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

위 스코어카드에서 ⚠️ 표시된 카테고리는 점수가 낮습니다.
각 페르소나는 **본래 조언을 하면서** 자연스럽게 낮은 카테고리 관련 내용을 섞어주세요.

**방법:**
- 직접적으로 묻지 말고, 맥락 안에서 유도하세요
- 페르소나의 전문 영역과 연결해서 질문하세요

**예시:**
Developer가 기술 스택 조언하면서 차별화(differentiation) 유도:
"Flutter 좋은 선택이에요. 그런데 비슷한 산책 앱 중에 스트라바가 있잖아요. 거기랑 뭐가 다를까요?"
→ 기술 조언 + 차별화 질문이 한 턴에 해결

VC가 수익 모델 조언하면서 시장분석(marketAnalysis) 유도:
"구독 모델이 좋겠네요. 그런데 이 시장에서 월 5천원을 내는 사람이 얼마나 있을까요?"
→ 수익 모델 조언 + 시장 규모 질문이 한 턴에 해결

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 Perspectives 생성 규칙 (Founder Profile 분석용)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ 중요: perspectiveId는 반드시 아래 목록에서만 선택하세요!
이 ID는 창업자 성향 분석에 사용되므로 정확히 맞춰야 합니다.

**Developer 허용 ID (12개):**
security(보안), speed(빠른출시), scalability(확장성), data-structure(데이터구조),
infra-cost(인프라비용), api-design(API설계), realtime(실시간), offline(오프라인),
ai-ml(AI/ML), location(위치기반), integration(외부연동), performance(성능최적화)

**Designer 허용 ID (12개):**
usability(사용성), aesthetics(심미성), accessibility(접근성), onboarding(온보딩),
gamification(게임화), mobile-first(모바일우선), simplicity(단순함), personalization(개인화),
emotional(감성디자인), consistency(일관성), feedback(피드백UX), trust(신뢰감)

**VC 허용 ID (12개):**
revenue(수익모델), market-size(시장규모), moat(진입장벽), unit-economics(유닛이코노믹스),
timing(시장타이밍), team(팀역량), network-effect(네트워크효과), retention(리텐션),
exit(엑싯전략), regulation(규제환경), global(글로벌확장), viral(바이럴성장)

**사용법:**
- perspectiveId: 반드시 위 목록의 영어 ID 중 하나 (예: "speed", "usability", "revenue")
- perspectiveLabel: 한글 라벨은 아이디어 맥락에 맞게 자유롭게 작성
- content: 해당 관점에서의 구체적 조언

**예시:**
산책앱 + Developer:
- { perspectiveId: "location", perspectiveLabel: "GPS 정확도 우선", content: "..." }
- { perspectiveId: "performance", perspectiveLabel: "배터리 최적화", content: "..." }
- { perspectiveId: "offline", perspectiveLabel: "오프라인 산책 기록", content: "..." }

핀테크 + VC:
- { perspectiveId: "moat", perspectiveLabel: "금융 라이선스 진입장벽", content: "..." }
- { perspectiveId: "regulation", perspectiveLabel: "핀테크 규제 대응", content: "..." }
- { perspectiveId: "revenue", perspectiveLabel: "수수료 기반 수익", content: "..." }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

한국어로 응답하세요. 반드시 다음 JSON 형식으로 응답하세요:
{
  "responses": [
    {
      "role": "Developer",
      "name": "개발자",
      "content": "핵심 피드백 요약 (1문장)",
      "tone": "Analytical",
      "suggestedActions": [],
      "perspectives": [
        {
          "perspectiveId": "speed",
          "perspectiveLabel": "빠른 MVP 출시",
          "content": "이 관점에서의 구체적인 조언 (2-3문장)",
          "suggestedActions": ["실행 방안 1", "실행 방안 2"]
        },
        { "perspectiveId": "scalability", "perspectiveLabel": "확장 가능한 구조", "content": "...", "suggestedActions": ["..."] },
        { "perspectiveId": "security", "perspectiveLabel": "보안 우선 설계", "content": "...", "suggestedActions": ["..."] }
      ]
    }
  ],
  "metrics": {
    "score": ${currentTotal + Math.max(5, expectedPerTurn)},
    "developerScore": 70,
    "designerScore": 80,
    "vcScore": 75,
    "keyRisks": ["주요 리스크 1"],
    "keyStrengths": ["강점 1"],
    "summary": "전체 요약 (1문장)"
  },
  "scorecard": {
    "problemDefinition": { "current": ${(scorecard?.problemDefinition.current || 0) + 3}, "max": 15, "filled": true },
    "solution": { "current": ${(scorecard?.solution.current || 0) + 2}, "max": 15, "filled": true },
    "marketAnalysis": { "current": ${scorecard?.marketAnalysis.current || 0}, "max": 10, "filled": ${scorecard?.marketAnalysis.filled || false} },
    "revenueModel": { "current": ${scorecard?.revenueModel.current || 0}, "max": 10, "filled": ${scorecard?.revenueModel.filled || false} },
    "differentiation": { "current": ${scorecard?.differentiation.current || 0}, "max": 10, "filled": ${scorecard?.differentiation.filled || false} },
    "logicalConsistency": { "current": ${(scorecard?.logicalConsistency.current || 0) + 1}, "max": 15, "filled": true },
    "feasibility": { "current": ${scorecard?.feasibility.current || 0}, "max": 15, "filled": ${scorecard?.feasibility.filled || false} },
    "feedbackReflection": { "current": ${scorecard?.feedbackReflection.current || 0}, "max": 10, "filled": ${scorecard?.feedbackReflection.filled || false} },
    "totalScore": ${currentTotal + Math.max(5, expectedPerTurn)}
  },
  "categoryUpdates": [
    { "category": "problemDefinition", "delta": 3, "reason": "문제 상황을 구체화함" },
    { "category": "solution", "delta": 2, "reason": "해결 방향 제시" }
  ]
}`;
}

// withRateLimit HOF 적용 - AI 엔드포인트로 더 엄격한 제한
export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    const {
      idea,
      conversationHistory = [],
      level = 'mvp',
      personas = ['Developer', 'Designer', 'VC'],
      currentScorecard = null,
      turnNumber = 1
    } = await request.json();

    if (!idea || idea.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '아이디어를 입력해주세요.' },
        { status: 400 }
      );
    }

    const historyContext = conversationHistory.length > 0
      ? `[이전 대화 및 결정 내역]:\n${conversationHistory.join('\n')}\n\n`
      : '';

    const prompt = buildPrompt(idea, historyContext, personas, currentScorecard, turnNumber, level);

    // 스코어카드 포함으로 토큰 증가
    const maxTokens = level === 'sketch' ? 1500 : 3000;
    const temperature = level === 'sketch' ? 0.9 : 0.7;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: getAnalyzeSystemInstruction(level, personas),
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: maxTokens,
        temperature: temperature,
      }
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);

    // 5번: 스코어카드 점수 보정 로직 (최소 +2 보장)
    const categories = [
      'problemDefinition', 'solution', 'marketAnalysis', 'revenueModel',
      'differentiation', 'logicalConsistency', 'feasibility', 'feedbackReflection'
    ] as const;

    if (parsed.scorecard) {
      let recalculatedTotal = 0;
      let totalIncrease = 0;

      // 🔔 피드백 반영 자동 감지: "[종합 결정 사항]" 또는 결정 표현이 있으면 feedbackReflection 자동 가산
      const isFeedbackResponse = idea.includes('[종합 결정 사항]') ||
        idea.includes('[User ACCEPTED & DECIDED]') ||
        /결정.*했|선택.*했|할게요|하겠습니다|로\s*정했/.test(idea);

      if (isFeedbackResponse && parsed.scorecard.feedbackReflection) {
        const feedbackCurrent = parsed.scorecard.feedbackReflection.current || 0;
        const feedbackMax = 10;
        const feedbackBonus = Math.min(3, feedbackMax - feedbackCurrent);
        if (feedbackBonus > 0) {
          parsed.scorecard.feedbackReflection.current = feedbackCurrent + feedbackBonus;
          parsed.scorecard.feedbackReflection.filled = true;

          if (!parsed.categoryUpdates) {
            parsed.categoryUpdates = [];
          }
          const existingFeedbackUpdate = parsed.categoryUpdates.find((u: any) => u.category === 'feedbackReflection');
          if (existingFeedbackUpdate) {
            existingFeedbackUpdate.delta += feedbackBonus;
          } else {
            parsed.categoryUpdates.push({
              category: 'feedbackReflection',
              delta: feedbackBonus,
              reason: '피드백 반영 완료'
            });
          }
        }
      }

      for (const cat of categories) {
        const prevScore = currentScorecard?.[cat]?.current || 0;
        const newScore = parsed.scorecard[cat]?.current || 0;
        const maxScore = CATEGORY_INFO[cat].max;

        // 점수 감소 방지: 기존 점수보다 낮으면 기존 점수 유지
        if (newScore < prevScore) {
          parsed.scorecard[cat].current = prevScore;
        }

        // 최대 점수 초과 방지
        if (parsed.scorecard[cat].current > maxScore) {
          parsed.scorecard[cat].current = maxScore;
        }

        // filled 상태 유지: 한번 채워지면 계속 filled
        if (currentScorecard?.[cat]?.filled) {
          parsed.scorecard[cat].filled = true;
        }

        // 0보다 크면 filled
        if (parsed.scorecard[cat].current > 0) {
          parsed.scorecard[cat].filled = true;
        }

        totalIncrease += (parsed.scorecard[cat].current - prevScore);
        recalculatedTotal += parsed.scorecard[cat].current;
      }

      // 최소 +2점 보장: 대화했는데 점수가 안 올랐으면 강제 가산
      if (totalIncrease < 2 && currentScorecard) {
        // 아직 최대가 아닌 카테고리 중 하나에 +2
        for (const cat of categories) {
          const current = parsed.scorecard[cat].current;
          const max = CATEGORY_INFO[cat].max;
          if (current < max) {
            const addAmount = Math.min(2, max - current);
            parsed.scorecard[cat].current += addAmount;
            parsed.scorecard[cat].filled = true;
            recalculatedTotal += addAmount;

            // categoryUpdates에 추가
            if (!parsed.categoryUpdates) {
              parsed.categoryUpdates = [];
            }
            const existingUpdate = parsed.categoryUpdates.find((u: any) => u.category === cat);
            if (existingUpdate) {
              existingUpdate.delta += addAmount;
            } else {
              parsed.categoryUpdates.push({
                category: cat,
                delta: addAmount,
                reason: '대화 참여 보너스'
              });
            }
            break;
          }
        }
      }

      parsed.scorecard.totalScore = recalculatedTotal;

      // categoryUpdates에서 delta가 0인 항목 제거
      if (parsed.categoryUpdates) {
        parsed.categoryUpdates = parsed.categoryUpdates.filter((u: any) => u.delta > 0);
      }
    }

    return NextResponse.json({ success: true, result: parsed });
  } catch (error) {
    console.error('Analyze Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}, { isAI: true });
