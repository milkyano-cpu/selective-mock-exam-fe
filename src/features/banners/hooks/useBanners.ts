import { useState, useCallback } from 'react';
import { isAxiosError } from 'axios';
import { bannerService, type ListBannersParams } from '../services/banners.service';
import type { Banner, CreateBannerPayload, UpdateBannerPayload, PaginationMeta } from '../types/banners.types';
import { showClientErrorAlert } from '@/lib/errorAlert';

export const useBanners = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBanners = useCallback(async (query?: ListBannersParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await bannerService.list(query || {});
      if (response.success) {
        setBanners(response.data);
        setMeta(response.meta);
      } else {
        setError(response.message || 'Failed to fetch banners');
        showClientErrorAlert('Failed to load. Please refresh and try again.', 'Failed to load');
      }
    } catch (err: unknown) {
      const msg = isAxiosError(err)
        ? err.response?.data?.message || 'Failed to fetch banners'
        : 'Failed to fetch banners';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createBanner = async (payload: CreateBannerPayload): Promise<Banner | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await bannerService.create(payload);
      if (response.success) {
        return response.data;
      }
      setError(response.message || 'Failed to create banner');
      showClientErrorAlert('Your changes could not be saved. Please try again.', 'Failed to save');
      return null;
    } catch (err: unknown) {
      const msg = isAxiosError(err)
        ? err.response?.data?.message || 'Failed to create banner'
        : 'Failed to create banner';
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateBanner = async (bannerId: string, payload: UpdateBannerPayload): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await bannerService.update(bannerId, payload);
      if (response.success) {
        return true;
      }
      setError(response.message || 'Failed to update banner');
      showClientErrorAlert('Your changes could not be saved. Please try again.', 'Failed to save');
      return false;
    } catch (err: unknown) {
      const msg = isAxiosError(err)
        ? err.response?.data?.message || 'Failed to update banner'
        : 'Failed to update banner';
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteBanner = async (bannerId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await bannerService.remove(bannerId);
      if (response.success) {
        return true;
      }
      setError(response.message || 'Failed to delete banner');
      showClientErrorAlert('The item could not be deleted. Please try again.', 'Failed to delete');
      return false;
    } catch (err: unknown) {
      const msg = isAxiosError(err)
        ? err.response?.data?.message || 'Failed to delete banner'
        : 'Failed to delete banner';
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const uploadBannerImage = async (bannerId: string, file: File): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await bannerService.uploadImage(bannerId, file);
      if (response.success) {
        return true;
      }
      setError(response.message || 'Failed to upload image');
      showClientErrorAlert('The image could not be uploaded. Please try again.', 'Failed to upload');
      return false;
    } catch (err: unknown) {
      const msg = isAxiosError(err)
        ? err.response?.data?.message || 'Failed to upload image'
        : 'Failed to upload image';
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    banners,
    meta,
    isLoading,
    error,
    fetchBanners,
    createBanner,
    updateBanner,
    deleteBanner,
    uploadBannerImage,
  };
};
