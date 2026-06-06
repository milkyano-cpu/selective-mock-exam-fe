import type { ImageSummary } from '@/features/images/types/images.types';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type ExamType = 'MOCK_EXAM' | 'ASSIGNMENT';
export type GradingType = 'AUTO' | 'MANUAL';
export type ExamStatus = 'DRAFT' | 'PUBLISHED';
export type SessionStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';
export type RankingLevel = 'SUPERIOR' | 'ABOVE_AVERAGE' | 'HIGH_AVERAGE' | 'AVERAGE' | 'LOW_AVERAGE';
export type AnswerReviewStatus = 'NOT_APPLICABLE' | 'AI_GRADED' | 'PENDING_REVIEW' | 'MANUAL_GRADED';
export type ManualGradingQueueStatus = 'ALL' | 'PENDING_REVIEW' | 'GRADED';
export type RetakeMode = 'FULL' | 'INCORRECT_ONLY' | 'SUBJECT_ONLY';

export interface EssayAiFeedback {
  isCorrect: boolean | null;
  confidence: 'high' | 'medium' | 'low' | null;
  feedback: string | null;
  overallFeedback?: string | null;
  strengths?: string[];
  improvements?: string[];
  pendingReview: boolean | null;
  reason: string | null;
  gradedAt: string | null;
  aiRubric: {
    id: string;
    name: string;
    totalMaxScore: number;
  } | null;
  criterionScores: Array<{
    criterionId: string;
    criterionName: string;
    score: number;
    maxScore: number;
    feedback: string;
    strengths?: string[];
    improvements?: string[];
  }>;
  totalAwardedMarks: number | null;
  totalPossibleMarks: number | null;
  scorePercent: number | null;
  bandLabel?: string | null;
  bandDescriptor?: string | null;
}

export interface ExamItem {
  id: string;
  title: string;
  examType: ExamType;
  durationMinutes: number | null;
  gradingType: GradingType;
  status: ExamStatus;
  createdBy: string;
  creatorName: string;
  questionCount: number;
  hasSessions: boolean;
  createdAt: string;
  updatedAt: string;
  requiredTier: 'BASIC' | 'STANDARD' | 'PREMIUM';
  thresholdSuperior: number;
  thresholdAboveAverage: number;
  thresholdHighAverage: number;
  thresholdAverage: number;
}

export interface McqOption {
  key: string;
  text: string;
}

export interface ExamQuestionItem {
  examId: string;
  questionId: string;
  order: number;
  question: {
    id: string;
    questionId: string | null;
    type: 'MCQ' | 'ESSAY';
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    questionText: string;
    latexEnabled: boolean;
    options: McqOption[] | null;
    correctAnswer: string;
    imageRefs: string[];
    images: ImageSummary[];
    subjectName: string;
    topicName: string;
  };
}

export interface SessionQuestion {
  questionId: string;
  order: number;
  type: 'MCQ' | 'ESSAY';
  questionText: string;
  promptText: string | null;
  latexEnabled: boolean;
  options: McqOption[] | null;
  imageRefs: string[];
  images: ImageSummary[];
  subjectName: string;
  topicName: string;
  passage: { id: string; title: string | null; text: string | null; imageRef: string | null; imageDisplayPosition: 'above' | 'below' | 'inline' | null; image: ImageSummary | null } | null;
  existingAnswer: { studentAnswer: string; timeSpentSeconds: number } | null;
}

export interface ExamSession {
  sessionId: string;
  examId: string;
  examTitle: string;
  durationMinutes: number;
  gradingType: GradingType;
  status: SessionStatus;
  startTime: string;
  expiresAt: string;
  serverNow: string;
  secondsRemaining: number;
  activeTimeSeconds: number;
  idleTimeSeconds: number;
  questions: SessionQuestion[];
  answeredCount: number;
}

export interface SessionSummary {
  sessionId: string;
  examId: string;
  examTitle: string;
  examType: ExamType;
  durationMinutes: number;
  status: SessionStatus;
  finalScore: number | null;
  rankingLevel: RankingLevel | null;
  totalTimeSeconds: number | null;
  activeTimeSeconds: number;
  idleTimeSeconds: number;
  startTime: string;
  endTime: string | null;
  attemptNumber: number;
  retakeMode: RetakeMode | null;
}

