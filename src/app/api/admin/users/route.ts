import { NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/serverBackend';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const backendRes = await fetchFromBackend(req, `/admin/users${query}`);
    const data = await backendRes.json().catch(() => ({}));

    return NextResponse.json(
      {
        success: backendRes.ok,
        message: (data.message as string | undefined) || (backendRes.ok ? 'Success' : 'Failed'),
        data: data.data ?? [],
        meta: data.meta,
      },
      { status: backendRes.status }
    );
  } catch (err) {
    console.error('[ADMIN API GET] ERROR:', err);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error', data: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const backendRes = await fetchFromBackend(req, '/admin/users', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const data = await backendRes.json().catch(() => ({}));
    const normalized = (data.data ?? data) as Record<string, unknown>;

    return NextResponse.json(
      {
        success: backendRes.ok,
        message: (data.message as string | undefined) || (backendRes.ok ? 'Success' : 'Failed'),
        data: normalized,
      },
      { status: backendRes.status }
    );
  } catch (err) {
    console.error('[ADMIN API] ERROR:', err);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error', data: {} },
      { status: 500 }
    );
  }
}
