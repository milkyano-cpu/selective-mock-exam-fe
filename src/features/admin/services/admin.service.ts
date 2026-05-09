import mdwClient from '@/lib/mdwClient';

export interface CreateStaffPayload {
  role: 'ADMIN' | 'TUTOR';
  fullName: string;
  email: string;
  password?: string;
}

export interface UserItem {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  tier: 'BASIC' | 'STANDARD' | 'PREMIUM';
  phoneNumber: string | null;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListUsersParams {
  role: 'STUDENT' | 'PARENT' | 'TUTOR' | 'ADMIN';
  page?: number;
  limit?: number;
  search?: string;
  tiers?: string;
}

export interface PaginatedUsersResponse {
  success: boolean;
  message: string;
  data: UserItem[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export const adminService = {
  createStaff: async (payload: CreateStaffPayload) => {
    const response = await mdwClient.post('/admin/users', payload);
    return response.data;
  },

  listUsers: async (params: ListUsersParams): Promise<PaginatedUsersResponse> => {
    const response = await mdwClient.get('/admin/users', { params });
    return response.data;
  },

  syncTiers: async (): Promise<{ success: boolean; message: string }> => {
    const response = await mdwClient.post('/admin/users/sync-tiers');
    return response.data;
  },

  deleteUser: async (userId: string): Promise<{ success: boolean; message: string }> => {
    const response = await mdwClient.delete(`/admin/users/${userId}`);
    return response.data;
  },
};
