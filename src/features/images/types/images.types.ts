export type ImageSummary = {
  fileName: string;
  url: string | null;
  altText: string | null;
  caption: string | null;
};

export type MasterImage = ImageSummary & {
  uuid: string;
  expiredDate: string | null;
  createdAt: string;
  updatedAt: string;
  passageCount: number;
  questionCount: number;
};

export type ListImagesParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ImagesListResponse = {
  success: boolean;
  message: string;
  data: MasterImage[];
  meta: PaginationMeta;
};

export type ImageResponse = {
  success: boolean;
  message: string;
  data: MasterImage;
};

export type ImageActionResponse = {
  success: boolean;
  message: string;
};

export type UpdateImagePayload = {
  altText?: string | null;
  caption?: string | null;
};
