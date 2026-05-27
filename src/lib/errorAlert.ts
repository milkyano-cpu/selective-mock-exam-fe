import { isAxiosError } from 'axios';
import type { User } from '@/features/auth/types';

type ViewerRole = User['role'] | undefined;
export type FeedbackContext =
  | 'login'
  | 'session'
  | 'load'
  | 'options'
  | 'save'
  | 'delete'
  | 'submit'
  | 'download'
  | 'request';
export type ErrorAlertContext = FeedbackContext;

interface MessageBody {
  message?: string;
  error?: string;
}

interface ErrorAlertOptions {
  context?: FeedbackContext;
}

export type FeedbackIcon = 'success' | 'warning' | 'error';

export interface FeedbackContent {
  icon: FeedbackIcon;
  title: string;
  description: string;
  statusCode?: number | 'NO_RESPONSE';
}

export interface FeedbackNotice extends FeedbackContent {
  key: string;
  duration: number;
}

const DEDUPE_WINDOW_MS = 1500;
const PENDING_FEEDBACK_KEY = 'aspire.pendingFeedback';
export const FEEDBACK_EVENT_NAME = 'aspire:feedback';
const TOAST_DURATION: Record<FeedbackIcon, number> = {
  success: 3000,
  warning: 5000,
  error: 6000,
};
const originalErrorMessages = new WeakMap<object, string>();

let lastToastKey = '';
let lastToastAt = 0;

function isStaff(role: ViewerRole): boolean {
  return role === 'ADMIN' || role === 'TUTOR';
}

function getServerMessage(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined;

  const body = data as MessageBody;
  if (typeof body.message === 'string' && body.message.trim()) {
    return body.message;
  }
  if (typeof body.error === 'string' && body.error.trim()) {
    return body.error;
  }
  return undefined;
}

function errorFeedback(
  status: number | undefined,
  role: ViewerRole,
  context: FeedbackContext
): FeedbackContent {
  const staff = isStaff(role);

  if (context === 'login' && status === 401) {
    return {
      icon: 'error',
      title: "Couldn't sign in",
      description: 'Please check your email and password, then try again.',
    };
  }
  if (context === 'session' || status === 401) {
    return {
      icon: 'error',
      title: 'Session expired',
      description: staff
        ? 'Your session has expired. Please log in again.'
        : 'Please log in again to continue.',
    };
  }
  if (status === undefined) {
    return {
      icon: 'error',
      title: staff ? 'Network error' : 'No connection',
      description: staff
        ? 'Request failed due to a network issue. Please check your connection.'
        : 'Please check your internet connection and try again.',
    };
  }
  if (status === 403) {
    return {
      icon: 'error',
      title: staff ? 'Access denied' : 'Access restricted',
      description: staff
        ? "You don't have permission to perform this action."
        : "You don't have permission to do this.",
    };
  }
  if (status === 404) {
    return {
      icon: 'error',
      title: 'Not found',
      description: staff
        ? 'The requested resource could not be found.'
        : 'This content is no longer available.',
    };
  }
  if (status >= 500) {
    return {
      icon: 'error',
      title: staff ? 'Server error' : 'Something went wrong',
      description: staff
        ? 'An unexpected error occurred on the server. Please try again shortly.'
        : 'Our system encountered an error. Please try again in a moment.',
    };
  }

  if (context === 'options') {
    return {
      icon: 'error',
      title: staff ? 'Failed to load options' : 'Something went wrong',
      description: staff
        ? "Some form fields couldn't be loaded. Please refresh and try again."
        : "We couldn't load this form. Please refresh and try again.",
    };
  }
  if (context === 'load') {
    return {
      icon: 'error',
      title: staff ? 'Failed to load data' : 'Something went wrong',
      description: staff
        ? 'Unable to fetch the required data. Please refresh or try again.'
        : "We couldn't load this page. Please refresh and try again.",
    };
  }
  if (context === 'delete') {
    return {
      icon: 'error',
      title: staff ? 'Failed to delete' : "Couldn't complete the action",
      description: staff
        ? 'The item could not be deleted. Please try again.'
        : 'Please try again or contact support.',
    };
  }
  if (context === 'save' || context === 'submit') {
    return {
      icon: 'error',
      title: staff ? 'Failed to save' : "Couldn't save your changes",
      description: staff
        ? 'Your changes could not be saved. Please check your input and try again.'
        : 'Something went wrong. Please try again.',
    };
  }

  return {
    icon: 'error',
    title: 'Something went wrong',
    description: 'We could not complete your request. Please try again.',
  };
}

function apiErrorFeedback(
  status: number | undefined,
  role: ViewerRole,
  context: FeedbackContext,
  serverMessage?: string
): FeedbackContent {
  const feedback = errorFeedback(status, role, context);

  if (!isStaff(role)) {
    return feedback;
  }

  return {
    ...feedback,
    description: serverMessage ?? feedback.description,
    statusCode: status ?? 'NO_RESPONSE',
  };
}

