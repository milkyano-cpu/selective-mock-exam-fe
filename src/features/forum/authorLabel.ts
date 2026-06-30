import type { ForumAuthor } from './types/forum.types';

/**
 * Display label for a forum author. For ADMIN/TUTOR the API includes the real
 * name behind an anonymous post (`realName`); surface it as
 * "Anonymous (Real Name)" so moderators know who posted. Everyone else just sees
 * the masked `name` (e.g. "Anonymous" or the real name for non-anonymous posts).
 */
export function forumAuthorLabel(author: ForumAuthor | null | undefined): string {
  if (!author) return 'Anonymous';
  const name = author.name ?? 'Anonymous';
  return author.realName ? `${name} (${author.realName})` : name;
}
