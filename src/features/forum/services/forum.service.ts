import mdwClient from '@/lib/mdwClient';
import type {
  ForumSegment,
  ForumThread,
  ForumThreadDetail,
  ForumFlag,
  ForumWarning,
  ForumBannedWord,
  PaginationMeta,
  CreateThreadPayload,
  CreatePostPayload,
  FlagPostPayload,
  AdminReviewFlagPayload,
  AdminWarnUserPayload,
} from '../types/forum.types';

interface ApiListResponse<T> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const forumService = {
  // ── Threads ──────────────────────────────────────────────────────────────

  listThreads(segment: ForumSegment, page = 1, limit = 20) {
    return mdwClient.get<ApiListResponse<ForumThread>>('/forum/threads', {
      params: { segment, page, limit },
    }).then((r) => r.data);
  },

  createThread(segment: ForumSegment, payload: CreateThreadPayload) {
    return mdwClient.post<ApiResponse<ForumThread>>('/forum/threads', payload, {
      params: { segment },
    }).then((r) => r.data);
  },

  getThread(threadId: string, page = 1, limit = 20) {
    return mdwClient.get<ApiResponse<ForumThreadDetail>>(`/forum/threads/${threadId}`, {
      params: { page, limit },
    }).then((r) => r.data);
  },

  createPost(threadId: string, payload: CreatePostPayload) {
    return mdwClient.post<ApiResponse<unknown>>(`/forum/threads/${threadId}/posts`, payload)
      .then((r) => r.data);
  },

  deletePost(postId: string) {
    return mdwClient.delete(`/forum/posts/${postId}`).then((r) => r.data);
  },

  flagPost(postId: string, payload: FlagPostPayload) {
    return mdwClient.post<ApiResponse<unknown>>(`/forum/posts/${postId}/flag`, payload)
      .then((r) => r.data);
  },

  // ── Admin ─────────────────────────────────────────────────────────────────

  adminListFlags(status?: string, page = 1, limit = 20) {
    return mdwClient.get<ApiListResponse<ForumFlag>>('/forum/admin/flags', {
      params: { status, page, limit },
    }).then((r) => r.data);
  },

  adminReviewFlag(flagId: string, payload: AdminReviewFlagPayload) {
    return mdwClient.patch<ApiResponse<unknown>>(`/forum/admin/flags/${flagId}`, payload)
      .then((r) => r.data);
  },

  adminApprovePost(postId: string) {
    return mdwClient.post<ApiResponse<unknown>>(`/forum/admin/posts/${postId}/approve`)
      .then((r) => r.data);
  },

  adminWarnUser(userId: string, payload: AdminWarnUserPayload) {
    return mdwClient.post<ApiResponse<unknown>>(`/forum/admin/users/${userId}/warn`, payload)
      .then((r) => r.data);
  },

  adminListWarnings(userId?: string, page = 1, limit = 20) {
    return mdwClient.get<ApiListResponse<ForumWarning>>('/forum/admin/warnings', {
      params: { userId, page, limit },
    }).then((r) => r.data);
  },

  adminPinThread(threadId: string, isPinned: boolean) {
    return mdwClient.patch(`/forum/admin/threads/${threadId}/pin`, { isPinned })
      .then((r) => r.data);
  },

  adminLockThread(threadId: string, isLocked: boolean) {
    return mdwClient.patch(`/forum/admin/threads/${threadId}/lock`, { isLocked })
      .then((r) => r.data);
  },

  adminDeleteThread(threadId: string) {
    return mdwClient.delete(`/forum/admin/threads/${threadId}`).then((r) => r.data);
  },

  listBannedWords() {
    return mdwClient.get<ApiResponse<ForumBannedWord[]>>('/forum/admin/banned-words')
      .then((r) => r.data);
  },

  addBannedWord(word: string) {
    return mdwClient.post<ApiResponse<ForumBannedWord>>('/forum/admin/banned-words', { word })
      .then((r) => r.data);
  },

  deleteBannedWord(wordId: string) {
    return mdwClient.delete(`/forum/admin/banned-words/${wordId}`).then((r) => r.data);
  },
};
