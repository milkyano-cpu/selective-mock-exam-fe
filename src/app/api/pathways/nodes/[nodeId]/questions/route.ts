import { NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/serverBackend';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ nodeId: string }> }
) {
  try {
    const { nodeId } = await params;
    const backendRes = await fetchFromBackend(req, `/pathways/nodes/${nodeId}/questions`);
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
    console.error('[PATHWAY NODE QUESTIONS API GET] ERROR:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error', data: [] }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ nodeId: string }> }
) {
  try {
    const { nodeId } = await params;
    const body = await req.json();
    const backendRes = await fetchFromBackend(req, `/pathways/nodes/${nodeId}/questions`, {
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
    console.error('[PATHWAY NODE QUESTIONS API POST] ERROR:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error', data: {} }, { status: 500 });
  }
}
