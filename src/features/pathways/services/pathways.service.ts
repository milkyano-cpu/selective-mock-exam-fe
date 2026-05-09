import mdwClient from '@/lib/mdwClient';
import type {
  ListPathwaysResponse,
  GetPathwayResponse,
  CreatePathwayResponse,
  AddNodeResponse,
  ReorderNodesResponse,
  StartPracticeResponse,
  UpdateProgressResponse,
  CreatePathwayPayload,
  AddNodePayload,
  ReorderNodesPayload,
  UpdateProgressPayload,
} from '../types/pathways.types';

export const pathwaysService = {
  list: async (studentId?: string): Promise<ListPathwaysResponse> => {
    const response = await mdwClient.get('/pathways', {
      params: studentId ? { studentId } : {},
    });
    return response.data;
  },

  get: async (id: string): Promise<GetPathwayResponse> => {
    const response = await mdwClient.get(`/pathways/${id}`);
    return response.data;
  },

  create: async (payload: CreatePathwayPayload): Promise<CreatePathwayResponse> => {
    const response = await mdwClient.post('/pathways', payload);
    return response.data;
  },

  remove: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await mdwClient.delete(`/pathways/${id}`);
    return response.data;
  },

  addNode: async (pathwayId: string, payload: AddNodePayload): Promise<AddNodeResponse> => {
    const response = await mdwClient.post(`/pathways/${pathwayId}/nodes`, payload);
    return response.data;
  },

  removeNode: async (
    pathwayId: string,
    nodeId: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await mdwClient.delete(`/pathways/${pathwayId}/nodes/${nodeId}`);
    return response.data;
  },

  reorderNodes: async (
    pathwayId: string,
    payload: ReorderNodesPayload
  ): Promise<ReorderNodesResponse> => {
    const response = await mdwClient.put(`/pathways/${pathwayId}/nodes/reorder`, payload);
    return response.data;
  },

  startPractice: async (
    pathwayId: string,
    nodeId: string
  ): Promise<StartPracticeResponse> => {
    const response = await mdwClient.post(`/pathways/${pathwayId}/nodes/${nodeId}/practice`);
    return response.data;
  },

  updateProgress: async (
    pathwayId: string,
    nodeId: string,
    payload: UpdateProgressPayload
  ): Promise<UpdateProgressResponse> => {
    const response = await mdwClient.patch(
      `/pathways/${pathwayId}/nodes/${nodeId}/progress`,
      payload
    );
    return response.data;
  },
};
