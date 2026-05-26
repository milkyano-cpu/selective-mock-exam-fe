export interface Subject {
  id: string;
  name: string;
  questionCode: string | null;
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
  questionCode: string;
  description?: string | null;
}

export interface UpdateSubjectPayload {
  name?: string;
  questionCode?: string;
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

export interface EnsureSubjectTopicsPayload {
  subject: CreateSubjectPayload;
  topics: CreateTopicPayload[];
}

export interface EnsureSubjectTopicsResult {
  subject: Subject;
  topics: Topic[];
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
  publishedOnly?: boolean;
  practiceOnly?: boolean;
}
