import { NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/serverBackend';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; pathwayId: string }> }
) {
  try {
    const { id, pathwayId } = await params;
    const backendRes = await fetchFromBackend(req, `/pathway-plans/${id}/pathways/${pathwayId}`, {
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
    console.error('[PATHWAY PLAN PATHWAY API DELETE] ERROR:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
