import { NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/serverBackend';

export async function GET(req: Request) {
  try {
    const backendRes = await fetchFromBackend(req, '/csv-templates');
    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err) {
    console.error('[CSV TEMPLATES GET] ERROR:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error', data: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const backendRes = await fetchFromBackend(req, '/csv-templates', {
      method: 'POST',
      body: formData,
    });

    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err) {
    console.error('[CSV TEMPLATES POST] ERROR:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error', data: null }, { status: 500 });
  }
}
