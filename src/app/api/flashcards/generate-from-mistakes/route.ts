import { NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/serverBackend';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const backendRes = await fetchFromBackend(req, '/flashcards/generate-from-mistakes', { method: 'POST', body: JSON.stringify(body) });
    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err) {
    console.error('[FLASHCARDS/generate-from-mistakes POST] ERROR:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
