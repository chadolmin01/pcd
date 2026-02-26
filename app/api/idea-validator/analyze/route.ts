import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { withRateLimit } from '@/lib/rate-limit';
import {
  getAnalyzeSystemInstruction,
  buildAnalyzePrompt,
  buildDiscussionPrompt,
} from '@/lib/prompts';
import {
  AnalyzeRequestSchema,
  validateRequest,
  AnalyzeResponseSchema,
  safeJsonParse,
  applyScoreCorrections,
  preValidateInput,
  ParsedWithScorecard,
} from '@/lib/validations';
import {
  AnalyzeResponseGeminiSchema,
  DiscussionResponseGeminiSchema,
} from '@/lib/schemas/gemini-schemas';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// withRateLimit HOF 적용 - AI 엔드포인트로 더 엄격한 제한
export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    // Zod 스키마로 요청 검증
    const body = await request.json();
    const validation = validateRequest(body, AnalyzeRequestSchema);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const {
      idea,
      conversationHistory,
      level,
      personas,
      currentScorecard,
      turnNumber,
      interactionMode,
    } = validation.data;

    // 사전 입력 검증 (명백히 부적절한 입력 필터링)
    const preValidation = preValidateInput(idea);
    if (!preValidation.isValid) {
      return NextResponse.json({
        success: true,
        result: {
          responses: [],
          warning: preValidation.warning,
          inputRelevance: { isRelevant: false, warningMessage: preValidation.warning }
        }
      });
    }

    const historyContext = conversationHistory.length > 0
      ? `[이전 대화 및 결정 내역]:\n${conversationHistory.join('\n')}\n\n`
      : '';

    // 인터랙션 모드에 따라 다른 프롬프트 사용
    const prompt = interactionMode === 'discussion'
      ? buildDiscussionPrompt(idea, historyContext, personas, currentScorecard, turnNumber, level)
      : buildAnalyzePrompt(idea, historyContext, personas, currentScorecard, turnNumber, level);

    // 스코어카드 포함으로 토큰 증가
    const maxTokens = level === 'sketch' ? 1500 : 3000;
    const temperature = level === 'sketch' ? 0.9 : 0.7;

    // Structured Outputs: 인터랙션 모드에 따라 다른 스키마 사용
    const responseSchema = interactionMode === 'discussion'
      ? DiscussionResponseGeminiSchema
      : AnalyzeResponseGeminiSchema;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: getAnalyzeSystemInstruction(level, personas),
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema,  // Structured Outputs - 스키마 강제
        maxOutputTokens: maxTokens,
        temperature: temperature,
      }
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // JSON 파싱 + Zod 검증 (안전한 방식)
    const parseResult = safeJsonParse(text, AnalyzeResponseSchema);

    if (!parseResult.success) {
      console.error('Analyze JSON parse/validation error:', parseResult.error);
      return NextResponse.json(
        { success: false, error: 'AI 응답을 처리할 수 없습니다. 다시 시도해주세요.' },
        { status: 500 }
      );
    }

    const parsed: ParsedWithScorecard = parseResult.data;

    // 스코어카드 점수 보정 (불변성 유지 - 복사본 반환)
    const { corrected, result: correctionResult } = applyScoreCorrections(parsed, currentScorecard, idea);

    // 경고 메시지가 있으면 응답에 포함
    const response: { success: boolean; result: ParsedWithScorecard; warning?: string } = {
      success: true,
      result: corrected  // 보정된 복사본 사용
    };

    if (correctionResult.warning) {
      response.warning = correctionResult.warning;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Analyze Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}, { isAI: true });
