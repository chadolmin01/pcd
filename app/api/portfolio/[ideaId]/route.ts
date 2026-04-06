import { NextRequest, NextResponse } from 'next/server';
import {
  getIdeaCore,
  updateIdeaCore,
  deleteIdeaCore,
  ideaCoreUpdateSchema,
} from '@/lib/portfolio';

interface RouteParams {
  params: Promise<{
    ideaId: string;
  }>;
}

// GET /api/portfolio/[ideaId] - Get idea details with versions
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

    const idea = await getIdeaCore(ideaId, userId);

    if (!idea) {
      return NextResponse.json(
        { success: false, error: 'Idea not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: idea,
    });
  } catch (error) {
    console.error('GET /api/portfolio/[ideaId] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch idea' },
      { status: 500 }
    );
  }
}

// PATCH /api/portfolio/[ideaId] - Update idea
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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
    const parseResult = ideaCoreUpdateSchema.safeParse(body);
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

    const idea = await updateIdeaCore(ideaId, userId, parseResult.data);

    return NextResponse.json({
      success: true,
      data: idea,
    });
  } catch (error) {
    console.error('PATCH /api/portfolio/[ideaId] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update idea' },
      { status: 500 }
    );
  }
}

// DELETE /api/portfolio/[ideaId] - Delete idea (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    await deleteIdeaCore(ideaId, userId);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('DELETE /api/portfolio/[ideaId] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete idea' },
      { status: 500 }
    );
  }
}
