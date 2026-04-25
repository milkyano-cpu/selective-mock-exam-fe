import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from './authCookies';
import { env } from './env';

function getCookieValue(cookieHeader: string | null, cookieName: string): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';').map((part) => part.trim());
  const found = parts.find((part) => part.startsWith(`${cookieName}=`));
  if (!found) return null;
  return decodeURIComponent(found.slice(cookieName.length + 1));
}

/**
 * Helper to fetch data from Backend via Next.js API Route (Server-Side).
 */
export async function fetchFromBackend(req: Request, path: string, options: RequestInit = {}) {
  // Trace ID propagation
  const traceId = req.headers.get("x-trace-id") || "";

  const authHeader = req.headers.get("authorization");
  const cookieHeader = req.headers.get('cookie');
  const accessTokenFromCookie = getCookieValue(cookieHeader, ACCESS_TOKEN_COOKIE);
  const refreshTokenFromCookie = getCookieValue(cookieHeader, REFRESH_TOKEN_COOKIE);

  // Build headers
  const defaultHeaders: Record<string, string> = {
    "X-Trace-Id": traceId,
    "Content-Type": "application/json",
  };

  if (authHeader) {
    defaultHeaders["Authorization"] = authHeader;
  } else if (accessTokenFromCookie) {
    defaultHeaders["Authorization"] = `Bearer ${accessTokenFromCookie}`;
  }

  // Forward the refresh token as a Cookie header matching the backend's expected
  // cookie name. The backend reads request.cookies.refresh_token on /auth/refresh.
  if (refreshTokenFromCookie) {
    defaultHeaders['Cookie'] = `refresh_token=${refreshTokenFromCookie}`;
  }

  // Merge headers
  const headers = {
    ...defaultHeaders,
    ...options.headers,
  } as Record<string, string>;

  // Send request to backend
  const url = `${env.apiUrl}${path}`;

  console.log(`[ServerBackend] ${options.method || "GET"} ${url} | TraceID: ${traceId}`);

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    return res;
  } catch (error) {
    console.error(`[ServerBackend] Network Error | TraceID: ${traceId}`, error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Gagal menghubungi Backend Server.",
        traceId,
      }),
      {
        status: 502,
        headers: {
          "Content-Type": "application/json",
          "x-trace-id": traceId,
        },
      }
    );
  }
}
