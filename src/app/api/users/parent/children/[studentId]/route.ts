import { NextResponse } from 'next/server';
import { fetchFromBackend } from '@/lib/serverBackend';

export async function DELETE(req: Request, { params }: { params: Promise<{ studentId: string }> }) {
  try {
    const { studentId } = await params;
    const backendRes = await fetchFromBackend(req, `/users/parent/children/${studentId}`, {
      method: 'DELETE',
    });
    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(
      { success: backendRes.ok, message: data.message || (backendRes.ok ? 'Success' : 'Failed') },
      { status: backendRes.status }
    );
  } catch (err) {
    console.error('[USERS PARENT CHILD DELETE API] ERROR:', err);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
