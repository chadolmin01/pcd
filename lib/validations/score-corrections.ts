/**
 * 스코어카드 점수 보정 유틸리티
 *
 * AI 응답의 스코어카드 점수를 비즈니스 로직에 맞게 보정
 * - 점수 감소 방지
 * - 최대 점수 초과 방지
 * - 최소 +2점 보장 (관련 있는 입력에만 적용)
 * - 피드백 반영 자동 감지
 * - 엉뚱한 입력 감지 및 경고
 */

import {
  CATEGORY_INFO,
  SCORECARD_CATEGORIES,
  Scorecard,
  isFeedbackResponse,
} from '@/lib/prompts';

export interface CategoryUpdateItem {
  category: string;
  delta: number;
  reason?: string;
}

export interface InputRelevance {
  isRelevant: boolean;
  reason?: string;
  warningMessage?: string;
}

export interface ParsedWithScorecard {
  scorecard?: Scorecard;
  categoryUpdates?: CategoryUpdateItem[];
  inputRelevance?: InputRelevance;
  [key: string]: unknown;
}

export interface ScoreCorrectionResult {
  /** 경고 메시지 (엉뚱한 입력 시) */
  warning?: string;
  /** 보너스 미적용 사유 */
  bonusSkipped?: boolean;
  bonusSkipReason?: string;
}

/**
 * 스코어카드 점수 보정 로직 (불변성 유지 버전)
 *
 * @param parsed - AI 응답에서 파싱된 데이터 (scorecard, categoryUpdates, inputRelevance 포함)
 * @param currentScorecard - 현재 클라이언트의 스코어카드 상태
 * @param idea - 사용자 입력 (피드백 반영 감지용)
 * @returns { corrected, result } - 보정된 데이터 복사본 + 보정 결과
 *
 * @description
 * 1. 입력 관련성 검증 (엉뚱한 입력 감지)
 * 2. 피드백 반영 자동 감지 및 보너스 부여
 * 3. 각 카테고리별 점수 보정:
 *    - 점수 감소 방지 (기존 점수보다 낮으면 기존 유지)
 *    - 최대 점수 초과 방지
 *    - filled 상태 유지 (한번 채워지면 계속 filled)
 * 4. 최소 +2점 보장 (관련 있는 입력에만 적용)
 * 5. totalScore 재계산
 * 6. delta가 0인 categoryUpdates 제거
 *
 * @note 이 함수는 원본 객체를 수정하지 않고 새 복사본을 반환합니다
 */
