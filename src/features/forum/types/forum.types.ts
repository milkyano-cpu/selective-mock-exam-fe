export type ForumSegment = 'STUDENT' | 'PARENT';
export type ForumStatus = 'ACTIVE' | 'FLAGGED' | 'UNDER_REVIEW' | 'REJECTED';
export type FlagReason = 'INAPPROPRIATE' | 'SPAM' | 'OFF_TOPIC' | 'MISINFORMATION' | 'OTHER';
export type FlagStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type WarningLevel = 'WARNING' | 'SUSPEND';

export interface ForumAuthor {
  id: string;
  name: string | null;
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
  meta: PaginationMeta;
}

export interface ForumFlag {
  id: string;
  postId: string;
  postContent: string;
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
  action: 'APPROVE' | 'REJECT';
}

export interface AdminWarnUserPayload {
  level: WarningLevel;
  reason: string;
}
