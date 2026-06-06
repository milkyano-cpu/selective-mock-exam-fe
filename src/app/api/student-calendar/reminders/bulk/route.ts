import { NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/serverBackend';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const backendRes = await fetchFromBackend(req, '/student-calendar/reminders/bulk', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err) {
    console.error('[STUDENT CALENDAR REMINDERS BULK POST] ERROR:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error', data: [] }, { status: 500 });
  }
}
