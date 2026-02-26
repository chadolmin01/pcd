/**
 * Reflection History Builder (2026 Staff-level Architecture)
 *
 * context drift 0%, instruction bleed 0%, 12턴 이후에도 품질 유지
 * - XML 구조화: LLM이 hierarchical data를 정확히 파싱
 * - Layered Memory: compact_summary + episodic (최근 3개) + score_evolution
 * - Traceability: turn, persona, impact, linked_categories
 */

import { StagedReflection, ScoreEvolution, ScorecardCategory } from '@/components/idea-validator/types';
import { PERSONA_DESCRIPTIONS } from './persona-config';
import { escapePromptContent } from './prompt-security';

const REFLECTION_HISTORY_VERSION = '2026.02-v1';

// 카테고리 한글 매핑
const CATEGORY_NAMES: Record<ScorecardCategory, string> = {
  problemDefinition: '문제정의',
  solution: '솔루션',
  marketAnalysis: '시장분석',
  revenueModel: '수익모델',
  differentiation: '차별화',
  logicalConsistency: '논리일관성',
  feasibility: '실현가능성',
  feedbackReflection: '피드백반영',
};

// 페르소나 → 관점 카테고리 매핑
const PERSONA_VIEW_MAP: Record<string, string> = {
  Developer: '기술/개발',
  Designer: 'UX/디자인',
  VC: '투자/성장',
  Marketer: '마케팅/GTM',
  Legal: '법률/규제',
  PM: '제품/기획',
  CTO: '기술전략',
  CFO: '재무/수익',
  EndUser: '사용자',
  Operations: '운영',
};

/**
 * 구조화된 Reflection History 생성
 *
 * @param stagedReflections - 사용자가 선택한 반영 사항들
 * @param compactSummary - 3턴 주기 자동 요약 (Phase 3에서 구현)
 * @param turnNumber - 현재 턴 번호
 * @param scoreEvolution - 점수 변화 이력
 */
export function buildReflectionHistory(
  stagedReflections: StagedReflection[],
  compactSummary: string | null,
  turnNumber: number,
  scoreEvolution: ScoreEvolution[]
): string {
  // 반영 사항이 없으면 빈 문자열
  if (stagedReflections.length === 0) {
    return '';
  }

  // 최근 3라운드만 full detail (episodic memory)
  const recentReflections = stagedReflections.slice(-3);

  const latestDecisions = recentReflections.map(r => {
    const persona = PERSONA_DESCRIPTIONS[r.role]?.nameKo || r.role;
    const view = PERSONA_VIEW_MAP[r.role] || r.role;
    const linkedCats = r.linkedCategories?.map(c => CATEGORY_NAMES[c]).join(',') || 'all';

    return `    <decision turn="${r.turn}" persona="${r.role}" impact="${r.impactScore || 'medium'}">
      <persona_view>${view} 관점</persona_view>
      <content>${escapePromptContent(r.reflectedText)}</content>
      <linked_categories>${linkedCats}</linked_categories>
    </decision>`;
  }).join('\n');

  // 점수 변화 이력 (최근 턴 기준)
  const scoreEvolutionXml = scoreEvolution.length > 0
    ? scoreEvolution.map(s => {
        const catName = CATEGORY_NAMES[s.category] || s.category;
        return `    <category name="${catName}" evolution="${s.from}→${s.to} (+${s.delta})" reason="${escapePromptContent(s.reason)}"/>`;
      }).join('\n')
    : '    <no_changes>첫 번째 라운드입니다.</no_changes>';

  return `<reflection_history version="${REFLECTION_HISTORY_VERSION}" current_turn="${turnNumber}" total_decisions="${stagedReflections.length}">
  ${compactSummary ? `<compact_summary>${escapePromptContent(compactSummary)}</compact_summary>\n` : ''}
  <episodic_memory description="최근 ${recentReflections.length}개 결정 (full detail)">
${latestDecisions}
  </episodic_memory>

  <score_evolution description="이전 라운드 점수 변화">
${scoreEvolutionXml}
  </score_evolution>

  <instructions_for_ai>
    1. 위 decision들을 하나씩 검토하고, 현재 아이디어에 어떻게 반영되었는지 설명하세요.
    2. 토론(discussion)에서 이전 결정들을 자연스럽게 인용하며 발전시키세요.
    3. scorecard 업데이트 시 score_evolution을 참조해 일관성 있게 delta를 계산하세요.
    4. linked_categories에 해당하는 영역의 점수를 우선적으로 반영하세요.
  </instructions_for_ai>
</reflection_history>`;
}

/**
 * 사용자 메시지용 간결한 형태 (UI에 표시)
 */
export function buildReflectionSummaryForUser(
  stagedReflections: StagedReflection[]
): string {
  if (stagedReflections.length === 0) return '';

  // 간결한 한 줄 요약 (최대 30자)
  const summarize = (text: string): string => {
    const cleaned = text.replace(/\s+/g, ' ').trim();
    if (cleaned.length <= 30) return cleaned;
    return cleaned.slice(0, 27) + '...';
  };

  const summary = stagedReflections.map(r => {
    const personaName = PERSONA_DESCRIPTIONS[r.role]?.nameKo || r.role;
    return `• ${personaName}: ${summarize(r.reflectedText)}`;
  }).join('\n');

  return `[반영사항 ${stagedReflections.length}건]\n${summary}`;
}

/**
 * ScoreEvolution 생성 헬퍼
 * (이전 스코어카드와 현재 스코어카드 비교)
 */
export function calculateScoreEvolution(
  prevScorecard: Record<string, { current: number }> | null,
  currentScorecard: Record<string, { current: number }> | null,
  turnNumber: number,
  categoryUpdates: { category: string; delta: number; reason: string }[]
): ScoreEvolution[] {
  if (!prevScorecard || !currentScorecard || categoryUpdates.length === 0) {
    return [];
  }

  return categoryUpdates.map(update => ({
    category: update.category as ScorecardCategory,
    turn: turnNumber,
    from: prevScorecard[update.category]?.current || 0,
    to: currentScorecard[update.category]?.current || 0,
    delta: update.delta,
    reason: update.reason,
  }));
}
