import mdwClient from '@/lib/mdwClient';
import type {
  ForumSegment,
  ForumThread,
  ForumThreadDetail,
  ForumFlag,
  ForumWarning,
  ForumBannedWord,
  ModeratedPost,
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
    return mdwClient.post<ApiResponse<{ id: string; underReview?: boolean }>>(`/forum/threads/${threadId}/posts`, payload)
      .then((r) => r.data);
  },

  editPost(postId: string, content: string) {
    return mdwClient.patch(`/forum/posts/${postId}`, { content }).then((r) => r.data);
  },

  deletePost(postId: string) {
    return mdwClient.delete<{ success: boolean; threadDeleted?: boolean }>(`/forum/posts/${postId}`)
      .then((r) => r.data);
  },

  flagPost(postId: string, payload: FlagPostPayload) {
    // Flagging is idempotent on the backend: a duplicate report returns 200 with
    // alreadyReported=true (not a 409), so the modal can show a clear message.
    return mdwClient.post<{ success: boolean; message?: string; alreadyReported?: boolean }>(
      `/forum/posts/${postId}/flag`, payload,
    ).then((r) => r.data);
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

  adminHidePost(postId: string, isHidden: boolean) {
    return mdwClient.patch<ApiResponse<unknown>>(`/forum/admin/posts/${postId}/hide`, { isHidden })
      .then((r) => r.data);
  },

  adminRemovePost(postId: string) {
    return mdwClient.patch<ApiResponse<unknown>>(`/forum/admin/posts/${postId}/remove`)
      .then((r) => r.data);
  },

  listModeratedPosts() {
    return mdwClient.get<ApiResponse<ModeratedPost[]>>('/forum/admin/posts/moderated')
      .then((r) => r.data);
  },

  restorePost(postId: string) {
    return mdwClient.patch<ApiResponse<unknown>>(`/forum/admin/posts/${postId}/restore`)
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

  liftForumBan(userId: string) {
    return mdwClient.delete(`/forum/admin/users/${userId}/ban`).then((r) => r.data);
  },

  deleteWarning(warningId: string) {
    return mdwClient.delete(`/forum/admin/warnings/${warningId}`).then((r) => r.data);
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
