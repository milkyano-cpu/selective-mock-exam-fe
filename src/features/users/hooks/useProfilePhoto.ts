'use client';

import { isAxiosError } from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { ProfilePhotoAccess, userService } from '../services/user.service';

const PROFILE_PHOTO_REFRESH_BUFFER_SECONDS = 60;

export function useProfilePhoto() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [profilePhoto, setProfilePhoto] = useState<ProfilePhotoAccess | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const userId = user?.id ?? null;
  const hasProfilePhoto = Boolean(user?.hasProfilePhoto);
  const profilePhotoUpdatedAt = user?.profilePhotoUpdatedAt ?? null;
  const shouldFetchProfilePhoto = Boolean(userId && hasProfilePhoto);

  const fetchProfilePhoto = useCallback(async () => {
    try {
      const response = await userService.getMyProfilePhoto();

      if (!response.success) {
        setError(response.message || 'Failed to load profile photo.');
        setProfilePhoto(null);
        setPhotoUrl(null);
        return;
      }

      setProfilePhoto(response.data);
      setPhotoUrl(response.data.signedUrl);
      setError(null);
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.status === 404) {
        updateUser({ hasProfilePhoto: false, profilePhotoUpdatedAt: null });
        setProfilePhoto(null);
        setPhotoUrl(null);
        setError(null);
      } else {
        setError(
          isAxiosError(err)
            ? err.response?.data?.message || 'Failed to load profile photo.'
            : 'Failed to load profile photo.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [updateUser]);

  const refresh = useCallback(async (options?: { force?: boolean }) => {
    if (!userId) {
      return;
    }

    if (!options?.force && !hasProfilePhoto) {
      return;
    }

    setIsLoading(true);

    await fetchProfilePhoto();
  }, [fetchProfilePhoto, hasProfilePhoto, userId]);

  useEffect(() => {
    if (!shouldFetchProfilePhoto) {
      return;
    }

    let isCancelled = false;

    const loadProfilePhoto = async () => {
      if (isCancelled) {
        return;
      }

      await refresh();
    };

    void loadProfilePhoto();

    return () => {
      isCancelled = true;
    };
  }, [profilePhotoUpdatedAt, refresh, shouldFetchProfilePhoto]);

  useEffect(() => {
    if (!shouldFetchProfilePhoto || !profilePhoto) {
      return;
    }

    const delaySeconds = Math.max(
      30,
      profilePhoto.expiresInSeconds - PROFILE_PHOTO_REFRESH_BUFFER_SECONDS
    );
    const timer = window.setTimeout(() => {
      void refresh({ force: true });
    }, delaySeconds * 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [profilePhoto, refresh, shouldFetchProfilePhoto]);

  return {
    profilePhoto: shouldFetchProfilePhoto ? profilePhoto : null,
    photoUrl: shouldFetchProfilePhoto ? photoUrl : null,
    isLoading: shouldFetchProfilePhoto ? isLoading : false,
    error: shouldFetchProfilePhoto ? error : null,
    refresh,
  };
}
