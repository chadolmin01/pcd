import { NextRequest, NextResponse } from 'next/server';
import {
  updateIdeaSubmission,
  deleteIdeaSubmission,
  ideaSubmissionUpdateSchema,
} from '@/lib/portfolio';

interface RouteParams {
  params: Promise<{
    ideaId: string;
    submissionId: string;
  }>;
}

// PATCH /api/portfolio/[ideaId]/submissions/[submissionId] - Update submission
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { ideaId, submissionId } = await params;
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 401 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (
      !uuidRegex.test(userId) ||
      !uuidRegex.test(ideaId) ||
      !uuidRegex.test(submissionId)
    ) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate input
    const parseResult = ideaSubmissionUpdateSchema.safeParse(body);
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

    const submission = await updateIdeaSubmission(submissionId, userId, parseResult.data);

    return NextResponse.json({
      success: true,
      data: submission,
    });
  } catch (error) {
    console.error('PATCH /api/portfolio/[ideaId]/submissions/[submissionId] error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update submission';
    const status = errorMessage.includes('not found') || errorMessage.includes('Access denied')
      ? 404
      : 500;
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status }
    );
  }
}

// DELETE /api/portfolio/[ideaId]/submissions/[submissionId] - Delete submission
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { ideaId, submissionId } = await params;
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 401 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (
      !uuidRegex.test(userId) ||
      !uuidRegex.test(ideaId) ||
      !uuidRegex.test(submissionId)
    ) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    await deleteIdeaSubmission(submissionId, userId);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('DELETE /api/portfolio/[ideaId]/submissions/[submissionId] error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete submission';
    const status = errorMessage.includes('not found') || errorMessage.includes('Access denied')
      ? 404
      : 500;
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status }
    );
  }
}
