import mdwClient from '@/lib/mdwClient';

export const CSV_TEMPLATE_OPTIONS = [
  { type: 'question-mcq', label: 'Question MCQ' },
  { type: 'question-essay', label: 'Question Essay' },
  { type: 'passages', label: 'Passages' },
  { type: 'ai-rubric-criteria', label: 'AI Rubric Criteria' },
  { type: 'ai-rubric-band-descriptors', label: 'AI Rubric Band Descriptors' },
  { type: 'ai-calibration-notes', label: 'AI Calibration Notes' },
] as const;

export type CsvTemplateType = (typeof CSV_TEMPLATE_OPTIONS)[number]['type'];

export interface CsvTemplateItem {
  type: CsvTemplateType;
  label: string;
  fileName: string;
  objectKey: string;
  available: boolean;
  size: number | null;
  lastModified: string | null;
  contentType: string | null;
}

export interface CsvTemplateDownload {
  type: CsvTemplateType;
  label: string;
  fileName: string;
  url: string;
  expiresInSeconds: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const csvTemplatesService = {
  list: async (): Promise<ApiResponse<CsvTemplateItem[]>> => {
    const response = await mdwClient.get('/csv-templates');
    return response.data;
  },

  upload: async (templateType: CsvTemplateType, file: File): Promise<ApiResponse<CsvTemplateItem>> => {
    const formData = new FormData();
    formData.append('templateType', templateType);
    formData.append('file', file);

    const response = await mdwClient.post('/csv-templates', formData);
    return response.data;
  },

  getDownload: async (templateType: CsvTemplateType): Promise<ApiResponse<CsvTemplateDownload>> => {
    const response = await mdwClient.get(`/csv-templates/${templateType}/download`);
    return response.data;
  },
};
