import axios from "axios";
import { generateUUID } from "./utils";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { env } from "./env";
import {
  getOriginalApiErrorMessage,
  redactApiErrorForRole,
  redactResponseForRole,
  showApiErrorAlert,
  showApiResponseErrorAlert,
  showApiSuccessToast,
  showApiWarningToast,
  queueSessionExpiredToast,
  type ErrorAlertContext,
} from "./errorAlert";

const BASE_URL = env.appUrl || "";

export interface MdwRequestOptions {
  feedbackContext?: ErrorAlertContext;
  suppressNotFoundToast?: boolean;
}

export function buildFeedbackHeaders(options?: MdwRequestOptions): Record<string, string> | undefined {
  if (!options?.feedbackContext && !options?.suppressNotFoundToast) return undefined;
  const headers: Record<string, string> = {};
  if (options.feedbackContext) headers['x-feedback-context'] = options.feedbackContext;
  if (options.suppressNotFoundToast) headers['x-suppress-not-found-toast'] = 'true';
  return headers;
}

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
const CROSS_TAB_SUCCESS_GRACE_MS = 5_000;
type RefreshOutcome = 'refreshed' | 'rejected' | 'forbidden' | 'unavailable';
interface RefreshResult {
  outcome: RefreshOutcome;
  error?: unknown;
}
interface RefreshCompletedMessage {
  type: 'done';
  accessTokenExpiresAt?: string;
  sessionExpiresAt?: string;
}
type RefreshMessage = RefreshCompletedMessage | { type: 'failed' };

const bc = typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('aspire_refresh')
  : null;

let crossTabResolvers: Array<(ok: boolean) => void> = [];
let refreshPromise: Promise<RefreshResult> | null = null;
let lastCrossTabSuccessAt = 0;

function syncAuthExpiryState(data: {
  accessTokenExpiresAt?: unknown;
  sessionExpiresAt?: unknown;
}) {
  if (typeof data.accessTokenExpiresAt === 'string' && data.accessTokenExpiresAt) {
    useAuthStore.getState().setAccessTokenExpiry(data.accessTokenExpiresAt);
  }
  if (typeof data.sessionExpiresAt === 'string' && data.sessionExpiresAt) {
    useAuthStore.getState().setSessionExpiry(data.sessionExpiresAt);
  }
}

bc?.addEventListener('message', ({ data }: MessageEvent<RefreshMessage>) => {
  if (data.type !== 'done') return;

  syncAuthExpiryState(data);
  lastCrossTabSuccessAt = Date.now();
  // Unblock any interceptors waiting for the fresh cookies in shared storage.
  crossTabResolvers.splice(0).forEach((fn) => fn(true));
});

function waitForCrossTabSuccess(): Promise<boolean> {
  if (Date.now() - lastCrossTabSuccessAt <= CROSS_TAB_SUCCESS_GRACE_MS) {
    return Promise.resolve(true);
  }

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

    if (bc) {
      crossTabResolvers.push(handler);
    }
  });
}

