import { NextResponse } from 'next/server';
import { fetchFromBackend } from './serverBackend';
import { clearAuthCookies, setAuthCookies } from './authCookies';

// Extracts a cookie value from the backend's Set-Cookie response headers.
// The backend sets httpOnly cookies directly; we read the values here to
// re-set them as the frontend's own aspire_* httpOnly cookies on the browser.
function extractFromSetCookie(headers: Headers, cookieName: string): string | undefined {
  const setCookieHeaders: string[] =
    typeof (headers as unknown as { getSetCookie?: () => string[] }).getSetCookie === 'function'
      ? (headers as unknown as { getSetCookie: () => string[] }).getSetCookie()
      : [headers.get('set-cookie') ?? ''].filter(Boolean);

  for (const header of setCookieHeaders) {
    const [nameValue] = header.split(';');
    if (!nameValue) continue;
    const eqIdx = nameValue.indexOf('=');
    if (eqIdx === -1) continue;
    const name = nameValue.slice(0, eqIdx).trim();
    const value = nameValue.slice(eqIdx + 1).trim();
    if (name === cookieName && value) return value;
  }
  return undefined;
}

export async function handleAuthProxy(req: Request, path: string, body?: unknown) {
  const backendRes = await fetchFromBackend(req, path, {
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const data = await backendRes.json().catch(() => ({} as Record<string, unknown>));
  const normalized = (data.data ?? data) as Record<string, unknown>;

  // Tokens are delivered via the backend's Set-Cookie headers, not the response body.
  const accessToken = extractFromSetCookie(backendRes.headers, 'access_token');
  const refreshToken = extractFromSetCookie(backendRes.headers, 'refresh_token');

  const response = NextResponse.json(
    {
      success: backendRes.ok,
      message:
        (data.message as string | undefined) ||
        (backendRes.ok ? 'Request succeeded' : 'Request failed'),
      data: normalized,
    },
    { status: backendRes.status }
  );

  if (backendRes.ok && (accessToken || refreshToken)) {
    setAuthCookies(response, accessToken, refreshToken);
  }

  return response;
}

export function handleAuthProxyError(scope: string, err: unknown) {
  console.error(`[${scope}] ERROR:`, err);
  return NextResponse.json(
    {
      success: false,
      message: 'Internal Server Error',
      data: {},
    },
    { status: 500 }
  );
}

export function handleLogoutResponse(response: NextResponse) {
  clearAuthCookies(response);
  return response;
}
