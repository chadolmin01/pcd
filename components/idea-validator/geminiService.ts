import { AnalysisResult, Artifacts, ValidationLevel, PersonaRole, DEFAULT_PERSONAS, Scorecard, createEmptyScorecard, BusinessPlanData, ChatMessage } from "./types";

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
  turnNumber: number = 1
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
        turnNumber
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Analysis failed');
    }

    return data.result as AnalysisResult;

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
