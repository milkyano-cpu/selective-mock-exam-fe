import { handleAuthProxy, handleAuthProxyError } from '@/lib/authProxy';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    return handleAuthProxy(req, '/auth/reset-password', body);
  } catch (err) {
    return handleAuthProxyError('RESET PASSWORD API', err);
  }
}
