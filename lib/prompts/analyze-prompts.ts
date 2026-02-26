/**
 * AI 분석 프롬프트 템플릿
 * Anthropic 권장 방식: XML 태그 구조화, 명확한 섹션 분리, 간결한 지침
 */

import { getKnowledgeBaseForPrompt, getFullKnowledgeBase } from '@/lib/knowledge-base/startup-criteria';
import {
  Scorecard,
  CATEGORY_INFO,
  PERSONA_DESCRIPTIONS,
  PERSONA_CATEGORY_MAP,
  TARGET_SCORES,
  Level,
  getPerspectiveIdsForPrompt,
} from './persona-config';
import { buildScorecardStatus } from './scorecard-utils';
import { escapePromptContent } from './prompt-security';

// 레벨별 설정 (string 인덱스 허용 - 외부 호출 호환성)
const LEVEL_CONFIG: Record<string, { name: string; goal: string; tone: string }> = {
  sketch: {
    name: 'Sketch',
    goal: '아이디어 구체화 및 동기 부여',
    tone: '친절하고 협력적. 3문장 이내. 쉬운 언어 사용.'
  },
  mvp: {
    name: 'MVP',
    goal: '현실적 제품 출시를 위한 핵심 기능 집중',
    tone: '논리적이고 실무 중심. 건설적 비판.'
  },
  investor: {
    name: 'Defense',
    goal: '투자자 관점의 철저한 검증',
    tone: '냉철하고 비판적. 전문 용어 사용. VC 기준 엄격 적용.'
  }
};

/**
 * 개별 의견용 간단한 시스템 인스트럭션 (Flash 모델용)
 * JSON 출력 지시 없이 텍스트 응답만 유도
 */
export function getSimpleSystemInstruction(persona: string): string {
  const desc = PERSONA_DESCRIPTIONS[persona];
  return `당신은 ${desc?.nameKo || persona}입니다.
전문 분야: ${desc?.focus || persona}
언어: 한국어
응답 형식: 2-3문장의 간결한 텍스트 (JSON 아님)`;
}

export function getAnalyzeSystemInstruction(level: string, personas: string[]): string {
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG.mvp;

  const personaList = personas
    .map(p => {
      const desc = PERSONA_DESCRIPTIONS[p];
      return desc ? `- ${desc.nameKo} (${p}): ${desc.focus}` : '';
    })
    .filter(Boolean)
    .join('\n');

  const personaKnowledge = personas
    .map(p => getKnowledgeBaseForPrompt(p))
    .join('\n');

  return `<role>
스타트업 아이디어 검증 엔진 "Draft."
언어: 한국어
</role>

<personas>
${personaList}
</personas>

<level name="${config.name}">
목표: ${config.goal}
톤: ${config.tone}
</level>

<knowledge_base>
${getFullKnowledgeBase()}

<persona_expertise>
${personaKnowledge}
</persona_expertise>

<usage_rules>
- 레드플래그 발견 → 지적 + 개선 방향 제시
- 성공 패턴 유사 → 해당 사례 언급
- 투자자 질문 미답변 → 자연스럽게 유도
- 시장/수익 숫자 → VC 기준과 비교
</usage_rules>
</knowledge_base>

<input_validation>
사용자 입력이 아이디어 발전에 관련이 있는지 판단하세요.

관련 없음 (isRelevant: false) 판단 기준:
- 의미없는 문자열 (예: "ㅋㅋㅋ", "asdf", "...")
- 주제와 무관한 내용 (예: 날씨, 인사말만, 장난)
- 너무 짧아서 의미 파악 불가 (예: "네", "좋아요"만)
- 욕설이나 비속어만 포함

관련 있음 (isRelevant: true) 판단 기준:
- 아이디어에 대한 구체적 설명
- 질문에 대한 답변
- 피드백 수용/거절 의사 표현
- 추가 정보 제공

관련 없으면 warningMessage에 친절한 안내 메시지를 포함하세요.
</input_validation>`;
}

