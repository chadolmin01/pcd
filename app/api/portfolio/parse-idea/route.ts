import { NextRequest, NextResponse } from 'next/server';
import { genAI } from '@/lib/gemini-client';

// 추출할 데이터 구조
export interface ParsedIdeaData {
  // 기본 정보
  title: string;
  category: string;
  oneLiner: string;

  // 평가항목별 내용
  problemDefinition: {
    marketStatus: string;
    problemStatement: string;
    necessity: string;
  };

  solution: {
    overview: string;
    coreFeatures: string[];
    techStack: string[];
    differentiation: string;
  };

  market: {
    targetCustomer: string;
    marketSize: string;
    competitors: string[];
  };

  businessModel: {
    revenueModel: string;
    pricingStrategy: string;
    growthPlan: string;
  };

  team: {
    founderBackground: string;
    teamComposition: string;
    capabilities: string[];
  };

  // 메타 정보
  extractedSections: string[];
  confidence: number;
  missingInfo: string[];
}

const CATEGORY_OPTIONS = [
  'ai-ml',
  'saas',
  'healthcare',
  'fintech',
  'ecommerce',
  'edutech',
  'foodtech',
  'mobility',
  'other',
];

// 기본값으로 안전한 데이터 구조 생성
function createDefaultParsedData(): ParsedIdeaData {
  return {
    title: '',
    category: 'other',
    oneLiner: '',
    problemDefinition: {
      marketStatus: '',
      problemStatement: '',
      necessity: '',
    },
    solution: {
      overview: '',
      coreFeatures: [],
      techStack: [],
      differentiation: '',
    },
    market: {
      targetCustomer: '',
      marketSize: '',
      competitors: [],
    },
    businessModel: {
      revenueModel: '',
      pricingStrategy: '',
      growthPlan: '',
    },
    team: {
      founderBackground: '',
      teamComposition: '',
      capabilities: [],
    },
    extractedSections: [],
    confidence: 0,
    missingInfo: [],
  };
}

// 안전하게 배열 확인
function ensureArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  return [];
}

// 안전하게 문자열 확인
function ensureString(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  return '';
}

// 안전하게 숫자 확인
function ensureNumber(value: unknown, defaultValue: number = 0): number {
  if (typeof value === 'number' && !isNaN(value)) {
    return Math.min(100, Math.max(0, value));
  }
  return defaultValue;
}

