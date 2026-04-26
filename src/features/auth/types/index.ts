export interface User {
  id: string;
  email: string;
  fullName?: string;
  name?: string;
  role: 'STUDENT' | 'PARENT' | 'TUTOR' | 'ADMIN';
  status?: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  hasProfilePhoto?: boolean;
  profilePhotoUpdatedAt?: string | null;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken?: string;
  };
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface RegisterCredentials {
  parent: {
    fullName: string;
    email: string;
    phoneNumber: string;
    address: string;
  };
  students: Array<{
    fullName: string;
    email: string;
    gender: 'MALE' | 'FEMALE';
    yearLevel: string;
    schoolName: string;
  }>;
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}
