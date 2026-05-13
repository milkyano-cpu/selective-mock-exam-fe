import mdwClient from '@/lib/mdwClient';
import type {
  CreateAiRubricPayload,
  ImportAiRubricsResult,
  ListAiRubricsQuery,
  PaginatedResponse,
  AiRubric,
  AiRubricDetail,
  SingleResponse,
  UpdateAiRubricPayload,
} from '../types/ai-rubrics.types';

export const aiRubricsService = {
  list: async (query?: ListAiRubricsQuery): Promise<PaginatedResponse<AiRubric>> => {
    const response = await mdwClient.get('/ai-rubrics', { params: query });
    return response.data;
  },

  getById: async (id: string): Promise<SingleResponse<AiRubricDetail>> => {
    const response = await mdwClient.get(`/ai-rubrics/${id}`);
    return response.data;
  },

  create: async (payload: CreateAiRubricPayload): Promise<SingleResponse<AiRubricDetail>> => {
    const response = await mdwClient.post('/ai-rubrics', payload);
    return response.data;
  },

  update: async (id: string, payload: UpdateAiRubricPayload): Promise<SingleResponse<AiRubricDetail>> => {
    const response = await mdwClient.patch(`/ai-rubrics/${id}`, payload);
    return response.data;
  },

  deactivate: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await mdwClient.delete(`/ai-rubrics/${id}`);
    return response.data;
  },

  importCsv: async (file: File): Promise<{ success: boolean; message: string; data: ImportAiRubricsResult }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await mdwClient.post('/ai-rubrics/import', formData);
    return response.data;
  },
};
