/**
 * 스코어카드 유틸리티 함수
 */

import { Scorecard, CATEGORY_INFO, SCORECARD_CATEGORIES } from './persona-config';

const QUESTION_HINTS: Record<string, string> = {
  problemDefinition: '"이 문제를 겪는 사람이 구체적으로 어떤 상황인가요?"',
  solution: '"이걸 어떻게 해결하실 건가요?"',
  marketAnalysis: '"비슷한 서비스 중에 XX가 있는데, 거기랑 뭐가 다를까요?"',
  revenueModel: '"사용자가 돈을 내는 시점은 언제인가요?"',
  differentiation: '"경쟁 서비스 대비 이게 왜 더 나은가요?"',
  logicalConsistency: '"이 기능과 저 기능이 어떻게 연결되나요?"',
  feasibility: '"이걸 만들려면 어떤 기술이 필요할까요?"',
  feedbackReflection: '"제가 제안한 방식 중 어떤 게 마음에 드세요?"'
};

export function buildScorecardStatus(scorecard: Scorecard | null): string {
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

  // 카테고리별 점수 비율 계산
  const categoryScores = SCORECARD_CATEGORIES.map(cat => ({
    key: cat,
    nameKo: CATEGORY_INFO[cat].nameKo,
    current: scorecard[cat].current,
    max: CATEGORY_INFO[cat].max,
    ratio: scorecard[cat].current / CATEGORY_INFO[cat].max,
    filled: scorecard[cat].filled
  }));

  // 가장 낮은 점수 비율 카테고리 찾기 (최대 3개, 70% 미만)
  const lowestCategories = [...categoryScores]
    .sort((a, b) => a.ratio - b.ratio)
    .slice(0, 3)
    .filter(c => c.ratio < 0.7);

  const emptyCategories = SCORECARD_CATEGORIES.filter(cat => !scorecard[cat].filled);

  const statusLines = SCORECARD_CATEGORIES.map(cat => {
    const info = CATEGORY_INFO[cat];
    const score = scorecard[cat];
    const status = score.filled ? '[O]' : '[ ]';
    const isLowest = lowestCategories.some(l => l.key === cat);
    return `${status} ${info.nameKo}: ${score.current}/${score.max}${isLowest ? ' ⚠️' : ''}`;
  }).join('\n');

  const lowestHints = lowestCategories
    .map(c => `- ${c.nameKo}: ${QUESTION_HINTS[c.key] || '관련 질문을 자연스럽게 섞어주세요'}`)
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

export function isFeedbackResponse(idea: string): boolean {
  return idea.includes('[종합 결정 사항]') ||
    idea.includes('[User ACCEPTED & DECIDED]') ||
    /결정.*했|선택.*했|할게요|하겠습니다|로\s*정했/.test(idea);
}
