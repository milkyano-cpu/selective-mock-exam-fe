import { handleAuthProxy, handleAuthProxyError, handleLogoutResponse } from '@/lib/authProxy';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    handleAuthProxy(req, '/auth/logout', {}).catch((err) => {
      console.error('[LOGOUT API] Backend logout failed:', err);
    });
    return handleLogoutResponse(NextResponse.json({ success: true, message: 'Logged out' }));
  } catch (err) {
    return handleAuthProxyError('LOGOUT API', err);
  }
}

export async function GET(req: Request) {
  try {
    handleAuthProxy(req, '/auth/logout', {}).catch((err) => {
      console.error('[LOGOUT API] Backend logout failed:', err);
    });
    return handleLogoutResponse(NextResponse.redirect(new URL('/login', req.url)));
  } catch (err) {
    return handleAuthProxyError('LOGOUT API', err);
  }
}
