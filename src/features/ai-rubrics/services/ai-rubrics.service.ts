import mdwClient, { buildFeedbackHeaders, type MdwRequestOptions } from '@/lib/mdwClient';
import type {
  AiCalibrationNote,
  AiCalibrationNoteInput,
  AiRubric,
  AiRubricBandDescriptor,
  AiRubricBandDescriptorInput,
  AiRubricCriterion,
  AiRubricCriterionInput,
  AiRubricDetail,
  CreateAiRubricPayload,
  ImportAiRubricsResult,
  ListAiRubricsQuery,
  PaginatedResponse,
  SingleResponse,
  UpdateAiRubricPayload,
} from '../types/ai-rubrics.types';

type ImportResponse = { success: boolean; message: string; data: ImportAiRubricsResult };

function csvFormData(file: File): FormData {
  const fd = new FormData();
  fd.append('file', file);
  return fd;
}

export const aiRubricsService = {
  list: async (query?: ListAiRubricsQuery, options?: MdwRequestOptions): Promise<PaginatedResponse<AiRubric>> => {
    const response = await mdwClient.get('/ai-rubrics', { params: query, headers: buildFeedbackHeaders(options) });
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

  // ── Criteria ──────────────────────────────────────────────────────────────
  createCriterion: async (rubricId: string, payload: AiRubricCriterionInput): Promise<SingleResponse<AiRubricCriterion>> => {
    const response = await mdwClient.post(`/ai-rubrics/${rubricId}/criteria`, payload);
    return response.data;
  },
  updateCriterion: async (rubricId: string, criterionId: string, payload: Partial<AiRubricCriterionInput>): Promise<SingleResponse<AiRubricCriterion>> => {
    const response = await mdwClient.patch(`/ai-rubrics/${rubricId}/criteria/${criterionId}`, payload);
    return response.data;
  },
  deleteCriterion: async (rubricId: string, criterionId: string): Promise<{ success: boolean; message: string }> => {
    const response = await mdwClient.delete(`/ai-rubrics/${rubricId}/criteria/${criterionId}`);
    return response.data;
  },
  importCriteriaCsv: async (file: File): Promise<ImportResponse> => {
    const response = await mdwClient.post(`/ai-rubrics/import/criteria`, csvFormData(file));
    return response.data;
  },

  // ── Band Descriptors ─────────────────────────────────────────────────────
  createBand: async (rubricId: string, payload: AiRubricBandDescriptorInput): Promise<SingleResponse<AiRubricBandDescriptor>> => {
    const response = await mdwClient.post(`/ai-rubrics/${rubricId}/bands`, payload);
    return response.data;
  },
  updateBand: async (rubricId: string, bandId: string, payload: Partial<AiRubricBandDescriptorInput>): Promise<SingleResponse<AiRubricBandDescriptor>> => {
    const response = await mdwClient.patch(`/ai-rubrics/${rubricId}/bands/${bandId}`, payload);
    return response.data;
  },
  deleteBand: async (rubricId: string, bandId: string): Promise<{ success: boolean; message: string }> => {
    const response = await mdwClient.delete(`/ai-rubrics/${rubricId}/bands/${bandId}`);
    return response.data;
  },
  importBandsCsv: async (file: File): Promise<ImportResponse> => {
    const response = await mdwClient.post(`/ai-rubrics/import/bands`, csvFormData(file));
    return response.data;
  },

  // ── Calibration Notes ────────────────────────────────────────────────────
  createCalibrationNote: async (rubricId: string, payload: AiCalibrationNoteInput): Promise<SingleResponse<AiCalibrationNote>> => {
    const response = await mdwClient.post(`/ai-rubrics/${rubricId}/calibration-notes`, payload);
    return response.data;
  },
  updateCalibrationNote: async (rubricId: string, noteId: string, payload: Partial<AiCalibrationNoteInput>): Promise<SingleResponse<AiCalibrationNote>> => {
    const response = await mdwClient.patch(`/ai-rubrics/${rubricId}/calibration-notes/${noteId}`, payload);
    return response.data;
  },
  deleteCalibrationNote: async (rubricId: string, noteId: string): Promise<{ success: boolean; message: string }> => {
    const response = await mdwClient.delete(`/ai-rubrics/${rubricId}/calibration-notes/${noteId}`);
    return response.data;
  },
  importCalibrationNotesCsv: async (file: File): Promise<ImportResponse> => {
    const response = await mdwClient.post(`/ai-rubrics/import/calibration-notes`, csvFormData(file));
    return response.data;
  },
};
