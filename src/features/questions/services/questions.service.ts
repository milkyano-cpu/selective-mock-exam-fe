import mdwClient from '@/lib/mdwClient';
import type {
  Question,
  CreateQuestionPayload,
  UpdateQuestionPayload,
  RejectQuestionPayload,
  PaginatedResponse,
  SingleResponse,
  ActionResponse,
  BulkImportResponse,
  BulkSubmitResponse,
  ListQuestionsQuery,
  ResolveImportResponse,
  UnresolvedRowItem,
} from '../types/questions.types';

export const questionsService = {
  list: async (query?: ListQuestionsQuery): Promise<PaginatedResponse<Question>> => {
    const response = await mdwClient.get('/questions', { params: query });
    return response.data;
  },

  getById: async (id: string): Promise<SingleResponse<Question>> => {
    const response = await mdwClient.get(`/questions/${id}`);
    return response.data;
  },

  create: async (payload: CreateQuestionPayload): Promise<SingleResponse<Question>> => {
    const response = await mdwClient.post('/questions', payload);
    return response.data;
  },

  update: async (id: string, payload: UpdateQuestionPayload): Promise<SingleResponse<Question>> => {
    const response = await mdwClient.put(`/questions/${id}`, payload);
    return response.data;
  },

  delete: async (id: string): Promise<ActionResponse> => {
    const response = await mdwClient.delete(`/questions/${id}`);
    return response.data;
  },

  submit: async (id: string): Promise<SingleResponse<Question>> => {
    const response = await mdwClient.patch(`/questions/${id}/submit`, {});
    return response.data;
  },

  approve: async (id: string): Promise<SingleResponse<Question>> => {
    const response = await mdwClient.patch(`/questions/${id}/approve`, {});
    return response.data;
  },

  reject: async (id: string, payload: RejectQuestionPayload): Promise<SingleResponse<Question>> => {
    const response = await mdwClient.patch(`/questions/${id}/reject`, payload);
    return response.data;
  },

  import: async (file: File): Promise<BulkImportResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await mdwClient.post('/questions/import', formData);
    return response.data;
  },

  resolveImport: async (rows: UnresolvedRowItem[]): Promise<ResolveImportResponse> => {
    const response = await mdwClient.post('/questions/import/resolve', { rows });
    return response.data;
  },

  submitMany: async (ids: string[]): Promise<BulkSubmitResponse> => {
    const response = await mdwClient.patch('/questions/submit/bulk', { ids });
    return response.data;
  },

  uploadQuestionImage: async (questionId: string, file: File): Promise<SingleResponse<Question>> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await mdwClient.post(`/questions/${questionId}/image`, formData);
    return response.data;
  },

  getNextId: async (subjectId: string): Promise<{ success: true; data: { questionId: string } }> => {
    const response = await mdwClient.get('/questions/next-id', { params: { subjectId } });
    return response.data;
  },
};
