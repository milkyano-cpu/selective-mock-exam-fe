import type { User } from '@/features/auth/types';

export type MembershipTier = 'BASIC' | 'STANDARD' | 'PREMIUM';

export function userTier(user: User | null | undefined): MembershipTier {
  return user?.tier ?? 'BASIC';
}

export function hasPremiumAccess(user: User | null | undefined) {
  return userTier(user) === 'PREMIUM';
}

export function hasFullPracticeAccess(user: User | null | undefined) {
  const tier = userTier(user);
  return tier === 'STANDARD' || tier === 'PREMIUM';
}

// Forum is Premium-only for students. Parents (and admins/tutors) always have access.
export function canAccessForum(user: User | null | undefined) {
  if (!user) return false;
  if (user.isForumBanned && user.role !== 'ADMIN' && user.role !== 'TUTOR') return false;
  if (user.role === 'ADMIN' || user.role === 'TUTOR' || user.role === 'PARENT') return true;
  return userTier(user) === 'PREMIUM';
}

export function canWriteForum(user: User | null | undefined) {
  if (!user) return false;
  if (user.isForumBanned && user.role !== 'ADMIN' && user.role !== 'TUTOR') return false;
  if (user.role === 'PARENT') return true;
  if (user.role !== 'STUDENT') return false;
  return userTier(user) === 'PREMIUM';
}
