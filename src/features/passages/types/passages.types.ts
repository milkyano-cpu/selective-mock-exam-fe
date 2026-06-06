import type { ImageSummary } from '@/features/images/types/images.types';

export type ImageDisplayPosition = 'above' | 'below' | 'inline';
export type PassageFormat = 'text' | 'poem' | 'article' | 'visual_text' | 'image_only';
export type PassageType = 'comprehension' | 'poem' | 'visual';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export type Passage = {
  id:                   string;
  passageId:            string;
  title:                string | null;
  text:                 string | null;
  passageFormat:        PassageFormat;
  imageRef:             string | null;
  image:                ImageSummary | null;
  passageType:          PassageType;
  imageDisplayPosition: ImageDisplayPosition | null;
  subjectId:            string;
  subject:              { id: string; name: string };
  topicId:              string;
  topic:                { id: string; name: string };
  imageAltText:         string | null;
  imageCaption:         string | null;
  difficulty:           Difficulty;
  latexEnabled:         boolean;
  notes:                string | null;
  createdAt:            string;
  updatedAt:            string;
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
  questionText: string;
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
  title?:                string;
  text?:                 string;
  passageFormat:         PassageFormat;
  imageRef?:             string;
  passageType:           PassageType;
  imageDisplayPosition?: ImageDisplayPosition;
  subjectId:             string;
  topicId:               string;
  imageAltText?:         string;
  imageCaption?:         string;
  difficulty:            Difficulty;
  latexEnabled?:         boolean;
  notes?:                string;
};

export type UpdatePassagePayload = {
  [K in keyof CreatePassagePayload]?: CreatePassagePayload[K] | null;
};

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
