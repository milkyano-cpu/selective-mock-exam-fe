import { NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/serverBackend';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const backendRes = await fetchFromBackend(req, '/billing/parent/checkout', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err) {
    console.error('[BILLING/parent/checkout POST] ERROR:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
