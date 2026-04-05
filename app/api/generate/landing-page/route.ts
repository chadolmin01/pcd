import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/rate-limit';
import { generateLandingPage } from '@/lib/generators';
import { BusinessPlanData } from '@/components/idea-validator/types';

export const POST = withRateLimit(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { data } = body as { data: BusinessPlanData };

    if (!data) {
      return NextResponse.json(
        { error: '사업계획서 데이터가 필요합니다.' },
        { status: 400 }
      );
    }

    const landingPage = generateLandingPage(data);

    return NextResponse.json({
      success: true,
      data: landingPage,
    });
  } catch (error) {
    console.error('Landing page generation error:', error);
    return NextResponse.json(
      { error: '랜딩페이지 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
});
