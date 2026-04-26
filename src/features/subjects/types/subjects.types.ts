export interface Subject {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    topics: number;
    questions?: number;
  };
}

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    questions: number;
  };
}

export interface CreateSubjectPayload {
  name: string;
  description?: string | null;
}

export interface UpdateSubjectPayload {
  name?: string;
  description?: string | null;
}

export interface CreateTopicPayload {
  name: string;
  description?: string | null;
}

export interface UpdateTopicPayload {
  name?: string;
  description?: string | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: PaginationMeta;
}

export interface SingleResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ActionResponse {
  success: boolean;
  message: string;
}

export interface ListQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}
