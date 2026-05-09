import mdwClient from '@/lib/mdwClient';
import type {
  ActionResponse,
  CreateResourcePayload,
  ResourceResponse,
  ResourcesListResponse,
  ResourceType,
  UpdateResourcePayload,
} from '../types/resources.types';

export interface ListResourcesParams {
  page?: number;
  limit?: number;
  type?: ResourceType;
  search?: string;
}

export const resourceService = {
  list: async (params?: ListResourcesParams): Promise<ResourcesListResponse> => {
    const response = await mdwClient.get('/resources', { params });
    return response.data;
  },

  create: async (payload: CreateResourcePayload): Promise<ResourceResponse> => {
    const response = await mdwClient.post('/resources', payload);
    return response.data;
  },

  update: async (id: string, payload: UpdateResourcePayload): Promise<ResourceResponse> => {
    const response = await mdwClient.patch(`/resources/${id}`, payload);
    return response.data;
  },

  uploadFile: async (id: string, file: File): Promise<ResourceResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await mdwClient.post(`/resources/${id}/file`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  previewFile: async (id: string): Promise<Blob> => {
    const response = await mdwClient.get(`/resources/${id}/preview`, {
      responseType: 'blob',
    });
    return response.data;
  },

  remove: async (id: string): Promise<ActionResponse> => {
    const response = await mdwClient.delete(`/resources/${id}`);
    return response.data;
  },
};
