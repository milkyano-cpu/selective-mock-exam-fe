import mdwClient from '@/lib/mdwClient';
import { User } from '@/features/auth/types';

export const userService = {
  getMe: async (): Promise<User> => {
    const response = await mdwClient.get('/users/me');
    return response.data;
  },
};
