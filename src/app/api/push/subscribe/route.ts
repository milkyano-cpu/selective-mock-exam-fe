import { fetchFromBackend } from '@/lib/serverBackend';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  return fetchFromBackend(req, '/push/subscribe', {
    method: 'POST',
    body: await req.text(),
  });
}
