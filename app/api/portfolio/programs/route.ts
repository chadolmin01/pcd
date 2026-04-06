import { NextRequest, NextResponse } from 'next/server';
import { getProgramEligibilities, getProgramEligibility } from '@/lib/portfolio';

// GET /api/portfolio/programs - List all programs with eligibility info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('id');

    // Get specific program if ID provided
    if (programId) {
      const program = await getProgramEligibility(programId);

      if (!program) {
        return NextResponse.json(
          { success: false, error: 'Program not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: program,
      });
    }

    // Get all programs
    const programs = await getProgramEligibilities();

    return NextResponse.json({
      success: true,
      data: programs,
    });
  } catch (error) {
    console.error('GET /api/portfolio/programs error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch programs' },
      { status: 500 }
    );
  }
}
