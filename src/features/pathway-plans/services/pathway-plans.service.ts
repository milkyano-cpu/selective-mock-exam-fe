import mdwClient from '@/lib/mdwClient';
import type {
  ListPlansResponse,
  GetPlanResponse,
  CreatePlanResponse,
  UpdatePlanResponse,
  PublishPlanResponse,
  AddPlanPathwayResponse,
  ListPlansQuery,
  CreatePlanPayload,
  UpdatePlanPayload,
  AddPlanPathwayPayload,
} from '../types/pathway-plans.types';

export const pathwayPlansService = {
  list: async (query?: ListPlansQuery): Promise<ListPlansResponse> => {
    const response = await mdwClient.get('/pathway-plans', { params: query });
    return response.data;
  },

  get: async (id: string): Promise<GetPlanResponse> => {
    const response = await mdwClient.get(`/pathway-plans/${id}`);
    return response.data;
  },

  create: async (payload: CreatePlanPayload): Promise<CreatePlanResponse> => {
    const response = await mdwClient.post('/pathway-plans', payload);
    return response.data;
  },

  update: async (id: string, payload: UpdatePlanPayload): Promise<UpdatePlanResponse> => {
    const response = await mdwClient.patch(`/pathway-plans/${id}`, payload);
    return response.data;
  },

  remove: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await mdwClient.delete(`/pathway-plans/${id}`);
    return response.data;
  },

  publish: async (id: string): Promise<PublishPlanResponse> => {
    const response = await mdwClient.patch(`/pathway-plans/${id}/publish`);
    return response.data;
  },

  addPathway: async (
    planId: string,
    payload: AddPlanPathwayPayload
  ): Promise<AddPlanPathwayResponse> => {
    const response = await mdwClient.post(`/pathway-plans/${planId}/pathways`, payload);
    return response.data;
  },

  removePathway: async (
    planId: string,
    pathwayId: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await mdwClient.delete(`/pathway-plans/${planId}/pathways/${pathwayId}`);
    return response.data;
  },
};
