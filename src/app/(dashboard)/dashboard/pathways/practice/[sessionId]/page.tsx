'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function LegacyPathwayPracticeRedirectPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/dashboard/practice/sessions/${sessionId}`);
  }, [router, sessionId]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <Loader2 size={40} className="animate-spin text-[#0A9AE2]" />
    </div>
  );
}
