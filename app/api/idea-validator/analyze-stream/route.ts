import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  getAnalyzeSystemInstruction,
  buildStreamingDiscussionPrompt,
} from '@/lib/prompts';
import {
  AnalyzeRequestSchema,
  validateRequest,
  createErrorResponse,
  DiscussionTurnSchema,
  AnalyzeResponseSchema,
  parseStreamChunk,
  safeJsonParse,
  applyScoreCorrections,
  preValidateInput,
  ParsedWithScorecard,
} from '@/lib/validations';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// 스트리밍 API 라우트 - 토론 모드 전용
export async function POST(request: NextRequest) {
  try {
    // Zod 스키마로 요청 검증
    const body = await request.json();
    const validation = validateRequest(body, AnalyzeRequestSchema);

    if (!validation.success) {
      return createErrorResponse(validation.error, 400);
    }

    const {
      idea,
      conversationHistory,
      level,
      personas,
      currentScorecard,
      turnNumber,
    } = validation.data;

    // 사전 입력 검증 (명백히 부적절한 입력 필터링)
    const preValidation = preValidateInput(idea);
    if (!preValidation.isValid) {
      const encoder = new TextEncoder();
      const warningStream = new ReadableStream({
        start(controller) {
          const warningData = `data: ${JSON.stringify({
            type: 'warning',
            data: {
              warning: preValidation.warning,
              inputRelevance: { isRelevant: false, warningMessage: preValidation.warning }
            }
          })}\n\n`;
          controller.enqueue(encoder.encode(warningData));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      });
      return new Response(warningStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      });
    }

    const historyContext = conversationHistory.length > 0
      ? `[이전 대화 및 결정 내역]:\n${conversationHistory.join('\n')}\n\n`
      : '';

    const prompt = buildStreamingDiscussionPrompt(
      idea, historyContext, personas, currentScorecard, turnNumber, level
    );

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: getAnalyzeSystemInstruction(level, personas),
      generationConfig: {
        maxOutputTokens: 3000,
        temperature: 0.8,
      }
    });

    // 스트리밍 응답 생성
    const result = await model.generateContentStream(prompt);

    // ReadableStream으로 SSE 형식 전송
    const encoder = new TextEncoder();
    let buffer = '';
    let discussionTurns: unknown[] = [];
    let finalResponseSent = false;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            buffer += text;

            // ---TURN--- 구분자로 토론 턴 파싱
            while (buffer.includes('---TURN---')) {
              const turnIndex = buffer.indexOf('---TURN---');
              const nextTurnIndex = buffer.indexOf('---TURN---', turnIndex + 10);
              const finalIndex = buffer.indexOf('---FINAL---');

              let endIndex = -1;
              if (nextTurnIndex !== -1 && (finalIndex === -1 || nextTurnIndex < finalIndex)) {
                endIndex = nextTurnIndex;
              } else if (finalIndex !== -1) {
                endIndex = finalIndex;
              }

              if (endIndex !== -1) {
                const turnJson = buffer.substring(turnIndex + 10, endIndex).trim();
                buffer = buffer.substring(endIndex);

                // Zod로 청크 검증
                const turnResult = parseStreamChunk(turnJson, DiscussionTurnSchema);

                if (turnResult.success) {
                  discussionTurns.push(turnResult.data);

                  // SSE 형식으로 토론 턴 전송
                  const sseData = `data: ${JSON.stringify({ type: 'turn', data: turnResult.data })}\n\n`;
                  controller.enqueue(encoder.encode(sseData));
                } else {
                  // 검증 실패 로그 (스트리밍 중단하지 않음)
                  console.warn('Turn chunk validation failed:', turnResult.error);
                }
              } else {
                break; // 아직 완전한 턴이 없음
              }
            }

            // ---FINAL--- 이후 최종 응답 파싱
            if (buffer.includes('---FINAL---') && !finalResponseSent) {
              const finalIndex = buffer.indexOf('---FINAL---');
              const finalJson = buffer.substring(finalIndex + 11).trim();

              // JSON이 완성될 때까지 기다림
              if (finalJson.endsWith('}')) {
                // Zod로 최종 응답 검증
                const finalResult = safeJsonParse(finalJson, AnalyzeResponseSchema);

                if (finalResult.success) {
                  const parsed: ParsedWithScorecard = finalResult.data;

                  // 스코어카드 점수 보정 (불변성 유지 - 복사본 반환)
                  const { corrected, result: correctionResult } = applyScoreCorrections(parsed, currentScorecard, idea);

                  // 토론 데이터 + 경고 메시지 포함
                  const finalData: Record<string, unknown> = { ...corrected, discussion: discussionTurns };
                  if (correctionResult.warning) {
                    finalData.warning = correctionResult.warning;
                  }

                  const sseData = `data: ${JSON.stringify({ type: 'final', data: finalData })}\n\n`;
                  controller.enqueue(encoder.encode(sseData));
                  finalResponseSent = true;
                } else {
                  console.warn('Final response validation failed:', finalResult.error);
                  // 검증 실패 시 안전한 폴백 응답 사용 (#6 수정)
                  const safeFallback = {
                    responses: [],
                    metrics: { score: 0, keyRisks: [], keyStrengths: [], summary: '응답 처리 실패' },
                    scorecard: currentScorecard,
                    categoryUpdates: [],
                    discussion: discussionTurns,
                    warning: '응답 처리 중 문제가 발생했습니다. 다시 시도해주세요.'
                  };
                  const sseData = `data: ${JSON.stringify({ type: 'final', data: safeFallback })}\n\n`;
                  controller.enqueue(encoder.encode(sseData));
                  finalResponseSent = true;
                }
              }
            }
          }

          // 스트림 종료
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });

  } catch (error) {
    console.error('Streaming Analyze Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Analysis failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
