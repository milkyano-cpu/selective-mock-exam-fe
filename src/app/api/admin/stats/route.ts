import { NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/serverBackend';

export async function GET(req: Request) {
  try {
    const backendRes = await fetchFromBackend(req, '/admin/stats');
    const data = await backendRes.json().catch(() => ({}));

    return NextResponse.json(
      {
        success: backendRes.ok,
        message: (data.message as string | undefined) || (backendRes.ok ? 'Success' : 'Failed'),
        data: data.data ?? null,
      },
      { status: backendRes.status }
    );
  } catch (err) {
    console.error('[ADMIN STATS API] ERROR:', err);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error', data: null },
      { status: 500 }
    );
  }
}
