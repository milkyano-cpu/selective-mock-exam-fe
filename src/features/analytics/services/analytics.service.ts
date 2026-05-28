import mdwClient from '@/lib/mdwClient';
import type {
  MyAnalyticsResponse,
  LeaderboardResponse,
  StudentAnalyticsResponse,
  ChildrenListResponse,
  ChildrenAnalyticsResponse,
  LeaderboardPeriod,
} from '../types/analytics.types';

export const analyticsService = {
  getMyAnalytics: async (): Promise<MyAnalyticsResponse> => {
    const response = await mdwClient.get('/analytics/me');
    return response.data;
  },

  getLeaderboard: async (period: LeaderboardPeriod = 'ALL_TIME', examId?: string): Promise<LeaderboardResponse> => {
    const response = await mdwClient.get('/analytics/leaderboard', { params: { period, examId } });
    return response.data;
  },

  getStudentAnalytics: async (studentId: string): Promise<StudentAnalyticsResponse> => {
    const response = await mdwClient.get(`/analytics/students/${studentId}`);
    return response.data;
  },

  // Lightweight list of linked children — used to populate the parent's selector.
  getChildren: async (): Promise<ChildrenListResponse> => {
    const response = await mdwClient.get('/analytics/children');
    return response.data;
  },

  // Per-child analytics for the logged-in parent. Tier-gated.
  getChildAnalytics: async (studentId: string): Promise<StudentAnalyticsResponse> => {
    const response = await mdwClient.get(`/analytics/children/${studentId}`);
    return response.data;
  },

  // Deprecated — kept temporarily for components that still rely on the old
  // bulk-children endpoint shape. New code should use getChildren + getChildAnalytics.
  getChildrenAnalytics: async (): Promise<ChildrenAnalyticsResponse> => {
    const response = await mdwClient.get('/analytics/children');
    return response.data;
  },
};
