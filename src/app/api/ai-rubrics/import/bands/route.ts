import { NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/serverBackend';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const backendRes = await fetchFromBackend(req, '/ai-rubrics/import/bands', {
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
    console.error('[BANDS IMPORT] ERROR:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error', data: {} }, { status: 500 });
  }
}