function successFeedback(context: FeedbackContext): FeedbackContent {
  switch (context) {
    case 'delete':
      return {
        icon: 'success',
        title: 'Deleted successfully',
        description: 'The item has been removed.',
      };
    case 'submit':
      return {
        icon: 'success',
        title: 'Submitted successfully',
        description: 'Your submission has been received.',
      };
    case 'download':
      return {
        icon: 'success',
        title: 'Download ready',
        description: 'Your file is ready to download.',
      };
    case 'login':
      return {
        icon: 'success',
        title: 'Signed in successfully',
        description: 'Welcome back.',
      };
    default:
      return {
        icon: 'success',
        title: 'Saved successfully',
        description: 'Your changes have been saved.',
      };
  }
}

function warningFeedback(): FeedbackContent {
  return {
    icon: 'warning',
    title: 'Saved with warnings',
    description: 'Some items could not be processed. Please review and try again.',
  };
}

async function fireFeedbackToast(content: FeedbackContent, key: string): Promise<void> {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  if (key === lastToastKey && now - lastToastAt < DEDUPE_WINDOW_MS) {
    return;
  }
  lastToastKey = key;
  lastToastAt = now;

  window.dispatchEvent(
    new CustomEvent<FeedbackNotice>(FEEDBACK_EVENT_NAME, {
      detail: {
        ...content,
        key,
        duration: TOAST_DURATION[content.icon],
      },
    })
  );
}

export function getOriginalApiErrorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;

  return originalErrorMessages.get(error) ??
    (isAxiosError(error) ? getServerMessage(error.response?.data) : undefined);
}

export function redactApiErrorForRole(
  error: unknown,
  role: ViewerRole,
  context: FeedbackContext = 'request'
): void {
  if (!isAxiosError(error)) {
    return;
  }

  const feedback = errorFeedback(error.response?.status, role, context);
  if (error.response?.data && typeof error.response.data === 'object') {
    const body = error.response.data as MessageBody;
    const serverMessage = getServerMessage(body);
    if (serverMessage && error && typeof error === 'object') {
      originalErrorMessages.set(error, serverMessage);
    }
    body.message = feedback.description;
    delete body.error;
  }
  error.message = feedback.description;
}

export function redactResponseForRole(
  data: unknown,
  status: number | undefined,
  role: ViewerRole,
  context: FeedbackContext = 'request'
): void {
  if (!data || typeof data !== 'object') return;

  const body = data as MessageBody;
  body.message = errorFeedback(status, role, context).description;
  delete body.error;
}

export async function showApiErrorAlert(
  error: unknown,
  role: ViewerRole,
  { context = 'request' }: ErrorAlertOptions = {}
): Promise<void> {
  const status = isAxiosError(error) ? error.response?.status : undefined;
  const serverMessage = isAxiosError(error) ? getServerMessage(error.response?.data) : undefined;
  const feedback = apiErrorFeedback(status, role, context, serverMessage);
  await fireFeedbackToast(feedback, `error:${role ?? 'PUBLIC'}:${context}:${status ?? 'network'}`);
}

export async function showApiResponseErrorAlert(
  status: number | undefined,
  data: unknown,
  role: ViewerRole,
  { context = 'request' }: ErrorAlertOptions = {}
): Promise<void> {
  const feedback = apiErrorFeedback(status, role, context, getServerMessage(data));
  await fireFeedbackToast(feedback, `error:${role ?? 'PUBLIC'}:${context}:${status ?? 'response'}`);
}

export async function showApiSuccessToast(context: FeedbackContext): Promise<void> {
  const feedback = successFeedback(context);
  await fireFeedbackToast(feedback, `success:${context}`);
}

export async function showApiWarningToast(): Promise<void> {
  const feedback = warningFeedback();
  await fireFeedbackToast(feedback, 'warning:partial');
}

export async function showClientErrorAlert(
  description: string,
  title = 'Something went wrong'
): Promise<void> {
  await fireFeedbackToast({ icon: 'error', title, description }, `client:${title}:${description}`);
}

export async function showClientWarningToast(
  description: string,
  title = 'Action needs attention'
): Promise<void> {
  await fireFeedbackToast({ icon: 'warning', title, description }, `client-warning:${title}:${description}`);
}

export async function showDataOutdatedToast(): Promise<void> {
  await fireFeedbackToast(
    {
      icon: 'warning',
      title: 'Data may be outdated',
      description: 'Please refresh to see the latest updates.',
    },
    'warning:data-outdated'
  );
}

export async function showSessionExpiringToast(): Promise<void> {
  await fireFeedbackToast(
    {
      icon: 'warning',
      title: 'Session expiring soon',
      description: "You'll be logged out shortly. Please save your work.",
    },
    'warning:session-expiring'
  );
}

export function queueSessionExpiredToast(role: ViewerRole): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(PENDING_FEEDBACK_KEY, JSON.stringify(apiErrorFeedback(401, role, 'session')));
  } catch {
    // Storage can be unavailable in privacy-restricted browsers.
  }
}

export async function showPendingFeedbackToast(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const stored = sessionStorage.getItem(PENDING_FEEDBACK_KEY);
    if (!stored) return;

    sessionStorage.removeItem(PENDING_FEEDBACK_KEY);
    const content = JSON.parse(stored) as FeedbackContent;
    if (content.icon && content.title && content.description) {
      await fireFeedbackToast(content, `pending:${content.icon}:${content.title}`);
    }
  } catch {
    // Invalid or unavailable storage should not interrupt rendering.
  }
}
