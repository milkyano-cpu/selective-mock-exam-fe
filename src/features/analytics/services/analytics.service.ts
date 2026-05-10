import mdwClient from '@/lib/mdwClient';
import type {
  MyAnalyticsResponse,
  LeaderboardResponse,
  StudentAnalyticsResponse,
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

  getChildrenAnalytics: async (): Promise<ChildrenAnalyticsResponse> => {
    const response = await mdwClient.get('/analytics/children');
    return response.data;
  },
};
