import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ACCESS_TOKEN_COOKIE = 'aspire_access_token';
const REFRESH_TOKEN_COOKIE = 'aspire_refresh_token';

const DASHBOARD_PREFIX = '/dashboard';
const AUTH_PAGES = ['/login', '/register', '/forgot-password', '/reset-password'];

async function tryServerRefresh(request: NextRequest): Promise<Response | null> {
  try {
    const refreshUrl = new URL('/api/auth/refresh', request.url);
    const res = await fetch(refreshUrl.toString(), {
      method: 'POST',
      headers: { cookie: request.headers.get('cookie') ?? '' },
    });
    return res.ok ? res : null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  const pathname = request.nextUrl.pathname;
  const isDashboardRoute = pathname === DASHBOARD_PREFIX || pathname.startsWith(`${DASHBOARD_PREFIX}/`);
  const isAuthPage = AUTH_PAGES.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (isDashboardRoute && !accessToken && !refreshToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Access token missing but refresh token present — silently refresh before SSR renders.
  // Redirect to the same URL with the new cookies so the page gets fresh tokens on first render.
  if (isDashboardRoute && !accessToken && refreshToken) {
    const refreshRes = await tryServerRefresh(request);

    if (!refreshRes) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const redirect = NextResponse.redirect(request.url);
    const setCookies =
      typeof (refreshRes.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie === 'function'
        ? (refreshRes.headers as unknown as { getSetCookie: () => string[] }).getSetCookie()
        : [refreshRes.headers.get('set-cookie')].filter(Boolean) as string[];

    setCookies.forEach((cookie) => redirect.headers.append('Set-Cookie', cookie));
    return redirect;
  }

  if (isAuthPage && (accessToken || refreshToken) && pathname !== '/reset-password') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register', '/forgot-password'],
};
