import { useState, useCallback } from 'react';
import { isAxiosError } from 'axios';
import { pathwayPlansService } from '../services/pathway-plans.service';
import { showClientErrorAlert } from '@/lib/errorAlert';
import type {
  PathwayPlanListItem,
  ListPlansQuery,
  CreatePlanPayload,
} from '../types/pathway-plans.types';

export function usePathwayPlans(initialQuery?: ListPlansQuery) {
  const [plans, setPlans] = useState<PathwayPlanListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(
    async (query?: ListPlansQuery) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await pathwayPlansService.list(query ?? initialQuery);
        if (res.success) {
          setPlans(res.data);
        } else {
          setError(res.message);
          showClientErrorAlert('Failed to load. Please refresh and try again.', 'Failed to load');
        }
      } catch (err) {
        setError(
          isAxiosError(err)
            ? err.response?.data?.message ?? 'Failed to load plans'
            : 'Failed to load plans'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [initialQuery]
  );

  const createPlan = async (
    payload: CreatePlanPayload
  ): Promise<PathwayPlanListItem | null> => {
    setError(null);
    try {
      const res = await pathwayPlansService.create(payload);
      if (res.success) {
        setPlans((prev) => [res.data, ...prev]);
        return res.data;
      }
      setError(res.message);
      showClientErrorAlert('Your changes could not be saved. Please try again.', 'Failed to save');
      return null;
    } catch (err) {
      setError(
        isAxiosError(err)
          ? err.response?.data?.message ?? 'Failed to create plan'
          : 'Failed to create plan'
      );
      return null;
    }
  };

  const removePlan = async (id: string): Promise<boolean> => {
    try {
      const res = await pathwayPlansService.remove(id);
      if (res.success) {
        setPlans((prev) => prev.filter((p) => p.id !== id));
        return true;
      }
      showClientErrorAlert('The item could not be deleted. Please try again.', 'Failed to delete');
      return false;
    } catch {
      return false;
    }
  };

  return {
    plans,
    setPlans,
    isLoading,
    error,
    fetchPlans,
    createPlan,
    removePlan,
  };
}
