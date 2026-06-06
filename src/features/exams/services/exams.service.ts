import mdwClient from '@/lib/mdwClient';
import type {
  ExamsListResponse,
  ExamResponse,
  ExamWithQuestionsResponse,
  ExamQuestionsListResponse,
  SessionResponse,
  SessionsListResponse,
  ExamSubmissionsResponse,
  ReviewSessionResponse,
  SessionResultResponse,
  SubmitAnswerResponse,
  SubmitSessionResponse,
  SessionHeartbeatResponse,
  SubmitManualGradesResponse,
  CreateExamPayload,
  UpdateExamPayload,
  AddExamQuestionsPayload,
  SubmitAnswerPayload,
  BatchAnswersPayload,
  BatchAnswersResponse,
  SubmitSessionPayload,
  SessionHeartbeatPayload,
  ManualGradePayloadItem,
  SubmitManualGradesPayload,
  ManualGradingQueueStatus,
  ExamStatus,
  PublishExamPayload,
  SessionInsightsResponse,
  StartRetakePayload,
  ExamAttemptSummaryResponse,
} from '../types/exams.types';

export interface ListExamsParams {
  page?: number;
  limit?: number;
  examType?: 'MOCK_EXAM' | 'ASSIGNMENT';
}

export interface ListExamSubmissionsParams {
  page?: number;
  limit?: number;
  status?: ManualGradingQueueStatus;
}

export const examService = {
  // ── Exam CRUD ───────────────────────────────────────────────────────────────

  list: async (params?: ListExamsParams): Promise<ExamsListResponse> => {
    const response = await mdwClient.get('/exams', { params });
    return response.data;
  },

  getWithQuestions: async (id: string): Promise<ExamWithQuestionsResponse> => {
    const response = await mdwClient.get(`/exams/${id}`);
    return response.data;
  },

  listSubmissions: async (examId: string, params?: ListExamSubmissionsParams): Promise<ExamSubmissionsResponse> => {
    const response = await mdwClient.get(`/exams/${examId}/submissions`, { params });
    return response.data;
  },

  create: async (payload: CreateExamPayload): Promise<ExamResponse> => {
    const response = await mdwClient.post('/exams', payload);
    return response.data;
  },

  update: async (id: string, payload: UpdateExamPayload): Promise<ExamResponse> => {
    const response = await mdwClient.put(`/exams/${id}`, payload);
    return response.data;
  },

  remove: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await mdwClient.delete(`/exams/${id}`);
    return response.data;
  },

  publish: async (id: string, payload: PublishExamPayload): Promise<ExamResponse> => {
    const response = await mdwClient.patch(`/exams/${id}/publish`, payload);
    return response.data;
  },

  // ── Exam Questions ──────────────────────────────────────────────────────────

  addQuestions: async (examId: string, payload: AddExamQuestionsPayload): Promise<ExamQuestionsListResponse> => {
    const response = await mdwClient.post(`/exams/${examId}/questions`, payload);
    return response.data;
  },

  removeQuestion: async (examId: string, questionId: string): Promise<{ success: boolean; message: string }> => {
    const response = await mdwClient.delete(`/exams/${examId}/questions/${questionId}`);
    return response.data;
  },

  // ── Sessions ────────────────────────────────────────────────────────────────

  startSession: async (examId: string): Promise<SessionResponse> => {
    const response = await mdwClient.post(`/exams/${examId}/sessions`);
    return response.data;
  },

  getSession: async (sessionId: string): Promise<SessionResponse> => {
    const response = await mdwClient.get(`/exams/sessions/${sessionId}`);
    return response.data;
  },

  submitAnswer: async (sessionId: string, payload: SubmitAnswerPayload): Promise<SubmitAnswerResponse> => {
    const response = await mdwClient.post(`/exams/sessions/${sessionId}/answers`, payload);
    return response.data;
  },

  batchAnswers: async (sessionId: string, payload: BatchAnswersPayload): Promise<BatchAnswersResponse> => {
    const response = await mdwClient.put(`/exams/sessions/${sessionId}/answers/batch`, payload);
    return response.data;
  },

  heartbeat: async (sessionId: string, payload: SessionHeartbeatPayload): Promise<SessionHeartbeatResponse> => {
    const response = await mdwClient.post(`/exams/sessions/${sessionId}/heartbeat`, payload);
    return response.data;
  },

  submitSession: async (sessionId: string, payload: SubmitSessionPayload): Promise<SubmitSessionResponse> => {
    const response = await mdwClient.patch(`/exams/sessions/${sessionId}/submit`, payload);
    return response.data;
  },

  getResult: async (sessionId: string): Promise<SessionResultResponse> => {
    const response = await mdwClient.get(`/exams/sessions/${sessionId}/result`);
    return response.data;
  },

  getInsights: async (sessionId: string): Promise<SessionInsightsResponse> => {
    const response = await mdwClient.get(`/exams/sessions/${sessionId}/insights`);
    return response.data;
  },

  getReviewSession: async (sessionId: string): Promise<ReviewSessionResponse> => {
    const response = await mdwClient.get(`/exams/sessions/${sessionId}/review`);
    return response.data;
  },

  submitManualGrades: async (sessionId: string, payload: SubmitManualGradesPayload): Promise<SubmitManualGradesResponse> => {
    const response = await mdwClient.patch(`/exams/sessions/${sessionId}/manual-grades`, payload);
    return response.data;
  },

  listSessions: async (params?: { page?: number; limit?: number }): Promise<SessionsListResponse> => {
    const response = await mdwClient.get('/exams/sessions', { params });
    return response.data;
  },

  // ── Retake & Attempts ──────────────────────────────────────────────────────

  startRetake: async (examId: string, payload: StartRetakePayload): Promise<SessionResponse> => {
    const response = await mdwClient.post(`/exams/${examId}/retake`, payload);
    return response.data;
  },

  getAttemptSummary: async (examId: string): Promise<ExamAttemptSummaryResponse> => {
    const response = await mdwClient.get(`/exams/${examId}/attempts`);
    return response.data;
  },
};
