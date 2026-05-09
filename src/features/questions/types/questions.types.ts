export type QuestionType       = 'MCQ' | 'ESSAY';
export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type QuestionStatus     = 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED';
export type QuestionMarkingType = 'AUTO' | 'RUBRIC';

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
  rubricId:         string | null;
  rubric:           {
    id: string;
    name: string;
    totalMaxScore: number;
  } | null;
  type:             QuestionType;
  difficulty:       QuestionDifficulty;
  contentText:      string;
  contentLatex:     string | null;
  isLatexFormat:    boolean;
  markingType:      QuestionMarkingType;
  maxMarks:         number;
  options:          McqOption[] | null;
  correctAnswer:    string;
  explanation:      string | null;
  timeLimitSeconds: number | null;
  imageUrl:         string | null;
  imageUrls:        string[];
  subtopics:        string[];
  notes:            string | null;
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
  testName:          string | null;
  questionNumber:    number | null;
  subjectName:       string;
  topicName:         string;
  type:              string;
  difficulty:        string;
  contentText:       string;
  optionA:           string;
  optionB:           string;
  optionC:           string;
  optionD:           string;
  optionE:           string;
  correctAnswer:     string;
  explanation:       string | null;
  timeLimitSeconds:  number | null;
  imageUrl:          string | null;
  imageUrls:         string[];
  passageExternalId: string | null;
  passageText:       string | null;
  rubricId:          string | null;
  subtopics:         string[];
  notes:             string | null;
  isLatexFormat?:    boolean;
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
  failed:         number;
  unresolved:     number;
  errors:         Array<{ row: number; reason: string }>;
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
  rubricId?:         string | null;
  questionNumber?:   number;
  type:              QuestionType;
  difficulty:        QuestionDifficulty;
  contentText:       string;
  contentLatex?:     string;
  isLatexFormat?:    boolean;
  markingType?:      QuestionMarkingType;
  maxMarks?:         number;
  options?:          McqOption[];
  correctAnswer?:    string;
  explanation?:      string;
  timeLimitSeconds?: number;
  imageUrl?:         string;
  imageUrls?:        string[];
  subtopics?:        string[];
  notes?:            string;
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
