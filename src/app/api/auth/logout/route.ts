import { handleAuthProxy, handleAuthProxyError, handleLogoutResponse } from '@/lib/authProxy';

export async function POST(req: Request) {
  try {
    const response = await handleAuthProxy(req, '/auth/logout', {});
    return handleLogoutResponse(response);
  } catch (err) {
    return handleAuthProxyError('LOGOUT API', err);
  }
}
