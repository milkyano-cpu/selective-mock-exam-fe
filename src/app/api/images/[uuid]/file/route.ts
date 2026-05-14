import { NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/serverBackend';

type Params = { params: Promise<{ uuid: string }> };

export async function POST(req: Request, { params }: Params) {
  try {
    const { uuid } = await params;
    const formData = await req.formData();
    const backendRes = await fetchFromBackend(req, `/images/${uuid}/file`, {
      method: 'POST',
      body: formData,
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
    console.error('[IMAGES FILE API POST] ERROR:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error', data: {} }, { status: 500 });
  }
}
