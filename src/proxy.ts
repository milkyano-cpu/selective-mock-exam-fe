import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ACCESS_TOKEN_COOKIE = 'aspire_access_token';
const REFRESH_TOKEN_COOKIE = 'aspire_refresh_token';

const DASHBOARD_PREFIX = '/dashboard';
const AUTH_PAGES = ['/login', '/register', '/forgot-password', '/reset-password'];

export function proxy(request: NextRequest) {
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

  // Dashboard content is client-rendered and validates the user through mdwClient.
  // Keeping rotation there avoids racing one-time refresh tokens against this proxy.
  if (isAuthPage && (accessToken || refreshToken) && pathname !== '/reset-password') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register', '/forgot-password'],
};
