import { NextResponse } from 'next/server';
import { env } from './env';

export const ACCESS_TOKEN_COOKIE = 'aspire_access_token';
export const REFRESH_TOKEN_COOKIE = 'aspire_refresh_token';

const baseCookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: 'lax' as const,
  path: '/',
};

export function setAuthCookies(response: NextResponse, accessToken?: string, refreshToken?: string) {
  if (accessToken) {
    response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
      ...baseCookieOptions,
      maxAge: 60 * 15,
    });
  }

  if (refreshToken) {
    response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, {
      ...baseCookieOptions,
      maxAge: 60 * 60 * 24 * 7,
    });
  }
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, '', {
    ...baseCookieOptions,
    maxAge: 0,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, '', {
    ...baseCookieOptions,
    maxAge: 0,
  });
}
