export type AiRubric = {
  id: string;
  name: string;
  description: string | null;
  writingType: string | null;
  isDefault: boolean;
  isActive: boolean;
  totalMaxScore: number;
  createdAt: string;
  updatedAt: string;
};

export type AiRubricBandDescriptor = {
  id: string;
  criterionId: string;
  scoreMin: number;
  scoreMax: number;
  descriptor: string;
  createdAt: string;
  updatedAt: string;
};

export type AiRubricCriterion = {
  id: string;
  aiRubricId: string;
  criterionName: string;
  criterionDescription: string;
  maxScore: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  bandDescriptors?: AiRubricBandDescriptor[];
};

export type AiRubricDetail = AiRubric & {
  criteria: AiRubricCriterion[];
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  success: boolean;
  message: string;
  data: T[];
  meta: PaginationMeta;
};

export type SingleResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type ListAiRubricsQuery = {
  page?: number;
  limit?: number;
  search?: string;
  activeOnly?: boolean;
};

export type AiRubricBandDescriptorInput = {
  scoreMin: number;
  scoreMax: number;
  descriptor: string;
};

export type AiRubricCriterionInput = {
  criterionName: string;
  criterionDescription: string;
  maxScore: number;
  sortOrder?: number;
  bandDescriptors?: AiRubricBandDescriptorInput[];
};

export type CreateAiRubricPayload = {
  id: string;
  name: string;
  description?: string | null;
  writingType?: string | null;
  isDefault?: boolean;
  isActive?: boolean;
  totalMaxScore: number;
  criteria?: AiRubricCriterionInput[];
};

export type UpdateAiRubricPayload = {
  name?: string;
  description?: string | null;
  writingType?: string | null;
  isDefault?: boolean;
  isActive?: boolean;
  totalMaxScore?: number;
  criteria?: AiRubricCriterionInput[];
};

export type ImportAiRubricsResult = {
  total: number;
  imported: number;
  failed: number;
  errors: Array<{ row: number; reason: string }>;
};
