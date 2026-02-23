import { NextRequest, NextResponse } from 'next/server';
import { generatePitchDeck, generatePitchDeckHTML } from '@/lib/generators';
import { BusinessPlanData } from '@/components/idea-validator/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, format } = body as { data: BusinessPlanData; format?: 'json' | 'html' };

    if (!data) {
      return NextResponse.json(
        { error: '사업계획서 데이터가 필요합니다.' },
        { status: 400 }
      );
    }

    const pitchDeck = generatePitchDeck(data);

    // HTML 포맷 요청 시
    if (format === 'html') {
      const html = generatePitchDeckHTML(pitchDeck);
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: pitchDeck,
    });
  } catch (error) {
    console.error('Pitch deck generation error:', error);
    return NextResponse.json(
      { error: '피치덱 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
