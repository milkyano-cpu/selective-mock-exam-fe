import { NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/serverBackend';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;
    const backendRes = await fetchFromBackend(
      req,
      `/csv-templates/${encodeURIComponent(type)}/download`
    );
    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err) {
    console.error('[CSV TEMPLATE DOWNLOAD GET] ERROR:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error', data: null }, { status: 500 });
  }
}
