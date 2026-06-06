import { fetchFromBackend } from '@/lib/serverBackend';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  return fetchFromBackend(req, '/push/vapid-public-key');
}
