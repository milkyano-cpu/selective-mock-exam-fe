import { useState, useCallback } from 'react';
import { isAxiosError } from 'axios';
import { pathwaysService } from '../services/pathways.service';
import { showClientErrorAlert } from '@/lib/errorAlert';
import type { PathwayItem, PathwayDetail, CreatePathwayPayload } from '../types/pathways.types';

export function usePathways(studentId?: string) {
  const [pathways, setPathways] = useState<PathwayItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPathways = useCallback(
    async (overrideStudentId?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await pathwaysService.list(overrideStudentId ?? studentId);
        if (res.success) setPathways(res.data);
        else {
          setError(res.message);
          showClientErrorAlert('Failed to load. Please refresh and try again.', 'Failed to load');
        }
      } catch (err) {
        setError(
          isAxiosError(err)
            ? err.response?.data?.message ?? 'Failed to load pathways'
            : 'Failed to load pathways'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [studentId]
  );

  const createPathway = async (
    payload: CreatePathwayPayload
  ): Promise<PathwayDetail | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await pathwaysService.create(payload);
      if (res.success) {
        return res.data;
      }
      setError(res.message);
      showClientErrorAlert('Your changes could not be saved. Please try again.', 'Failed to save');
      return null;
    } catch (err) {
      setError(
        isAxiosError(err)
          ? err.response?.data?.message ?? 'Failed to create pathway'
          : 'Failed to create pathway'
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const removePathway = async (id: string): Promise<boolean> => {
    try {
      const res = await pathwaysService.remove(id);
      if (res.success) {
        setPathways((prev) => prev.filter((p) => p.id !== id));
        return true;
      }
      showClientErrorAlert('The item could not be deleted. Please try again.', 'Failed to delete');
      return false;
    } catch {
      return false;
    }
  };

  return {
    pathways,
    setPathways,
    isLoading,
    error,
    fetchPathways,
    createPathway,
    removePathway,
  };
}
