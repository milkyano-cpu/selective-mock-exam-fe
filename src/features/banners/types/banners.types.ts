export interface Banner {
  id: string;
  imageUrl: string;
  targetUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateBannerPayload {
  imageUrl: string;
  targetUrl?: string | null;
  isActive?: boolean;
}

export interface UpdateBannerPayload {
  imageUrl?: string;
  targetUrl?: string | null;
  isActive?: boolean;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface BannersListResponse {
  success: boolean;
  message: string;
  data: Banner[];
  meta: PaginationMeta;
}

export interface BannerResponse {
  success: boolean;
  message: string;
  data: Banner;
}

export interface ActiveBannersResponse {
  success: boolean;
  message: string;
  data: Banner[];
}

export interface ActionResponse {
  success: boolean;
  message: string;
}
