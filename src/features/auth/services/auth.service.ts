import mdwClient from '@/lib/mdwClient';
import { LoginCredentials, AuthResponse } from '../types';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await mdwClient.post('/auth/login', credentials);
    return response.data;
  },
  
  register: async (credentials: Record<string, unknown>): Promise<AuthResponse> => {
    const response = await mdwClient.post('/auth/register', credentials);
    return response.data;
  },
  
  logout: async () => {
    await mdwClient.post('/auth/logout');
  },
};
