import { NextRequest, NextResponse } from 'next/server';
import {
  getIdeaCores,
  createIdeaCore,
  ideaCoreCreateSchema,
} from '@/lib/portfolio';

// GET /api/portfolio - List all ideas for a user
export async function GET(request: NextRequest) {
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

    const ideas = await getIdeaCores(userId);

    return NextResponse.json({
      success: true,
      data: ideas,
    });
  } catch (error) {
    console.error('GET /api/portfolio error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ideas' },
      { status: 500 }
    );
  }
}

// POST /api/portfolio - Create a new idea
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

    // Validate input
    const parseResult = ideaCoreCreateSchema.safeParse(body);
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

    const idea = await createIdeaCore(userId, parseResult.data);

    return NextResponse.json({
      success: true,
      data: idea,
    });
  } catch (error) {
    console.error('POST /api/portfolio error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create idea' },
      { status: 500 }
    );
  }
}
