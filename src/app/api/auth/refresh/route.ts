import { handleAuthProxy, handleAuthProxyError } from '@/lib/authProxy';
import { REFRESH_TOKEN_COOKIE, clearAuthCookies } from '@/lib/authCookies';

export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie');
    const fallbackBody = cookieHeader?.includes(`${REFRESH_TOKEN_COOKIE}=`) ? {} : await req.json().catch(() => ({}));
    const response = await handleAuthProxy(req, '/auth/refresh', fallbackBody);

    // If the backend rejected the refresh token, clear the stale cookies so the
    // middleware doesn't see them and bounce the client back to /dashboard when
    // they try to navigate to /login.
    if (response.status === 401 || response.status === 403) {
      clearAuthCookies(response);
    }

    return response;
  } catch (err) {
    return handleAuthProxyError('REFRESH API', err);
  }
}
