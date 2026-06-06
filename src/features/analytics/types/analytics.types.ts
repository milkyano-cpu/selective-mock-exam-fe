export type RankingLevel = 'SUPERIOR' | 'ABOVE_AVERAGE' | 'HIGH_AVERAGE' | 'AVERAGE' | 'LOW_AVERAGE';
export type LeaderboardPeriod = 'WEEKLY' | 'MONTHLY' | 'ALL_TIME';
export type ExamType = 'MOCK_EXAM' | 'ASSIGNMENT';

export interface ExamHistoryItem {
  examId: string;
  examTitle: string;
  examType: ExamType;
  bestSessionId: string | null;
  bestScore: number | null;
  latestSessionId: string | null;
  latestScore: number | null;
  totalAttempts: number;
  rankingLevel: RankingLevel | null;
  totalTimeSeconds: number | null;
  takenAt: string;
  // Legacy aliases — kept for backward compatibility. Point to the best attempt.
  sessionId: string;
  finalScore: number | null;
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
  bandLevel: RankingLevel;
}

export interface ScoreHistoryItem {
  sessionId: string;
  examTitle: string;
  score: number;
  rankingLevel: RankingLevel | null;
  takenAt: string;
  attemptNumber: number;
}

export interface WritingPerformanceCriterion {
  criterionName: string;
  score: number;
  maxScore: number;
  scorePercent: number;
  feedback: string | null;
  strengths: string[];
  improvements: string[];
}

export interface WritingPerformanceItem {
  sessionId: string;
  examTitle: string;
  takenAt: string;
  bandLabel: string | null;
  bandDescriptor: string | null;
  criteria: WritingPerformanceCriterion[];
}

export interface MyAnalytics {
  overallAvg: number | null;
  totalExams: number;
  totalTimeSeconds: number;
  rankingLevel: RankingLevel | null;
  examHistory: ExamHistoryItem[];
  topicPerformance: TopicPerformanceItem[];
  subjectPerformance?: SubjectPerformanceItem[];
  scoreHistory?: ScoreHistoryItem[];
  percentile?: number | null;
  writingPerformance?: WritingPerformanceItem[];
}

export interface LeaderboardEntry {
  rank: number;
  studentId: string;
  studentName: string;
  avatarUrl: string | null;
  score: number;
  rankingLevel: RankingLevel | null;
  totalExams: number;
  avgTimeSeconds: number | null;
}

export interface Leaderboard {
  period: LeaderboardPeriod;
  entries: LeaderboardEntry[];
  myRank: {
    rank: number | null;
    studentId: string;
    studentName: string | null;
    avatarUrl: string | null;
    score: number | null;
    rankingLevel: RankingLevel | null;
    totalExams: number | null;
    avgTimeSeconds: number | null;
    percentile: number | null;
  };
}

export interface ChildActiveSubscription {
  id: string;
  tier: 'STANDARD' | 'PREMIUM';
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

// Lightweight item used in the parent child selector.
export interface ChildSummary {
  studentId: string;
  studentName: string;
  avatarUrl: string | null;
  tier: 'BASIC' | 'STANDARD' | 'PREMIUM';
  activeSubscription: ChildActiveSubscription | null;
}

export interface StudentAnalytics extends MyAnalytics {
  studentId: string;
  studentName: string;
  avatarUrl: string | null;
  tier?: 'BASIC' | 'STANDARD' | 'PREMIUM';
  activeSubscription?: ChildActiveSubscription | null;
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

// Lightweight list — used to populate the parent's child selector.
export interface ChildrenListResponse {
  success: boolean;
  message: string;
  data: ChildSummary[];
}

export interface ChildrenAnalyticsResponse {
  success: boolean;
  message: string;
  data: StudentAnalytics[];
}
