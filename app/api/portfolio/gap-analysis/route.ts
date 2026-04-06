import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getIdeaVersion,
  getProgramEligibility,
  calculateGapAnalysis,
  compareVersions,
} from '@/lib/portfolio';

const gapAnalysisSchema = z.object({
  version_id: z.string().uuid(),
  program_id: z.string().min(1),
});

const compareSchema = z.object({
  from_version_id: z.string().uuid(),
  to_version_id: z.string().uuid(),
});

// POST /api/portfolio/gap-analysis - Calculate gap analysis for a version
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 401 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Check if this is a compare request
    if (body.from_version_id && body.to_version_id) {
      const compareResult = compareSchema.safeParse(body);
      if (!compareResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid input',
            details: compareResult.error.flatten(),
          },
          { status: 400 }
        );
      }

      const fromVersion = await getIdeaVersion(compareResult.data.from_version_id, userId);
      const toVersion = await getIdeaVersion(compareResult.data.to_version_id, userId);

      if (!fromVersion || !toVersion) {
        return NextResponse.json(
          { success: false, error: 'One or both versions not found' },
          { status: 404 }
        );
      }

      const comparison = compareVersions(fromVersion, toVersion);

      return NextResponse.json({
        success: true,
        data: comparison,
      });
    }

    // Gap analysis request
    const parseResult = gapAnalysisSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input',
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const version = await getIdeaVersion(parseResult.data.version_id, userId);
    if (!version) {
      return NextResponse.json(
        { success: false, error: 'Version not found' },
        { status: 404 }
      );
    }

    const program = await getProgramEligibility(parseResult.data.program_id);
    if (!program) {
      return NextResponse.json(
        { success: false, error: 'Program not found' },
        { status: 404 }
      );
    }

    const gapAnalysis = calculateGapAnalysis(version, program);

    return NextResponse.json({
      success: true,
      data: gapAnalysis,
    });
  } catch (error) {
    console.error('POST /api/portfolio/gap-analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate gap analysis' },
      { status: 500 }
    );
  }
}
