import { NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/serverBackend';

async function proxyForum(req: Request, pathSegments: string[], method: string) {
  try {
    const { searchParams } = new URL(req.url);
    const path = pathSegments.length ? `/${pathSegments.join('/')}` : '';
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const hasBody = !['GET', 'HEAD'].includes(method);
    const body = hasBody ? await req.text() : undefined;
    const backendRes = await fetchFromBackend(req, `/forum${path}${query}`, {
      method,
      body: body || undefined,
    });
    if (backendRes.status === 204) {
      return new Response(null, { status: 204 });
    }
    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err) {
    console.error(`[FORUM ${method}] ERROR:`, err);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

type ForumRouteContext = { params: Promise<{ path?: string[] }> };

export async function GET(req: Request, { params }: ForumRouteContext) {
  const { path = [] } = await params;
  return proxyForum(req, path, 'GET');
}

export async function POST(req: Request, { params }: ForumRouteContext) {
  const { path = [] } = await params;
  return proxyForum(req, path, 'POST');
}

export async function PATCH(req: Request, { params }: ForumRouteContext) {
  const { path = [] } = await params;
  return proxyForum(req, path, 'PATCH');
}

export async function DELETE(req: Request, { params }: ForumRouteContext) {
  const { path = [] } = await params;
  return proxyForum(req, path, 'DELETE');
}
