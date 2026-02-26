import { AnalysisResult, Artifacts, ValidationLevel, PersonaRole, DEFAULT_PERSONAS, Scorecard, createEmptyScorecard, BusinessPlanData, ChatMessage, InteractionMode, DiscussionTurn, StagedReflection, ScoreEvolution } from "./types";

// 스트리밍 콜백 타입
export interface StreamingCallbacks {
  onDiscussionTurn: (turn: DiscussionTurn) => void;
  onFinalResponse: (result: AnalysisResult) => void;
  onError: (error: Error) => void;
  onWarning?: (message: string) => void; // 입력 관련성 경고
}

// 병렬 스트리밍 콜백 타입 (방안 5)
export interface ParallelStreamingCallbacks {
  onOpinion: (data: { persona: string; message: string }) => void;
  onClosing: (data: { persona: string; message: string }) => void;
  onWaiting: (data: { persona: string; message: string }) => void;
  onDiscussionTurn: (turn: DiscussionTurn) => void;
  onFinalResponse: (result: AnalysisResult) => void;
  onError: (error: Error) => void;
  onWarning?: (message: string) => void; // 입력 관련성 경고
}

// 레벨 변환 (프론트엔드 enum -> 백엔드 string)
const convertLevel = (level: ValidationLevel): string => {
  switch (level) {
    case ValidationLevel.SKETCH:
      return 'sketch';
    case ValidationLevel.DEFENSE:
      return 'investor';
    case ValidationLevel.MVP:
    default:
      return 'mvp';
  }
};

export const analyzeIdea = async (
  idea: string,
  conversationHistory: string[] = [],
  level: ValidationLevel = ValidationLevel.MVP,
  personas: PersonaRole[] = DEFAULT_PERSONAS,
  currentScorecard: Scorecard | null = null,
  turnNumber: number = 1,
  interactionMode: InteractionMode = 'individual'
): Promise<AnalysisResult> => {
  try {
    const backendLevel = convertLevel(level);

    const response = await fetch('/api/idea-validator/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idea,
        conversationHistory,
        level: backendLevel,
        personas,
        currentScorecard,
        turnNumber,
        interactionMode
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Analysis failed');
    }

    // 경고 메시지가 있으면 결과에 포함
    const result = data.result as AnalysisResult;
    if (data.warning) {
      result.warning = data.warning;
    }

    return result;

  } catch (error) {
    console.error("Analysis Error:", error);
    // Fallback response structure
    return {
      responses: [{
        role: 'System',
        name: '시스템',
        avatar: '',
        content: '신경망 연결이 불안정합니다. 잠시 후 다시 시도해주세요.',
        tone: 'Neutral',
        suggestedActions: []
      }],
      metrics: {
        score: 0,
        developerScore: 0,
        designerScore: 0,
        vcScore: 0,
        keyRisks: ["분석 실패"],
        keyStrengths: [],
        summary: "데이터를 불러오지 못했습니다."
      },
      scorecard: createEmptyScorecard(),
      categoryUpdates: []
    };
  }
};

export const generateFinalArtifacts = async (
  idea: string,
  fullConversation: string,
  reflectedAdvice: string[]
): Promise<Artifacts> => {
  try {
    const response = await fetch('/api/idea-validator/generate-artifacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idea,
        fullConversation,
        reflectedAdvice
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Artifact generation failed');
    }

    return data.result as Artifacts;

  } catch (error) {
    console.error("Artifact Generation Error:", error);
    // Return empty structured fallback
    return {
      prd: {
        projectName: "Error Generating PRD",
        version: "0.0.0",
        tagline: "Please try again.",
        overview: "문서 생성 중 오류가 발생했습니다.",
        targetAudience: [],
        coreFeatures: [],
        techStack: [],
        successMetrics: [],
        userFlow: ""
      },
      jd: {
        roleTitle: "Error",
        department: "Unknown",
        companyIntro: "Error generating JD.",
        responsibilities: [],
        qualifications: [],
        preferred: [],
        benefits: []
      },
      score: 0,
      ideaSummary: "요약 생성 실패",
      personaScores: { developer: 0, designer: 0, vc: 0 },
      actionPlan: { developer: [], designer: [], vc: [] }
    };
  }
};

