import mdwClient from '@/lib/mdwClient';
import type {
  CreateRubricPayload,
  ImportRubricsResult,
  ListRubricsQuery,
  PaginatedResponse,
  Rubric,
  RubricDetail,
  SingleResponse,
  UpdateRubricPayload,
} from '../types/rubrics.types';

export const rubricsService = {
  list: async (query?: ListRubricsQuery): Promise<PaginatedResponse<Rubric>> => {
    const response = await mdwClient.get('/rubrics', { params: query });
    return response.data;
  },

  getById: async (id: string): Promise<SingleResponse<RubricDetail>> => {
    const response = await mdwClient.get(`/rubrics/${id}`);
    return response.data;
  },

  create: async (payload: CreateRubricPayload): Promise<SingleResponse<RubricDetail>> => {
    const response = await mdwClient.post('/rubrics', payload);
    return response.data;
  },

  update: async (id: string, payload: UpdateRubricPayload): Promise<SingleResponse<RubricDetail>> => {
    const response = await mdwClient.patch(`/rubrics/${id}`, payload);
    return response.data;
  },

  deactivate: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await mdwClient.delete(`/rubrics/${id}`);
    return response.data;
  },

  importCsv: async (file: File): Promise<{ success: boolean; message: string; data: ImportRubricsResult }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await mdwClient.post('/rubrics/import', formData);
    return response.data;
  },
};
