import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { withRateLimit } from '@/lib/rate-limit';

// 레벨별 일간 제한
const LEVEL_LIMITS = {
  sketch: -1,  // 무제한
  mvp: 10,     // 일 10회
  defense: 1,  // MVP 80점 이상 시 일 1회 해금
};

export const GET = withRateLimit(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { success: false, error: '이메일이 필요합니다.' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // 오늘 사용량 조회
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { data: usageData, error: usageError } = await supabase
      .from('prd_usage')
      .select('level, score')
      .eq('user_email', email)
      .gte('created_at', startOfDay.toISOString());

    if (usageError) {
      console.error('Usage query error:', usageError);
    }

    // 레벨별 사용 횟수 계산
    const usageByLevel = {
      sketch: 0,
      mvp: 0,
      defense: 0,
    };

    let hasHighMvpScore = false;

    (usageData || []).forEach((item: { level: string; score: number | null }) => {
      if (item.level in usageByLevel) {
        usageByLevel[item.level as keyof typeof usageByLevel]++;
      }
      if (item.level === 'mvp' && item.score && item.score >= 80) {
        hasHighMvpScore = true;
      }
    });

    // Defense 해금 조건 확인 (전체 기록에서 MVP 80점 이상)
    if (!hasHighMvpScore) {
      const { data: highScoreData } = await supabase
        .from('prd_usage')
        .select('id')
        .eq('user_email', email)
        .eq('level', 'mvp')
        .gte('score', 80)
        .limit(1);

      hasHighMvpScore = (highScoreData?.length || 0) > 0;
    }

    // 각 레벨별 상태 계산
    const levels = {
      sketch: {
        used: usageByLevel.sketch,
        limit: LEVEL_LIMITS.sketch,
        remaining: -1, // 무제한
        available: true,
        label: '무제한 무료',
      },
      mvp: {
        used: usageByLevel.mvp,
        limit: LEVEL_LIMITS.mvp,
        remaining: Math.max(0, LEVEL_LIMITS.mvp - usageByLevel.mvp),
        available: usageByLevel.mvp < LEVEL_LIMITS.mvp,
        label: `일 ${LEVEL_LIMITS.mvp}회 무료`,
      },
      defense: {
        used: usageByLevel.defense,
        limit: LEVEL_LIMITS.defense,
        remaining: hasHighMvpScore ? Math.max(0, LEVEL_LIMITS.defense - usageByLevel.defense) : 0,
        available: hasHighMvpScore && usageByLevel.defense < LEVEL_LIMITS.defense,
        unlocked: hasHighMvpScore,
        label: hasHighMvpScore ? '해금됨' : 'MVP 80점 이상 달성 시 해금',
      },
    };

    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);

    return NextResponse.json({
      success: true,
      email,
      period: {
        start: startOfDay.toISOString(),
        end: endOfDay.toISOString(),
      },
      levels,
    });

  } catch (error) {
    console.error('Usage API error:', error);
    return NextResponse.json(
      { success: false, error: '사용량 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
});

// POST: 사용량 기록
export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    const { email, level, score, validationId } = await request.json();

    if (!email || !level) {
      return NextResponse.json(
        { success: false, error: '이메일과 레벨이 필요합니다.' },
        { status: 400 }
      );
    }

    if (!['sketch', 'mvp', 'defense'].includes(level)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 레벨입니다.' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // 사용 제한 확인 (일간)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from('prd_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_email', email)
      .eq('level', level)
      .gte('created_at', startOfDay.toISOString());

    const limit = LEVEL_LIMITS[level as keyof typeof LEVEL_LIMITS];

    if (limit !== -1 && (count || 0) >= limit) {
      return NextResponse.json({
        success: false,
        error: `오늘 ${level.toUpperCase()} 레벨 사용 횟수를 초과했습니다. 내일 다시 시도해주세요.`,
        exceeded: true,
      }, { status: 429 });
    }

    // Defense 레벨 해금 확인
    if (level === 'defense') {
      const { data: highScoreData } = await supabase
        .from('prd_usage')
        .select('id')
        .eq('user_email', email)
        .eq('level', 'mvp')
        .gte('score', 80)
        .limit(1);

      if (!highScoreData?.length) {
        return NextResponse.json({
          success: false,
          error: 'MVP 레벨에서 80점 이상을 달성해야 Defense 레벨을 사용할 수 있습니다.',
          locked: true,
        }, { status: 403 });
      }
    }

    // 사용량 기록 (validation_id는 UUID 타입이므로 문자열 ID는 저장하지 않음)
    const { data, error } = await supabase
      .from('prd_usage')
      .insert({
        user_email: email,
        level,
        score: score || null,
        // validation_id는 UUID 형식만 허용 - 문자열 ID는 무시
      })
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      return NextResponse.json(
        { success: false, error: '사용량 기록에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      usage: data,
    });

  } catch (error) {
    console.error('Usage POST error:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
});
