import { useState, useCallback } from 'react';
import { isAxiosError } from 'axios';
import { questionsService } from '../services/questions.service';
import { showClientErrorAlert } from '@/lib/errorAlert';
import type {
  Question,
  CreateQuestionPayload,
  UpdateQuestionPayload,
  RejectQuestionPayload,
  ListQuestionsQuery,
  PaginationMeta,
  BulkImportResult,
} from '../types/questions.types';

const BULK_SUBMIT_ACTION_ID = '__bulk_submit__';
const BULK_APPROVE_ACTION_ID = '__bulk_approve__';
const BULK_SUBMIT_CHUNK_SIZE = 500;
const BULK_APPROVE_CHUNK_SIZE = 25;

export const useQuestions = () => {
  const [questions, setQuestions]     = useState<Question[]>([]);
  const [meta, setMeta]               = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading]     = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // tracks which question is being actioned
  const [error, setError]             = useState<string | null>(null);

  const fetchQuestions = useCallback(async (query?: ListQuestionsQuery) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await questionsService.list(query);
      if (response.success) {
        setQuestions(response.data);
        setMeta(response.meta);
      } else {
        setError(response.message || 'Failed to fetch questions');
        showClientErrorAlert('Failed to load. Please refresh and try again.', 'Failed to load');
      }
    } catch (err: unknown) {
      const msg = isAxiosError(err)
        ? err.response?.data?.message || 'Failed to fetch questions'
        : 'Failed to fetch questions';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createQuestion = async (payload: CreateQuestionPayload): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await questionsService.create(payload);
      if (response.success) return true;
      setError(response.message || 'Failed to create question');
      showClientErrorAlert('Your changes could not be saved. Please try again.', 'Failed to save');
      return false;
    } catch (err: unknown) {
      const msg = isAxiosError(err)
        ? err.response?.data?.message || 'Failed to create question'
        : 'Failed to create question';
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuestion = async (id: string, payload: UpdateQuestionPayload): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await questionsService.update(id, payload);
      if (response.success) return true;
      setError(response.message || 'Failed to update question');
      showClientErrorAlert('Your changes could not be saved. Please try again.', 'Failed to save');
      return false;
    } catch (err: unknown) {
      const msg = isAxiosError(err)
        ? err.response?.data?.message || 'Failed to update question'
        : 'Failed to update question';
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteQuestion = async (id: string): Promise<boolean> => {
    setActionLoading(id);
    setError(null);
    try {
      const response = await questionsService.delete(id);
      if (response.success) return true;
      setError(response.message || 'Failed to delete question');
      showClientErrorAlert('The item could not be deleted. Please try again.', 'Failed to delete');
      return false;
    } catch (err: unknown) {
      const msg = isAxiosError(err)
        ? err.response?.data?.message || 'Failed to delete question'
        : 'Failed to delete question';
      setError(msg);
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  const submitQuestion = async (id: string): Promise<boolean> => {
    setActionLoading(id);
    setError(null);
    try {
      const response = await questionsService.submit(id);
      if (response.success) return true;
      setError(response.message || 'Failed to submit question');
      showClientErrorAlert('Your submission could not be processed. Please try again.', 'Failed to submit');
      return false;
    } catch (err: unknown) {
      const msg = isAxiosError(err)
        ? err.response?.data?.message || 'Failed to submit question'
        : 'Failed to submit question';
      setError(msg);
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  const submitQuestions = async (ids: string[]): Promise<{ successCount: number; failedIds: string[] }> => {
    const uniqueIds = [...new Set(ids)];

    if (uniqueIds.length === 0) {
      return { successCount: 0, failedIds: [] };
    }

    setActionLoading(BULK_SUBMIT_ACTION_ID);
    setError(null);

    try {
      const submittedIds: string[] = [];
      const failedIds: string[] = [];

      for (let index = 0; index < uniqueIds.length; index += BULK_SUBMIT_CHUNK_SIZE) {
        const chunk = uniqueIds.slice(index, index + BULK_SUBMIT_CHUNK_SIZE);

        try {
          const response = await questionsService.submitMany(chunk);

          if (!response.success) {
            failedIds.push(...chunk);
            continue;
          }

          submittedIds.push(...response.data.submittedIds);
          failedIds.push(...response.data.failures.map((f) => f.id));
        } catch {
          failedIds.push(...chunk);
        }
      }

      if (failedIds.length > 0) {
        setError(`${failedIds.length} question(s) failed to submit`);
      }

      return { successCount: submittedIds.length, failedIds };
    } catch (err: unknown) {
      const msg = isAxiosError(err)
        ? err.response?.data?.message || 'Bulk submit failed'
        : 'Bulk submit failed';
      setError(msg);
      return { successCount: 0, failedIds: uniqueIds };
    } finally {
      setActionLoading(null);
    }
  };

  const approveQuestion = async (id: string): Promise<boolean> => {
    setActionLoading(id);
    setError(null);
    try {
      const response = await questionsService.approve(id);
      if (response.success) return true;
      setError(response.message || 'Failed to approve question');
      showClientErrorAlert('This action could not be completed. Please try again.', 'Action failed');
      return false;
    } catch (err: unknown) {
      const msg = isAxiosError(err)
        ? err.response?.data?.message || 'Failed to approve question'
        : 'Failed to approve question';
      setError(msg);
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  const approveQuestions = async (ids: string[]): Promise<{ successCount: number; failedIds: string[] }> => {
    const uniqueIds = [...new Set(ids)];

    if (uniqueIds.length === 0) {
      return { successCount: 0, failedIds: [] };
    }

    setActionLoading(BULK_APPROVE_ACTION_ID);
    setError(null);

    try {
      const results: Array<{ id: string; success: boolean }> = [];

      for (let index = 0; index < uniqueIds.length; index += BULK_APPROVE_CHUNK_SIZE) {
        const chunk = uniqueIds.slice(index, index + BULK_APPROVE_CHUNK_SIZE);
        const chunkResults = await Promise.all(
          chunk.map(async (id) => {
            try {
              const response = await questionsService.approve(id);
              return { id, success: response.success };
            } catch {
              return { id, success: false };
            }
          })
        );
        results.push(...chunkResults);
      }

      const failedIds = results.filter((result) => !result.success).map((result) => result.id);
      const successCount = results.length - failedIds.length;

      if (failedIds.length > 0) {
        setError(`${failedIds.length} question(s) failed to approve`);
      }

      return { successCount, failedIds };
    } finally {
      setActionLoading(null);
    }
  };

  const rejectQuestion = async (id: string, payload: RejectQuestionPayload): Promise<boolean> => {
    setActionLoading(id);
    setError(null);
    try {
      const response = await questionsService.reject(id, payload);
      if (response.success) return true;
      setError(response.message || 'Failed to reject question');
      showClientErrorAlert('This action could not be completed. Please try again.', 'Action failed');
      return false;
    } catch (err: unknown) {
      const msg = isAxiosError(err)
        ? err.response?.data?.message || 'Failed to reject question'
        : 'Failed to reject question';
      setError(msg);
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  const importQuestions = async (file: File): Promise<BulkImportResult | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await questionsService.import(file);
      if (response.success) return response.data;
      setError(response.message || 'Import failed');
      showClientErrorAlert('Import failed. Please check your file and try again.', 'Import failed');
      return null;
    } catch (err: unknown) {
      const msg = isAxiosError(err)
        ? err.response?.data?.message || 'Import failed'
        : 'Import failed';
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    questions,
    meta,
    isLoading,
    actionLoading,
    error,
    fetchQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    submitQuestion,
    submitQuestions,
    approveQuestion,
    approveQuestions,
    rejectQuestion,
    importQuestions,
  };
};
