export interface PlanSubjectSummary {
  id: string;
  name: string;
}

export interface PlanPathwaySummary {
  id: string;
  subjectId: string;
  thresholdCorrect: number;
  subject: PlanSubjectSummary;
  nodeCount: number;
  completedNodeCount: number;
}

export interface PathwayPlanListItem {
  id: string;
  name: string;
  tutorId: string;
  studentId: string;
  studentName: string | null;
  tutorName: string | null;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  subjects: PlanSubjectSummary[];
  totalNodes: number;
  completedNodes: number;
  progressPercent: number;
  isComplete: boolean;
}

export interface PathwayPlanDetail extends PathwayPlanListItem {
  pathways: PlanPathwaySummary[];
}

// ── API response wrappers ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListPlansResponse {
  success: boolean;
  message: string;
  data: PathwayPlanListItem[];
  meta: PaginationMeta;
}

export type GetPlanResponse = ApiResponse<PathwayPlanDetail>;
export type CreatePlanResponse = ApiResponse<PathwayPlanListItem>;
export type UpdatePlanResponse = ApiResponse<PathwayPlanListItem>;

export interface AddPlanPathwayData {
  id: string;
  planId: string;
  studentId: string;
  subjectId: string;
  tutorId: string;
  thresholdCorrect: number;
  nodeCount: number;
  subject: PlanSubjectSummary;
  createdAt: string;
  updatedAt: string;
}

export type AddPlanPathwayResponse = ApiResponse<AddPlanPathwayData>;

// ── Request payloads / queries ────────────────────────────────────────────────

export interface ListPlansQuery {
  studentId?: string;
  page?: number;
  limit?: number;
}

export interface CreatePlanPayload {
  name: string;
  studentId: string;
  dueDate?: string;
}

export interface UpdatePlanPayload {
  name?: string;
  dueDate?: string | null;
}

export interface AddPlanPathwayPayload {
  subjectId: string;
  thresholdCorrect?: number;
}
