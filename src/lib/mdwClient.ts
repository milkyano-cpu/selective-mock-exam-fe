import axios from "axios";
import { generateUUID } from "./utils";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { env } from "./env";

const BASE_URL = env.appUrl || "";

export const mdwClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 30000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

mdwClient.interceptors.request.use(
  async (config) => {
    const traceId = generateUUID();
    config.headers["X-Trace-Id"] = traceId;
    // FormData requests need the browser to set Content-Type automatically
    // (it includes the multipart boundary). Removing the default JSON header
    // here prevents it from overriding the correct multipart/form-data value.
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Cross-tab refresh coordination ───────────────────────────────────────────
// BroadcastChannel lets tabs signal each other when a refresh completes.
// Problem: if two tabs both have an expired access token and both fire doRefresh()
// simultaneously, rotateRefreshToken atomically revokes the old token — the
// second tab's refresh call gets 401. Without coordination it calls clearAuth()
// and redirects spuriously. With the channel, the losing tab waits for the
// winning tab's 'done' signal, then retries its original request with the fresh
// cookies that are now in the shared browser cookie store.

const REFRESH_TIMEOUT_MS = 10_000;
const CROSS_TAB_WAIT_MS = 3_000;

const bc = typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('aspire_refresh')
  : null;

let crossTabResolvers: Array<(ok: boolean) => void> = [];
let refreshPromise: Promise<boolean> | null = null;

bc?.addEventListener('message', ({ data }: MessageEvent<{ type: 'done' | 'failed' }>) => {
  const ok = data.type === 'done';
  // If another tab refreshed successfully, reset this tab's mutex so future
  // refresh attempts start fresh (new cookies are already in the cookie store).
  if (ok) refreshPromise = null;
  // Unblock any interceptors that are waiting on a cross-tab result.
  crossTabResolvers.splice(0).forEach((fn) => fn(ok));
});

function doRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${BASE_URL}/api/auth/refresh`, {}, { withCredentials: true })
      .then((res) => {
        if (res.data.success) {
          bc?.postMessage({ type: 'done' });
          return true;
        }
        bc?.postMessage({ type: 'failed' });
        return false;
      })
      .catch((err) => {
        if (axios.isAxiosError(err) && err.response?.status === 401 && bc) {
          // A 401 on /auth/refresh most likely means another tab already rotated
          // the token. Wait briefly for that tab to broadcast 'done'.
          return new Promise<boolean>((resolve) => {
            let settled = false;

            const handler = (ok: boolean) => {
              if (settled) return;
              settled = true;
              clearTimeout(timer);
              resolve(ok);
            };

            const timer = setTimeout(() => {
              if (settled) return;
              settled = true;
              crossTabResolvers = crossTabResolvers.filter((fn) => fn !== handler);
              resolve(false);
            }, CROSS_TAB_WAIT_MS);

            crossTabResolvers.push(handler);
          });
        }
        bc?.postMessage({ type: 'failed' });
        return false;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return Promise.race([
    refreshPromise,
    new Promise<boolean>((resolve) =>
      setTimeout(() => resolve(false), REFRESH_TIMEOUT_MS)
    ),
  ]);
}

// ─────────────────────────────────────────────────────────────────────────────

mdwClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isAuthRequest =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/refresh") ||
      originalRequest.url?.includes("/auth/register");

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true;

      const refreshed = await doRefresh();

      if (refreshed) {
        return mdwClient(originalRequest);
      }

      // Refresh failed — clear local state and redirect to login.
      useAuthStore.getState().clearAuth();
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default mdwClient;
