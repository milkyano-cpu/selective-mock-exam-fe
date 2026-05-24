import { NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/serverBackend';

type Params = { params: Promise<{ id: string; childId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id, childId } = await params;
    const body = await req.json();
    const backendRes = await fetchFromBackend(req, `/ai-rubrics/${id}/bands/${childId}`, {
      method: 'PATCH',
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
    console.error('[BANDS PATCH] ERROR:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error', data: {} }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const { id, childId } = await params;
    const backendRes = await fetchFromBackend(req, `/ai-rubrics/${id}/bands/${childId}`, {
      method: 'DELETE',
    });
    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(
      { success: backendRes.ok, message: data.message || (backendRes.ok ? 'Success' : 'Failed') },
      { status: backendRes.status }
    );
  } catch (err) {
    console.error('[BANDS DELETE] ERROR:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
