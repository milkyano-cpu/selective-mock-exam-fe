export interface TopicSummary {
  id: string;
  name: string;
  subjectId: string;
}

export interface NodeProgress {
  correctAnswers: number;
  totalAttempts: number;
  isUnlocked: boolean;
  completedAt: string | null;
}

export interface PathwayNodeItem {
  id: string;
  pathwayId: string;
  topicId: string;
  orderIndex: number;
  topic: TopicSummary;
  questionCount: number;
  progress: NodeProgress | null;
  createdAt: string;
  updatedAt: string;
}

export interface PathwayItem {
  id: string;
  planId: string;
  studentId: string;
  subjectId: string;
  tutorId: string;
  thresholdCorrect: number;
  nodeCount: number;
  subject: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

// ── Node question curation (SME-111 / SME-112) ────────────────────────────────

export interface NodeQuestionContent {
  id: string;
  type: string;
  difficulty: string;
  status: string;
  questionText: string;
  latexEnabled: boolean;
  options: Array<{ key: string; text: string }> | null;
  correctAnswer: string | null;
  explanation: string | null;
  topicId: string;
  topic: { id: string; name: string };
}

export interface NodeQuestionItem {
  id: string;
  nodeId: string;
  questionId: string;
  orderIndex: number;
  question: NodeQuestionContent;
}

export interface PathwayDetail extends PathwayItem {
  nodes: PathwayNodeItem[];
}

// ── API response wrappers ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export type ListPathwaysResponse = ApiResponse<PathwayItem[]>;
export type GetPathwayResponse = ApiResponse<PathwayDetail>;
export type CreatePathwayResponse = ApiResponse<PathwayDetail>;
export type AddNodeResponse = ApiResponse<PathwayNodeItem>;
export type ReorderNodesResponse = ApiResponse<PathwayNodeItem[]>;
export type StartPracticeResponse = ApiResponse<{
  sessionId: string;
  topicId: string;
  nodeId: string;
}>;
export type UpdateProgressResponse = ApiResponse<NodeProgress>;
export type NodeQuestionsResponse = ApiResponse<NodeQuestionItem[]>;

// ── Request payloads ──────────────────────────────────────────────────────────

export interface CreatePathwayPayload {
  planId: string;
  subjectId: string;
  thresholdCorrect?: number;
}

export interface AddNodePayload {
  topicId: string;
}

export interface ReorderNodesPayload {
  order: Array<{ nodeId: string; orderIndex: number }>;
}

export interface UpdateProgressPayload {
  correctAnswers: number;
  totalAttempts: number;
}

export interface AddNodeQuestionsPayload {
  questionIds: string[];
}

export interface ReorderNodeQuestionsPayload {
  orderedQuestionIds: string[];
}
