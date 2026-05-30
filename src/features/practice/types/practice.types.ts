import type { ImageSummary } from '@/features/images/types/images.types';

export type PracticeStatus = 'IN_PROGRESS' | 'COMPLETED';
export type DifficultyFilter = 'ALL' | 'EASY' | 'MEDIUM' | 'HARD';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type QuestionCount = 5 | 10 | 15 | 20;
export type PracticeSourceType = 'SELF_SELECTED' | 'TUTOR_ASSIGNED' | 'PATHWAY' | 'RECOMMENDATION';
export type MembershipTier = 'BASIC' | 'STANDARD' | 'PREMIUM';

export interface McqOption {
  key: string;
  text: string;
}

export interface PracticeQuestion {
  questionId: string;
  order: number;
  type: 'MCQ' | 'ESSAY';
  questionText: string;
  writingType: string | null;
  promptText: string | null;
  latexEnabled: boolean;
  difficulty: Difficulty;
  options: McqOption[] | null;
  imageRefs: string[];
  images: ImageSummary[];
  correctAnswer: string;
  explanation: string | null;
  maxMarks: number;
  passage: {
    id: string;
    title: string | null;
    text: string | null;
    imageRef: string | null;
    imageDisplayPosition: 'above' | 'below' | 'inline' | null;
    image: ImageSummary | null;
  } | null;
}

export interface PracticeResultAnswer extends PracticeQuestion {
  studentAnswer: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
  awardedMarks: number | null;
  bandLabel: string | null;
  bandDescriptor: string | null;
  gradingStatus: string;
  aiFeedback: {
    overallFeedback?: string;
    feedback?: string | null;
    strengths?: string[];
    improvements?: string[];
    criterionScores?: Array<{
      criterionId: string;
      criterionName: string;
      score: number;
      maxScore: number;
      feedback: string;
    }>;
    totalAwardedMarks?: number;
    totalPossibleMarks?: number;
    scorePercent?: number;
    bandLabel?: string | null;
    bandDescriptor?: string | null;
  } | null;
}

export interface PracticeSessionDetail {
  sessionId: string;
  topicId: string | null;
  topicName: string | null;
  subjectId: string | null;
  subjectName: string | null;
  sourceType: PracticeSourceType;
  // Pathway linkage — present only for PATHWAY sessions.
  pathwayNodeId: string | null;
  pathwayId: string | null;
  planId: string | null;
  difficulty: DifficultyFilter;
  questionCount: number;
  status: PracticeStatus;
  startedAt: string;
  endedAt: string | null;
  totalTimeSeconds: number | null;
  questions: PracticeQuestion[];
  answers: PracticeResultAnswer[] | null;
}

export interface PracticeSessionSummary {
  sessionId: string;
  topicId: string | null;
  topicName: string | null;
  subjectId: string | null;
  subjectName: string | null;
  sourceType: PracticeSourceType;
  difficulty: DifficultyFilter;
  questionCount: number;
  status: PracticeStatus;
  scorePercent: number | null;
  correctCount: number | null;
  startedAt: string;
  endedAt: string | null;
  totalTimeSeconds: number | null;
}

export interface WeakTopic {
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  scoreAvg: number;
}

export interface RecommendationItem {
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  scoreAvg: number;
  attemptCount: number;
  availableQuestions: number;
}

export interface AssignmentSummary {
  sessionId: string;
  studentId: string;
  studentName: string;
  topicId: string | null;
  topicName: string | null;
  subjectId: string | null;
  subjectName: string | null;
  difficulty: DifficultyFilter;
  questionCount: number;
  status: PracticeStatus;
  scorePercent: number | null;
  correctCount: number | null;
  startedAt: string;
  endedAt: string | null;
}

export interface FreePracticeTopic {
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  availableQuestions: number;
}

// ── Payloads ──────────────────────────────────────────────────────────────────

export interface StartPracticePayload {
  topicId?: string;
  subjectId?: string;
  subtopics?: string[];
  difficulty: DifficultyFilter;
  questionCount: QuestionCount;
  excludeCompleted?: boolean;
  incorrectOnly?: boolean;
}

export interface StartWeakAreaPayload {
  questionCount: QuestionCount;
  weaknessThreshold?: number;
  subjectId?: string;
}

export interface AnswerPayload {
  questionId: string;
  studentAnswer: string;
  timeSpentSeconds: number;
}

export interface SubmitPracticePayload {
  answers: AnswerPayload[];
}

export interface CreateAssignmentPayload {
  studentId: string;
  questionIds: string[];
  topicId?: string;
}

// ── Responses ─────────────────────────────────────────────────────────────────

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface StartPracticeResponse {
  success: boolean;
  message: string;
  data: PracticeSessionDetail;
}

export interface StartWeakAreaResponse {
  success: boolean;
  message: string;
  data: PracticeSessionDetail & { weakTopics: WeakTopic[] };
}

export interface GetRecommendationsResponse {
  success: boolean;
  message: string;
  data: RecommendationItem[];
}

export interface GetPracticeSessionResponse {
  success: boolean;
  message: string;
  data: PracticeSessionDetail;
}

export interface SubmitPracticeResponse {
  success: boolean;
  message: string;
  data: {
    sessionId: string;
    topicId: string | null;
    topicName: string | null;
    status: PracticeStatus;
    totalQuestions: number;
    correctCount: number;
    scorePercent: number;
    endedAt: string;
    totalTimeSeconds: number;
    answers: PracticeResultAnswer[];
  };
}

export interface ListPracticeSessionsResponse {
  success: boolean;
  message: string;
  data: PracticeSessionSummary[];
  meta: PaginationMeta;
}

export interface PracticeAccessResponse {
  success: boolean;
  message: string;
  data: {
    tier: MembershipTier;
    fullPracticeAccess: boolean;
    freeTopics: FreePracticeTopic[];
  };
}

export interface CreateAssignmentResponse {
  success: boolean;
  message: string;
  data: {
    sessionId: string;
    studentId: string;
    studentName: string;
    topicId: string | null;
    sourceType: PracticeSourceType;
    questionCount: number;
    status: PracticeStatus;
    startedAt: string;
  };
}

export interface ListAssignmentsResponse {
  success: boolean;
  message: string;
  data: AssignmentSummary[];
  meta: PaginationMeta;
}
