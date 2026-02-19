import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/src/lib/supabase';
import { withRateLimit } from '@/src/lib/rate-limit';

/**
 * GET /api/events/recommend
 * 아이디어 관련 대회/프로그램 추천 (티저용)
 */
export const GET = withRateLimit(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const tags = searchParams.get('tags')?.split(',').filter(t => t.trim()) || [];
    const limit = Math.min(parseInt(searchParams.get('limit') || '3'), 10);

    const supabase = createServerClient();

    // 오늘 날짜
    const today = new Date().toISOString().split('T')[0];

    let query = supabase
      .from('startup_events')
      .select('id, title, organizer, event_type, registration_end_date, interest_tags, benefits')
      .eq('status', 'active')
      .gte('registration_end_date', today)
      .order('registration_end_date', { ascending: true });

    // 태그가 있으면 태그 기반 필터링
    if (tags.length > 0) {
      query = query.overlaps('interest_tags', tags);
    }

    const { data, error } = await query.limit(limit * 2); // 여분으로 더 가져옴

    if (error) {
      console.error('Events query error:', error);
      // 에러 시 목업 데이터 반환
      return NextResponse.json({
        success: true,
        events: getMockEvents(limit),
        isMock: true,
      });
    }

    if (!data || data.length === 0) {
      // 데이터 없으면 목업 반환
      return NextResponse.json({
        success: true,
        events: getMockEvents(limit),
        isMock: true,
      });
    }

    // 태그 매칭 점수 계산
    const scoredEvents = data.map(event => {
      const matchingTags = event.interest_tags?.filter((t: string) =>
        tags.some(tag => t.toLowerCase().includes(tag.toLowerCase()) || tag.toLowerCase().includes(t.toLowerCase()))
      ) || [];

      const daysLeft = Math.ceil(
        (new Date(event.registration_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      return {
        id: event.id,
        title: event.title,
        organizer: event.organizer,
        eventType: event.event_type,
        deadline: event.registration_end_date,
        daysLeft,
        tags: event.interest_tags?.slice(0, 3) || [],
        benefits: event.benefits?.slice(0, 2) || [],
        matchScore: tags.length > 0 ? matchingTags.length / tags.length : 0,
      };
    });

    // 매칭 점수 높은 순, 마감 임박 순 정렬
    scoredEvents.sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      return a.daysLeft - b.daysLeft;
    });

    return NextResponse.json({
      success: true,
      events: scoredEvents.slice(0, limit),
      isMock: false,
    });

  } catch (error) {
    console.error('Events recommend error:', error);
    return NextResponse.json({
      success: true,
      events: getMockEvents(3),
      isMock: true,
    });
  }
});

// 목업 데이터 (DB 연결 실패 또는 데이터 없을 때)
function getMockEvents(limit: number) {
  const mockEvents = [
    {
      id: 'mock-1',
      title: '2026 K-Startup 그랜드 챌린지',
      organizer: '중소벤처기업부',
      eventType: '창업대회',
      deadline: getDatePlusDays(14),
      daysLeft: 14,
      tags: ['AI', '스타트업', '글로벌'],
      benefits: ['최대 1억원 지원', '글로벌 네트워킹'],
      matchScore: 0.8,
    },
    {
      id: 'mock-2',
      title: '서울 스타트업 데모데이',
      organizer: '서울창업허브',
      eventType: '데모데이',
      deadline: getDatePlusDays(7),
      daysLeft: 7,
      tags: ['투자유치', '네트워킹', 'IR'],
      benefits: ['VC 매칭', '멘토링'],
      matchScore: 0.6,
    },
    {
      id: 'mock-3',
      title: '예비창업패키지 2차 모집',
      organizer: '창업진흥원',
      eventType: '지원사업',
      deadline: getDatePlusDays(21),
      daysLeft: 21,
      tags: ['예비창업자', '사업화지원'],
      benefits: ['최대 1억원', '사업화 교육'],
      matchScore: 0.5,
    },
  ];

  return mockEvents.slice(0, limit);
}

function getDatePlusDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}
