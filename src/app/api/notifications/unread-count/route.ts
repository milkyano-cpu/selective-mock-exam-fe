import { NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/serverBackend';

export async function GET(req: Request) {
  try {
    const backendRes = await fetchFromBackend(req, '/notifications/unread-count');
    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err) {
    console.error('[NOTIFICATIONS UNREAD COUNT] ERROR:', err);
    return NextResponse.json(
      { success: false, count: 0 },
      { status: 500 }
    );
  }
}
