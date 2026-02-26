import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { streamObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import {
  getSimpleSystemInstruction,
} from '@/lib/prompts';
import { buildCombinedOpinionPrompt, buildSynthesisPrompt, getRandomClosingRemark } from '@/lib/prompts/parallel-prompts';
import { buildReflectionHistory } from '@/lib/prompts/build-reflection-history';
import {
  AnalyzeRequestSchema,
  validateRequest,
  createErrorResponse,
  applyScoreCorrections,
  preValidateInput,
  ParsedWithScorecard,
} from '@/lib/validations';
import { DiscussionResponseSchema, DiscussionTurn } from '@/lib/schemas/ai-sdk-schemas';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Vercel AI SDK용 Google provider
const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

// Exponential backoff with jitter for 429 errors
async function callWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 4
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const error = err as { status?: number };
      if (error.status !== 429 || i === maxRetries - 1) throw err;
      const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

// 병렬 + 스트리밍 합성 API (Vercel AI SDK)
export async function POST(request: NextRequest) {
  try {
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
      // Staff-level Reflection History (Phase 2)
      stagedReflections,
      scoreEvolution,
    } = validation.data;

    const encoder = new TextEncoder();

    // 사전 입력 검증
    const preValidation = preValidateInput(idea);
    if (!preValidation.isValid) {
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

    // Staff-level: 구조화된 Reflection History 생성
    const reflectionHistoryXml = buildReflectionHistory(
      stagedReflections,
      null, // compactSummary는 Phase 3에서 구현
      turnNumber,
      scoreEvolution
    );

    // 레거시 호환: 기존 conversationHistory도 유지
    const historyContext = conversationHistory.length > 0
      ? `[이전 대화 및 결정 내역]:\n${conversationHistory.join('\n')}\n\n`
      : '';

    const stream = new ReadableStream({
      async start(controller) {
        let isClosed = false;
        const safeEnqueue = (data: Uint8Array) => {
          if (!isClosed) {
            try {
              controller.enqueue(data);
            } catch {
              isClosed = true;
            }
          }
        };
        const safeClose = () => {
          if (!isClosed) {
            isClosed = true;
            controller.close();
          }
        };

        try {
          // Phase 1: 통합 의견 수집 (한 번의 호출로 모든 페르소나 의견)
          const flashModel = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: {
              maxOutputTokens: 2000,
              temperature: 0.8,
              responseMimeType: 'application/json',
            }
          });

          const combinedPrompt = buildCombinedOpinionPrompt(
            idea, historyContext, personas, currentScorecard, level
          );

          let opinions: { persona: string; opinion: string }[] = [];

          try {
            const result = await callWithBackoff(() =>
              flashModel.generateContent(combinedPrompt)
            );
            const responseText = result.response.text();
            const parsed = JSON.parse(responseText);

            opinions = personas.map(persona => ({
              persona,
              opinion: parsed[persona] || '의견을 생성하지 못했습니다.'
            }));
          } catch (error) {
            console.error('Combined opinion generation failed:', error);
            // 폴백: 기본 메시지
            opinions = personas.map(persona => ({
              persona,
              opinion: '의견을 불러오는 중 오류가 발생했습니다.'
            }));
          }

          // 순차적으로 스트리밍
          for (const { persona, opinion } of opinions) {
            const sseData = `data: ${JSON.stringify({
              type: 'opinion',
              data: { persona, message: opinion }
            })}\n\n`;
            safeEnqueue(encoder.encode(sseData));
            await new Promise(resolve => setTimeout(resolve, 1200));
          }

          // "종합 중" 메시지
          safeEnqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'synthesizing',
            data: { message: 'AI가 토론을 종합하고 있습니다...' }
          })}\n\n`));

          // Phase 1.5: 4-Agent 분석 (Grok-style multi-perspective)
          const opinionsContext = opinions.map(o => `${o.persona}: ${o.opinion}`).join('\n');

          const agentPrompts = {
            coordinator: `당신은 토론 코디네이터입니다.
아이디어: ${idea}
수집된 의견: ${opinionsContext}

이 의견들을 종합하여:
1. 핵심 합의점 2개
2. 주요 쟁점 2개
3. 다음 토론에서 다뤄야 할 질문 1개
를 한국어로 간결하게 정리하세요. (총 5문장 이내)`,

            critic: `당신은 논리 검증 전문가 Benjamin입니다.
아이디어: ${idea}
수집된 의견: ${opinionsContext}

냉정하게 분석하세요:
1. 논리적 허점이나 모순 1개
2. 과장되거나 검증 안 된 가정 1개
3. 가장 큰 실패 리스크 1개
한국어로 직설적으로 답하세요. (총 4문장 이내)`,

            creative: `당신은 창의적 관점 전문가 Lucas입니다.
아이디어: ${idea}
수집된 의견: ${opinionsContext}

다른 각도에서 생각하세요:
1. 아무도 언급 안 한 기회 1개
2. 피벗 가능한 대안 방향 1개
한국어로 신선하게 답하세요. (총 3문장 이내)`
          };

          // 병렬 실행 (3개 에이전트)
          const agentFlashModel = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: { maxOutputTokens: 500, temperature: 0.7 }
          });

          const [coordResult, criticResult, creativeResult] = await Promise.all([
            callWithBackoff(() => agentFlashModel.generateContent(agentPrompts.coordinator)),
            callWithBackoff(() => agentFlashModel.generateContent(agentPrompts.critic)),
            callWithBackoff(() => agentFlashModel.generateContent(agentPrompts.creative))
          ]);

          const multiAgentInsights = `
<multi_agent_analysis>
  <coordinator>${coordResult.response.text()}</coordinator>
  <critic>${criticResult.response.text()}</critic>
  <creative>${creativeResult.response.text()}</creative>
</multi_agent_analysis>`;

          // Phase 2: 스트리밍 합성 (Vercel AI SDK + Staff-level Reflection)
          const baseSynthesisPrompt = buildSynthesisPrompt(
            idea,
            opinions,
            personas,
            currentScorecard,
            turnNumber,
            level
          );

          // Staff-level: Reflection History + Multi-Agent Insights 추가
          // Gemini 권장: instruction은 맨 마지막에 와야 함
          let synthesisPrompt = baseSynthesisPrompt;
          const insertPoint = baseSynthesisPrompt.indexOf('<output_format>');

          if (insertPoint > 0) {
            // <output_format> 앞에 reflection history + multi-agent insights 삽입
            const additionalContext = [
              reflectionHistoryXml,
              multiAgentInsights
            ].filter(Boolean).join('\n\n');

            synthesisPrompt =
              baseSynthesisPrompt.slice(0, insertPoint) +
              additionalContext + '\n\n' +
              baseSynthesisPrompt.slice(insertPoint);
          } else {
            // fallback: 뒤에 붙임
            synthesisPrompt = baseSynthesisPrompt + '\n\n' + reflectionHistoryXml + '\n\n' + multiAgentInsights;
          }

          let sentDiscussionCount = 0;
          let finalData: Record<string, unknown> | null = null;
          let prevDiscussion: DiscussionTurn[] = [];

          // 메시지가 완성되었는지 확인 (마침표/물음표/느낌표로 끝남)
          const isMessageComplete = (msg: string | undefined): boolean => {
            if (!msg || msg.length < 20) return false;
            const trimmed = msg.trim();
            return /[.!?。]$/.test(trimmed);
          };

          try {
            const { partialObjectStream } = streamObject({
              model: google('gemini-2.0-flash'),
              schema: DiscussionResponseSchema,
              prompt: synthesisPrompt,
              temperature: 0.65,
            });

            for await (const partial of partialObjectStream) {
              if (partial.discussion && partial.discussion.length > 0) {
                // 새 턴이 추가되면 이전 턴들은 완성된 것으로 간주
                const currentLength = partial.discussion.length;

                // 이전에 전송하지 않은 완성된 턴들 전송
                for (let i = sentDiscussionCount; i < currentLength; i++) {
                  const turn = partial.discussion[i] as DiscussionTurn;

                  // 마지막 턴이 아니면 완성된 것 (다음 턴이 존재)
                  // 마지막 턴이면 메시지 완성 여부 확인
                  const isComplete = (i < currentLength - 1) || isMessageComplete(turn?.message);

                  if (turn && turn.persona && turn.message && isComplete) {
                    // 이미 전송한 턴인지 확인
                    const alreadySent = prevDiscussion.some(
                      (p, idx) => idx === i && p.message === turn.message
                    );

                    if (!alreadySent) {
                      const sseData = `data: ${JSON.stringify({
                        type: 'discussion',
                        data: turn
                      })}\n\n`;
                      safeEnqueue(encoder.encode(sseData));
                      sentDiscussionCount = i + 1;
                    }
                  }
                }

                // 현재 상태 저장
                prevDiscussion = [...(partial.discussion as DiscussionTurn[])];
              }

              // 최종 데이터 저장
              if (partial.responses && partial.scorecard && partial.metrics) {
                finalData = {
                  responses: partial.responses,
                  metrics: partial.metrics,
                  scorecard: partial.scorecard,
                  categoryUpdates: partial.categoryUpdates || [],
                };
              }
            }

            // 스트림 끝난 후 아직 전송 안 된 턴 전송
            if (prevDiscussion.length > sentDiscussionCount) {
              for (let i = sentDiscussionCount; i < prevDiscussion.length; i++) {
                const turn = prevDiscussion[i];
                if (turn && turn.persona && turn.message) {
                  const sseData = `data: ${JSON.stringify({
                    type: 'discussion',
                    data: turn
                  })}\n\n`;
                  safeEnqueue(encoder.encode(sseData));
                }
              }
            }
          } catch (streamError) {
            console.error('Streaming synthesis error:', streamError);
            // 폴백: 기본 응답
            finalData = {
              responses: opinions.map(o => ({
                role: o.persona,
                name: o.persona,
                content: o.opinion,
                perspectives: []
              })),
              metrics: { summary: '합성 중 오류 발생' },
              scorecard: currentScorecard,
              categoryUpdates: [],
            };
          }

          // 점수 보정 및 최종 응답
          if (finalData) {
            const { corrected, result: correctionResult } = applyScoreCorrections(
              finalData as ParsedWithScorecard,
              currentScorecard,
              idea
            );

            // 모든 페르소나에 대한 응답 보장 (누락된 경우 폴백)
            type ResponseItem = { role: string; name?: string; content?: string; perspectives?: unknown[] };
            const finalResponses: ResponseItem[] = (corrected.responses || finalData.responses || []) as ResponseItem[];
            const existingRoles = new Set(finalResponses.map(r => r.role));

            for (const persona of personas) {
              if (!existingRoles.has(persona)) {
                const personaOpinion = opinions.find(o => o.persona === persona);
                finalResponses.push({
                  role: persona,
                  name: persona,
                  content: personaOpinion?.opinion || '의견 없음',
                  perspectives: []
                });
              }
            }

            const response: Record<string, unknown> = {
              responses: finalResponses,
              metrics: corrected.metrics || finalData.metrics,
              scorecard: corrected.scorecard || currentScorecard,
              categoryUpdates: corrected.categoryUpdates || finalData.categoryUpdates,
            };
            if (correctionResult.warning) {
              response.warning = correctionResult.warning;
            }

            safeEnqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'final',
              data: response
            })}\n\n`));
          }

          safeEnqueue(encoder.encode('data: [DONE]\n\n'));
          safeClose();

        } catch (error) {
          console.error('Parallel stream error:', error);
          const errorData = `data: ${JSON.stringify({
            type: 'error',
            data: { message: error instanceof Error ? error.message : 'Unknown error' }
          })}\n\n`;
          safeEnqueue(encoder.encode(errorData));
          safeClose();
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
    console.error('Parallel Analyze Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Analysis failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
