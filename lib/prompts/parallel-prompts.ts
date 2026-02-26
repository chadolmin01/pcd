/**
 * 병렬 토론 모드용 프롬프트 (방안 5: Two-Tier Model Routing)
 * Anthropic 권장 방식: XML 태그 구조화, 타입 안전성, 중복 제거
 */

import {
  Scorecard,
  PERSONA_DESCRIPTIONS,
  PERSONA_CATEGORY_MAP,
  CATEGORY_INFO,
  TARGET_SCORES,
  Level,
  getPerspectiveIdsForPrompt,
} from './persona-config';
import { buildScorecardStatus } from './scorecard-utils';
import { escapePromptContent } from './prompt-security';

// 스코어카드 헬퍼: null-safe 접근
function getScorecardValue(scorecard: Scorecard | null, category: keyof Scorecard): number {
  if (!scorecard || category === 'totalScore') return 0;
  return scorecard[category]?.current ?? 0;
}

function getScorecardFilled(scorecard: Scorecard | null, category: keyof Scorecard): boolean {
  if (!scorecard || category === 'totalScore') return false;
  return scorecard[category]?.filled ?? false;
}

// 결정 멘트 (합성 대기 중 표시) - 더 자연스러운 대화체
export const CLOSING_REMARKS: Record<string, string[]> = {
  Developer: [
    "제 쪽 기술 검토는 여기까지입니다. 다른 분들 의견도 궁금하네요.",
    "코드 관점에서는 이 정도로 정리될 것 같아요. 종합해볼까요?",
    "개발 측면 분석 마쳤습니다. Draft, 정리 부탁드려요."
  ],
  Designer: [
    "UX 관점에서 볼 건 다 본 것 같아요. 합쳐보시죠.",
    "사용자 경험 쪽은 이 정도면 될 것 같습니다. 넘길게요.",
    "디자인 검토 끝났어요. 다른 분들 의견이랑 맞춰볼까요?"
  ],
  VC: [
    "투자자 입장에서 체크할 건 했습니다. 정리해주세요.",
    "수익성 검토 완료요. 전체적으로 어떻게 되는지 보고 싶네요.",
    "비즈니스 모델 쪽은 여기까지. Draft, 종합 부탁해요."
  ],
  Marketer: [
    "마케팅 관점 분석 끝났습니다. 합쳐보시죠.",
    "GTM 전략 검토 완료요. 다음 단계로 넘어가볼까요?",
    "시장 진입 쪽은 정리됐어요. 종합해주세요."
  ],
  Legal: [
    "법적 리스크 체크 마쳤습니다. 넘기겠습니다.",
    "컴플라이언스 검토 완료요. 정리해주세요.",
    "규제 쪽은 확인했어요. 다음 단계로요."
  ],
  PM: [
    "프로덕트 로드맵 검토 끝났습니다. 종합해볼까요?",
    "PM 관점에서는 여기까지예요. 합쳐보시죠.",
    "제품 기획 쪽 정리 완료. Draft, 부탁해요."
  ],
  CTO: [
    "아키텍처 리뷰 마쳤습니다. 전체 그림 봐볼까요?",
    "기술 전략 검토 끝났어요. 종합해주세요.",
    "시스템 설계 쪽은 여기까지. 넘길게요."
  ],
  CFO: [
    "재무 분석 완료했습니다. 전체적으로 정리해볼까요?",
    "숫자 쪽은 다 봤어요. 종합 부탁드려요.",
    "비용 구조 검토 끝났습니다. 합쳐보시죠."
  ],
  EndUser: [
    "사용자 입장에서 느낀 점 정리했어요. 들어보세요.",
    "실제로 쓸 사람 관점에서는 이 정도예요. 넘길게요.",
    "유저 경험 쪽 의견 끝났습니다. 종합해주세요."
  ],
  Operations: [
    "운영 관점 체크 완료했습니다. 정리해볼까요?",
    "실제 운영 쪽은 여기까지예요. 합쳐보시죠.",
    "오퍼레이션 검토 끝났습니다. Draft, 부탁해요."
  ],
};

// 랜덤 결정 멘트 가져오기
export function getRandomClosingRemark(persona: string): string {
  const remarks = CLOSING_REMARKS[persona] || [`${persona} 검토 완료. 종합해주세요.`];
  return remarks[Math.floor(Math.random() * remarks.length)];
}

