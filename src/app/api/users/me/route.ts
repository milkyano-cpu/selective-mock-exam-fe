import { NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/serverBackend';

export async function GET(req: Request) {
  try {
    const backendRes = await fetchFromBackend(req, '/users/me');
    const data = await backendRes.json().catch(() => ({}));
    const normalized = (data.data ?? data) as Record<string, unknown>;

    return NextResponse.json(
      {
        success: backendRes.ok,
        message: (data.message as string | undefined) || (backendRes.ok ? 'Success' : 'Failed'),
        data: normalized,
      },
      { status: backendRes.status }
    );
  } catch (err) {
    console.error('[USERS ME API] ERROR:', err);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error', data: {} },
      { status: 500 }
    );
  }
}
