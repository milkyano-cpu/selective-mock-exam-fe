import mdwClient from '@/lib/mdwClient';

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface ListNotificationsParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

export interface PaginatedNotificationsResponse {
  success: boolean;
  message: string;
  data: NotificationItem[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export const notificationService = {
  list: async (params: ListNotificationsParams): Promise<PaginatedNotificationsResponse> => {
    const response = await mdwClient.get('/notifications', { params });
    return response.data;
  },

  unreadCount: async (): Promise<{ success: boolean; count: number }> => {
    const response = await mdwClient.get('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await mdwClient.patch(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<{ success: boolean; message: string; count: number }> => {
    const response = await mdwClient.patch('/notifications/read-all');
    return response.data;
  },
};