/**
 * Phase 1: 개별 페르소나 의견 프롬프트 (Flash용 - 간단하고 빠름)
 * @param persona - 페르소나 ID
 * @param viewType - 'positive' | 'concern' 관점 타입
 */
/**
 * 통합 의견 프롬프트 - 한 번의 호출로 모든 페르소나 의견 생성
 */
export function buildCombinedOpinionPrompt(
  idea: string,
  historyContext: string,
  personas: string[],
  _scorecard: Scorecard | null,
  _level: Level = 'mvp'
): string {
  const safeIdea = escapePromptContent(idea);
  const safeHistory = escapePromptContent(historyContext);

  const personaDescriptions = personas.map(persona => {
    const desc = PERSONA_DESCRIPTIONS[persona];
    const categoryMap = PERSONA_CATEGORY_MAP[persona];
    const focusCategories = categoryMap?.primary.map(c => CATEGORY_INFO[c]?.nameKo).filter(Boolean).join(', ') || '미정의';
    return `- ${persona} (${desc?.nameKo || persona}): ${desc?.focus || persona} | 검토: ${focusCategories}`;
  }).join('\n');

  return `<context>
${safeHistory}
</context>

<user_input>${safeIdea}</user_input>

<personas>
${personaDescriptions}
</personas>

<instructions>
각 페르소나 관점에서 이 아이디어에 대한 의견을 작성하세요.

각 의견은:
- 강점 또는 기회 1가지
- 우려 또는 질문 1가지
- 총 3-4문장으로 균형있게 작성

**중요**: 모든 페르소나의 의견 길이가 비슷해야 합니다.

JSON 형식으로 출력:
{
  "${personas[0]}": "의견 내용...",
  "${personas[1]}": "의견 내용...",
  "${personas[2]}": "의견 내용..."
}
</instructions>`;
}

export function buildIndividualOpinionPrompt(
  idea: string,
  historyContext: string,
  persona: string,
  _scorecard: Scorecard | null,
  _level: Level = 'mvp'
): string {
  const desc = PERSONA_DESCRIPTIONS[persona];
  const categoryMap = PERSONA_CATEGORY_MAP[persona];
  const focusCategories = categoryMap?.primary.map(c => CATEGORY_INFO[c]?.nameKo).filter(Boolean).join(', ') || '미정의';

  // 프롬프트 인젝션 방지를 위한 이스케이프
  const safeIdea = escapePromptContent(idea);
  const safeHistory = escapePromptContent(historyContext);

  return `<context>
${safeHistory}
</context>

<user_input>${safeIdea}</user_input>

<role>
${desc?.nameKo || persona}
전문: ${desc?.focus || persona}
검토 영역: ${focusCategories}
</role>

<instructions>
이 아이디어에 대해 당신의 전문 분야 관점에서 핵심 의견을 제시하세요.
- 강점 또는 기회 1가지
- 우려 또는 질문 1가지
총 3-4문장으로 간결하게 작성하세요. 한국어로 답하세요.
</instructions>`;
}

/**
 * Phase 3: 합성 프롬프트 (Pro/Opus용 - 품질 중심)
 * @param personas - 최소 3개의 페르소나 필요
 */
