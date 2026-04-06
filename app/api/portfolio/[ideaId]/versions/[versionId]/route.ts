import { NextRequest, NextResponse } from 'next/server';
import {
  getIdeaVersion,
  updateIdeaVersion,
  deleteIdeaVersion,
  ideaVersionUpdateSchema,
} from '@/lib/portfolio';

interface RouteParams {
  params: Promise<{
    ideaId: string;
    versionId: string;
  }>;
}

// GET /api/portfolio/[ideaId]/versions/[versionId] - Get version details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { ideaId, versionId } = await params;
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 401 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId) || !uuidRegex.test(ideaId) || !uuidRegex.test(versionId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const version = await getIdeaVersion(versionId, userId);

    if (!version) {
      return NextResponse.json(
        { success: false, error: 'Version not found' },
        { status: 404 }
      );
    }

    // Verify version belongs to the idea
    if (version.core_id !== ideaId) {
      return NextResponse.json(
        { success: false, error: 'Version does not belong to this idea' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: version,
    });
  } catch (error) {
    console.error('GET /api/portfolio/[ideaId]/versions/[versionId] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch version' },
      { status: 500 }
    );
  }
}

// PATCH /api/portfolio/[ideaId]/versions/[versionId] - Update version
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { ideaId, versionId } = await params;
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 401 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId) || !uuidRegex.test(ideaId) || !uuidRegex.test(versionId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate input
    const parseResult = ideaVersionUpdateSchema.safeParse(body);
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

    // Verify version belongs to the idea
    const existingVersion = await getIdeaVersion(versionId, userId);
    if (!existingVersion || existingVersion.core_id !== ideaId) {
      return NextResponse.json(
        { success: false, error: 'Version not found or does not belong to this idea' },
        { status: 404 }
      );
    }

    const version = await updateIdeaVersion(versionId, userId, parseResult.data);

    return NextResponse.json({
      success: true,
      data: version,
    });
  } catch (error) {
    console.error('PATCH /api/portfolio/[ideaId]/versions/[versionId] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update version' },
      { status: 500 }
    );
  }
}

// DELETE /api/portfolio/[ideaId]/versions/[versionId] - Delete version (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { ideaId, versionId } = await params;
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 401 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId) || !uuidRegex.test(ideaId) || !uuidRegex.test(versionId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    // Verify version belongs to the idea
    const existingVersion = await getIdeaVersion(versionId, userId);
    if (!existingVersion || existingVersion.core_id !== ideaId) {
      return NextResponse.json(
        { success: false, error: 'Version not found or does not belong to this idea' },
        { status: 404 }
      );
    }

    await deleteIdeaVersion(versionId, userId);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('DELETE /api/portfolio/[ideaId]/versions/[versionId] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete version' },
      { status: 500 }
    );
  }
}