// 스코어카드 헬퍼: null-safe 접근 및 일관된 포맷
function getScorecardValue(scorecard: Scorecard | null, category: keyof Scorecard): number {
  if (!scorecard || category === 'totalScore') return 0;
  return scorecard[category]?.current ?? 0;
}

function getScorecardFilled(scorecard: Scorecard | null, category: keyof Scorecard): boolean {
  if (!scorecard || category === 'totalScore') return false;
  return scorecard[category]?.filled ?? false;
}

/**
 * 분석 프롬프트 생성
 * @param idea - 사용자의 아이디어 입력
 * @param historyContext - 이전 대화 기록
 * @param personas - 페르소나 목록 (최소 1개)
 * @param scorecard - 현재 스코어카드 (null이면 새 세션)
 * @param turnNumber - 현재 턴 (1-8)
 * @param level - 검증 레벨
 */
export function buildAnalyzePrompt(
  idea: string,
  historyContext: string,
  personas: string[],
  scorecard: Scorecard | null,
  turnNumber: number = 1,
  level: Level = 'mvp'
): string {
  const currentTotal = scorecard?.totalScore ?? 0;
  const targetScore = TARGET_SCORES[level] ?? 65;
  const remainingTurns = Math.max(1, 8 - turnNumber);
  const minIncrease = Math.max(5, Math.ceil((targetScore - currentTotal) / remainingTurns));

  const personaCategories = personas.map(p => {
    const map = PERSONA_CATEGORY_MAP[p];
    const desc = PERSONA_DESCRIPTIONS[p];
    const primary = map?.primary.map(c => CATEGORY_INFO[c]?.nameKo).filter(Boolean).join(', ') || '미정의';
    return `${desc?.nameKo || p}: ${primary}`;
  }).join('\n');

  const scorecardStatus = buildScorecardStatus(scorecard);

  // 프롬프트 인젝션 방지를 위한 이스케이프
  const safeIdea = escapePromptContent(idea);
  const safeHistory = escapePromptContent(historyContext);

  return `<context>
${safeHistory}
${scorecardStatus}
</context>

<user_input>
${safeIdea}
</user_input>

<game_state>
턴: ${turnNumber}/8
현재: ${currentTotal}점 → 목표: ${targetScore}점
이번 턴 최소 증가: +${minIncrease}점
</game_state>

<scoring_rules>
점수는 항상 증가합니다 (감소 없음).

증가 기준:
- 새 정보 제공: +3~5
- 선택지 선택: +2~4
- 직접 답변 작성: +4~6
- 피드백 반영하여 수정: +5~8
- 숫자/데이터 언급: +3~5

feedbackReflection 증가 조건:
- "[종합 결정 사항]" 또는 결정 표명("~할게요", "~로 정했어요") → +2~5
</scoring_rules>

<persona_categories>
${personaCategories}
각 페르소나는 담당 카테고리 점수를 올립니다.
⚠️ 표시된 낮은 카테고리는 조언 중 자연스럽게 유도하세요.
</persona_categories>

<perspective_ids>
각 페르소나는 아래 ID만 사용:
${getPerspectiveIdsForPrompt(personas)}
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

<instructions>
- responses: 각 페르소나가 3가지 perspectives로 조언 (perspectiveId는 위 허용 목록에서만)
- metrics: keyRisks, keyStrengths, summary 포함
- scorecard: 각 카테고리 current 값 업데이트 (감소 불가, max 초과 불가)
- categoryUpdates: 변경된 카테고리와 delta, reason
- inputRelevance: 입력이 관련 없으면 isRelevant=false, warningMessage 포함
</instructions>`;
}

/**
 * 스트리밍 토론 모드용 프롬프트 빌더
 * @param personas - 최소 3개의 페르소나 필요
 */
