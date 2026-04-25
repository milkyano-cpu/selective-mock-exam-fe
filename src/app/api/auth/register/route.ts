import { handleAuthProxy, handleAuthProxyError } from '@/lib/authProxy';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    return handleAuthProxy(req, '/auth/register', body);
  } catch (err) {
    return handleAuthProxyError('REGISTER API', err);
  }
}