export function applyScoreCorrections(
  parsed: ParsedWithScorecard,
  currentScorecard: Scorecard | null,
  idea: string
): { corrected: ParsedWithScorecard; result: ScoreCorrectionResult } {
  const result: ScoreCorrectionResult = {};

  // 원본 보존을 위한 깊은 복사 (structuredClone이 더 안전하고 빠름)
  const corrected: ParsedWithScorecard = structuredClone(parsed);

  if (!corrected.scorecard) return { corrected, result };

  // 1. 입력 관련성 검증
  const inputRelevance = corrected.inputRelevance;
  const isRelevantInput = inputRelevance?.isRelevant !== false; // 명시적 false일 때만 관련 없음

  if (!isRelevantInput) {
    result.warning = inputRelevance?.warningMessage ||
      '입력이 아이디어 발전과 관련이 없어 보입니다. 아이디어에 대한 구체적인 내용을 입력해주세요.';
    result.bonusSkipped = true;
    result.bonusSkipReason = inputRelevance?.reason || '관련 없는 입력';
  }

  let recalculatedTotal = 0;
  let totalIncrease = 0;

  // 2. 피드백 반영 자동 감지 (관련 있는 입력에만 적용)
  if (isRelevantInput && isFeedbackResponse(idea) && corrected.scorecard.feedbackReflection) {
    const feedbackCurrent = corrected.scorecard.feedbackReflection.current || 0;
    const feedbackMax = 10;
    const feedbackBonus = Math.min(3, feedbackMax - feedbackCurrent);

    if (feedbackBonus > 0) {
      corrected.scorecard.feedbackReflection.current = feedbackCurrent + feedbackBonus;
      corrected.scorecard.feedbackReflection.filled = true;

      if (!corrected.categoryUpdates) {
        corrected.categoryUpdates = [];
      }

      // 기존 feedbackReflection 업데이트가 있으면 delta 추가, 없으면 새로 생성
      const existingFeedbackUpdate = corrected.categoryUpdates.find(
        u => u.category === 'feedbackReflection'
      );

      if (existingFeedbackUpdate) {
        existingFeedbackUpdate.delta += feedbackBonus;
      } else {
        corrected.categoryUpdates.push({
          category: 'feedbackReflection',
          delta: feedbackBonus,
          reason: '피드백 반영 완료'
        });
      }
    }
  }

  // 3. 각 카테고리별 점수 보정
  for (const cat of SCORECARD_CATEGORIES) {
    const prevScore = currentScorecard?.[cat]?.current || 0;
    const newScore = corrected.scorecard[cat]?.current || 0;
    const maxScore = CATEGORY_INFO[cat].max;

    // 점수 감소 방지: 기존 점수보다 낮으면 기존 점수 유지
    if (newScore < prevScore) {
      corrected.scorecard[cat].current = prevScore;
    }

    // 최대 점수 초과 방지
    if (corrected.scorecard[cat].current > maxScore) {
      corrected.scorecard[cat].current = maxScore;
    }

    // filled 상태 유지: 한번 채워지면 계속 filled
    if (currentScorecard?.[cat]?.filled) {
      corrected.scorecard[cat].filled = true;
    }

    // 0보다 크면 filled
    if (corrected.scorecard[cat].current > 0) {
      corrected.scorecard[cat].filled = true;
    }

    totalIncrease += (corrected.scorecard[cat].current - prevScore);
    recalculatedTotal += corrected.scorecard[cat].current;
  }

  // 4. 최소 +2점 보장 (관련 있는 입력에만 적용)
  if (isRelevantInput && totalIncrease < 2 && currentScorecard) {
    for (const cat of SCORECARD_CATEGORIES) {
      const current = corrected.scorecard[cat].current;
      const max = CATEGORY_INFO[cat].max;

      if (current < max) {
        const addAmount = Math.min(2, max - current);
        corrected.scorecard[cat].current += addAmount;
        corrected.scorecard[cat].filled = true;
        recalculatedTotal += addAmount;

        if (!corrected.categoryUpdates) {
          corrected.categoryUpdates = [];
        }

        // 기존 업데이트가 있으면 delta 추가, 없으면 새로 생성
        const existingUpdate = corrected.categoryUpdates.find(u => u.category === cat);

        if (existingUpdate) {
          existingUpdate.delta += addAmount;
        } else {
          corrected.categoryUpdates.push({
            category: cat,
            delta: addAmount,
            reason: '대화 참여 보너스'
          });
        }
        break; // 첫 번째 가능한 카테고리에만 적용
      }
    }
  }

  // 5. totalScore 재계산
  corrected.scorecard.totalScore = recalculatedTotal;

  // 6. delta가 0 이하인 항목 제거 (양수 delta만 유지)
  if (corrected.categoryUpdates) {
    corrected.categoryUpdates = corrected.categoryUpdates.filter(u => u.delta > 0);
  }

  return { corrected, result };
}

/**
 * 입력 길이 기반 사전 검증
 * AI 호출 전에 명백히 부적절한 입력 걸러내기
 */
export function preValidateInput(input: string): {
  isValid: boolean;
  warning?: string;
} {
  const trimmed = input.trim();

  // 너무 짧은 입력
  if (trimmed.length < 5) {
    return {
      isValid: false,
      warning: '입력이 너무 짧습니다. 아이디어에 대해 더 구체적으로 설명해주세요.'
    };
  }

  // 의미없는 반복 패턴 감지 (예: "ㅋㅋㅋㅋ", "ㅎㅎㅎㅎ", "asdf")
  const meaninglessPatterns = [
    /^[ㅋㅎㅠㅜ]+$/,           // 한글 자음 반복
    /^[a-z]{1,4}$/i,           // 짧은 알파벳만
    /^(.)\1{3,}$/,             // 같은 문자 4번 이상 반복
    /^[!@#$%^&*()]+$/,         // 특수문자만
    /^[0-9]+$/,                // 숫자만
  ];

  for (const pattern of meaninglessPatterns) {
    if (pattern.test(trimmed)) {
      return {
        isValid: false,
        warning: '의미 있는 내용을 입력해주세요. 아이디어 발전에 도움이 되는 답변을 부탁드립니다.'
      };
    }
  }

  return { isValid: true };
}
