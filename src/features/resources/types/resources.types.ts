export type ResourceType = 'FILE' | 'VIDEO';
export type Tier = 'BASIC' | 'STANDARD' | 'PREMIUM';

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  fileUrl: string | null;
  videoUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  allowedTiers: Tier[];
  uploadedBy: string;
  uploaderName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateResourcePayload {
  title: string;
  description?: string;
  type: ResourceType;
  videoUrl?: string | null;
  allowedTiers: Tier[];
}

export interface UpdateResourcePayload {
  title?: string;
  description?: string;
  allowedTiers?: Tier[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ResourcesListResponse {
  success: boolean;
  message: string;
  data: Resource[];
  meta: PaginationMeta;
}

export interface ResourceResponse {
  success: boolean;
  message: string;
  data: Resource;
}

export interface ActionResponse {
  success: boolean;
  message: string;
}
