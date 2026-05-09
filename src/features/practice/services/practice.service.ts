import mdwClient from '@/lib/mdwClient';
import type {
  StartPracticePayload,
  StartWeakAreaPayload,
  SubmitPracticePayload,
  CreateAssignmentPayload,
  StartPracticeResponse,
  StartWeakAreaResponse,
  GetRecommendationsResponse,
  GetPracticeSessionResponse,
  SubmitPracticeResponse,
  ListPracticeSessionsResponse,
  PracticeAccessResponse,
  CreateAssignmentResponse,
  ListAssignmentsResponse,
  PracticeStatus,
  PracticeSourceType,
} from '../types/practice.types';

export interface ListPracticeSessionsParams {
  page?: number;
  limit?: number;
  topicId?: string;
  status?: PracticeStatus;
  sourceType?: PracticeSourceType;
}

export interface ListAssignmentsParams {
  page?: number;
  limit?: number;
  studentId?: string;
  status?: PracticeStatus;
}

export interface GetRecommendationsParams {
  threshold?: number;
  subjectId?: string;
  limit?: number;
}

export const practiceService = {
  // ── Student: self-selected ──────────────────────────────────────────────────

  getAccess: (): Promise<PracticeAccessResponse> =>
    mdwClient.get('/practice/access').then((r) => r.data),

  start: (payload: StartPracticePayload): Promise<StartPracticeResponse> =>
    mdwClient.post('/practice/sessions', payload).then((r) => r.data),

  startWeakArea: (payload: StartWeakAreaPayload): Promise<StartWeakAreaResponse> =>
    mdwClient.post('/practice/sessions/weak-area', payload).then((r) => r.data),

  getRecommendations: (params?: GetRecommendationsParams): Promise<GetRecommendationsResponse> =>
    mdwClient.get('/practice/recommendations', { params }).then((r) => r.data),

  getSession: (sessionId: string): Promise<GetPracticeSessionResponse> =>
    mdwClient.get(`/practice/sessions/${sessionId}`).then((r) => r.data),

  submit: (sessionId: string, payload: SubmitPracticePayload): Promise<SubmitPracticeResponse> =>
    mdwClient.patch(`/practice/sessions/${sessionId}/submit`, payload).then((r) => r.data),

  list: (params?: ListPracticeSessionsParams): Promise<ListPracticeSessionsResponse> =>
    mdwClient.get('/practice/sessions', { params }).then((r) => r.data),

  // ── Tutor/Admin: assignments ────────────────────────────────────────────────

  createAssignment: (payload: CreateAssignmentPayload): Promise<CreateAssignmentResponse> =>
    mdwClient.post('/practice/assignments', payload).then((r) => r.data),

  listAssignments: (params?: ListAssignmentsParams): Promise<ListAssignmentsResponse> =>
    mdwClient.get('/practice/assignments', { params }).then((r) => r.data),
};
