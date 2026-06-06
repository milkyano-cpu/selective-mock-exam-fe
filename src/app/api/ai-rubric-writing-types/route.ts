import { NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/serverBackend';

// GET only — write operations (POST/PUT/DELETE) go directly to the backend API
// via Postman. The dropdowns in QuestionFormModal and AI Rubrics page rely on
// this proxy to fetch the list of allowed writing types.
export async function GET(req: Request) {
  try {
    const backendRes = await fetchFromBackend(req, '/ai-rubric-writing-types');
    const data = await backendRes.json().catch(() => ({}));

    return NextResponse.json(
      {
        success: backendRes.ok,
        message: data.message || (backendRes.ok ? 'Success' : 'Failed'),
        data: data.data ?? [],
      },
      { status: backendRes.status }
    );
  } catch (err) {
    console.error('[AI_RUBRIC_WRITING_TYPES API GET] ERROR:', err);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error', data: [] },
      { status: 500 }
    );
  }
}