// 병렬 토론 모드 API 호출 (방안 5: Two-Tier Model Routing + Staff-level Reflection)
export const analyzeIdeaParallel = async (
  idea: string,
  conversationHistory: string[] = [],
  level: ValidationLevel = ValidationLevel.MVP,
  personas: PersonaRole[] = DEFAULT_PERSONAS,
  currentScorecard: Scorecard | null = null,
  turnNumber: number = 1,
  callbacks: ParallelStreamingCallbacks,
  // Staff-level reflection history (Phase 2)
  stagedReflections: StagedReflection[] = [],
  scoreEvolution: ScoreEvolution[] = []
): Promise<void> => {
  try {
    const backendLevel = convertLevel(level);

    const response = await fetch('/api/idea-validator/analyze-parallel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idea,
        conversationHistory,
        level: backendLevel,
        personas,
        currentScorecard,
        turnNumber,
        // Staff-level reflection history
        stagedReflections,
        scoreEvolution,
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No reader available');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE 메시지는 \n\n으로 구분됨
      let boundary = buffer.indexOf('\n\n');
      while (boundary !== -1) {
        const line = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);

        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          if (data === '[DONE]') {
            return;
          }

          try {
            const parsed = JSON.parse(data);

            switch (parsed.type) {
              case 'opinion':
                callbacks.onOpinion(parsed.data);
                break;
              case 'closing':
                callbacks.onClosing(parsed.data);
                break;
              case 'waiting':
                callbacks.onWaiting(parsed.data);
                break;
              case 'discussion':
                callbacks.onDiscussionTurn(parsed.data as DiscussionTurn);
                break;
              case 'final':
                // 경고 메시지가 있으면 결과에 포함
                const finalResult = parsed.data as AnalysisResult;
                if (parsed.data.warning) {
                  finalResult.warning = parsed.data.warning;
                }
                callbacks.onFinalResponse(finalResult);
                break;
              case 'warning':
                // 입력 관련성 경고 이벤트
                if (callbacks.onWarning && parsed.data.warning) {
                  callbacks.onWarning(parsed.data.warning);
                }
                break;
              case 'error':
                callbacks.onError(new Error(parsed.data.message));
                break;
            }
          } catch {
            // JSON 파싱 실패 - 무시
          }
        }

        // 다음 메시지 경계 찾기
        boundary = buffer.indexOf('\n\n');
      }
    }
  } catch (error) {
    console.error("Parallel Streaming Error:", error);
    callbacks.onError(error instanceof Error ? error : new Error('Streaming failed'));
  }
};

// 스트리밍 토론 모드 API 호출 (레거시)
export const analyzeIdeaStream = async (
  idea: string,
  conversationHistory: string[] = [],
  level: ValidationLevel = ValidationLevel.MVP,
  personas: PersonaRole[] = DEFAULT_PERSONAS,
  currentScorecard: Scorecard | null = null,
  turnNumber: number = 1,
  callbacks: StreamingCallbacks
): Promise<void> => {
  try {
    const backendLevel = convertLevel(level);

    const response = await fetch('/api/idea-validator/analyze-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idea,
        conversationHistory,
        level: backendLevel,
        personas,
        currentScorecard,
        turnNumber,
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No reader available');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE 이벤트 파싱
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || ''; // 마지막 불완전한 라인은 버퍼에 유지

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          if (data === '[DONE]') {
            return;
          }

          try {
            const parsed = JSON.parse(data);

            if (parsed.type === 'turn') {
              callbacks.onDiscussionTurn(parsed.data as DiscussionTurn);
            } else if (parsed.type === 'final') {
              // 경고 메시지가 있으면 결과에 포함
              const finalResult = parsed.data as AnalysisResult;
              if (parsed.data.warning) {
                finalResult.warning = parsed.data.warning;
              }
              callbacks.onFinalResponse(finalResult);
            } else if (parsed.type === 'warning') {
              // 입력 관련성 경고 이벤트
              if (callbacks.onWarning && parsed.data.warning) {
                callbacks.onWarning(parsed.data.warning);
              }
            }
          } catch {
            // JSON 파싱 실패 - 무시
          }
        }
      }
    }
  } catch (error) {
    console.error("Streaming Analysis Error:", error);
    callbacks.onError(error instanceof Error ? error : new Error('Streaming failed'));
  }
};

// 대화 내역을 종합하여 사업계획서 형태의 JSON 생성
export const synthesizeBusinessPlan = async (
  originalIdea: string,
  conversationHistory: ChatMessage[],
  reflectedAdvice: string[],
  scorecard: Scorecard,
  ideaCategory?: string
): Promise<BusinessPlanData> => {
  try {
    const response = await fetch('/api/idea-validator/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originalIdea,
        conversationHistory,
        reflectedAdvice,
        scorecard,
        ideaCategory
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Synthesis failed');
    }

    return data.result as BusinessPlanData;

  } catch (error) {
    console.error("Synthesis Error:", error);
    // Return minimal fallback
    return {
      basicInfo: {
        itemName: originalIdea.slice(0, 20) || '아이템명',
        oneLiner: originalIdea.slice(0, 50) || '설명 없음',
        targetCustomer: '타겟 고객',
        industry: ideaCategory || 'other'
      },
      sectionData: {
        problem: {
          market_status: '시장 분석 실패',
          problem_definition: '문제 정의 실패',
          development_necessity: '개발 필요성 분석 실패'
        },
        solution: {
          development_plan: '개발 계획 생성 실패',
          differentiation: '차별화 분석 실패',
          competitiveness: '경쟁력 분석 실패'
        },
        scaleup: {
          business_model: '수익 모델 생성 실패',
          market_size: '시장 규모 분석 실패',
          roadmap: '로드맵 생성 실패'
        },
        team: {
          founder: '팀 정보 없음',
          team_members: '팀 정보 없음',
          team_synergy: '팀 정보 없음'
        }
      },
      schedule: [],
      budget: [],
      teamTable: [],
      partners: [],
      generatedAt: new Date().toISOString(),
      scorecard: scorecard || createEmptyScorecard(),
      validationScore: scorecard?.totalScore || 0
    };
  }
};
