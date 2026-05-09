export type Rubric = {
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

export type RubricBandDescriptor = {
  id: string;
  criterionId: string;
  scoreMin: number;
  scoreMax: number;
  descriptor: string;
  createdAt: string;
  updatedAt: string;
};

export type RubricCriterion = {
  id: string;
  rubricId: string;
  criterionName: string;
  criterionDescription: string;
  maxScore: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  bandDescriptors?: RubricBandDescriptor[];
};

export type RubricDetail = Rubric & {
  criteria: RubricCriterion[];
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

export type ListRubricsQuery = {
  page?: number;
  limit?: number;
  search?: string;
  activeOnly?: boolean;
};

export type RubricBandDescriptorInput = {
  scoreMin: number;
  scoreMax: number;
  descriptor: string;
};

export type RubricCriterionInput = {
  criterionName: string;
  criterionDescription: string;
  maxScore: number;
  sortOrder?: number;
  bandDescriptors?: RubricBandDescriptorInput[];
};

export type CreateRubricPayload = {
  id: string;
  name: string;
  description?: string | null;
  writingType?: string | null;
  isDefault?: boolean;
  isActive?: boolean;
  totalMaxScore: number;
  criteria?: RubricCriterionInput[];
};

export type UpdateRubricPayload = {
  name?: string;
  description?: string | null;
  writingType?: string | null;
  isDefault?: boolean;
  isActive?: boolean;
  totalMaxScore?: number;
  criteria?: RubricCriterionInput[];
};

export type ImportRubricsResult = {
  total: number;
  imported: number;
  failed: number;
  errors: Array<{ row: number; reason: string }>;
};
