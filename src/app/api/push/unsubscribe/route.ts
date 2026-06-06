import { fetchFromBackend } from '@/lib/serverBackend';

export const dynamic = 'force-dynamic';

export async function DELETE(req: Request) {
  return fetchFromBackend(req, '/push/unsubscribe', {
    method: 'DELETE',
    body: await req.text(),
  });
}
