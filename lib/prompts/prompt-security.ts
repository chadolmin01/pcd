/**
 * 프롬프트 보안 유틸리티
 *
 * 사용자 입력을 프롬프트에 삽입할 때 인젝션 공격 방지
 */

/**
 * 프롬프트 인젝션 방지를 위한 사용자 입력 이스케이프
 *
 * 방어 대상:
 * - XML/HTML 태그 주입 (</user_input>, <system> 등)
 * - 프롬프트 구분자 주입 (---TURN---, ---FINAL--- 등)
 * - 역할 전환 시도 (Assistant:, Human: 등)
 *
 * @param content - 사용자 입력 원본
 * @returns 이스케이프된 안전한 문자열
 */
export function escapePromptContent(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  return content
    // XML/HTML 태그 이스케이프
    .replace(/</g, '＜')  // 전각 부등호로 대체 (시각적으로 유사)
    .replace(/>/g, '＞')
    // 프롬프트 구분자 무력화
    .replace(/---+/g, '—')  // em dash로 대체
    // 역할 전환 시도 차단
    .replace(/^(Human|Assistant|System|User):/gim, '$1：')  // 전각 콜론으로 대체
    // 백틱 코드블록 무력화 (마크다운 인젝션 방지)
    .replace(/```/g, '`‌`‌`');  // zero-width non-joiner 삽입
}

/**
 * 대화 히스토리 배열 이스케이프
 *
 * @param history - 대화 히스토리 문자열 배열
 * @returns 이스케이프된 배열
 */
export function escapeConversationHistory(history: string[]): string[] {
  if (!Array.isArray(history)) {
    return [];
  }
  return history.map(h => escapePromptContent(h));
}

/**
 * 프롬프트 컨텍스트 생성 (이스케이프 포함)
 *
 * @param conversationHistory - 대화 히스토리 배열
 * @returns 이스케이프된 컨텍스트 문자열
 */
export function buildSafeHistoryContext(conversationHistory: string[]): string {
  if (!conversationHistory || conversationHistory.length === 0) {
    return '';
  }

  const escapedHistory = escapeConversationHistory(conversationHistory);
  return `[이전 대화 및 결정 내역]:\n${escapedHistory.join('\n')}\n\n`;
}
