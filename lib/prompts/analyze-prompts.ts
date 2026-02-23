/**
 * AI 분석 프롬프트 템플릿
 */

import { getKnowledgeBaseForPrompt, getFullKnowledgeBase } from '@/lib/knowledge-base/startup-criteria';
import {
  Scorecard,
  CATEGORY_INFO,
  PERSONA_DESCRIPTIONS,
  PERSONA_CATEGORY_MAP,
  TARGET_SCORES
} from './persona-config';
import { buildScorecardStatus } from './scorecard-utils';

export function getAnalyzeSystemInstruction(level: string, personas: string[]): string {
  const personaDescriptions = personas
    .map((p, idx) => {
      const desc = PERSONA_DESCRIPTIONS[p];
      if (!desc) return '';
      return `${idx + 1}. "${desc.nameKo}" (${p}): ${desc.focus}`;
    })
    .filter(Boolean)
    .join('\n      ');

  const personaKnowledge = personas
    .map(p => getKnowledgeBaseForPrompt(p))
    .join('\n');

  const baseInstruction = `당신은 "Draft." 스타트업 아이디어 검증 엔진입니다. 사용자가 아이디어를 입력하면 선택된 ${personas.length}가지 페르소나로 응답합니다. 한국어로 응답하십시오.

선택된 페르소나:
      ${personaDescriptions}

${getFullKnowledgeBase()}

**[페르소나별 심화 지식]**
${personaKnowledge}

**[Knowledge Base 활용 규칙]**
1. 레드플래그 발견 시 → 즉시 지적하고 개선 방향 제시
2. 성공 패턴과 유사하면 → 해당 사례 언급하며 격려
3. 투자자 질문 중 답변 안 된 것 → 자연스럽게 유도
4. 시장/수익 숫자 언급 시 → VC 기준과 비교 평가`;

  const levelInstructions: Record<string, string> = {
    sketch: `
    **[Level 1: 아이디어 스케치 단계]**
    - 목표: 창업자가 아이디어를 구체화하도록 돕고 동기를 부여합니다.
    - 태도: 친절하고, 협력적이며, 이해하기 쉬운 언어를 사용하세요.
    - 제약: 답변을 짧고 명료하게(3문장 이내) 유지하세요. 어려운 전문 용어 사용을 지양하세요.
    - Knowledge Base: 레드플래그는 부드럽게 언급, 성공 사례는 동기부여용으로 활용`,

    investor: `
    **[Level 3: 투자자 방어(Hardcore) 단계]**
    - 목표: 창업자의 논리를 극한까지 검증하고 약점을 파고듭니다.
    - 태도: 매우 냉소적이고, 비판적이며, 전문적인 용어를 사용하세요. 봐주지 마세요.
    - 제약: 창업자가 논리적으로 방어하지 못하면 점수를 낮게 책정하세요.
    - Knowledge Base: VC 기준 엄격 적용, 투자자 질문 7개 모두 검증, 레드플래그 즉시 지적`,

    mvp: `
    **[Level 2: MVP 빌딩 단계]**
    - 목표: 현실적인 제품 출시를 위해 불필요한 기능을 덜어냅니다.
    - 태도: 논리적이고, 현실적이며, 실무 중심적입니다.
    - 제약: 현실적인 제약을 근거로 피드백을 제공하세요.
    - Knowledge Base: 성공 사례의 MVP 전략 참고, 레드플래그는 건설적으로 지적`
  };

  return `${baseInstruction}${levelInstructions[level] || levelInstructions.mvp}`;
}

export function buildAnalyzePrompt(
  idea: string,
  historyContext: string,
  personas: string[],
  scorecard: Scorecard | null,
  turnNumber: number = 1,
  level: string = 'mvp'
): string {
  const currentTotal = scorecard?.totalScore || 0;
  const targetScore = TARGET_SCORES[level] || 65;
  const remainingTurns = Math.max(1, 8 - turnNumber);
  const expectedPerTurn = Math.ceil((targetScore - currentTotal) / remainingTurns);

  const personaCategoryInfo = personas.map(p => {
    const map = PERSONA_CATEGORY_MAP[p];
    const desc = PERSONA_DESCRIPTIONS[p];
    return `- ${desc?.nameKo || p}: 주로 [${map?.primary.map(c => CATEGORY_INFO[c]?.nameKo).join(', ')}] 점수를 올림, 가끔 [${map?.secondary.map(c => CATEGORY_INFO[c]?.nameKo).join(', ')}]도 가능`;
  }).join('\n');

  const scorecardStatus = buildScorecardStatus(scorecard);

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

**[점수 진행 예시 - 대화할수록 반드시 우상향]**
- 1턴 후: totalScore 12~18 (첫 아이디어 입력)
- 3턴 후: totalScore 30~40 (기본 컨셉 확립)
- 6턴 후: totalScore 50~65 (세부사항 구체화)
- 8턴 후: totalScore 65~80 (검증 완료)

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
