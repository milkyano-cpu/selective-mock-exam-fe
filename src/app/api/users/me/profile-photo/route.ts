import { NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/serverBackend';

export async function GET(req: Request) {
  try {
    const backendRes = await fetchFromBackend(req, '/users/me/profile-photo');
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
    console.error('[USERS PROFILE PHOTO GET API] ERROR:', err);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error', data: {} },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const backendRes = await fetchFromBackend(req, '/users/me/profile-photo', {
      method: 'POST',
      body: formData,
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
    console.error('[USERS PROFILE PHOTO POST API] ERROR:', err);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error', data: {} },
      { status: 500 }
    );
  }
}
