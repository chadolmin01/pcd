import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { withRateLimit } from '@/lib/rate-limit';

// withRateLimit HOF 적용 (로그인/회원가입 전용 제한)
export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    const { name, organization, email, privacyConsent } = await request.json();

    // Validation
    if (!name || !organization || !email) {
      return NextResponse.json(
        { success: false, error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    if (!privacyConsent) {
      return NextResponse.json(
        { success: false, error: '개인정보 수집에 동의해주세요.' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: '올바른 이메일 형식이 아닙니다.' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('prd_users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      // User exists, return success (already onboarded)
      return NextResponse.json({
        success: true,
        user: existingUser,
        message: '이미 등록된 사용자입니다.'
      });
    }

    // Insert new user
    const { data, error } = await supabase
      .from('prd_users')
      .insert({
        name,
        organization,
        email,
        privacy_consent: privacyConsent
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: '사용자 등록에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: data,
      message: '등록이 완료되었습니다.'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}, { isRegister: true });

// GET endpoint removed for security
// User data should only be accessible via authenticated admin panel
export async function GET() {
  return NextResponse.json(
    { success: false, error: 'This endpoint is not available.' },
    { status: 403 }
  );
}
