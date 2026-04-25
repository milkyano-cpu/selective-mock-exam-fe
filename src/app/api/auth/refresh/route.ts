import { handleAuthProxy, handleAuthProxyError } from '@/lib/authProxy';
import { REFRESH_TOKEN_COOKIE } from '@/lib/authCookies';

export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie');
    const fallbackBody = cookieHeader?.includes(`${REFRESH_TOKEN_COOKIE}=`) ? {} : await req.json().catch(() => ({}));
    return handleAuthProxy(req, '/auth/refresh', fallbackBody);
  } catch (err) {
    return handleAuthProxyError('REFRESH API', err);
  }
}
