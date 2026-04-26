import { useState, useCallback } from 'react';
import { isAxiosError } from 'axios';
import { subjectsService } from '../services/subjects.service';
import {
  Topic,
  CreateTopicPayload,
  UpdateTopicPayload,
  ListQuery,
  PaginationMeta,
} from '../types/subjects.types';

export const useTopics = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTopics = useCallback(async (subjectId: string, query?: ListQuery) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await subjectsService.listTopics(subjectId, query);
      if (response.success) {
        setTopics(response.data);
        setMeta(response.meta);
      } else {
        setError(response.message || 'Failed to fetch topics');
      }
    } catch (err: unknown) {
      const msg = isAxiosError(err)
        ? err.response?.data?.message || 'Failed to fetch topics'
        : 'Failed to fetch topics';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createTopic = async (subjectId: string, payload: CreateTopicPayload): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await subjectsService.createTopic(subjectId, payload);
      if (response.success) {
        return true;
      }
      setError(response.message || 'Failed to create topic');
      return false;
    } catch (err: unknown) {
      const msg = isAxiosError(err)
        ? err.response?.data?.message || 'Failed to create topic'
        : 'Failed to create topic';
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateTopic = async (
    subjectId: string,
    topicId: string,
    payload: UpdateTopicPayload
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await subjectsService.updateTopic(subjectId, topicId, payload);
      if (response.success) {
        return true;
      }
      setError(response.message || 'Failed to update topic');
      return false;
    } catch (err: unknown) {
      const msg = isAxiosError(err)
        ? err.response?.data?.message || 'Failed to update topic'
        : 'Failed to update topic';
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTopic = async (subjectId: string, topicId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await subjectsService.deleteTopic(subjectId, topicId);
      if (response.success) {
        return true;
      }
      setError(response.message || 'Failed to delete topic');
      return false;
    } catch (err: unknown) {
      const msg = isAxiosError(err)
        ? err.response?.data?.message || 'Failed to delete topic'
        : 'Failed to delete topic';
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    topics,
    meta,
    isLoading,
    error,
    fetchTopics,
    createTopic,
    updateTopic,
    deleteTopic,
  };
};