export function buildStreamingDiscussionPrompt(
  idea: string,
  historyContext: string,
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

  const personaNames = safePersonas.map(p => PERSONA_DESCRIPTIONS[p]?.nameKo || p).join(', ');
  const personaCategories = safePersonas.map(p => {
    const map = PERSONA_CATEGORY_MAP[p];
    const desc = PERSONA_DESCRIPTIONS[p];
    return `${desc?.nameKo || p}: ${map?.primary.map(c => CATEGORY_INFO[c]?.nameKo).filter(Boolean).join(', ') || '미정의'}`;
  }).join('\n');

  const scorecardStatus = buildScorecardStatus(scorecard);

  // 프롬프트 인젝션 방지를 위한 이스케이프
  const safeIdea = escapePromptContent(idea);
  const safeHistory = escapePromptContent(historyContext);

  return `<context>
${safeHistory}
${scorecardStatus}
</context>

<user_input>
${safeIdea}
</user_input>

<mode>실시간 토론: ${personaNames}</mode>

<game_state>
턴: ${turnNumber}/8
현재: ${currentTotal}점 → 목표: ${targetScore}점
이번 턴 최소 증가: +${minIncrease}점
</game_state>

<output_format>
각 토론 턴을 ---TURN--- 뒤에 JSON으로, 완료 후 ---FINAL--- 뒤에 최종 JSON을 출력합니다.

<example>
---TURN---
{"persona": "Developer", "message": "첫 의견", "replyTo": null, "tone": "neutral"}
---TURN---
{"persona": "Designer", "message": "동의하며 추가", "replyTo": "Developer", "tone": "agree"}
---TURN---
{"persona": "VC", "message": "수익 관점 질문", "replyTo": "Designer", "tone": "question"}
---TURN---
{"persona": "Developer", "message": "종합 정리", "replyTo": "VC", "tone": "suggestion"}
---FINAL---
{전체 응답 JSON}
</example>
</output_format>

<discussion_rules>
- 4-5개 턴, 각 2-3문장
- tone: agree | disagree | question | suggestion | neutral
</discussion_rules>

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

<final_instructions>
---FINAL--- 이후 JSON 출력:
- discussion: 토론 턴들 (이미 스트리밍됨, 다시 포함)
- responses: 각 페르소나의 최종 제안
- scorecard: 업데이트된 점수 (감소 불가)
- categoryUpdates: 변경 내역
- inputRelevance: 입력 관련성 판단
</final_instructions>`;
}

/**
 * 토론 모드용 프롬프트 빌더 (토론 + 제안 카드 통합) - 비스트리밍 버전
 * @param personas - 최소 3개의 페르소나 필요
 */
export function buildDiscussionPrompt(
  idea: string,
  historyContext: string,
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

  const personaNames = safePersonas.map(p => PERSONA_DESCRIPTIONS[p]?.nameKo || p).join(', ');
  const personaCategories = safePersonas.map(p => {
    const map = PERSONA_CATEGORY_MAP[p];
    const desc = PERSONA_DESCRIPTIONS[p];
    return `${desc?.nameKo || p}: ${map?.primary.map(c => CATEGORY_INFO[c]?.nameKo).filter(Boolean).join(', ') || '미정의'}`;
  }).join('\n');

  // 프롬프트 인젝션 방지를 위한 이스케이프
  const safeIdea = escapePromptContent(idea);
  const safeHistory = escapePromptContent(historyContext);

  return `<context>
${safeHistory}
</context>

<user_input>
${safeIdea}
</user_input>

<mode>토론 + 제안: ${personaNames}</mode>

<game_state>
턴: ${turnNumber}/8
현재: ${currentTotal}점 → 목표: ${targetScore}점
이번 턴 최소 증가: +${minIncrease}점
</game_state>

<workflow>
1단계 - 토론 (discussion): 4-5개 턴, 각 2-3문장, 동의/반박/질문
2단계 - 최종 제안 (responses): 각 페르소나가 3가지 관점으로 제안
</workflow>

<tone_options>
agree | disagree | question | suggestion | neutral
</tone_options>

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

<instructions>
- discussion: 4-5턴 토론 (persona, message, replyTo, tone)
- responses: 각 페르소나 최종 제안 (perspectives 포함)
- scorecard: 업데이트된 점수 (감소 불가, max: 15,15,10,10,10,15,15,10)
- categoryUpdates: 변경 내역
- inputRelevance: 입력 관련성 판단
</instructions>`;
}
