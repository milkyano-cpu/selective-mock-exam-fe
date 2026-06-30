export type ForumSegment = 'STUDENT' | 'PARENT';
export type ForumStatus = 'ACTIVE' | 'FLAGGED' | 'UNDER_REVIEW' | 'REJECTED' | 'HIDDEN' | 'REMOVED';
export type FlagReason = 'INAPPROPRIATE' | 'SPAM' | 'OFF_TOPIC' | 'MISINFORMATION' | 'OTHER';
export type FlagStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type WarningLevel = 'MINOR' | 'MAJOR' | 'BAN';

export interface ForumAuthor {
  id: string;
  name: string | null;
  /** Real name behind an anonymous post — only present for ADMIN/TUTOR viewers. */
  realName?: string;
}

export interface ForumThread {
  id: string;
  segment: ForumSegment;
  title: string;
  author: ForumAuthor | null;
  isAnonymous: boolean;
  isPinned: boolean;
  isLocked: boolean;
  postCount: number;
  lastPostAt: string | null;
  status: ForumStatus;
  createdAt: string;
  // Present only on the create-thread response: true when the post was auto-sent
  // to moderation (banned word) and isn't publicly visible yet.
  underReview?: boolean;
}

export interface ForumPost {
  id: string;
  threadId: string;
  author: ForumAuthor | null;
  isAnonymous: boolean;
  content: string;
  status: ForumStatus;
  flagCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ForumThreadDetail extends ForumThread {
  posts: ForumPost[];
  /** True when the opening post is hidden/removed from the current viewer. */
  openingPostRemoved?: boolean;
  meta: PaginationMeta;
}

export interface ForumFlag {
  id: string;
  postId: string;
  postContent: string;
  /** Flagged post's real author (revealed to ADMIN/TUTOR), null if unavailable. */
  author: ForumAuthor | null;
  isAnonymous: boolean;
  reporter: ForumAuthor;
  reason: FlagReason;
  note: string | null;
  status: FlagStatus;
  createdAt: string;
}

export interface ForumWarning {
  id: string;
  user: ForumAuthor;
  admin: ForumAuthor;
  level: WarningLevel;
  reason: string;
  /** Total MINOR warnings currently recorded for this user. */
  minorCount: number;
  /** Total MAJOR warnings currently recorded for this user. */
  majorCount: number;
  /** Current forum-ban state of the warned user. */
  isForumBanned: boolean;
  createdAt: string;
}

export interface ModeratedPost {
  id: string;
  content: string;
  author: ForumAuthor | null;
  status: 'HIDDEN' | 'REMOVED';
  threadId: string;
  threadTitle: string;
  createdAt: string;
}

export interface ForumBannedWord {
  id: string;
  word: string;
  createdAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ── Request payloads ──────────────────────────────────────────────────────────

export interface CreateThreadPayload {
  title: string;
  content: string;
  isAnonymous: boolean;
}

export interface CreatePostPayload {
  content: string;
  isAnonymous: boolean;
}

export interface FlagPostPayload {
  reason: FlagReason;
  note?: string;
}

export interface AdminReviewFlagPayload {
  action: 'APPROVE' | 'REJECT' | 'HIDE' | 'REMOVE';
}

export interface AdminWarnUserPayload {
  level: WarningLevel;
  reason: string;
}
