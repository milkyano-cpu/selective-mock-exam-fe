import { useCallback, useState } from 'react';
import { isAxiosError } from 'axios';
import { passagesService } from '../services/passages.service';
import type {
  CreatePassagePayload,
  ListPassagesQuery,
  PaginationMeta,
  PassageDetail,
  PassageListItem,
  UpdatePassagePayload,
} from '../types/passages.types';

export const usePassages = () => {
  const [passages, setPassages] = useState<PassageListItem[]>([]);
  const [selectedPassage, setSelectedPassage] = useState<PassageDetail | null>(null);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPassages = useCallback(async (query?: ListPassagesQuery) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await passagesService.list(query);
      if (response.success) {
        setPassages(response.data);
        setMeta(response.meta);
      } else {
        setError(response.message || 'Failed to fetch passages');
      }
    } catch (err: unknown) {
      const message = isAxiosError(err)
        ? err.response?.data?.message || 'Failed to fetch passages'
        : 'Failed to fetch passages';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPassageById = useCallback(async (id: string): Promise<PassageDetail | null> => {
    setActionLoading(id);
    setError(null);
    try {
      const response = await passagesService.getById(id);
      if (response.success) {
        setSelectedPassage(response.data);
        return response.data;
      }
      setError(response.message || 'Failed to fetch passage detail');
      return null;
    } catch (err: unknown) {
      const message = isAxiosError(err)
        ? err.response?.data?.message || 'Failed to fetch passage detail'
        : 'Failed to fetch passage detail';
      setError(message);
      return null;
    } finally {
      setActionLoading(null);
    }
  }, []);

  const createPassage = async (payload: CreatePassagePayload): Promise<PassageDetail | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await passagesService.create(payload);
      if (response.success) {
        return response.data;
      }
      setError(response.message || 'Failed to create passage');
      return null;
    } catch (err: unknown) {
      const message = isAxiosError(err)
        ? err.response?.data?.message || 'Failed to create passage'
        : 'Failed to create passage';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassage = async (id: string, payload: UpdatePassagePayload): Promise<PassageDetail | null> => {
    setActionLoading(id);
    setError(null);
    try {
      const response = await passagesService.update(id, payload);
      if (response.success) {
        setSelectedPassage(response.data);
        return response.data;
      }
      setError(response.message || 'Failed to update passage');
      return null;
    } catch (err: unknown) {
      const message = isAxiosError(err)
        ? err.response?.data?.message || 'Failed to update passage'
        : 'Failed to update passage';
      setError(message);
      return null;
    } finally {
      setActionLoading(null);
    }
  };

  const deletePassage = async (id: string): Promise<boolean> => {
    setActionLoading(id);
    setError(null);
    try {
      const response = await passagesService.delete(id);
      if (response.success) {
        if (selectedPassage?.id === id) {
          setSelectedPassage(null);
        }
        return true;
      }
      setError(response.message || 'Failed to delete passage');
      return false;
    } catch (err: unknown) {
      const message = isAxiosError(err)
        ? err.response?.data?.message || 'Failed to delete passage'
        : 'Failed to delete passage';
      setError(message);
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  return {
    passages,
    selectedPassage,
    meta,
    isLoading,
    actionLoading,
    error,
    setSelectedPassage,
    fetchPassages,
    fetchPassageById,
    createPassage,
    updatePassage,
    deletePassage,
  };
};
