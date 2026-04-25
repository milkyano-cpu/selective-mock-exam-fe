import { useState } from 'react';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/auth.store';
import { ChangePasswordPayload, LoginCredentials, RegisterCredentials } from '../types';

import { isAxiosError } from 'axios';

function toFriendlyError(raw: string): string {
  const msg = raw.toLowerCase();

  if (msg.includes('duplicate email')) {
    return 'Two or more email addresses you entered are the same. Please make sure each person has a unique email.';
  }
  if (msg.includes('email already registered')) {
    return 'One of the email addresses is already registered. Please use a different email or contact us if you need help.';
  }
  if (msg.includes('invalid email or password')) {
    return 'Incorrect email or password. Please try again.';
  }
  if (msg.includes('suspended')) {
    return 'Your account has been suspended. Please contact us for assistance.';
  }
  if (msg.includes('banned')) {
    return 'Your account has been deactivated. Please contact us for assistance.';
  }
  if (msg.includes('session has been invalidated')) {
    return 'Your session has expired. Please log in again.';
  }
  if (msg.includes('invalid or expired')) {
    return 'Your session has expired. Please log in again.';
  }

  return raw;
}

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(credentials);
      if (response.success) {
        setAuth(response.data.user);
        return response.data;
      } else {
        setError(response.message || 'Login failed');
        return null;
      }
    } catch (err: unknown) {
      const msg = isAxiosError(err)
        ? err.response?.data?.message || 'Something went wrong. Please try again.'
        : 'Something went wrong. Please try again.';
      setError(toFriendlyError(msg));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const registerUser = async (credentials: RegisterCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.register(credentials);
      if (response.success) {
        return response;
      } else {
        setError(toFriendlyError(response.message || 'Registration failed. Please try again.'));
        return null;
      }
    } catch (err: unknown) {
      const msg = isAxiosError(err)
        ? err.response?.data?.message || 'Something went wrong. Please try again.'
        : 'Something went wrong. Please try again.';
      setError(toFriendlyError(msg));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      clearAuth();
    } catch (err) {
      console.error('Logout error:', err);
      // Still clear auth locally
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (data: ChangePasswordPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.changePassword(data);
      return response;
    } catch (err: unknown) {
      const msg = isAxiosError(err)
        ? err.response?.data?.message || 'Failed to change password'
        : 'Failed to change password';
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.forgotPassword({ email });
      return true;
    } catch (err: unknown) {
      const msg = isAxiosError(err)
        ? err.response?.data?.message || 'Something went wrong. Please try again.'
        : 'Something went wrong. Please try again.';
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (token: string, newPassword: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.resetPassword({ token, newPassword });
      if (response.success) return true;
      setError(response.message || 'Failed to reset password.');
      return false;
    } catch (err: unknown) {
      const msg = isAxiosError(err)
        ? err.response?.data?.message || 'Something went wrong. Please try again.'
        : 'Something went wrong. Please try again.';
      setError(
        msg.toLowerCase().includes('invalid or expired')
          ? 'This reset link is invalid or has already expired. Please request a new one.'
          : msg
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resetError = () => setError(null);

  return {
    login,
    register: registerUser,
    logout,
    changePassword,
    forgotPassword,
    resetPassword,
    isLoading,
    error,
    resetError,
  };
};
