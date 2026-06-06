import { useState, useCallback } from 'react';
import { isAxiosError } from 'axios';
import { examService, type ListExamsParams } from '../services/exams.service';
import type { ExamItem, ExamQuestionItem, PaginationMeta, CreateExamPayload, UpdateExamPayload, AddExamQuestionsPayload } from '../types/exams.types';

export const useExams = () => {
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExams = useCallback(async (params?: ListExamsParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await examService.list(params);
      if (response.success) {
        setExams(response.data);
        setMeta(response.meta);
      } else {
        setError(response.message || 'Failed to fetch exams');
      }
    } catch (err: unknown) {
      const msg = isAxiosError(err) ? err.response?.data?.message || 'Failed to fetch exams' : 'Failed to fetch exams';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createExam = async (payload: CreateExamPayload): Promise<ExamItem | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await examService.create(payload);
      if (response.success) return response.data;
      setError(response.message || 'Failed to create exam');
      return null;
    } catch (err: unknown) {
      const msg = isAxiosError(err) ? err.response?.data?.message || 'Failed to create exam' : 'Failed to create exam';
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateExam = async (id: string, payload: UpdateExamPayload): Promise<ExamItem | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await examService.update(id, payload);
      if (response.success) return response.data;
      setError(response.message || 'Failed to update exam');
      return null;
    } catch (err: unknown) {
      const msg = isAxiosError(err) ? err.response?.data?.message || 'Failed to update exam' : 'Failed to update exam';
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteExam = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await examService.remove(id);
      if (response.success) return true;
      setError(response.message || 'Failed to delete exam');
      return false;
    } catch (err: unknown) {
      const msg = isAxiosError(err) ? err.response?.data?.message || 'Failed to delete exam' : 'Failed to delete exam';
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const addQuestionsToExam = async (examId: string, payload: AddExamQuestionsPayload): Promise<ExamQuestionItem[] | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await examService.addQuestions(examId, payload);
      if (response.success) return response.data;
      setError(response.message || 'Failed to add questions');
      return null;
    } catch (err: unknown) {
      const msg = isAxiosError(err) ? err.response?.data?.message || 'Failed to add questions' : 'Failed to add questions';
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const removeQuestionFromExam = async (examId: string, questionId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await examService.removeQuestion(examId, questionId);
      if (response.success) return true;
      setError(response.message || 'Failed to remove question');
      return false;
    } catch (err: unknown) {
      const msg = isAxiosError(err) ? err.response?.data?.message || 'Failed to remove question' : 'Failed to remove question';
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    exams,
    meta,
    isLoading,
    error,
    fetchExams,
    createExam,
    updateExam,
    deleteExam,
    addQuestionsToExam,
    removeQuestionFromExam,
  };
};
