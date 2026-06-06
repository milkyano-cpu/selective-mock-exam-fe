import { NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/serverBackend';

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const backendRes = await fetchFromBackend(req, '/questions/submit/bulk', {
      method: 'PATCH',
      body: JSON.stringify(body),
    });

    const data = await backendRes.json().catch(() => ({}));
    const normalized = data.data ?? data;

    return NextResponse.json(
      {
        success: backendRes.ok,
        message: data.message || (backendRes.ok ? 'Success' : 'Failed'),
        data: normalized,
      },
      { status: backendRes.status }
    );
  } catch (err) {
    console.error('[QUESTIONS BULK SUBMIT API PATCH] ERROR:', err);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error', data: {} },
      { status: 500 }
    );
  }
}
