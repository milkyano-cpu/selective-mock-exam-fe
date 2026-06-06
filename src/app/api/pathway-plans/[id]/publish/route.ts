import { NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/serverBackend';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Publish takes no body — just forward the PATCH (auth is forwarded by the helper).
    const backendRes = await fetchFromBackend(req, `/pathway-plans/${id}/publish`, {
      method: 'PATCH',
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
    console.error('[PATHWAY PLAN PUBLISH API PATCH] ERROR:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error', data: {} }, { status: 500 });
  }
}
