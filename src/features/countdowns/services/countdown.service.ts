import mdwClient from '@/lib/mdwClient';
import type {
  ActionResponse,
  ActiveCountdownResponse,
  CountdownResponse,
  CountdownsListResponse,
  CreateCountdownPayload,
  UpdateCountdownPayload,
} from '../types/countdowns.types';

export interface ListCountdownsParams {
  page?: number;
  limit?: number;
}

export const countdownService = {
  getActive: async (): Promise<ActiveCountdownResponse> => {
    const response = await mdwClient.get('/countdowns/active');
    return response.data;
  },

  list: async (params: ListCountdownsParams): Promise<CountdownsListResponse> => {
    const response = await mdwClient.get('/countdowns', { params });
    return response.data;
  },

  create: async (payload: CreateCountdownPayload): Promise<CountdownResponse> => {
    const response = await mdwClient.post('/countdowns', payload);
    return response.data;
  },

  update: async (id: string, payload: UpdateCountdownPayload): Promise<CountdownResponse> => {
    const response = await mdwClient.patch(`/countdowns/${id}`, payload);
    return response.data;
  },

  activate: async (id: string): Promise<CountdownResponse> => {
    const response = await mdwClient.patch(`/countdowns/${id}/activate`);
    return response.data;
  },

  remove: async (id: string): Promise<ActionResponse> => {
    const response = await mdwClient.delete(`/countdowns/${id}`);
    return response.data;
  },
};
