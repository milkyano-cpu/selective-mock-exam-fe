import { NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/serverBackend';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const backendRes = await fetchFromBackend(req, `/questions/${id}`);
    const data = await backendRes.json().catch(() => ({}));

    return NextResponse.json(
      {
        success: backendRes.ok,
        message: data.message || (backendRes.ok ? 'Success' : 'Failed'),
        data: data.data ?? data,
      },
      { status: backendRes.status }
    );
  } catch (err) {
    console.error('[QUESTION API GET] ERROR:', err);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error', data: {} },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const backendRes = await fetchFromBackend(req, `/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    const data = await backendRes.json().catch(() => ({}));

    return NextResponse.json(
      {
        success: backendRes.ok,
        message: data.message || (backendRes.ok ? 'Success' : 'Failed'),
        data: data.data ?? data,
      },
      { status: backendRes.status }
    );
  } catch (err) {
    console.error('[QUESTION API PUT] ERROR:', err);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error', data: {} },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const backendRes = await fetchFromBackend(req, `/questions/${id}`, {
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
    console.error('[QUESTION API DELETE] ERROR:', err);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
