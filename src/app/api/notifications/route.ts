import { NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/serverBackend';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const backendRes = await fetchFromBackend(req, `/notifications${query}`);
    const data = await backendRes.json().catch(() => ({}));

    return NextResponse.json(data, { status: backendRes.status });
  } catch (err) {
    console.error('[NOTIFICATIONS GET] ERROR:', err);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error', data: [] },
      { status: 500 }
    );
  }
}
