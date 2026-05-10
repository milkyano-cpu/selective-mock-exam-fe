export type RankingLevel = 'SUPERIOR' | 'ABOVE_AVERAGE' | 'HIGH_AVERAGE' | 'AVERAGE' | 'LOW_AVERAGE';
export type LeaderboardPeriod = 'WEEKLY' | 'MONTHLY' | 'ALL_TIME';

export interface ExamHistoryItem {
  sessionId: string;
  examId: string;
  examTitle: string;
  finalScore: number | null;
  rankingLevel: RankingLevel | null;
  totalTimeSeconds: number | null;
  takenAt: string;
}

export interface TopicPerformanceItem {
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  scoreAvg: number;
  attemptCount: number;
}

export interface SubjectPerformanceItem {
  subjectId: string;
  subjectName: string;
  scoreAvg: number;
  topicCount: number;
}

export interface MyAnalytics {
  overallAvg: number | null;
  totalExams: number;
  totalTimeSeconds: number;
  rankingLevel: RankingLevel | null;
  examHistory: ExamHistoryItem[];
  topicPerformance: TopicPerformanceItem[];
  subjectPerformance: SubjectPerformanceItem[];
}

export interface LeaderboardEntry {
  rank: number;
  studentId: string;
  studentName: string;
  avatarUrl: string | null;
  score: number;
  rankingLevel: RankingLevel | null;
  totalExams: number;
}

export interface Leaderboard {
  period: LeaderboardPeriod;
  entries: LeaderboardEntry[];
  myRank: { rank: number | null; score: number | null };
}

export interface StudentAnalytics extends MyAnalytics {
  studentId: string;
  studentName: string;
  avatarUrl: string | null;
}

// API responses
export interface MyAnalyticsResponse {
  success: boolean;
  message: string;
  data: MyAnalytics;
}

export interface LeaderboardResponse {
  success: boolean;
  message: string;
  data: Leaderboard;
}

export interface StudentAnalyticsResponse {
  success: boolean;
  message: string;
  data: StudentAnalytics;
}

export interface ChildrenAnalyticsResponse {
  success: boolean;
  message: string;
  data: StudentAnalytics[];
}
