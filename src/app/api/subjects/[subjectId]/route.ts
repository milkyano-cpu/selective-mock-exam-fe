import { NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/serverBackend';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  try {
    const { subjectId } = await params;
    const backendRes = await fetchFromBackend(req, `/subjects/${subjectId}`);
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
    console.error('[SUBJECT API GET] ERROR:', err);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error', data: {} },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  try {
    const { subjectId } = await params;
    const body = await req.json();
    const backendRes = await fetchFromBackend(req, `/subjects/${subjectId}`, {
      method: 'PUT',
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
    console.error('[SUBJECT API PUT] ERROR:', err);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error', data: {} },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  try {
    const { subjectId } = await params;
    const backendRes = await fetchFromBackend(req, `/subjects/${subjectId}`, {
      method: 'DELETE',
    });

    const data = await backendRes.json().catch(() => ({}));

    return NextResponse.json(
      {
        success: backendRes.ok,
        message: data.message || (backendRes.ok ? 'Success' : 'Failed'),
      },
      { status: backendRes.status }
    );
  } catch (err) {
    console.error('[SUBJECT API DELETE] ERROR:', err);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
