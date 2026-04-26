'use client';

import { ChangeEvent, useRef, useState } from 'react';
import { Camera, Loader2, Upload } from 'lucide-react';
import { isAxiosError } from 'axios';
import { ProfileAvatar } from './ProfileAvatar';
import { useProfilePhoto } from '@/features/users/hooks/useProfilePhoto';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { userService } from '@/features/users/services/user.service';
import { env } from '@/lib/env';

const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

export function ProfilePhotoSettingsCard() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const { photoUrl, profilePhoto, isLoading, refresh } = useProfilePhoto();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSelectClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      setError('Please choose a JPG, PNG, or WebP image.');
      setSuccessMessage(null);
      return;
    }

    if (file.size > env.profilePhotoMaxSizeBytes) {
      setError(`Profile photo must be ${formatFileSize(env.profilePhotoMaxSizeBytes)} or smaller.`);
      setSuccessMessage(null);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await userService.uploadMyProfilePhoto(file, {
        onProgress: setUploadProgress,
      });

      if (!response.success) {
        setError(response.message || 'Failed to upload profile photo.');
        return;
      }

      updateUser({
        hasProfilePhoto: true,
        profilePhotoUpdatedAt: response.data.updatedAt,
      });
      setUploadProgress(100);
      await refresh({ force: true });
      setSuccessMessage(
        response.data.previousPhotoCleanupFailed
          ? 'Profile photo updated. The previous file could not be cleaned up automatically.'
          : 'Profile photo updated successfully.'
      );
    } catch (err: unknown) {
      setError(
        isAxiosError(err)
          ? err.response?.data?.message || 'Failed to upload profile photo.'
          : 'Failed to upload profile photo.'
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900 lg:p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Camera className="text-[#0A9AE2]" size={20} />
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Profile Photo</h3>
          </div>
          <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
            Upload a private profile photo. We support JPG, PNG, and WebP up to {formatFileSize(env.profilePhotoMaxSizeBytes)}.
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />

        <button
          type="button"
          onClick={handleSelectClick}
          disabled={isUploading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0A9AE2] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0989ca] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
          {user?.hasProfilePhoto ? 'Replace Photo' : 'Upload Photo'}
        </button>
      </div>

      {isUploading && (
        <div className="mt-4 space-y-2">
          <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-[#0A9AE2] transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Uploading... {uploadProgress}%
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-6 rounded-3xl border border-slate-100 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-950/60 md:flex-row md:items-center">
        <ProfileAvatar
          name={user?.fullName || user?.name}
          photoUrl={photoUrl}
          isLoading={isLoading || isUploading}
          className="h-24 w-24 rounded-3xl"
          iconSize={32}
          textClassName="text-2xl"
        />

        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {user?.fullName || user?.email || 'Your profile'}
          </p>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            {profilePhoto?.originalName || 'No profile photo uploaded yet'}
          </p>

          {profilePhoto && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="rounded-full bg-white px-3 py-1 dark:bg-slate-900">{profilePhoto.mimeType}</span>
              <span className="rounded-full bg-white px-3 py-1 dark:bg-slate-900">{formatFileSize(profilePhoto.size)}</span>
              <span className="rounded-full bg-white px-3 py-1 dark:bg-slate-900">
                Updated {new Date(profilePhoto.updatedAt).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </p>
      )}

      {successMessage && (
        <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
          {successMessage}
        </p>
      )}
    </section>
  );
}