export interface SessionResultAnswer {
  questionId: string;
  order: number;
  questionText: string;
  writingType: string | null;
  topicName: string;
  promptText: string | null;
  latexEnabled: boolean;
  type: 'MCQ' | 'ESSAY';
  options: McqOption[] | null;
  imageRefs: string[];
  images: ImageSummary[];
  passage: {
    id: string;
    title: string | null;
    text: string | null;
    imageRef: string | null;
    imageDisplayPosition: 'above' | 'below' | 'inline' | null;
    image: ImageSummary | null;
  } | null;
  studentAnswer: string;
  correctAnswer: string;
  explanation: string | null;
  maxMarks: number;
  isCorrect: boolean;
  timeSpentSeconds: number;
  awardedMarks: number | null;
  manualScore: number | null;
  tutorFeedback: string | null;
  reviewStatus: AnswerReviewStatus;
  aiFeedback: EssayAiFeedback | null;
  isOverridden: boolean;
  overrideScore: number | null;
  overrideNotes: string | null;
}

export interface SessionResult {
  sessionId: string;
  examId: string;
  examTitle: string;
  status: SessionStatus;
  finalScore: number | null;
  mcqScore: number | null;
  essayScore: number | null;
  rankingLevel: RankingLevel | null;
  totalTimeSeconds: number | null;
  activeTimeSeconds: number;
  idleTimeSeconds: number;
  totalQuestions: number;
  correctCount: number;
  gradingType: GradingType;
  startTime: string;
  endTime: string | null;
  /** Tier of the student who owns this session — used to gate result sections
   *  by the OWNER's tier (so a parent sees their child's tier, not their own). */
  ownerTier: 'BASIC' | 'STANDARD' | 'PREMIUM';
  answers: SessionResultAnswer[];
}

export interface ManualGradingSubmission {
  sessionId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  status: SessionStatus;
  finalScore: number | null;
  rankingLevel: RankingLevel | null;
  submittedAt: string | null;
  gradedAt: string | null;
  totalAnswers: number;
  totalEssayAnswers: number;
  pendingReviewCount: number;
  reviewedEssayCount: number;
  totalTimeSeconds: number | null;
  activeTimeSeconds: number;
  idleTimeSeconds: number;
}

export interface ReviewSessionAnswer extends SessionResultAnswer {
  answerId: string | null;
}

export interface ReviewSession {
  sessionId: string;
  examId: string;
  examTitle: string;
  gradingType: GradingType;
  status: SessionStatus;
  student: {
    id: string;
    fullName: string;
    email: string;
  };
  finalScore: number | null;
  mcqScore: number | null;
  essayScore: number | null;
  rankingLevel: RankingLevel | null;
  totalTimeSeconds: number | null;
  activeTimeSeconds: number;
  idleTimeSeconds: number;
  startTime: string;
  endTime: string | null;
  answers: ReviewSessionAnswer[];
}

// ── Payloads ─────────────────────────────────────────────────────────────────

export interface CreateExamPayload {
  title: string;
  examType: ExamType;
  durationMinutes: number;
  gradingType: GradingType;
  requiredTier?: 'BASIC' | 'STANDARD' | 'PREMIUM';
  thresholdSuperior?: number;
  thresholdAboveAverage?: number;
  thresholdHighAverage?: number;
  thresholdAverage?: number;
}

export interface UpdateExamPayload {
  title?: string;
  examType?: ExamType;
  durationMinutes?: number;
  gradingType?: GradingType;
  requiredTier?: 'BASIC' | 'STANDARD' | 'PREMIUM';
  thresholdSuperior?: number;
  thresholdAboveAverage?: number;
  thresholdHighAverage?: number;
  thresholdAverage?: number;
}

export interface PublishExamPayload {
  status: ExamStatus;
  durationMinutes?: number;
  gradingType?: GradingType;
}

export interface AddExamQuestionsPayload {
  questionIds: string[];
}

export interface SubmitAnswerPayload {
  questionId: string;
  studentAnswer: string;
  timeSpentSeconds: number;
  timeSpentDeltaSeconds?: number;
}

export interface BatchAnswerItem {
  questionId: string;
  studentAnswer: string;
  timeSpentSeconds: number;
}

export interface BatchAnswersPayload {
  answers: BatchAnswerItem[];
}

export interface SubmitSessionPayload {
  totalTimeSeconds?: number;
  answers?: BatchAnswerItem[];
}

