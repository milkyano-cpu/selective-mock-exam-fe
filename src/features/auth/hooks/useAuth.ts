import { useState } from 'react';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/auth.store';
import { LoginCredentials } from '../types';

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setAuth = useAuthStore((state) => state.setAuth);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(credentials);
      if (response.success) {
        setAuth(response.data.user, response.data.accessToken);
        return response.data;
      } else {
        setError(response.message || 'Login failed');
        return null;
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const msg = error.response?.data?.message || 'Something went wrong';
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    login,
    isLoading,
    error,
  };
};