export function buildSynthesisPrompt(
  idea: string,
  opinions: { persona: string; opinion: string }[],
  personas: string[],
  scorecard: Scorecard | null,
  turnNumber: number = 1,
  level: Level = 'mvp'
): string {
  // 페르소나 최소 3개 보장 (기본값 사용)
  const p0 = personas[0] || 'Developer';
  const p1 = personas[1] || 'Designer';
  const p2 = personas[2] || 'VC';
  const safePersonas = [p0, p1, p2];

  const currentTotal = scorecard?.totalScore ?? 0;
  const targetScore = TARGET_SCORES[level] ?? 65;
  const minIncrease = Math.max(5, Math.ceil((targetScore - currentTotal) / Math.max(1, 8 - turnNumber)));

  const scorecardStatus = buildScorecardStatus(scorecard);

  // 프롬프트 인젝션 방지를 위한 이스케이프
  const safeIdea = escapePromptContent(idea);

  const opinionsText = opinions.map(o => {
    const desc = PERSONA_DESCRIPTIONS[o.persona];
    // 의견도 AI에서 온 것이지만 안전을 위해 이스케이프
    const safeOpinion = escapePromptContent(o.opinion);
    return `<opinion persona="${desc?.nameKo || o.persona}">\n${safeOpinion}\n</opinion>`;
  }).join('\n');

  const personaCategories = safePersonas.map(p => {
    const map = PERSONA_CATEGORY_MAP[p];
    const desc = PERSONA_DESCRIPTIONS[p];
    return `${desc?.nameKo || p}: ${map?.primary.map(c => CATEGORY_INFO[c]?.nameKo).filter(Boolean).join(', ') || '미정의'}`;
  }).join('\n');

  return `<max_truth_objective>
이 시스템의 목적은 사용자에게 **최대한 정확하고 솔직한 아이디어 검증**을 제공하는 것이다.
모든 출력에서 과장, 미화, 안전한 중립을 피하고,
진짜 위험한 부분은 명확히 지적하되,
건설적인 다음 액션을 항상 제시한다.
</max_truth_objective>

<user_input>${safeIdea}</user_input>

<scorecard>
${scorecardStatus}
</scorecard>

<collected_opinions>
${opinionsText}
</collected_opinions>

<role>Draft AI - 토론 코디네이터</role>

<task>
1. reflection_history가 있다면 모든 decision을 **하나씩** 검토하세요.
2. 각 decision이 현재 아이디어에 **구체적으로 어떻게 반영되었는지** 토론에서 언급하세요.
3. impact="high"인 decision은 반드시 우선 반영하고 해당 카테고리 점수를 올리세요.
4. 새로운 토론(discussion)에서 이전 decision들을 자연스럽게 인용하며 발전시키세요.
5. scorecard 업데이트 시 score_evolution을 참조해 일관성 있게 delta를 계산하세요.
</task>

<discussion_format>
- 4-6턴의 실제 대화 (독백 금지)
- 예시: "지난번 말씀하신 API 설계 부분을 반영해서..." / "CFO님 의견에 동의합니다. 다만..."
- 각 턴은 반드시 이전 발언자에게 반응 (replyTo 필수)
- tone: agree(동의), disagree(반박), question(질문), suggestion(제안), neutral(중립)
</discussion_format>

<constraints>
- 점수 감소 절대 불가
- 최소 +${minIncrease}점 이상
- linked_categories에 해당하는 카테고리 우선 점수 반영
- replyTo 필수 사용, tone 정확히 매핑
- JSON만 출력 (DiscussionResponseSchema 엄격 준수)
</constraints>

<game_state>
턴: ${turnNumber}/8
현재: ${currentTotal}점 → 목표: ${targetScore}점
최소 증가: +${minIncrease}점
</game_state>

<persona_categories>
${personaCategories}
</persona_categories>

<perspective_ids>
${getPerspectiveIdsForPrompt(safePersonas)}
</perspective_ids>

<current_scores>
problemDefinition: ${getScorecardValue(scorecard, 'problemDefinition')}/15
solution: ${getScorecardValue(scorecard, 'solution')}/15
marketAnalysis: ${getScorecardValue(scorecard, 'marketAnalysis')}/10
revenueModel: ${getScorecardValue(scorecard, 'revenueModel')}/10
differentiation: ${getScorecardValue(scorecard, 'differentiation')}/10
logicalConsistency: ${getScorecardValue(scorecard, 'logicalConsistency')}/15
feasibility: ${getScorecardValue(scorecard, 'feasibility')}/15
feedbackReflection: ${getScorecardValue(scorecard, 'feedbackReflection')}/10
totalScore: ${currentTotal} → 목표: ${currentTotal + minIncrease}+
</current_scores>

<output_format>
JSON 스키마 (DiscussionResponseSchema):
- discussion: [{persona:"Developer", message:"...", replyTo:"Designer", tone:"agree"}] (4-6턴, 필수)
- responses: 반드시 ${safePersonas.length}개 (${safePersonas.join(', ')}) - [{role:"Developer", name:"개발자", content:"핵심 1문장", perspectives:[...]}]
- scorecard: 점수 (max: 15,15,10,10,10,15,15,10, 감소 불가)
- categoryUpdates: [{category:"feasibility", delta:3, reason:"..."}]
- inputRelevance: {isRelevant:true}
</output_format>`;
}
