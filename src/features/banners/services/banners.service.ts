import mdwClient from '@/lib/mdwClient';
import type { Banner, CreateBannerPayload, UpdateBannerPayload, BannersListResponse, BannerResponse, ActiveBannersResponse } from '../types/banners.types';

export interface ListBannersParams {
  page?: number;
  limit?: number;
}

export const bannerService = {
  listActive: async (): Promise<ActiveBannersResponse> => {
    const response = await mdwClient.get('/banners/active');
    return response.data;
  },

  list: async (params: ListBannersParams): Promise<BannersListResponse> => {
    const response = await mdwClient.get('/banners', { params });
    return response.data;
  },

  create: async (payload: CreateBannerPayload): Promise<BannerResponse> => {
    const response = await mdwClient.post('/banners', payload);
    return response.data;
  },

  update: async (id: string, payload: UpdateBannerPayload): Promise<BannerResponse> => {
    const response = await mdwClient.patch(`/banners/${id}`, payload);
    return response.data;
  },

  uploadImage: async (id: string, file: File): Promise<BannerResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await mdwClient.post(`/banners/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  remove: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await mdwClient.delete(`/banners/${id}`);
    return response.data;
  },
};
