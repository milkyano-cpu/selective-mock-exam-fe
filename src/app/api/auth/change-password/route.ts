import { handleAuthProxy, handleAuthProxyError } from '@/lib/authProxy';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    return handleAuthProxy(req, '/auth/change-password', body);
  } catch (err) {
    return handleAuthProxyError('CHANGE PASSWORD API', err);
  }
}
