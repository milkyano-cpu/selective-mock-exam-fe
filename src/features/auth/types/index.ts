export interface User {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'PARENT' | 'TUTOR' | 'ADMIN';
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface RegisterCredentials {
  email: string;
  password?: string;
  name: string;
}
