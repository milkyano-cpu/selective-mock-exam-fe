'use client';

import { useAuthStore } from '@/features/auth/store/auth.store';
import { ExamDetailSkeleton } from './ExamDetailSkeleton';

export default function Loading() {
  const user = useAuthStore((state) => state.user);

  return <ExamDetailSkeleton variant={user?.role === 'STUDENT' ? 'student' : 'staff'} />;
}
