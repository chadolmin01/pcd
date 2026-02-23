import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { withRateLimit } from '@/lib/rate-limit';
import {
  CATEGORY_INFO,
  SCORECARD_CATEGORIES,
  Scorecard,
  getAnalyzeSystemInstruction,
  buildAnalyzePrompt,
  isFeedbackResponse,
} from '@/lib/prompts';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface CategoryUpdateItem {
  category: string;
  delta: number;
  reason?: string;
}

interface ParsedResponse {
  scorecard?: Scorecard;
  categoryUpdates?: CategoryUpdateItem[];
  [key: string]: unknown;
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

    const prompt = buildAnalyzePrompt(idea, historyContext, personas, currentScorecard, turnNumber, level);

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
    const parsed: ParsedResponse = JSON.parse(text);

    // 스코어카드 점수 보정 로직 (최소 +2 보장)
    if (parsed.scorecard) {
      let recalculatedTotal = 0;
      let totalIncrease = 0;

      // 🔔 피드백 반영 자동 감지
      if (isFeedbackResponse(idea) && parsed.scorecard.feedbackReflection) {
        const feedbackCurrent = parsed.scorecard.feedbackReflection.current || 0;
        const feedbackMax = 10;
        const feedbackBonus = Math.min(3, feedbackMax - feedbackCurrent);
        if (feedbackBonus > 0) {
          parsed.scorecard.feedbackReflection.current = feedbackCurrent + feedbackBonus;
          parsed.scorecard.feedbackReflection.filled = true;

          if (!parsed.categoryUpdates) {
            parsed.categoryUpdates = [];
          }
          const existingFeedbackUpdate = parsed.categoryUpdates.find(u => u.category === 'feedbackReflection');
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

      for (const cat of SCORECARD_CATEGORIES) {
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
        for (const cat of SCORECARD_CATEGORIES) {
          const current = parsed.scorecard[cat].current;
          const max = CATEGORY_INFO[cat].max;
          if (current < max) {
            const addAmount = Math.min(2, max - current);
            parsed.scorecard[cat].current += addAmount;
            parsed.scorecard[cat].filled = true;
            recalculatedTotal += addAmount;

            if (!parsed.categoryUpdates) {
              parsed.categoryUpdates = [];
            }
            const existingUpdate = parsed.categoryUpdates.find(u => u.category === cat);
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
        parsed.categoryUpdates = parsed.categoryUpdates.filter(u => u.delta > 0);
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
