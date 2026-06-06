import { NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/serverBackend';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const backendRes = await fetchFromBackend(req, `/pathways/${id}/nodes`, {
      method: 'POST',
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
    console.error('[PATHWAY NODES API POST] ERROR:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error', data: {} }, { status: 500 });
  }
}
