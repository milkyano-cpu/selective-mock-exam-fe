export type Passage = {
  id:           string;
  externalId:   string | null;
  title:        string | null;
  content:      string | null;
  imageUrl:     string | null;
  passageType:  'TEXT' | 'IMAGE' | 'TEXT_IMAGE' | null;
  section:      string | null;
  difficulty:   string | null;
  topic:        string | null;
  latexEnabled: boolean;
  notes:        string | null;
  createdAt:    string;
  updatedAt:    string;
};

export type PassageQuestionSummary = {
  id:          string;
  questionId:  string | null;
  subjectId:   string;
  topicId:     string;
  passageId:   string | null;
  type:        'MCQ' | 'ESSAY';
  difficulty:  'EASY' | 'MEDIUM' | 'HARD';
  status:      'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED';
  contentText: string;
  createdAt:   string;
  updatedAt:   string;
};

export type PassageListItem = Passage & {
  _count: {
    questions: number;
  };
};

export type PassageDetail = Passage & {
  _count: {
    questions: number;
  };
  questions: PassageQuestionSummary[];
};

export type PaginationMeta = {
  page:       number;
  limit:      number;
  total:      number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  success: boolean;
  message: string;
  data:    T[];
  meta:    PaginationMeta;
};

export type SingleResponse<T> = {
  success: boolean;
  message: string;
  data:    T;
};

export type ActionResponse = {
  success: boolean;
  message: string;
};

export type CreatePassagePayload = {
  externalId?:  string;
  title?:       string;
  content?:     string;
  imageUrl?:    string;
  passageType?: 'TEXT' | 'IMAGE' | 'TEXT_IMAGE';
  section?:     string;
  difficulty?:  string;
  topic?:       string;
  latexEnabled?: boolean;
  notes?:       string;
};

export type UpdatePassagePayload = Partial<CreatePassagePayload>;

export type ListPassagesQuery = {
  page?:   number;
  limit?:  number;
  search?: string;
};

export type ImportPassagesResult = {
  total:   number;
  created: number;
  updated: number;
  failed:  number;
  errors:  Array<{ row: number; reason: string }>;
};
