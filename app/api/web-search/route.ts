import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/rate-limit';
import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is required');
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// POST /api/web-search - Search and summarize web information
export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { query, context } = body;

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query required' },
        { status: 400 }
      );
    }

    // Use Gemini to generate a comprehensive response with its knowledge
    // In production, this would integrate with actual web search APIs
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `당신은 창업 지원서 작성을 돕는 리서치 전문가입니다.

사용자 질문: "${query}"
${context ? `맥락: ${context}` : ''}

다음 정보를 찾아서 정리해주세요:
1. 관련 시장 규모 및 성장률 (최신 데이터 기준)
2. 주요 트렌드 및 동향
3. 경쟁 현황
4. 관련 정책 또는 규제 (있는 경우)

응답 형식:
- 구체적인 수치와 출처를 포함해주세요
- 창업 지원서에 바로 활용할 수 있게 정리해주세요
- 마크다운 형식으로 작성해주세요`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return NextResponse.json({
      success: true,
      data: {
        query,
        result: text,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Web search error:', error);
    return NextResponse.json(
      { success: false, error: 'Search failed' },
      { status: 500 }
    );
  }
}, { isAI: true });
