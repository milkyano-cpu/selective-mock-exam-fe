import mdwClient from '@/lib/mdwClient';

export type AnnouncementPriority = 'NORMAL' | 'URGENT';
export type AnnouncementStatus = 'SCHEDULED' | 'SENT';
export type AnnouncementTarget = 'STUDENT' | 'PARENT';

export interface AnnouncementItem {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  message: string;
  priority: AnnouncementPriority;
  target: AnnouncementTarget[];
  status: AnnouncementStatus;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
}

export interface CreateAnnouncementPayload {
  title: string;
  message: string;
  priority: AnnouncementPriority;
  target: AnnouncementTarget[];
  scheduledAt?: string;
}

export interface ListAnnouncementsParams {
  page?: number;
  limit?: number;
}

export interface PaginatedAnnouncementsResponse {
  success: boolean;
  message: string;
  data: AnnouncementItem[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export const announcementService = {
  create: async (payload: CreateAnnouncementPayload): Promise<{ success: boolean; message: string; data: AnnouncementItem }> => {
    const response = await mdwClient.post('/announcements', payload);
    return response.data;
  },

  list: async (params: ListAnnouncementsParams): Promise<PaginatedAnnouncementsResponse> => {
    const response = await mdwClient.get('/announcements', { params });
    return response.data;
  },

  feed: async (params: ListAnnouncementsParams): Promise<PaginatedAnnouncementsResponse> => {
    const response = await mdwClient.get('/announcements/feed', { params });
    return response.data;
  },

  remove: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await mdwClient.delete(`/announcements/${id}`);
    return response.data;
  },
};