function doRefresh(): Promise<RefreshResult> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${BASE_URL}/api/auth/refresh`, {}, { withCredentials: true })
      .then((res) => {
        if (res.data.success) {
          const expiryState = {
            accessTokenExpiresAt: res.data?.data?.accessTokenExpiresAt,
            sessionExpiresAt: res.data?.data?.sessionExpiresAt,
          };
          syncAuthExpiryState(expiryState);
          bc?.postMessage({ type: 'done', ...expiryState } satisfies RefreshCompletedMessage);
          return { outcome: 'refreshed' as const };
        }
        return { outcome: 'rejected' as const };
      })
      .catch(async (err) => {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          // A 401 on /auth/refresh most likely means another tab already rotated
          // the token. Wait briefly for that tab to broadcast 'done'.
          if (await waitForCrossTabSuccess()) {
            return { outcome: 'refreshed' as const };
          }
          return { outcome: 'rejected' as const, error: err };
        }
        if (axios.isAxiosError(err) && err.response?.status === 403) {
          return { outcome: 'forbidden' as const, error: err };
        }
        return { outcome: 'unavailable' as const, error: err };
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return Promise.race([
    refreshPromise,
    new Promise<RefreshResult>((resolve) =>
      setTimeout(
        () => resolve({ outcome: 'unavailable', error: new Error('Authentication refresh timed out') }),
        REFRESH_TIMEOUT_MS
      )
    ),
  ]);
}

// ─────────────────────────────────────────────────────────────────────────────

const VALID_FEEDBACK_CONTEXTS: ErrorAlertContext[] = [
  'login', 'session', 'load', 'options', 'save', 'delete', 'submit', 'download', 'request',
];

function readFeedbackContextHeader(headers: unknown): ErrorAlertContext | undefined {
  if (!headers || typeof headers !== 'object') return undefined;
  const raw = (headers as Record<string, unknown>)['x-feedback-context']
    ?? (headers as Record<string, unknown>)['X-Feedback-Context'];
  if (typeof raw !== 'string') return undefined;
  return VALID_FEEDBACK_CONTEXTS.includes(raw as ErrorAlertContext)
    ? (raw as ErrorAlertContext)
    : undefined;
}

function getAlertContext(
  url: string | undefined,
  method: string | undefined,
  isExpiredSession = false,
  headers?: unknown
): ErrorAlertContext {
  const normalizedMethod = method?.toUpperCase() ?? 'GET';

  if (isExpiredSession) return 'session';

  const headerOverride = readFeedbackContextHeader(headers);
  if (headerOverride) return headerOverride;

  if (url?.includes('/auth/login')) return 'login';
  if (normalizedMethod === 'DELETE') return 'delete';
  if (normalizedMethod === 'GET') {
    return url?.includes('/download') ? 'download' : 'load';
  }
  if (
    url?.includes('/submit') ||
    url?.includes('/approve') ||
    url?.includes('/reject') ||
    url?.includes('/publish') ||
    url?.includes('/flag') ||
    url?.includes('/review')
  ) {
    return 'submit';
  }
  return 'save';
}

function isHandledWorkflowError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;

  const url = error.config?.url ?? '';
  const message = getOriginalApiErrorMessage(error)?.toLowerCase() ?? '';

  return (
    (url.includes('/exams/sessions/') && url.includes('/result') && message.includes('in progress')) ||
    (url.includes('/exams/') && url.includes('/sessions') && message.includes('already submitted'))
  );
}

function isHandledWorkflowResponse(url: string | undefined, data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;

  const message = String((data as { message?: string }).message ?? '').toLowerCase();
  return Boolean(url?.includes('/exams/sessions/') && url.includes('/result') && message.includes('in progress'));
}

function isQuietBackgroundRequest(url: string | undefined): boolean {
  return Boolean(
    url?.includes('/auth/refresh') ||
    url?.includes('/auth/logout') ||
    url?.includes('/heartbeat') ||
    url?.includes('/answers') ||
    url?.includes('/student-calendar/reminders/bulk') ||
    (url?.includes('/resources/') && url?.includes('/stream-url'))
  );
}

function hasPartialOutcome(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;

  const result = 'data' in data && data.data && typeof data.data === 'object'
    ? data.data as Record<string, unknown>
    : data as Record<string, unknown>;

  return (
    (Array.isArray(result.errors) && result.errors.length > 0) ||
    (Array.isArray(result.skippedErrors) && result.skippedErrors.length > 0) ||
    (Array.isArray(result.failures) && result.failures.length > 0) ||
    (Array.isArray(result.failedIds) && result.failedIds.length > 0) ||
    (typeof result.failed === 'number' && result.failed > 0) ||
    (typeof result.skipped === 'number' && result.skipped > 0) ||
    (typeof result.unresolved === 'number' && result.unresolved > 0) ||
    (Array.isArray(result.stillUnresolved) && result.stillUnresolved.length > 0)
  );
}

function hasInteractiveSuccess(url: string | undefined, method: string | undefined): boolean {
  const normalizedMethod = method?.toUpperCase() ?? 'GET';

  if (isQuietBackgroundRequest(url)) return false;
  if (url?.includes('/auth/login') || url?.includes('/auth/register')) return false;
  if (
    normalizedMethod === 'POST' &&
    (url === '/resources' || Boolean(url?.includes('/resources/') && url?.includes('/file')))
  ) {
    return false;
  }
  // Billing endpoints return a Stripe redirect URL — they are not save actions,
  // so the success outcome belongs to Stripe, not us. Suppress the generic toast.
  // Covers both student (/billing/checkout, /billing/portal) and parent
  // (/billing/parent/checkout, /billing/parent/portal) variants.
  if (
    normalizedMethod === 'POST' &&
    (
      url?.includes('/billing/checkout') ||
      url?.includes('/billing/portal') ||
      url?.includes('/billing/parent/checkout') ||
      url?.includes('/billing/parent/portal')
    )
  ) {
    return false;
  }
  // Notification read-state mutations are passive UI side effects triggered by
  // clicking a notification. Showing "Saved successfully" there is misleading.
  if (
    normalizedMethod === 'PATCH' &&
    (Boolean(url?.match(/\/notifications\/[^/]+\/read$/)) || url?.includes('/notifications/read-all'))
  ) {
    return false;
  }
  // Exam session lifecycle actions (start, retake, submit) navigate the user to
  // the next page (exam runner / result page). The destination page is itself
  // the confirmation, so a toast on top of that is redundant noise.
  if (
    normalizedMethod === 'POST' &&
    (Boolean(url?.match(/\/exams\/[^/]+\/sessions$/)) ||
      Boolean(url?.match(/\/exams\/[^/]+\/retake$/)))
  ) {
    return false;
  }
  if (
    normalizedMethod === 'PATCH' &&
    Boolean(url?.match(/\/exams\/sessions\/[^/]+\/submit$/))
  ) {
    return false;
  }
  if (normalizedMethod === 'GET') return Boolean(url?.includes('/download'));
  return true;
}

async function rejectWithVisibleError(
  error: unknown,
  context: ErrorAlertContext = 'request'
): Promise<never> {
  const url = axios.isAxiosError(error) ? error.config?.url : undefined;
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  const headers = axios.isAxiosError(error) ? error.config?.headers : undefined;
  const suppressBackgroundError = context !== 'session' && isQuietBackgroundRequest(url);
  const suppressForbidden = status === 403;
  const suppressNotFound =
    status === 404 &&
    headers &&
    typeof headers === 'object' &&
    ((headers as Record<string, unknown>)['x-suppress-not-found-toast'] === 'true' ||
      (headers as Record<string, unknown>)['X-Suppress-Not-Found-Toast'] === 'true');

  if (
    !axios.isCancel(error)
    && !isHandledWorkflowError(error)
    && !suppressBackgroundError
    && !suppressForbidden
    && !suppressNotFound
  ) {
    const role = useAuthStore.getState().user?.role;
    await showApiErrorAlert(error, role, { context });
    redactApiErrorForRole(error, role, context);
  }

  return Promise.reject(error);
}

function clearSessionAndRedirect(): void {
  queueSessionExpiredToast(useAuthStore.getState().user?.role);
  useAuthStore.getState().clearAuth();
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.replace("/api/auth/logout");
  }
}

mdwClient.interceptors.response.use(
  async (response) => {
    const isQuietError =
      isQuietBackgroundRequest(response.config.url) ||
      isHandledWorkflowResponse(response.config.url, response.data);
    const context = getAlertContext(
      response.config.url,
      response.config.method,
      false,
      response.config.headers
    );

    if (response.data?.success === false && !isQuietError && response.status !== 403) {
      const role = useAuthStore.getState().user?.role;
      await showApiResponseErrorAlert(response.status, response.data, role, { context });
      redactResponseForRole(response.data, response.status, role, context);
    } else if (!isQuietError && hasInteractiveSuccess(response.config.url, response.config.method)) {
      if (hasPartialOutcome(response.data)) {
        await showApiWarningToast();
      } else {
        await showApiSuccessToast(context);
      }
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    const isAuthRequest =
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/refresh") ||
      originalRequest?.url?.includes("/auth/register");
    const isLogoutRequest = originalRequest?.url?.includes("/auth/logout");

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true;

      const refreshResult = await doRefresh();

      if (refreshResult.outcome === 'forbidden') {
        await rejectWithVisibleError(refreshResult.error ?? error, 'session').catch(() => undefined);
        clearSessionAndRedirect();
        return Promise.reject(refreshResult.error ?? error);
      }

      if (refreshResult.outcome === 'unavailable') {
        return rejectWithVisibleError(refreshResult.error ?? error);
      }

      if (refreshResult.outcome === 'refreshed' || refreshResult.outcome === 'rejected') {
        try {
          // A different tab can rotate a shared cookie even where
          // BroadcastChannel is unavailable; the retry confirms the session.
          return await mdwClient(originalRequest);
        } catch (retryError) {
          if (axios.isAxiosError(retryError) && retryError.response?.status === 401) {
            clearSessionAndRedirect();
          }
          return Promise.reject(retryError);
        }
      }
    }

    if (isLogoutRequest) {
      return Promise.reject(error);
    }

    const expiredSession = error.response?.status === 401 && Boolean(originalRequest?._retry) && !isAuthRequest;
    return rejectWithVisibleError(
      error,
      getAlertContext(originalRequest?.url, originalRequest?.method, expiredSession, originalRequest?.headers)
    );
  }
);

export default mdwClient;
