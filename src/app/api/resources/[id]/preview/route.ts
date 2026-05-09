import { NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/serverBackend';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const backendRes = await fetchFromBackend(req, `/resources/${id}/preview`);

    if (!backendRes.ok || !backendRes.body) {
      const message = await backendRes.text().catch(() => 'Failed to fetch resource file');
      return NextResponse.json(
        { success: false, message },
        { status: backendRes.status || 502 }
      );
    }

    const buffer = new Uint8Array(await backendRes.arrayBuffer());

    const contentType = backendRes.headers.get('content-type') || 'application/octet-stream';
    const contentDisposition = backendRes.headers.get('content-disposition');

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Length', String(buffer.byteLength));
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Cache-Control', 'private, max-age=300');
    if (contentDisposition) headers.set('Content-Disposition', contentDisposition);

    return new Response(buffer, {
      status: 200,
      headers,
    });
  } catch (err) {
    console.error('[RESOURCES PREVIEW GET] ERROR:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
