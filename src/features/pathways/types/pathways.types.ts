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
  progress: NodeProgress | null;
  createdAt: string;
  updatedAt: string;
}

export interface PathwayItem {
  id: string;
  studentId: string;
  subjectId: string;
  tutorId: string;
  thresholdCorrect: number;
  nodeCount: number;
  subject: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
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

// ── Request payloads ──────────────────────────────────────────────────────────

export interface CreatePathwayPayload {
  studentId: string;
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
