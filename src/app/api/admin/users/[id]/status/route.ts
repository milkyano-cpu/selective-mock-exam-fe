import { NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/serverBackend';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const backendRes = await fetchFromBackend(req, `/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(
      {
        success: backendRes.ok,
        message: (data.message as string | undefined) || (backendRes.ok ? 'Success' : 'Failed'),
        data: data.data,
      },
      { status: backendRes.status }
    );
  } catch (err) {
    console.error('[ADMIN USERS STATUS PATCH API] ERROR:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