// AI 응답을 안전하게 파싱
function sanitizeParsedData(raw: unknown): ParsedIdeaData {
  const defaults = createDefaultParsedData();

  if (!raw || typeof raw !== 'object') {
    return defaults;
  }

  const data = raw as Record<string, unknown>;

  // 기본 정보
  const title = ensureString(data.title);
  const category = CATEGORY_OPTIONS.includes(ensureString(data.category))
    ? ensureString(data.category)
    : 'other';
  const oneLiner = ensureString(data.oneLiner);

  // problemDefinition
  const problemDef = (data.problemDefinition || {}) as Record<string, unknown>;
  const problemDefinition = {
    marketStatus: ensureString(problemDef.marketStatus),
    problemStatement: ensureString(problemDef.problemStatement),
    necessity: ensureString(problemDef.necessity),
  };

  // solution
  const sol = (data.solution || {}) as Record<string, unknown>;
  const solution = {
    overview: ensureString(sol.overview),
    coreFeatures: ensureArray(sol.coreFeatures),
    techStack: ensureArray(sol.techStack),
    differentiation: ensureString(sol.differentiation),
  };

  // market
  const mkt = (data.market || {}) as Record<string, unknown>;
  const market = {
    targetCustomer: ensureString(mkt.targetCustomer),
    marketSize: ensureString(mkt.marketSize),
    competitors: ensureArray(mkt.competitors),
  };

  // businessModel
  const biz = (data.businessModel || {}) as Record<string, unknown>;
  const businessModel = {
    revenueModel: ensureString(biz.revenueModel),
    pricingStrategy: ensureString(biz.pricingStrategy),
    growthPlan: ensureString(biz.growthPlan),
  };

  // team
  const tm = (data.team || {}) as Record<string, unknown>;
  const team = {
    founderBackground: ensureString(tm.founderBackground),
    teamComposition: ensureString(tm.teamComposition),
    capabilities: ensureArray(tm.capabilities),
  };

  // 메타 정보
  const extractedSections = ensureArray(data.extractedSections);
  const confidence = ensureNumber(data.confidence, 50);
  const missingInfo = ensureArray(data.missingInfo);

  return {
    title,
    category,
    oneLiner,
    problemDefinition,
    solution,
    market,
    businessModel,
    team,
    extractedSections,
    confidence,
    missingInfo,
  };
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: '잘못된 요청 형식입니다.' },
        { status: 400 }
      );
    }

    const { content } = body as { content?: unknown };

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { success: false, error: '파일 내용이 필요합니다.' },
        { status: 400 }
      );
    }

    if (content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '파일 내용이 비어있습니다.' },
        { status: 400 }
      );
    }

    if (content.length > 100000) {
      return NextResponse.json(
        { success: false, error: '파일이 너무 큽니다. (최대 100,000자)' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `당신은 스타트업 아이디어 문서를 분석하는 전문가입니다.
아래 문서를 분석하여 정부 지원사업(예비창업패키지, 초기창업패키지) 평가항목에 맞게 정보를 추출해주세요.

## 추출 규칙
1. 문서에 명시된 내용만 추출하세요. 추측하지 마세요.
2. 없는 정보는 빈 문자열("")로 남겨두세요. null이나 undefined를 사용하지 마세요.
3. 배열 필드는 항상 배열로 반환하세요. 없으면 빈 배열 []을 사용하세요.
4. 카테고리는 다음 중 하나여야 합니다: ${CATEGORY_OPTIONS.join(', ')}
5. confidence는 문서에서 추출할 수 있는 정보의 충분함을 0-100으로 평가하세요.
6. missingInfo에는 정부지원사업 신청에 필요하지만 문서에 없는 정보를 나열하세요.

## 문서 내용
${content.slice(0, 50000)}

## 응답 형식 (JSON)
{
  "title": "아이디어/프로젝트 제목",
  "category": "카테고리 (${CATEGORY_OPTIONS.join(' | ')})",
  "oneLiner": "한 줄 요약 (50자 이내)",

  "problemDefinition": {
    "marketStatus": "시장 현황 및 트렌드",
    "problemStatement": "해결하고자 하는 핵심 문제",
    "necessity": "이 솔루션이 필요한 이유"
  },

  "solution": {
    "overview": "솔루션 개요",
    "coreFeatures": ["핵심 기능 1", "핵심 기능 2"],
    "techStack": ["사용 기술 1", "사용 기술 2"],
    "differentiation": "경쟁 대비 차별화 포인트"
  },

  "market": {
    "targetCustomer": "타겟 고객 정의",
    "marketSize": "시장 규모 (TAM/SAM/SOM)",
    "competitors": ["경쟁사 1", "경쟁사 2"]
  },

  "businessModel": {
    "revenueModel": "수익 모델",
    "pricingStrategy": "가격 전략",
    "growthPlan": "성장 전략"
  },

  "team": {
    "founderBackground": "대표자 배경/경력",
    "teamComposition": "팀 구성 현황",
    "capabilities": ["보유 역량 1", "보유 역량 2"]
  },

  "extractedSections": ["추출 성공한 섹션들"],
  "confidence": 75,
  "missingInfo": ["부족한 정보 1", "부족한 정보 2"]
}

JSON만 응답하세요. 마크다운 코드블록 없이 순수 JSON만 반환하세요.`;

    let result;
    try {
      result = await model.generateContent(prompt);
    } catch (error) {
      console.error('Gemini API error:', error);
      return NextResponse.json(
        { success: false, error: 'AI 분석 요청에 실패했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 503 }
      );
    }

    const response = result.response;
    if (!response) {
      return NextResponse.json(
        { success: false, error: 'AI가 응답하지 않았습니다.' },
        { status: 500 }
      );
    }

    const text = response.text();
    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'AI 응답이 비어있습니다.' },
        { status: 500 }
      );
    }

    // JSON 파싱 (마크다운 코드블록 제거)
    let jsonText = text.trim();

    // ```json ... ``` 형태 제거
    const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1].trim();
    }

    // 순수 JSON 추출
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('JSON parse failed, raw text:', text.slice(0, 500));
      return NextResponse.json(
        { success: false, error: '분석 결과를 파싱할 수 없습니다. 다른 형식의 파일을 시도해주세요.' },
        { status: 500 }
      );
    }

    let rawParsedData: unknown;
    try {
      rawParsedData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json(
        { success: false, error: '분석 결과 형식이 올바르지 않습니다.' },
        { status: 500 }
      );
    }

    // 안전하게 데이터 정규화
    const parsedData = sanitizeParsedData(rawParsedData);

    // 최소한의 정보가 추출되었는지 확인
    if (!parsedData.title && !parsedData.oneLiner && !parsedData.problemDefinition.problemStatement) {
      return NextResponse.json({
        success: true,
        data: {
          ...parsedData,
          confidence: 10,
          missingInfo: ['문서에서 아이디어 관련 정보를 찾을 수 없습니다. 아이디어 설명이 포함된 문서인지 확인해주세요.'],
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: parsedData,
    });
  } catch (error) {
    console.error('Parse idea error:', error);

    // 구체적인 에러 메시지 제공
    let errorMessage = '분석 중 오류가 발생했습니다.';

    if (error instanceof SyntaxError) {
      errorMessage = '파일 형식을 처리할 수 없습니다.';
    } else if (error instanceof TypeError) {
      errorMessage = '데이터 처리 중 오류가 발생했습니다.';
    } else if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        errorMessage = '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.';
      } else if (error.message.includes('timeout')) {
        errorMessage = '요청 시간이 초과되었습니다. 파일 크기를 줄여주세요.';
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
