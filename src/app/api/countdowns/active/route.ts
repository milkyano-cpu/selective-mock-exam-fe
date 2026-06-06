import { NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/serverBackend';

export async function GET(req: Request) {
  try {
    const backendRes = await fetchFromBackend(req, '/countdowns/active');
    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err) {
    console.error('[COUNTDOWNS ACTIVE GET] ERROR:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error', data: null }, { status: 500 });
  }
}
