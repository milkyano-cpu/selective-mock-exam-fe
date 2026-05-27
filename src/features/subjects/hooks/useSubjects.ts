import { useState, useCallback } from 'react';
import { isAxiosError } from 'axios';
import { subjectsService } from '../services/subjects.service';
import { showClientErrorAlert } from '@/lib/errorAlert';
import {
  Subject,
  CreateSubjectPayload,
  UpdateSubjectPayload,
  ListQuery,
  PaginationMeta,
} from '../types/subjects.types';

export const useSubjects = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubjects = useCallback(async (query?: ListQuery) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await subjectsService.listSubjects(query);
      if (response.success) {
        setSubjects(response.data);
        setMeta(response.meta);
      } else {
        setError(response.message || 'Failed to fetch subjects');
        showClientErrorAlert('Failed to load. Please refresh and try again.', 'Failed to load');
      }
    } catch (err: unknown) {
      const msg = isAxiosError(err)
        ? err.response?.data?.message || 'Failed to fetch subjects'
        : 'Failed to fetch subjects';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createSubject = async (payload: CreateSubjectPayload): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await subjectsService.createSubject(payload);
      if (response.success) {
        return true;
      }
      setError(response.message || 'Failed to create subject');
      showClientErrorAlert('Your changes could not be saved. Please try again.', 'Failed to save');
      return false;
    } catch (err: unknown) {
      const msg = isAxiosError(err)
        ? err.response?.data?.message || 'Failed to create subject'
        : 'Failed to create subject';
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateSubject = async (subjectId: string, payload: UpdateSubjectPayload): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await subjectsService.updateSubject(subjectId, payload);
      if (response.success) {
        return true;
      }
      setError(response.message || 'Failed to update subject');
      showClientErrorAlert('Your changes could not be saved. Please try again.', 'Failed to save');
      return false;
    } catch (err: unknown) {
      const msg = isAxiosError(err)
        ? err.response?.data?.message || 'Failed to update subject'
        : 'Failed to update subject';
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSubject = async (subjectId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await subjectsService.deleteSubject(subjectId);
      if (response.success) {
        return true;
      }
      setError(response.message || 'Failed to delete subject');
      showClientErrorAlert('The item could not be deleted. Please try again.', 'Failed to delete');
      return false;
    } catch (err: unknown) {
      const msg = isAxiosError(err)
        ? err.response?.data?.message || 'Failed to delete subject'
        : 'Failed to delete subject';
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = useCallback(() => setError(null), []);

  return {
    subjects,
    meta,
    isLoading,
    error,
    fetchSubjects,
    createSubject,
    updateSubject,
    deleteSubject,
    clearError,
  };
};
