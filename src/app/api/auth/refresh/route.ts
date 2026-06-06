import { handleAuthProxy, handleAuthProxyError } from '@/lib/authProxy';
import { REFRESH_TOKEN_COOKIE } from '@/lib/authCookies';

export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie');
    const fallbackBody = cookieHeader?.includes(`${REFRESH_TOKEN_COOKIE}=`) ? {} : await req.json().catch(() => ({}));
    const response = await handleAuthProxy(req, '/auth/refresh', fallbackBody);

    // A rejected rotation may have lost a race to a successful request in
    // another tab, so only the coordinated client may decide to clear cookies.
    return response;
  } catch (err) {
    return handleAuthProxyError('REFRESH API', err);
  }
}
