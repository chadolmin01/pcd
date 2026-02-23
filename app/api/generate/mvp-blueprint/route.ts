import { NextRequest, NextResponse } from 'next/server';
import { generateMvpBlueprint, generateMvpMarkdown } from '@/lib/generators';
import { BusinessPlanData } from '@/components/idea-validator/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, format } = body as { data: BusinessPlanData; format?: 'json' | 'markdown' };

    if (!data) {
      return NextResponse.json(
        { error: '사업계획서 데이터가 필요합니다.' },
        { status: 400 }
      );
    }

    const blueprint = generateMvpBlueprint(data);

    // Markdown 포맷 요청 시
    if (format === 'markdown') {
      const markdown = generateMvpMarkdown(blueprint);
      return new NextResponse(markdown, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: blueprint,
    });
  } catch (error) {
    console.error('MVP blueprint generation error:', error);
    return NextResponse.json(
      { error: 'MVP 블루프린트 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
