import mdwClient from '@/lib/mdwClient';
import { LoginCredentials, AuthResponse, RegisterCredentials, ChangePasswordPayload } from '../types';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await mdwClient.post('/auth/login', credentials);
    return response.data;
  },
  
  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await mdwClient.post('/auth/register', credentials);
    return response.data;
  },
  
  logout: async () => {
    const response = await mdwClient.post('/auth/logout');
    return response.data;
  },

  refresh: async () => {
    const response = await mdwClient.post('/auth/refresh', {});
    return response.data;
  },

  changePassword: async (data: ChangePasswordPayload) => {
    const response = await mdwClient.post('/auth/change-password', data);
    return response.data;
  },

  forgotPassword: async (data: { email: string }): Promise<{ success: boolean; message: string }> => {
    const response = await mdwClient.post('/auth/forgot-password', data);
    return response.data;
  },

  resetPassword: async (data: { token: string; newPassword: string }): Promise<{ success: boolean; message: string }> => {
    const response = await mdwClient.post('/auth/reset-password', data);
    return response.data;
  },
};