export interface SessionHeartbeatPayload {
  activeQuestionId?: string | null;
  activeTimeDeltaSeconds?: number;
  idleTimeDeltaSeconds?: number;
}

export interface SessionHeartbeatResponse {
  success: boolean;
  message: string;
  data: {
    sessionId: string;
    status: SessionStatus;
    serverNow: string;
    expiresAt: string;
    secondsRemaining: number;
    activeQuestionId: string | null;
    activeTimeSeconds: number;
    idleTimeSeconds: number;
    expired: boolean;
  };
}

export interface ManualGradePayloadItem {
  questionId: string;
  manualScore: number;
  tutorFeedback: string | null;
}

export interface SubmitManualGradesPayload {
  grades: ManualGradePayloadItem[];
}

// ── Responses ─────────────────────────────────────────────────────────────────

export interface ExamsListResponse {
  success: boolean;
  message: string;
  data: ExamItem[];
  meta: PaginationMeta;
}

export interface ExamResponse {
  success: boolean;
  message: string;
  data: ExamItem;
}

export interface ExamWithQuestionsResponse {
  success: boolean;
  message: string;
  data: { exam: ExamItem; questions: ExamQuestionItem[] };
}

export interface ExamQuestionsListResponse {
  success: boolean;
  message: string;
  data: ExamQuestionItem[];
}

export interface SessionResponse {
  success: boolean;
  message: string;
  data: ExamSession;
}

export interface SessionsListResponse {
  success: boolean;
  message: string;
  data: SessionSummary[];
  meta: PaginationMeta;
}

export interface ExamSubmissionsResponse {
  success: boolean;
  message: string;
  data: {
    exam: ExamItem;
    submissions: ManualGradingSubmission[];
  };
  meta: PaginationMeta;
}

export interface ReviewSessionResponse {
  success: boolean;
  message: string;
  data: ReviewSession;
}

export interface SessionResultResponse {
  success: boolean;
  message: string;
  data: SessionResult;
}

export interface SubmitAnswerResponse {
  success: boolean;
  message: string;
  data: { questionId: string; studentAnswer: string; timeSpentSeconds: number };
}

export interface BatchAnswersResponse {
  success: boolean;
  message: string;
  data: { savedCount: number };
}

export interface SubmitSessionResponse {
  success: boolean;
  message: string;
  data: { sessionId: string; status: SessionStatus; submittedAt: string; totalTimeSeconds: number; message: string };
}

export interface SubmitManualGradesResponse {
  success: boolean;
  message: string;
  data: {
    sessionId: string;
    status: SessionStatus;
    finalScore: number | null;
    rankingLevel: RankingLevel | null;
    pendingReviewCount: number;
  };
}

export interface StartRetakePayload {
  mode: RetakeMode;
  sourceSessionId?: string;
  subjectId?: string;
}

export interface AttemptSummaryItem {
  sessionId: string;
  attemptNumber: number;
  retakeMode: RetakeMode | null;
  finalScore: number | null;
  rankingLevel: RankingLevel | null;
  totalTimeSeconds: number | null;
  activeTimeSeconds: number;
  idleTimeSeconds: number;
  status: SessionStatus;
  startTime: string;
  endTime: string | null;
}

export interface IncorrectQuestionItem {
  questionId: string;
  questionText: string;
  type: 'MCQ' | 'ESSAY';
  subjectName: string;
  topicName: string;
  studentAnswer: string;
  correctAnswer: string;
}

export interface SubjectBreakdown {
  subjectId: string;
  subjectName: string;
  totalQuestions: number;
  correctCount: number;
}

export interface ExamAttemptSummary {
  examId: string;
  examTitle: string;
  totalAttempts: number;
  firstAttempt: AttemptSummaryItem | null;
  latestAttempt: AttemptSummaryItem | null;
  bestScore: AttemptSummaryItem | null;
  incorrectQuestions: IncorrectQuestionItem[];
  subjects: SubjectBreakdown[];
}

export interface ExamAttemptSummaryResponse {
  success: boolean;
  message: string;
  data: ExamAttemptSummary;
}

export interface SessionInsightsResponse {
  success: boolean;
  message: string;
  data: {
    summary: string;
    strengths: string[];
    weaknesses: string[];
    advice: string[];
  };
}
