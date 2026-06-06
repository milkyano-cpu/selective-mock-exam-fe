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
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900 sm:rounded-[1.75rem] sm:shadow-[0_18px_50px_-28px_rgba(15,23,42,0.24)]">
      <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/40 sm:px-6 sm:py-5 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0A9AE2]/10 text-[#0A9AE2] sm:h-10 sm:w-10 sm:rounded-2xl">
                <Camera size={18} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 sm:text-lg">Profile Photo</h3>
                <p className="hidden text-xs font-bold uppercase tracking-[0.18em] text-slate-400 sm:block">Personal identity</p>
              </div>
            </div>
            <p className="mt-2 max-w-2xl text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400 sm:mt-3 sm:text-sm">
              Upload a private profile photo. We support JPG, PNG, and WebP up to {formatFileSize(env.profilePhotoMaxSizeBytes)}.
            </p>
          </div>

          <div className="hidden flex-wrap items-center gap-2 sm:flex">
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${user?.hasProfilePhoto ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'}`}>
              {user?.hasProfilePhoto ? 'Photo uploaded' : 'No photo yet'}
            </span>

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
        </div>
      </div>

      <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
        {isUploading && (
          <div className="mb-4 space-y-2 rounded-xl border border-[#0A9AE2]/10 bg-[#0A9AE2]/5 p-3 dark:border-[#0A9AE2]/20 dark:bg-[#0A9AE2]/10 sm:mb-5 sm:rounded-2xl sm:p-4">
            <div className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <span>Uploading profile photo</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-[#0A9AE2] transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="space-y-3 sm:hidden">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-800 dark:bg-slate-950/60">
            <ProfileAvatar
              name={user?.fullName || user?.name}
              photoUrl={photoUrl}
              isLoading={isLoading || isUploading}
              className="h-14 w-14 rounded-2xl"
              iconSize={20}
              textClassName="text-base"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-slate-900 dark:text-slate-100">
                {user?.fullName || user?.email || 'Your profile'}
              </p>
              <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                {profilePhoto?.originalName || 'No profile photo uploaded yet'}
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between px-3 py-3">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Status</span>
              <span className={`text-sm font-bold ${user?.hasProfilePhoto ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {user?.hasProfilePhoto ? 'Uploaded' : 'Pending'}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 px-3 py-3 dark:border-slate-800">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Format</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">JPG, PNG, WebP</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 px-3 py-3 dark:border-slate-800">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Max size</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatFileSize(env.profilePhotoMaxSizeBytes)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSelectClick}
            disabled={isUploading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A9AE2] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0989ca] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            {user?.hasProfilePhoto ? 'Replace Photo' : 'Upload Photo'}
          </button>
        </div>

        <div className="hidden gap-5 sm:grid lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="flex flex-col gap-6 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-950/60 md:flex-row md:items-center">
            <ProfileAvatar
              name={user?.fullName || user?.name}
              photoUrl={photoUrl}
              isLoading={isLoading || isUploading}
              className="h-24 w-24 rounded-3xl"
              iconSize={32}
              textClassName="text-2xl"
            />

            <div className="min-w-0 flex-1">
              <p className="text-base font-black text-slate-900 dark:text-slate-100">
                {user?.fullName || user?.email || 'Your profile'}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                {profilePhoto?.originalName || 'No profile photo uploaded yet'}
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span className="rounded-full bg-white px-3 py-1 dark:bg-slate-900">
                  {profilePhoto?.mimeType || 'Awaiting upload'}
                </span>
                <span className="rounded-full bg-white px-3 py-1 dark:bg-slate-900">
                  {profilePhoto ? formatFileSize(profilePhoto.size) : `Max ${formatFileSize(env.profilePhotoMaxSizeBytes)}`}
                </span>
                <span className="rounded-full bg-white px-3 py-1 dark:bg-slate-900">
                  {profilePhoto ? `Updated ${new Date(profilePhoto.updatedAt).toLocaleString()}` : 'Private image only'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Format</p>
              <p className="mt-2 text-sm font-black text-slate-900 dark:text-slate-100">JPG, PNG, WebP</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Max size</p>
              <p className="mt-2 text-sm font-black text-slate-900 dark:text-slate-100">{formatFileSize(env.profilePhotoMaxSizeBytes)}</p>
            </div>
          </div>
        </div>

        {error && (
          <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </p>
        )}

        {successMessage && (
          <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            {successMessage}
          </p>
        )}
      </div>
    </section>
  );
}
