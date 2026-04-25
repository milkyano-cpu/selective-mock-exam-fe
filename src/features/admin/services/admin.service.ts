import mdwClient from '@/lib/mdwClient';

export interface CreateStaffPayload {
  role: 'ADMIN' | 'TUTOR';
  fullName: string;
  email: string;
  password?: string;
}

export const adminService = {
  createStaff: async (payload: CreateStaffPayload) => {
    const response = await mdwClient.post('/admin/users', payload);
    return response.data;
  },
};
