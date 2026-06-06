import { NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/serverBackend';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Forward Range header for video streaming support
    const rangeHeader = req.headers.get('range');
    const fetchOptions: RequestInit = {};
    if (rangeHeader) {
      fetchOptions.headers = { Range: rangeHeader };
    }

    const backendRes = await fetchFromBackend(req, `/resources/${id}/preview`, fetchOptions);

    if (!backendRes.ok || !backendRes.body) {
      const message = await backendRes.text().catch(() => 'Failed to fetch resource file');
      return NextResponse.json(
        { success: false, message },
        { status: backendRes.status || 502 }
      );
    }

    // Stream the response body directly without buffering
    const contentType = backendRes.headers.get('content-type') || 'application/octet-stream';
    const contentDisposition = backendRes.headers.get('content-disposition');
    const contentLength = backendRes.headers.get('content-length');
    const contentRange = backendRes.headers.get('content-range');
    const acceptRanges = backendRes.headers.get('accept-ranges');

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Cache-Control', 'private, max-age=300');
    headers.set('Accept-Ranges', acceptRanges || 'bytes');
    if (contentLength) headers.set('Content-Length', contentLength);
    if (contentDisposition) headers.set('Content-Disposition', contentDisposition);
    if (contentRange) headers.set('Content-Range', contentRange);

    // Use the backend status (206 for partial content, 200 for full)
    return new Response(backendRes.body, {
      status: backendRes.status,
      headers,
    });
  } catch (err) {
    console.error('[RESOURCES PREVIEW GET] ERROR:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
