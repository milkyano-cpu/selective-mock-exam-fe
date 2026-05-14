import mdwClient from '@/lib/mdwClient';
import type {
  ImageActionResponse,
  ImageResponse,
  ImagesListResponse,
  ListImagesParams,
  UpdateImagePayload,
} from '../types/images.types';

export const imagesService = {
  list: async (params?: ListImagesParams): Promise<ImagesListResponse> => {
    const response = await mdwClient.get('/images', { params });
    return response.data;
  },

  upload: async (file: File, payload: { fileName?: string; altText?: string; caption?: string }): Promise<ImageResponse> => {
    const form = new FormData();
    if (payload.fileName) form.append('fileName', payload.fileName);
    if (payload.altText) form.append('altText', payload.altText);
    if (payload.caption) form.append('caption', payload.caption);
    form.append('file', file);
    const response = await mdwClient.post('/images', form);
    return response.data;
  },

  update: async (uuid: string, payload: UpdateImagePayload): Promise<ImageResponse> => {
    const response = await mdwClient.patch(`/images/${uuid}`, payload);
    return response.data;
  },

  uploadFile: async (uuid: string, file: File): Promise<ImageResponse> => {
    const form = new FormData();
    form.append('file', file);
    const response = await mdwClient.post(`/images/${uuid}/file`, form);
    return response.data;
  },

  remove: async (uuid: string): Promise<ImageActionResponse> => {
    const response = await mdwClient.delete(`/images/${uuid}`);
    return response.data;
  },
};
