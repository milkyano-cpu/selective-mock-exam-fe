import type { ImageSummary } from '@/features/images/types/images.types';

export type QuestionType       = 'MCQ' | 'ESSAY';
export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type QuestionStatus     = 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED';
export type QuestionMarkingType = 'AUTO' | 'AI' | 'MANUAL';
export type EssayWritingType = 'CREATIVE' | 'PERSUASIVE';

export type McqOption = {
  key:  'A' | 'B' | 'C' | 'D' | 'E';
  text: string;
};

export type Question = {
  id:               string;
  questionId:       string | null;
  questionNumber:   number | null;
  subjectId:        string;
  topicId:          string;
  subjectName:      string;
  topicName:        string;
  tutorId:          string;
  passageId:        string | null;
  aiRubricId:         string | null;
  aiRubric:           {
    id: string;
    name: string;
    totalMaxScore: number;
  } | null;
  type:             QuestionType;
  difficulty:       QuestionDifficulty;
  questionText:     string;
  writingType:      EssayWritingType | string | null;
  promptText:       string | null;
  markingGuide:     string | null;
  latexEnabled:    boolean;
  markingType:      QuestionMarkingType;
  maxMarks:         number;
  isPracticeAllowed: boolean;
  options:          McqOption[] | null;
  correctAnswer:    string;
  explanation:      string | null;
  timeLimitSeconds: number | null;
  imageRefs:        string[];
  images:           ImageSummary[];
  subtopics:        string[];
  notes:            string | null;
  adaptiveTags:     string[];
  skillTags:        string[];
  status:           QuestionStatus;
  rejectionNote:    string | null;
  createdAt:        string;
  updatedAt:        string;
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

export type UnresolvedRowData = {
  questionId:        string;
  questionNumber:    number | null;
  subjectName:       string;
  topicName:         string;
  type:              string;
  difficulty:        string;
  questionText:      string;
  writingType:       string | null;
  promptText:        string | null;
  markingGuide:      string | null;
  optionA:           string;
  optionB:           string;
  optionC:           string;
  optionD:           string;
  optionE:           string;
  correctAnswer:     string;
  explanation:       string | null;
  timeLimitSeconds:  number | null;
  imageRefs:         string[];
  passageExternalId: string | null;
  aiRubricId:          string | null;
  subtopics:         string[];
  notes:             string | null;
  latexEnabled?:    boolean;
  adaptiveTags?:     string[];
  skillTags?:        string[];
  markingType:       QuestionMarkingType;
  maxMarks:          number;
};

export type UnresolvedRowItem = {
  rowNumber:   number;
  sectionName: string;
  topicName:   string;
  reason:      'SUBJECT_NOT_FOUND' | 'TOPIC_NOT_FOUND';
  resolvedSubjectId?: string;
  resolvedTopicId?: string;
  rowData:     UnresolvedRowData;
};

export type ImportedQuestionItem = {
  rowNumber: number;
  question: Question;
};

export type BulkImportResult = {
  total:          number;
  created:        number;
  skipped:        number;
  failed:         number;
  unresolved:     number;
  errors:         Array<{ row: number; reason: string }>;
  skippedErrors:  Array<{ row: number; reason: string }>;
  unresolvedRows: UnresolvedRowItem[];
  createdQuestions: ImportedQuestionItem[];
};

export type BulkImportResponse = {
  success: boolean;
  message: string;
  data:    BulkImportResult;
};

export type ResolveImportResponse = {
  success: boolean;
  message: string;
  data: {
    saved:           number;
    stillUnresolved: UnresolvedRowItem[];
    createdQuestions: ImportedQuestionItem[];
  };
};

export type CreateQuestionPayload = {
  subjectId:         string;
  topicId:           string;
  passageId?:        string | null;
  aiRubricId?:         string | null;
  questionNumber?:   number;
  type:              QuestionType;
  difficulty:        QuestionDifficulty;
  questionText:      string;
  writingType?:      string | null;
  promptText?:       string | null;
  markingGuide?:     string | null;
  latexEnabled?:    boolean;
  markingType?:      QuestionMarkingType;
  maxMarks?:         number;
  isPracticeAllowed?: boolean;
  options?:          McqOption[];
  correctAnswer?:    string;
  explanation?:      string;
  timeLimitSeconds?: number | null;
  imageRefs?:        string[];
  subtopics?:        string[];
  notes?:            string;
  adaptiveTags?:     string[];
  skillTags?:        string[];
  questionId?:       string;
};

export type UpdateQuestionPayload = Partial<CreateQuestionPayload>;

export type ListQuestionsQuery = {
  page?:       number;
  limit?:      number;
  search?:     string;
  subjectId?:  string;
  topicId?:    string;
  type?:       QuestionType;
  difficulty?: QuestionDifficulty;
  status?:     QuestionStatus;
  isPracticeAllowed?: boolean;
};

export type BulkSubmitResult = {
  submitted:    number;
  failed:       number;
  submittedIds: string[];
  failures:     Array<{ id: string; reason: string }>;
};

export type BulkSubmitResponse = {
  success: boolean;
  message: string;
  data:    BulkSubmitResult;
};

export type RejectQuestionPayload = {
  rejectionNote: string;
};
