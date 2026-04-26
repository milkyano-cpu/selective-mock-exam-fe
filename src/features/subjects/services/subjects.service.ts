import mdwClient from '@/lib/mdwClient';
import {
  Subject,
  Topic,
  CreateSubjectPayload,
  UpdateSubjectPayload,
  CreateTopicPayload,
  UpdateTopicPayload,
  PaginatedResponse,
  SingleResponse,
  ActionResponse,
  ListQuery,
} from '../types/subjects.types';

export const subjectsService = {
  // --- Subjects ---
  listSubjects: async (query?: ListQuery): Promise<PaginatedResponse<Subject>> => {
    const response = await mdwClient.get('/subjects', { params: query });
    return response.data;
  },

  getSubject: async (subjectId: string): Promise<SingleResponse<Subject>> => {
    const response = await mdwClient.get(`/subjects/${subjectId}`);
    return response.data;
  },

  createSubject: async (payload: CreateSubjectPayload): Promise<SingleResponse<Subject>> => {
    const response = await mdwClient.post('/subjects', payload);
    return response.data;
  },

  updateSubject: async (subjectId: string, payload: UpdateSubjectPayload): Promise<SingleResponse<Subject>> => {
    const response = await mdwClient.put(`/subjects/${subjectId}`, payload);
    return response.data;
  },

  deleteSubject: async (subjectId: string): Promise<ActionResponse> => {
    const response = await mdwClient.delete(`/subjects/${subjectId}`);
    return response.data;
  },

  // --- Topics ---
  listTopics: async (subjectId: string, query?: ListQuery): Promise<PaginatedResponse<Topic>> => {
    const response = await mdwClient.get(`/subjects/${subjectId}/topics`, { params: query });
    return response.data;
  },

  getTopic: async (subjectId: string, topicId: string): Promise<SingleResponse<Topic>> => {
    const response = await mdwClient.get(`/subjects/${subjectId}/topics/${topicId}`);
    return response.data;
  },

  createTopic: async (subjectId: string, payload: CreateTopicPayload): Promise<SingleResponse<Topic>> => {
    const response = await mdwClient.post(`/subjects/${subjectId}/topics`, payload);
    return response.data;
  },

  updateTopic: async (subjectId: string, topicId: string, payload: UpdateTopicPayload): Promise<SingleResponse<Topic>> => {
    const response = await mdwClient.put(`/subjects/${subjectId}/topics/${topicId}`, payload);
    return response.data;
  },

  deleteTopic: async (subjectId: string, topicId: string): Promise<ActionResponse> => {
    const response = await mdwClient.delete(`/subjects/${subjectId}/topics/${topicId}`);
    return response.data;
  },
};
