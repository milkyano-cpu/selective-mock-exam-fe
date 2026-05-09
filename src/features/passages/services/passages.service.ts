import mdwClient from '@/lib/mdwClient';
import type {
  PassageListItem,
  PassageDetail,
  CreatePassagePayload,
  UpdatePassagePayload,
  ListPassagesQuery,
  PaginatedResponse,
  SingleResponse,
  ActionResponse,
  ImportPassagesResult,
} from '../types/passages.types';

export const passagesService = {
  list: async (query?: ListPassagesQuery): Promise<PaginatedResponse<PassageListItem>> => {
    const response = await mdwClient.get('/passages', { params: query });
    return response.data;
  },

  getById: async (id: string): Promise<SingleResponse<PassageDetail>> => {
    const response = await mdwClient.get(`/passages/${id}`);
    return response.data;
  },

  create: async (payload: CreatePassagePayload): Promise<SingleResponse<PassageDetail>> => {
    const response = await mdwClient.post('/passages', payload);
    return response.data;
  },

  update: async (id: string, payload: UpdatePassagePayload): Promise<SingleResponse<PassageDetail>> => {
    const response = await mdwClient.patch(`/passages/${id}`, payload);
    return response.data;
  },

  delete: async (id: string): Promise<ActionResponse> => {
    const response = await mdwClient.delete(`/passages/${id}`);
    return response.data;
  },

  importCsv: async (file: File): Promise<SingleResponse<ImportPassagesResult>> => {
    const form = new FormData();
    form.append('file', file);
    const response = await mdwClient.post('/passages/import', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
