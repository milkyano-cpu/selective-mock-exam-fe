'use client';

import { User as UserIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

interface ProfileAvatarProps {
  name?: string;
  photoUrl?: string | null;
  isLoading?: boolean;
  className?: string;
  iconSize?: number;
  textClassName?: string;
}

export function ProfileAvatar({
  name,
  photoUrl,
  isLoading = false,
  className = 'h-10 w-10 rounded-lg',
  iconSize = 20,
  textClassName = 'text-sm',
}: ProfileAvatarProps) {
  const [failedPhotoUrl, setFailedPhotoUrl] = useState<string | null>(null);

  const initials = useMemo(() => {
    const source = name?.trim();

    if (!source) {
      return '';
    }

    const parts = source.split(/\s+/).slice(0, 2);
    return parts.map((part) => part.charAt(0).toUpperCase()).join('');
  }, [name]);

  if (photoUrl && failedPhotoUrl !== photoUrl) {
    return (
      <div className={`overflow-hidden bg-slate-200 ${className}`}>
        <img
          src={photoUrl}
          alt={name || 'Profile photo'}
          className="h-full w-full object-cover"
          onError={() => setFailedPhotoUrl(photoUrl)}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-[#0A9AE2] to-[#0659AA] text-white shadow-sm ${className}`}
      aria-busy={isLoading}
    >
      {initials ? <span className={`font-semibold ${textClassName}`}>{initials}</span> : <UserIcon size={iconSize} />}
    </div>
  );
}
