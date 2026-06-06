import { fetchFromBackend } from '@/lib/serverBackend';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const backendRes = await fetchFromBackend(req, '/notifications/sse', {
      headers: {
        Accept: 'text/event-stream',
      },
    });

    if (!backendRes.ok || !backendRes.body) {
      return new Response(backendRes.statusText, { status: backendRes.status });
    }

    return new Response(backendRes.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err) {
    console.error('[SSE PROXY] ERROR:', err);
    return new Response('SSE proxy error', { status: 502 });
  }
}
