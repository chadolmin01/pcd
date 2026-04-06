import { NextRequest, NextResponse } from 'next/server';
import {
  getIdeaVersions,
  createIdeaVersion,
  forkIdeaVersion,
  ideaVersionCreateSchema,
} from '@/lib/portfolio';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{
    ideaId: string;
  }>;
}

// GET /api/portfolio/[ideaId]/versions - List versions for an idea
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { ideaId } = await params;
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 401 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId) || !uuidRegex.test(ideaId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const versions = await getIdeaVersions(ideaId, userId);

    return NextResponse.json({
      success: true,
      data: versions,
    });
  } catch (error) {
    console.error('GET /api/portfolio/[ideaId]/versions error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch versions' },
      { status: 500 }
    );
  }
}

// POST /api/portfolio/[ideaId]/versions - Create or fork a version
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { ideaId } = await params;
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 401 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId) || !uuidRegex.test(ideaId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Check if this is a fork request
    if (body.fork_from) {
      const forkSchema = z.object({
        fork_from: z.string().uuid(),
        version_name: z.string().min(1).max(100),
        target_program_id: z.string().optional().nullable(),
        target_program_name: z.string().optional().nullable(),
      });

      const forkResult = forkSchema.safeParse(body);
      if (!forkResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid fork input',
            details: forkResult.error.flatten(),
          },
          { status: 400 }
        );
      }

      const version = await forkIdeaVersion(userId, {
        source_version_id: forkResult.data.fork_from,
        new_version_name: forkResult.data.version_name,
        target_program_id: forkResult.data.target_program_id,
        target_program_name: forkResult.data.target_program_name,
      });

      return NextResponse.json({
        success: true,
        data: version,
      });
    }

    // Regular version creation
    const parseResult = ideaVersionCreateSchema.safeParse({
      ...body,
      core_id: ideaId,
    });

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

    const version = await createIdeaVersion(userId, parseResult.data);

    return NextResponse.json({
      success: true,
      data: version,
    });
  } catch (error) {
    console.error('POST /api/portfolio/[ideaId]/versions error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create version' },
      { status: 500 }
    );
  }
}
