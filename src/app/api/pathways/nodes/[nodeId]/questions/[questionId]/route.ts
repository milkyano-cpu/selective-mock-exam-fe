import { NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/serverBackend';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ nodeId: string; questionId: string }> }
) {
  try {
    const { nodeId, questionId } = await params;
    const backendRes = await fetchFromBackend(req, `/pathways/nodes/${nodeId}/questions/${questionId}`, {
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
    console.error('[PATHWAY NODE QUESTION API DELETE] ERROR:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
