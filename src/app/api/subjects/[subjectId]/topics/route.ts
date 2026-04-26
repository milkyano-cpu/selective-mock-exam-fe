import { NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/serverBackend';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  try {
    const { subjectId } = await params;
    const { searchParams } = new URL(req.url);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const backendRes = await fetchFromBackend(req, `/subjects/${subjectId}/topics${query}`);

    const data = await backendRes.json().catch(() => ({}));
    const normalized = data.data ?? data;

    return NextResponse.json(
      {
        success: backendRes.ok,
        message: data.message || (backendRes.ok ? 'Success' : 'Failed'),
        data: normalized,
        meta: data.meta,
      },
      { status: backendRes.status }
    );
  } catch (err) {
    console.error('[TOPICS API GET] ERROR:', err);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error', data: {} },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  try {
    const { subjectId } = await params;
    const body = await req.json();
    const backendRes = await fetchFromBackend(req, `/subjects/${subjectId}/topics`, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const data = await backendRes.json().catch(() => ({}));
    const normalized = data.data ?? data;

    return NextResponse.json(
      {
        success: backendRes.ok,
        message: data.message || (backendRes.ok ? 'Success' : 'Failed'),
        data: normalized,
      },
      { status: backendRes.status }
    );
  } catch (err) {
    console.error('[TOPICS API POST] ERROR:', err);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error', data: {} },
      { status: 500 }
    );
  }
}
