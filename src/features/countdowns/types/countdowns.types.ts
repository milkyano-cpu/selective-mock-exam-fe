export interface CountdownItem {
  id: string;
  title: string;
  targetAt: string;
  isActive: boolean;
  isExpired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CreateCountdownPayload {
  title: string;
  targetAt: string;
}

export interface UpdateCountdownPayload {
  title?: string;
  targetAt?: string;
}

export interface CountdownsListResponse {
  success: boolean;
  message: string;
  data: CountdownItem[];
  meta: PaginationMeta;
}

export interface CountdownResponse {
  success: boolean;
  message: string;
  data: CountdownItem;
}

export interface ActiveCountdownResponse {
  success: boolean;
  message: string;
  data: CountdownItem | null;
}

export interface ActionResponse {
  success: boolean;
  message: string;
}
