import { NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/serverBackend';

type Params = { params: Promise<{ uuid: string }> };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { uuid } = await params;
    const body = await req.json();
    const backendRes = await fetchFromBackend(req, `/images/${uuid}`, {
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
    console.error('[IMAGES API PATCH] ERROR:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error', data: {} }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const { uuid } = await params;
    const backendRes = await fetchFromBackend(req, `/images/${uuid}`, {
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
    console.error('[IMAGES API DELETE] ERROR:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
