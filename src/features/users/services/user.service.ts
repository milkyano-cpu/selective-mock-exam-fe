import mdwClient, { buildFeedbackHeaders } from '@/lib/mdwClient';
import { User } from '@/features/auth/types';

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export interface ProfilePhotoAccess {
  signedUrl: string;
  originalName: string | null;
  mimeType: string;
  size: number;
  updatedAt: string;
  expiresInSeconds: number;
}

export interface UploadedProfilePhoto extends ProfilePhotoAccess {
  previousPhotoCleanupFailed: boolean;
}

type UploadProfilePhotoOptions = {
  onProgress?: (progress: number) => void;
};

export const userService = {
  getMe: async (): Promise<ApiResponse<User>> => {
    const response = await mdwClient.get('/users/me');
    return response.data;
  },

  getMyProfilePhoto: async (): Promise<ApiResponse<ProfilePhotoAccess>> => {
    const response = await mdwClient.get('/users/me/profile-photo', {
      headers: buildFeedbackHeaders({ suppressNotFoundToast: true }),
    });
    return response.data;
  },

  deleteMyAccount: async (): Promise<{ success: boolean; message: string }> => {
    const response = await mdwClient.delete('/users/me');
    return response.data;
  },

  uploadMyProfilePhoto: async (
    file: File,
    options?: UploadProfilePhotoOptions
  ): Promise<ApiResponse<UploadedProfilePhoto>> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await mdwClient.post('/users/me/profile-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000,
      onUploadProgress: (event) => {
        if (!options?.onProgress) {
          return;
        }

        const total = event.total ?? file.size;
        const progress = total > 0 ? Math.min(100, Math.round((event.loaded / total) * 100)) : 0;
        options.onProgress(progress);
      },
    });

    return response.data;
  },
};
