import { NextRequest, NextResponse } from 'next/server';
import {
  getIdeaCore,
  createIdeaSubmission,
  ideaSubmissionCreateSchema,
  IdeaSubmission,
} from '@/lib/portfolio';
import { createServerClient } from '@/lib/supabase/supabase';

interface RouteParams {
  params: Promise<{
    ideaId: string;
  }>;
}

// GET /api/portfolio/[ideaId]/submissions - List all submissions for an idea
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

    // Verify idea ownership
    const idea = await getIdeaCore(ideaId, userId);
    if (!idea) {
      return NextResponse.json(
        { success: false, error: 'Idea not found' },
        { status: 404 }
      );
    }

    // Get all submissions for all versions of this idea
    const supabase = createServerClient();
    const versionIds = idea.versions.map((v) => v.id);

    let submissions: IdeaSubmission[] = [];
    if (versionIds.length > 0) {
      const { data, error } = await supabase
        .from('idea_submissions')
        .select('*')
        .in('version_id', versionIds)
        .order('submitted_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch submissions: ${error.message}`);
      }
      submissions = data || [];
    }

    return NextResponse.json({
      success: true,
      data: submissions,
    });
  } catch (error) {
    console.error('GET /api/portfolio/[ideaId]/submissions error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}

// POST /api/portfolio/[ideaId]/submissions - Create a new submission
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

    // Validate input
    const parseResult = ideaSubmissionCreateSchema.safeParse(body);
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

    // Verify the version belongs to this idea
    const idea = await getIdeaCore(ideaId, userId);
    if (!idea) {
      return NextResponse.json(
        { success: false, error: 'Idea not found' },
        { status: 404 }
      );
    }

    const versionBelongsToIdea = idea.versions.some(
      (v) => v.id === parseResult.data.version_id
    );
    if (!versionBelongsToIdea) {
      return NextResponse.json(
        { success: false, error: 'Version does not belong to this idea' },
        { status: 400 }
      );
    }

    const submission = await createIdeaSubmission(userId, parseResult.data);

    return NextResponse.json({
      success: true,
      data: submission,
    });
  } catch (error) {
    console.error('POST /api/portfolio/[ideaId]/submissions error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create submission' },
      { status: 500 }
    );
  }
}
