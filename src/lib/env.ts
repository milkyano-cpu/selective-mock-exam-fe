import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url('NEXT_PUBLIC_API_URL must be a valid URL'),
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL').optional(),
  NEXT_PUBLIC_PROFILE_PHOTO_MAX_SIZE_BYTES: z.coerce.number().int().min(1).default(5 * 1024 * 1024),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsedEnv = envSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_PROFILE_PHOTO_MAX_SIZE_BYTES: process.env.NEXT_PUBLIC_PROFILE_PHOTO_MAX_SIZE_BYTES,
  NODE_ENV: process.env.NODE_ENV,
});

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format());
  throw new Error('Invalid environment variables');
}

export const env = {
  apiUrl: parsedEnv.data.NEXT_PUBLIC_API_URL,
  appUrl: parsedEnv.data.NEXT_PUBLIC_APP_URL,
  profilePhotoMaxSizeBytes: parsedEnv.data.NEXT_PUBLIC_PROFILE_PHOTO_MAX_SIZE_BYTES,
  isProduction: parsedEnv.data.NODE_ENV === 'production',
};
