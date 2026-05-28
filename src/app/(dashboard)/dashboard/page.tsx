'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { isAxiosError } from 'axios';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { analyticsService } from '@/features/analytics/services/analytics.service';
import { FeaturePaywall } from '@/components/billing/FeaturePaywall';
import { hasFullPracticeAccess, hasPremiumAccess } from '@/features/membership/access';
import { showApiErrorAlert } from '@/lib/errorAlert';
import type { MyAnalytics, Leaderboard, StudentAnalytics } from '@/features/analytics/types/analytics.types';
import {
  TrendingUp,
  Users,
  Trophy,
  Clock,
  Target,
  AlertTriangle,
  Award,
  ChevronDown,
  FileText,
  Crown,
  Search,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Label, BarChart, Bar, Legend } from 'recharts';

const RANKING_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  SUPERIOR: { label: 'Superior', color: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  ABOVE_AVERAGE: { label: 'Above Average', color: 'text-green-700 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
  HIGH_AVERAGE: { label: 'High Average', color: 'text-teal-700 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-900/30' },
  AVERAGE: { label: 'Average', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  LOW_AVERAGE: { label: 'Low Average', color: 'text-slate-700 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' },
};

const AVATAR_PALETTE = [
  'bg-rose-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-teal-500',
  'bg-sky-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-fuchsia-500',
  'bg-pink-500',
];

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function getAvatarColor(seed: string | null | undefined): string {
  if (!seed) return AVATAR_PALETTE[0]!;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length]!;
}

function formatAvgTime(seconds: number): string {
  if (seconds <= 0) return '—';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remMin = minutes % 60;
  return remMin === 0 ? `${hours}h` : `${hours}h ${remMin}m`;
}

function LeaderboardAvatar({
  name,
  src,
  seed,
  sizeClass,
  textClass,
}: {
  name: string | null;
  src: string | null;
  seed: string;
  sizeClass: string;
  textClass: string;
}) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name ?? 'Avatar'} className={`${sizeClass} shrink-0 rounded-full object-cover`} />;
  }
  const color = getAvatarColor(seed);
  return (
    <div className={`${sizeClass} shrink-0 rounded-full ${color} flex items-center justify-center font-black text-white ${textClass}`}>
      {getInitials(name)}
    </div>
  );
}

function PodiumRow({
  entry,
  isMe,
  myPercentile,
}: {
  entry: import('@/features/analytics/types/analytics.types').LeaderboardEntry;
  isMe: boolean;
  myPercentile: number | null;
}) {
  if (entry.rank === 1) return <PodiumRowChampion entry={entry} isMe={isMe} myPercentile={myPercentile} />;
  if (entry.rank === 2) return <PodiumRowSilver entry={entry} isMe={isMe} myPercentile={myPercentile} />;
  return <PodiumRowBronze entry={entry} isMe={isMe} myPercentile={myPercentile} />;
}

function PodiumMeta({
  entry,
  toneClass,
  isMe,
  myPercentile,
}: {
  entry: import('@/features/analytics/types/analytics.types').LeaderboardEntry;
  toneClass: string;
  isMe: boolean;
  myPercentile: number | null;
}) {
  const rankConfig = entry.rankingLevel ? RANKING_CONFIG[entry.rankingLevel] : null;
  return (
    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
      {rankConfig && (
        <span className={`rounded-md px-1.5 py-0.5 font-black ${rankConfig.bg} ${rankConfig.color}`}>
          {rankConfig.label}
        </span>
      )}
      <span className={`font-medium ${toneClass}`}>{entry.totalExams} exams</span>
      {entry.avgTimeSeconds !== null && (
        <span className={`font-medium ${toneClass}`}>· ⏱ {formatAvgTime(entry.avgTimeSeconds)}</span>
      )}
      {isMe && myPercentile !== null && (
        <span className="rounded-md bg-sky-100 px-1.5 py-0.5 font-black text-[#0A9AE2] dark:bg-sky-900/30">
          Top {(100 - myPercentile).toFixed(1)}%
        </span>
      )}
    </div>
  );
}

function PodiumRowChampion({
  entry,
  isMe,
  myPercentile,
}: {
  entry: import('@/features/analytics/types/analytics.types').LeaderboardEntry;
  isMe: boolean;
  myPercentile: number | null;
}) {
  const meRingClass = isMe ? 'ring-2 ring-[#0A9AE2] ring-offset-2 dark:ring-offset-slate-900' : '';
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50/70 p-4 shadow-lg shadow-amber-200/40 dark:border-amber-800 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-orange-950/30 dark:shadow-amber-950/20 ${meRingClass}`}
    >
      {/* Decorative giant "1" watermark */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-3 -top-10 select-none text-[140px] font-black leading-none text-amber-300/40 dark:text-amber-700/30"
      >
        1
      </span>
      {/* Soft glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-amber-300/40 blur-3xl dark:bg-amber-600/20"
      />
      {/* Sparkle dots */}
      <div aria-hidden className="pointer-events-none absolute right-8 top-3 h-1.5 w-1.5 rounded-full bg-amber-400" />
      <div aria-hidden className="pointer-events-none absolute right-14 top-7 h-1 w-1 rounded-full bg-yellow-400" />
      <div aria-hidden className="pointer-events-none absolute right-4 bottom-3 h-1 w-1 rounded-full bg-orange-400" />

      <div className="relative flex items-center gap-3">
        <div className="relative shrink-0">
          <LeaderboardAvatar
            name={entry.studentName}
            src={entry.avatarUrl}
            seed={entry.studentId}
            sizeClass="h-14 w-14 ring-4 ring-amber-300 dark:ring-amber-700"
            textClass="text-base"
          />
          {/* Tilted crown sitting on top-right of avatar */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-2 -top-3 rotate-[25deg] text-amber-500 drop-shadow-[0_2px_4px_rgba(217,119,6,0.45)] dark:text-amber-400"
          >
            <Crown size={22} fill="currentColor" strokeWidth={1.5} />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-xl font-black text-amber-900 dark:text-amber-100">
            {entry.studentName}
            {isMe && <span className="ml-1.5 text-[11px] font-bold text-[#0A9AE2]">(You)</span>}
          </h3>
          <PodiumMeta
            entry={entry}
            toneClass="text-amber-700/80 dark:text-amber-400/80"
            isMe={isMe}
            myPercentile={myPercentile}
          />
        </div>

        <div className="shrink-0 text-right">
          <div className="text-3xl font-black tracking-tight text-amber-700 dark:text-amber-400">
            {entry.score.toFixed(0)}
          </div>
          <p className="text-[9px] font-black uppercase tracking-wide text-amber-600/70 dark:text-amber-500/70">
            avg
          </p>
        </div>
      </div>
    </div>
  );
}

function PodiumRowSilver({
  entry,
  isMe,
  myPercentile,
}: {
  entry: import('@/features/analytics/types/analytics.types').LeaderboardEntry;
  isMe: boolean;
  myPercentile: number | null;
}) {
  const meRingClass = isMe ? 'ring-2 ring-[#0A9AE2] ring-offset-2 dark:ring-offset-slate-900' : '';
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-slate-300 bg-gradient-to-r from-slate-100 via-slate-50 to-white p-3.5 dark:border-slate-700 dark:from-slate-800/70 dark:via-slate-800/30 dark:to-slate-900 ${meRingClass}`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-2 -top-6 select-none text-[88px] font-black leading-none text-slate-300/60 dark:text-slate-700/60"
      >
        2
      </span>
      <div className="relative flex items-center gap-3">
        <LeaderboardAvatar
          name={entry.studentName}
          src={entry.avatarUrl}
          seed={entry.studentId}
          sizeClass="h-12 w-12 ring-2 ring-slate-200 dark:ring-slate-700"
          textClass="text-xs"
        />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-black text-slate-900 dark:text-slate-100">
            {entry.studentName}
            {isMe && <span className="ml-1.5 text-[11px] font-bold text-[#0A9AE2]">(You)</span>}
          </h3>
          <PodiumMeta
            entry={entry}
            toneClass="text-slate-500 dark:text-slate-400"
            isMe={isMe}
            myPercentile={myPercentile}
          />
        </div>
        <div className="shrink-0 text-right">
          <div className="text-2xl font-black tracking-tight text-slate-700 dark:text-slate-200">
            {entry.score.toFixed(0)}
          </div>
          <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">avg</p>
        </div>
      </div>
    </div>
  );
}

function PodiumRowBronze({
  entry,
  isMe,
  myPercentile,
}: {
  entry: import('@/features/analytics/types/analytics.types').LeaderboardEntry;
  isMe: boolean;
  myPercentile: number | null;
}) {
  const meRingClass = isMe ? 'ring-2 ring-[#0A9AE2] ring-offset-2 dark:ring-offset-slate-900' : '';
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-orange-300 bg-gradient-to-r from-orange-50 via-amber-50/70 to-white p-3.5 dark:border-orange-900/60 dark:from-orange-950/30 dark:via-amber-950/20 dark:to-slate-900 ${meRingClass}`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-2 -top-6 select-none text-[88px] font-black leading-none text-orange-300/60 dark:text-orange-700/40"
      >
        3
      </span>
      <div className="relative flex items-center gap-3">
        <LeaderboardAvatar
          name={entry.studentName}
          src={entry.avatarUrl}
          seed={entry.studentId}
          sizeClass="h-12 w-12 ring-2 ring-orange-200 dark:ring-orange-900/50"
          textClass="text-xs"
        />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-black text-orange-900 dark:text-orange-100">
            {entry.studentName}
            {isMe && <span className="ml-1.5 text-[11px] font-bold text-[#0A9AE2]">(You)</span>}
          </h3>
          <PodiumMeta
            entry={entry}
            toneClass="text-orange-700/80 dark:text-orange-400/80"
            isMe={isMe}
            myPercentile={myPercentile}
          />
        </div>
        <div className="shrink-0 text-right">
          <div className="text-2xl font-black tracking-tight text-orange-700 dark:text-orange-400">
            {entry.score.toFixed(0)}
          </div>
          <p className="text-[9px] font-black uppercase tracking-wide text-orange-600/70 dark:text-orange-500/70">
            avg
          </p>
        </div>
      </div>
    </div>
  );
}

function CompactLeaderRow({
  entry,
  isMe,
  myPercentile,
}: {
  entry: import('@/features/analytics/types/analytics.types').LeaderboardEntry;
  isMe: boolean;
  myPercentile: number | null;
}) {
  const rankConfig = entry.rankingLevel ? RANKING_CONFIG[entry.rankingLevel] : null;
  return (
    <div
      className={`group flex items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
        isMe
          ? 'bg-[#0A9AE2]/8 ring-1 ring-[#0A9AE2]/30 dark:bg-[#0A9AE2]/10 dark:ring-[#0A9AE2]/40'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
      }`}
    >
      <span className="w-6 shrink-0 text-center text-xs font-black text-slate-400 dark:text-slate-500">
        {entry.rank}
      </span>
      <LeaderboardAvatar
        name={entry.studentName}
        src={entry.avatarUrl}
        seed={entry.studentId}
        sizeClass="h-8 w-8"
        textClass="text-[10px]"
      />
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-bold ${isMe ? 'text-[#0A9AE2]' : 'text-slate-800 dark:text-slate-200'}`}>
          {entry.studentName}
          {isMe && <span className="ml-1 text-[10px] font-bold">(You)</span>}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px]">
          {rankConfig && (
            <span className={`rounded-md px-1.5 py-0.5 font-bold ${rankConfig.bg} ${rankConfig.color}`}>
              {rankConfig.label}
            </span>
          )}
          <span className="font-medium text-slate-500 dark:text-slate-400">
            {entry.totalExams} exams
          </span>
          {entry.avgTimeSeconds !== null && (
            <span className="font-medium text-slate-500 dark:text-slate-400">
              · ⏱ {formatAvgTime(entry.avgTimeSeconds)}
            </span>
          )}
          {isMe && myPercentile !== null && (
            <span className="rounded-md bg-sky-100 px-1.5 py-0.5 font-black text-[#0A9AE2] dark:bg-sky-900/30">
              Top {(100 - myPercentile).toFixed(1)}%
            </span>
          )}
        </div>
      </div>
      <div className="shrink-0 text-right text-sm font-black text-slate-700 dark:text-slate-200">
        {entry.score.toFixed(0)}
      </div>
    </div>
  );
}

function YouCard({
  myRank,
}: {
  myRank: import('@/features/analytics/types/analytics.types').Leaderboard['myRank'];
}) {
  const cfg = myRank.rankingLevel ? RANKING_CONFIG[myRank.rankingLevel] : null;
  return (
    <div className="mt-auto flex flex-col gap-2">
      <div className="flex items-center justify-center gap-2 px-1">
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Your position</span>
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="relative overflow-hidden rounded-2xl border-2 border-[#0A9AE2] bg-gradient-to-br from-[#0A9AE2]/10 via-sky-50 to-white p-4 shadow-sm dark:from-[#0A9AE2]/15 dark:via-sky-900/10 dark:to-slate-900">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#0A9AE2]/10 blur-2xl" aria-hidden />
        <div className="relative flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#0A9AE2] text-white shadow-md">
            <span className="text-[9px] font-black uppercase leading-none">Rank</span>
            <span className="text-base font-black leading-tight">#{myRank.rank}</span>
          </div>
          <LeaderboardAvatar
            name={myRank.studentName}
            src={myRank.avatarUrl}
            seed={myRank.studentId}
            sizeClass="h-10 w-10"
            textClass="text-xs"
          />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-black text-slate-900 dark:text-slate-100">
              {myRank.studentName} <span className="text-[10px] font-bold text-[#0A9AE2]">(You)</span>
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
              {cfg && (
                <span className={`rounded-md px-1.5 py-0.5 font-black ${cfg.bg} ${cfg.color}`}>
                  {cfg.label}
                </span>
              )}
              <span className="font-medium text-slate-500 dark:text-slate-400">
                {myRank.totalExams ?? 0} exams
              </span>
              {myRank.avgTimeSeconds !== null && (
                <span className="font-medium text-slate-500 dark:text-slate-400">
                  · ⏱ {formatAvgTime(myRank.avgTimeSeconds)}
                </span>
              )}
              {myRank.percentile !== null && (
                <span className="rounded-md bg-[#0A9AE2] px-1.5 py-0.5 font-black text-white">
                  Top {(100 - myRank.percentile).toFixed(1)}%
                </span>
              )}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-2xl font-black tracking-tight text-[#0A9AE2]">
              {myRank.score?.toFixed(0) ?? '—'}
            </div>
            <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">avg</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RankRace({
  leaderboard,
  currentUserId,
}: {
  leaderboard: import('@/features/analytics/types/analytics.types').Leaderboard;
  currentUserId: string | undefined;
}) {
  type Entry = import('@/features/analytics/types/analytics.types').LeaderboardEntry;

  const myEntryFromTop = leaderboard.entries.find((e) => e.studentId === currentUserId) ?? null;
  // Build a "self" snapshot whether user is inside top10 or outside
  const myScore = myEntryFromTop?.score ?? leaderboard.myRank.score;
  const myRankNum = myEntryFromTop?.rank ?? leaderboard.myRank.rank;

  if (myScore === null || myRankNum === null) return null;

  // For "climb": entry just above me. For "defend": entry just below me.
  // Source: leaderboard.entries (top 10). If user outside top 10, climbTarget
  // is rank 10 (closest one to catch); defendThreat is null (no info beyond top 10).
  let climbTarget: Entry | null = null;
  let defendThreat: Entry | null = null;

  const myIndexInTop = leaderboard.entries.findIndex((e) => e.studentId === currentUserId);

  if (myIndexInTop > 0) {
    climbTarget = leaderboard.entries[myIndexInTop - 1] ?? null;
  } else if (myIndexInTop === -1) {
    // Outside top 10 — closest known competitor is rank 10
    climbTarget = leaderboard.entries[leaderboard.entries.length - 1] ?? null;
  }

  if (myIndexInTop >= 0 && myIndexInTop < leaderboard.entries.length - 1) {
    defendThreat = leaderboard.entries[myIndexInTop + 1] ?? null;
  }

  const isAtTop = myRankNum === 1;
  const hasNothingToShow = !climbTarget && !defendThreat && !isAtTop;
  if (hasNothingToShow) return null;

  return (
    <div className="mt-2 flex flex-col gap-2">
      <div className="flex items-center gap-2 px-1">
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Race to the top</span>
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
      </div>

      {isAtTop ? (
        <div className="overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50/70 p-4 dark:border-amber-900/60 dark:from-amber-950/30 dark:via-yellow-950/20 dark:to-orange-950/20">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🏆</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-amber-900 dark:text-amber-100">You&apos;re at the top</p>
              {defendThreat && (
                <p className="text-[11px] font-medium text-amber-700/80 dark:text-amber-400/80">
                  Defending +{Math.max(0, Math.round(myScore - defendThreat.score))} pts gap from {defendThreat.studentName}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {climbTarget && (
            <RankRaceTile
              kind="climb"
              targetEntry={climbTarget}
              myScore={myScore}
              myRank={myRankNum}
              currentUserId={currentUserId}
            />
          )}
          {defendThreat && (
            <RankRaceTile
              kind="defend"
              targetEntry={defendThreat}
              myScore={myScore}
              myRank={myRankNum}
              currentUserId={currentUserId}
            />
          )}
        </div>
      )}
    </div>
  );
}

function RankRaceTile({
  kind,
  targetEntry,
  myScore,
  myRank,
  currentUserId,
}: {
  kind: 'climb' | 'defend';
  targetEntry: import('@/features/analytics/types/analytics.types').LeaderboardEntry;
  myScore: number;
  myRank: number;
  currentUserId: string | undefined;
}) {
  const targetScore = targetEntry.score;
  const isClimb = kind === 'climb';
  const delta = Math.abs(myScore - targetScore);
  const deltaRounded = Math.round(delta * 10) / 10;
  const climbProgress = targetScore > 0 ? Math.min(100, Math.max(0, (myScore / targetScore) * 100)) : 0;
  // For defend: how much "buffer" we have. Higher = safer. Cap at 100% visual.
  const defendBuffer = targetScore > 0 ? Math.min(100, Math.max(0, ((myScore - targetScore) / Math.max(1, myScore)) * 100 + 30)) : 30;

  const palette = isClimb
    ? {
        card: 'border-sky-200 bg-gradient-to-br from-sky-50 via-blue-50 to-white dark:border-sky-900/50 dark:from-sky-950/30 dark:via-blue-950/20 dark:to-slate-900',
        eyebrow: 'text-sky-700 dark:text-sky-400',
        bar: 'bg-gradient-to-r from-sky-400 to-[#0A9AE2]',
        track: 'bg-sky-100 dark:bg-sky-950/50',
        deltaText: 'text-sky-700 dark:text-sky-400',
        icon: '↑',
      }
    : {
        card: 'border-orange-200 bg-gradient-to-br from-orange-50 via-amber-50 to-white dark:border-orange-900/50 dark:from-orange-950/30 dark:via-amber-950/20 dark:to-slate-900',
        eyebrow: 'text-orange-700 dark:text-orange-400',
        bar: 'bg-gradient-to-r from-amber-400 to-orange-500',
        track: 'bg-orange-100 dark:bg-orange-950/50',
        deltaText: 'text-orange-700 dark:text-orange-400',
        icon: '🛡',
      };

  const eyebrowText = isClimb ? `Climb to #${targetEntry.rank}` : `Defending #${myRank} from #${targetEntry.rank}`;
  const widthPercent = isClimb ? climbProgress : defendBuffer;
  const isMeTarget = targetEntry.studentId === currentUserId;

  return (
    <div className={`rounded-2xl border p-3 ${palette.card}`}>
      <div className="flex items-center justify-between gap-2">
        <p className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-wider ${palette.eyebrow}`}>
          <span className="text-sm leading-none">{palette.icon}</span>
          {eyebrowText}
        </p>
        <span className={`text-xs font-black ${palette.deltaText}`}>
          {isClimb ? '+' : '−'}{deltaRounded.toFixed(deltaRounded % 1 === 0 ? 0 : 1)} pts
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2.5">
        <LeaderboardAvatar
          name={targetEntry.studentName}
          src={targetEntry.avatarUrl}
          seed={targetEntry.studentId}
          sizeClass="h-9 w-9"
          textClass="text-[10px]"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-black text-slate-800 dark:text-slate-200">
            {targetEntry.studentName}
            {isMeTarget && <span className="ml-1 text-[10px] font-bold text-[#0A9AE2]">(You)</span>}
          </p>
          <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
            avg {targetEntry.score.toFixed(0)} · {targetEntry.totalExams} exams
          </p>
        </div>
      </div>
      <div
        className={`mt-2.5 h-2 w-full overflow-hidden rounded-full ${palette.track}`}
        role="progressbar"
        aria-valuenow={Math.round(widthPercent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={isClimb ? 'Progress towards next rank' : 'Buffer over chaser'}
      >
        <div
          className={`h-full rounded-full ${palette.bar} transition-[width] duration-700`}
          style={{ width: `${widthPercent}%` }}
        />
      </div>
      <p className="mt-1.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
        {isClimb
          ? `You: ${myScore.toFixed(0)}  •  Target: ${targetScore.toFixed(0)}`
          : `You: ${myScore.toFixed(0)}  •  Behind: ${targetScore.toFixed(0)}`}
      </p>
    </div>
  );
}

const EMPTY_ANALYTICS: MyAnalytics = {
  overallAvg: null,
  totalExams: 0,
  totalTimeSeconds: 0,
  rankingLevel: null,
  examHistory: [],
  topicPerformance: [],
  subjectPerformance: [],
  scoreHistory: [],
  percentile: null,
  writingPerformance: [],
};

type ScoreHistoryTooltipPayload = {
  fullName?: string;
  score?: number;
  attemptNumber?: number;
  rankingLevel?: string | null;
  takenAt?: string;
  sessionId?: string;
};

function ScoreHistoryTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: ScoreHistoryTooltipPayload }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0]?.payload;
  if (!item) return null;
  const cfg = item.rankingLevel ? RANKING_CONFIG[item.rankingLevel] : null;
  const dateStr = item.takenAt ? new Date(item.takenAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : null;

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/95 px-3 py-2 text-white shadow-xl backdrop-blur-sm">
      <p className="text-xs font-black">
        {item.fullName ?? ''}
        {item.attemptNumber && item.attemptNumber > 1 && (
          <span className="ml-1 font-bold text-slate-400">(Attempt {item.attemptNumber})</span>
        )}
      </p>
      <p className="mt-1 text-sm font-black text-[#0A9AE2]">
        Score: {item.score?.toFixed(1) ?? '—'}%
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-bold">
        {cfg && (
          <span className={`rounded-md px-1.5 py-0.5 ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
        )}
        {dateStr && <span className="text-slate-300">{dateStr}</span>}
      </div>
    </div>
  );
}

function TopicMasteryChart({ strongList, averageList, weakList, total }: {
  strongList: { topicId: string; topicName: string; subjectName: string; scoreAvg: number }[];
  averageList: { topicId: string; topicName: string; subjectName: string; scoreAvg: number }[];
  weakList: { topicId: string; topicName: string; subjectName: string; scoreAvg: number }[];
  total: number;
}) {
  const [expanded, setExpanded] = useState<'strong' | 'average' | 'weak' | null>(null);

  const handleClick = (category: 'strong' | 'average' | 'weak') => {
    setExpanded(expanded === category ? null : category);
  };

  const expandedList = expanded === 'strong' ? strongList : expanded === 'average' ? averageList : expanded === 'weak' ? weakList : [];
  const expandedColor = expanded === 'strong' ? 'emerald' : expanded === 'average' ? 'amber' : 'red';
  const expandedLabel = expanded === 'strong' ? 'Strong Topics' : expanded === 'average' ? 'Average Topics' : 'Weak Topics';

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
      <p className="text-[11px] font-black uppercase tracking-wide text-slate-400 mb-2 text-center">Topic Mastery</p>
      <div className="flex items-center gap-4">
        <div className="h-[120px] w-[120px] shrink-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Strong', value: strongList.length },
                  { name: 'Average', value: averageList.length },
                  { name: 'Weak', value: weakList.length },
                ].filter(d => d.value > 0)}
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={50}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {strongList.length > 0 && <Cell fill="#10b981" />}
                {averageList.length > 0 && <Cell fill="#f59e0b" />}
                {weakList.length > 0 && <Cell fill="#ef4444" />}
                <Label
                  value={total.toString()}
                  position="center"
                  style={{ fontSize: '16px', fontWeight: 900 }}
                  className="fill-slate-900 dark:fill-slate-100"
                />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-1.5">
          <button
            type="button"
            onClick={() => handleClick('strong')}
            className={`w-full flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors ${expanded === 'strong' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}
          >
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Strong (≥70%)</span>
            </div>
            <span className="text-xs font-black text-emerald-600">{strongList.length}</span>
          </button>
          <button
            type="button"
            onClick={() => handleClick('average')}
            className={`w-full flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors ${expanded === 'average' ? 'bg-amber-100 dark:bg-amber-900/30' : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}
          >
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Average (50-69%)</span>
            </div>
            <span className="text-xs font-black text-amber-600">{averageList.length}</span>
          </button>
          <button
            type="button"
            onClick={() => handleClick('weak')}
            className={`w-full flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors ${expanded === 'weak' ? 'bg-red-100 dark:bg-red-900/30' : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}
          >
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Weak (&lt;50%)</span>
            </div>
            <span className="text-xs font-black text-red-600">{weakList.length}</span>
          </button>
        </div>
      </div>

      {/* Expanded topic list */}
      {expanded && expandedList.length > 0 && (
        <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-700">
          <p className={`text-[10px] font-black uppercase tracking-wide mb-2 text-${expandedColor}-600 dark:text-${expandedColor}-400`}>
            {expandedLabel}
          </p>
          <div className="space-y-1 max-h-[140px] overflow-y-auto scrollbar-hide">
            {expandedList.sort((a, b) => b.scoreAvg - a.scoreAvg).map((t) => (
              <div key={t.topicId} className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-1.5 dark:bg-slate-900">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">{t.topicName}</p>
                  <p className="text-[10px] text-slate-400 truncate">{t.subjectName}</p>
                </div>
                <span className={`text-[11px] font-black shrink-0 text-${expandedColor}-600`}>{Math.round(t.scoreAvg)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StudentPerformanceAnalytics() {
  const [analytics, setAnalytics] = useState<MyAnalytics | null>(null);
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBasicLimited, setIsBasicLimited] = useState(false);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentUser = useAuthStore((state) => state.user);
  const canViewStandardAnalytics = !isBasicLimited && hasFullPracticeAccess(currentUser);
  const canViewWritingAnalytics = !isBasicLimited && hasPremiumAccess(currentUser);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef?.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownRef]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setIsBasicLimited(false);
      try {
        const analyticsRes = await analyticsService.getMyAnalytics();
        if (analyticsRes.success) setAnalytics(analyticsRes.data);
      } catch (err) {
        if (
          isAxiosError<{ error?: string }>(err) &&
          err.response?.status === 403 &&
          err.response.data?.error === 'tier_required'
        ) {
          setAnalytics(null);
          setIsBasicLimited(true);
        } else {
          void showApiErrorAlert(err, currentUser?.role, { context: 'load' });
        }
      } finally {
        setIsLoading(false);
      }
    };
    void fetchData();
  }, [currentUser?.role, currentUser?.tier]);

  useEffect(() => {
    if (!canViewStandardAnalytics || isLoading || !analytics) return;
    const fetchLeaderboard = async () => {
      setIsLeaderboardLoading(true);
      try {
        const res = await analyticsService.getLeaderboard('ALL_TIME', selectedExamId || undefined);
        if (res.success) setLeaderboard(res.data);
      } catch (err) {
        void showApiErrorAlert(err, currentUser?.role, { context: 'load' });
      } finally {
        setIsLeaderboardLoading(false);
      }
    };
    void fetchLeaderboard();
  }, [selectedExamId, isLoading, analytics, canViewStandardAnalytics, currentUser?.role]);

  const uniqueExams = useMemo(() => {
    if (!analytics) return [];
    const map = new Map<string, { id: string, title: string }>();
    analytics.examHistory.forEach(h => {
      if (!map.has(h.examId)) {
        map.set(h.examId, { id: h.examId, title: h.examTitle });
      }
    });
    return Array.from(map.values());
  }, [analytics]);

  if (isLoading || (!analytics && !isBasicLimited) || (canViewStandardAnalytics && !leaderboard)) {
    return (
      <div className="grid w-full min-w-0 grid-cols-1 gap-6 lg:grid-cols-2 animate-pulse">
        {/* Analytics skeleton */}
        <div className="rounded-[2rem] border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8 flex flex-col gap-6">
          <div>
            <div className="h-6 w-32 rounded-lg bg-slate-200/70 dark:bg-slate-800" />
            <div className="mt-2 h-4 w-52 rounded-lg bg-slate-100 dark:bg-slate-800/60" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                <div className="mx-auto h-3 w-16 rounded bg-slate-200/70 dark:bg-slate-700" />
                <div className="mx-auto mt-3 h-7 w-10 rounded bg-slate-200/70 dark:bg-slate-700" />
              </div>
            ))}
          </div>
          <div className="h-[120px] rounded-2xl bg-slate-50 dark:bg-slate-800/30" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-28 rounded-2xl bg-emerald-50/50 dark:bg-emerald-900/10" />
            <div className="h-28 rounded-2xl bg-rose-50/50 dark:bg-rose-900/10" />
          </div>
          <div className="h-[180px] rounded-2xl bg-slate-50 dark:bg-slate-800/30" />
        </div>
        {/* Leaderboard skeleton */}
        <div className="rounded-[2rem] border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8 flex flex-col gap-3">
          <div className="mb-3">
            <div className="h-6 w-44 rounded-lg bg-slate-200/70 dark:bg-slate-800" />
            <div className="mt-2 h-4 w-56 rounded-lg bg-slate-100 dark:bg-slate-800/60" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="h-12 w-12 shrink-0 rounded-full bg-slate-100 dark:bg-slate-800/80" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-28 rounded bg-slate-200/70 dark:bg-slate-700" />
                <div className="h-3 w-20 rounded bg-slate-100 dark:bg-slate-800/60" />
              </div>
              <div className="h-7 w-10 rounded bg-slate-200/70 dark:bg-slate-700" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const visibleAnalytics = analytics ?? EMPTY_ANALYTICS;
  const { totalExams, overallAvg, totalTimeSeconds, topicPerformance } = visibleAnalytics;
  const scoreHistory = visibleAnalytics.scoreHistory ?? [];
  const subjectPerformance = visibleAnalytics.subjectPerformance ?? [];
  const writingPerformance = visibleAnalytics.writingPerformance ?? [];

  // Strength and Weakness
  const sortedTopics = [...topicPerformance].sort((a, b) => b.scoreAvg - a.scoreAvg);
  const strengths = sortedTopics.filter(t => t.scoreAvg >= 70).slice(0, 3);
  const weaknesses = [...sortedTopics].sort((a, b) => a.scoreAvg - b.scoreAvg).slice(0, 3).filter(t => t.scoreAvg < 70);

  const formatTime = (seconds: number) => {
    if (seconds === 0) return '0m';
    if (seconds < 60) return `${seconds}s`;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <div className="grid w-full min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
      
      {/* Analytics Card */}
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8 flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="text-[#0A9AE2]" /> Analytics
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Your overall performance overview</p>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50 text-center">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wide text-slate-400">Total Exams</p>
            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">{totalExams}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50 text-center">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wide text-slate-400">Avg Score</p>
            <p className="mt-1 text-2xl font-black text-[#0A9AE2]">{overallAvg?.toFixed(1) ?? '0'}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50 text-center">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wide text-slate-400">Time Spent</p>
            <p className="mt-1 text-xl font-black text-slate-900 dark:text-slate-100">{formatTime(totalTimeSeconds)}</p>
          </div>
        </div>

        {/* Personal Analytics Donut - Strengths vs Weaknesses */}
        {canViewStandardAnalytics ? (
          topicPerformance.length > 0 ? (() => {
            const strongList = topicPerformance.filter(t => t.scoreAvg >= 70);
            const averageList = topicPerformance.filter(t => t.scoreAvg >= 50 && t.scoreAvg < 70);
            const weakList = topicPerformance.filter(t => t.scoreAvg < 50);
            const total = topicPerformance.length;

            return <TopicMasteryChart strongList={strongList} averageList={averageList} weakList={weakList} total={total} />;
          })() : (
            <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-xs font-medium text-slate-400">No topic performance yet</p>
            </div>
          )
        ) : (
          <FeaturePaywall
            compact
            requiredTier="STANDARD"
            title="Topic mastery requires Standard"
            description="Upgrade to unlock your mastery breakdown by topic."
          />
        )}

        {/* Strength & Weakness */}
        {canViewStandardAnalytics ? (
          <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-900/30 dark:bg-emerald-900/10">
            <h3 className="mb-3 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-500">
              <Target size={14} /> Strengths
            </h3>
            {strengths.length > 0 ? (
              <div className="flex flex-col gap-2">
                {strengths.map(t => (
                  <div key={t.topicId} className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold text-emerald-900 dark:text-emerald-300" title={t.topicName}>{t.topicName}</span>
                    <span className="shrink-0 text-xs font-black text-emerald-600 dark:text-emerald-400">{Math.round(t.scoreAvg)}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-medium text-emerald-600/60 dark:text-emerald-500/60">Keep practicing to build your strengths!</p>
            )}
          </div>
          
          <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 dark:border-rose-900/30 dark:bg-rose-900/10">
            <h3 className="mb-3 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-rose-700 dark:text-rose-500">
              <AlertTriangle size={14} /> Needs Focus
            </h3>
            {weaknesses.length > 0 ? (
              <div className="flex flex-col gap-2">
                {weaknesses.map(t => (
                  <div key={t.topicId} className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold text-rose-900 dark:text-rose-300" title={t.topicName}>{t.topicName}</span>
                    <span className="shrink-0 text-xs font-black text-rose-600 dark:text-rose-400">{Math.round(t.scoreAvg)}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-medium text-rose-600/60 dark:text-rose-500/60">No major weak spots found yet!</p>
            )}
          </div>
          </div>
        ) : (
          <FeaturePaywall
            compact
            requiredTier="STANDARD"
            title="Strength insights require Standard"
            description="Upgrade to identify strengths and topics that need attention."
          />
        )}
          
        {/* Subject Performance */}
        {canViewStandardAnalytics ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-3">Subject Performance</p>
            {subjectPerformance.length > 0 ? (
              <div className="flex flex-col gap-3">
                {subjectPerformance.map((subject) => {
                  const cfg = RANKING_CONFIG[subject.bandLevel] ?? null;
                  const widthPercent = Math.max(0, Math.min(100, subject.scoreAvg));
                  const barColor =
                    subject.scoreAvg >= 70
                      ? 'bg-emerald-500'
                      : subject.scoreAvg >= 50
                      ? 'bg-amber-500'
                      : 'bg-rose-500';
                  return (
                    <div key={subject.subjectId} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-200">
                            {subject.subjectName}
                          </p>
                          {cfg && (
                            <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-black ${cfg.bg} ${cfg.color}`}>
                              {cfg.label}
                            </span>
                          )}
                        </div>
                        <span className="shrink-0 text-xs font-black text-slate-700 dark:text-slate-300">
                          {Math.round(subject.scoreAvg)}%
                        </span>
                      </div>
                      <div
                        className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
                        role="progressbar"
                        aria-valuenow={Math.round(subject.scoreAvg)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${subject.subjectName} average score`}
                      >
                        <div
                          className={`h-full rounded-full ${barColor} transition-[width] duration-500`}
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex min-h-[80px] items-center justify-center">
                <p className="text-xs font-medium text-slate-400">No subject data yet</p>
              </div>
            )}
          </div>
        ) : (
          <FeaturePaywall
            compact
            requiredTier="STANDARD"
            title="Subject performance requires Standard"
            description="Upgrade to see how you perform across each subject."
          />
        )}

        {/* Score Trend */}
        {canViewStandardAnalytics ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 mt-auto">
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-4">Mock Exam Scores</p>
          {scoreHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height={160} minWidth={0} minHeight={0}>
              <AreaChart
                data={scoreHistory.map((s) => {
                  const baseName = s.examTitle.length > 12 ? s.examTitle.slice(0, 12) + '…' : s.examTitle;
                  const attemptSuffix = s.attemptNumber > 1 ? ` #${s.attemptNumber}` : '';
                  return {
                    name: `${baseName}${attemptSuffix}`,
                    score: s.score,
                    fullName: s.examTitle,
                    attemptNumber: s.attemptNumber,
                    sessionId: s.sessionId,
                    rankingLevel: s.rankingLevel,
                    takenAt: s.takenAt,
                  };
                })}
                margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0A9AE2" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0A9AE2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ stroke: '#0A9AE2', strokeOpacity: 0.2, strokeWidth: 1 }}
                  content={<ScoreHistoryTooltip />}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#0A9AE2"
                  strokeWidth={2}
                  fill="url(#scoreGradient)"
                  dot={{ r: 4, fill: '#0A9AE2', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#0A9AE2', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[140px] items-center justify-center">
              <p className="text-xs font-medium text-slate-400">No exams completed yet</p>
            </div>
          )}
          </div>
        ) : (
          <FeaturePaywall
            compact
            requiredTier="STANDARD"
            title="Score trends require Standard"
            description="Upgrade to see how your exam scores change over time."
          />
        )}
      </div>

      {/* Leaderboard Card */}
      {canViewStandardAnalytics && leaderboard ? (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8 flex flex-col">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Award className="text-[#FF6900]" /> Global Leaderboard
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">See how you rank among all students</p>
          </div>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 focus:border-[#0A9AE2] focus:outline-none focus:ring-2 focus:ring-[#0A9AE2]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/50"
            >
              <span className="truncate max-w-[150px]">
                {selectedExamId ? uniqueExams.find(e => e.id === selectedExamId)?.title || 'Unknown Exam' : 'Overall Ranking'}
              </span>
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-800">
                <button
                  onClick={() => {
                    setSelectedExamId('');
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold transition-colors ${
                    selectedExamId === ''
                      ? 'bg-[#0A9AE2]/10 text-[#0A9AE2]'
                      : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/50'
                  }`}
                >
                  Overall Ranking
                </button>
                {uniqueExams.length > 0 && <div className="my-1 border-t border-slate-100 dark:border-slate-700/50"></div>}
                <div className="max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                  {uniqueExams.map(ex => (
                    <button
                      key={ex.id}
                      onClick={() => {
                        setSelectedExamId(ex.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold transition-colors ${
                        selectedExamId === ex.id
                          ? 'bg-[#0A9AE2]/10 text-[#0A9AE2]'
                          : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <span className="block truncate" title={ex.title}>{ex.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 relative min-h-[200px]">
          {isLeaderboardLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/50 backdrop-blur-sm dark:bg-slate-900/50">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0A9AE2] border-t-transparent"></div>
            </div>
          )}
          {leaderboard.entries.length === 0 && !isLeaderboardLoading ? (
            <div className="flex h-32 items-center justify-center rounded-2xl border-2 border-dashed border-slate-100 text-sm font-medium text-slate-400 dark:border-slate-800">
              No data yet
            </div>
          ) : (
            (() => {
              const myRankNum = leaderboard.myRank?.rank;
              const isInTop10 = myRankNum != null && myRankNum <= 10;
              const top3 = leaderboard.entries.slice(0, 3);
              const restOfTop10 = leaderboard.entries.slice(3, 10);
              const showMyEntry = !isInTop10 && myRankNum != null && Boolean(leaderboard.myRank.studentName);
              const myPercentile = leaderboard.myRank.percentile;

              return (
                <div className="flex flex-1 flex-col gap-4">
                  {/* PODIUM ZONE — top 3 (or fewer) with placeholders */}
                  <div className="flex flex-col gap-2.5">
                    {[0, 1, 2].map((idx) => {
                      const entry = top3[idx];
                      const rank = idx + 1;
                      if (!entry) {
                        return (
                          <div
                            key={`podium-empty-${rank}`}
                            className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-3 dark:border-slate-700/60 dark:bg-slate-800/20"
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-dashed border-slate-300 text-xs font-black text-slate-400 dark:border-slate-600">
                              #{rank}
                            </div>
                            <p className="text-xs font-medium text-slate-400">
                              Waiting for more students to complete exams
                            </p>
                          </div>
                        );
                      }
                      return (
                        <PodiumRow
                          key={entry.studentId}
                          entry={entry}
                          isMe={entry.studentId === currentUser?.id}
                          myPercentile={myPercentile}
                        />
                      );
                    })}
                  </div>

                  {/* Compact list — ranks 4-10 */}
                  {restOfTop10.length > 0 && (
                    <>
                      <div className="flex items-center gap-3 px-1 pt-1">
                        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Top 10</span>
                        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                      </div>
                      <div className="flex flex-col">
                        {restOfTop10.map((entry) => (
                          <CompactLeaderRow
                            key={entry.studentId}
                            entry={entry}
                            isMe={entry.studentId === currentUser?.id}
                            myPercentile={myPercentile}
                          />
                        ))}
                      </div>
                    </>
                  )}

                  {/* Sticky "you" card — only when outside top 10 */}
                  {showMyEntry && (
                    <YouCard myRank={leaderboard.myRank} />
                  )}

                  {/* Rank Race — climb + defend tiles */}
                  <RankRace
                    leaderboard={leaderboard}
                    currentUserId={currentUser?.id}
                  />
                </div>
              );
            })()
          )}
        </div>
        </div>
      ) : (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <FeaturePaywall
            compact
            requiredTier="STANDARD"
            title="Leaderboard requires Standard"
            description="Upgrade to compare your rank and percentile with other students."
          />
        </div>
      )}

      {/* Writing Performance */}
      <WritingPerformanceSection
        canView={canViewWritingAnalytics}
        sessions={writingPerformance}
      />
    </div>
  );
}

function criterionBarColor(scorePercent: number): { bar: string; text: string } {
  if (scorePercent >= 70) return { bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' };
  if (scorePercent >= 50) return { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' };
  return { bar: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400' };
}

function WritingPerformanceSection({
  canView,
  sessions,
}: {
  canView: boolean;
  sessions: import('@/features/analytics/types/analytics.types').WritingPerformanceItem[];
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const sortedSessions = useMemo(
    () =>
      [...sessions].sort(
        (a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime()
      ),
    [sessions]
  );

  const trimmedQuery = searchQuery.trim().toLowerCase();
  const filteredSessions = useMemo(() => {
    if (!trimmedQuery) return sortedSessions;
    return sortedSessions.filter((s) => s.examTitle.toLowerCase().includes(trimmedQuery));
  }, [sortedSessions, trimmedQuery]);

  const indexOfSelected = selectedSessionId
    ? sortedSessions.findIndex((s) => s.sessionId === selectedSessionId)
    : -1;
  const selectedSession =
    indexOfSelected >= 0 ? sortedSessions[indexOfSelected] : sortedSessions[0] ?? null;

  useEffect(() => {
    if (!isDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isDropdownOpen]);

  const handleSelect = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  if (!canView) {
    return (
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8 lg:col-span-2">
        <FeaturePaywall
          compact
          requiredTier="PREMIUM"
          title="Writing performance requires Premium"
          description="Upgrade to unlock rubric-level writing feedback, strengths, and improvements."
        />
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8 lg:col-span-2">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-black text-slate-900 dark:text-slate-100">
            <FileText className="text-[#0A9AE2]" /> Writing Performance
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            Rubric feedback from graded essay answers
          </p>
        </div>
        {sessions.length > 0 && selectedSession && (
          <div className="relative w-full sm:w-80" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              aria-haspopup="listbox"
              aria-expanded={isDropdownOpen}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-bold text-slate-700 transition hover:border-[#0A9AE2]/40 hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <span className="flex min-w-0 flex-col">
                <span className="truncate">{selectedSession.examTitle}</span>
                <span className="text-[11px] font-medium text-slate-400">
                  {new Date(selectedSession.takenAt).toLocaleDateString()}
                </span>
              </span>
              <ChevronDown
                size={16}
                className={`shrink-0 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                <div className="relative border-b border-slate-100 p-2 dark:border-slate-800">
                  <Search
                    size={14}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search exams..."
                    aria-label="Search writing exams"
                    autoFocus
                    className="w-full rounded-lg bg-slate-50 py-1.5 pl-8 pr-2 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto py-1">
                  {filteredSessions.length === 0 ? (
                    <p className="px-3 py-4 text-center text-xs font-medium text-slate-400">
                      No exams match &ldquo;{searchQuery}&rdquo;
                    </p>
                  ) : (
                    filteredSessions.map((s) => {
                      const isActive = s.sessionId === selectedSession.sessionId;
                      return (
                        <button
                          key={s.sessionId}
                          type="button"
                          onClick={() => handleSelect(s.sessionId)}
                          className={`flex w-full items-start justify-between gap-3 px-3 py-2 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800 ${
                            isActive ? 'bg-[#0A9AE2]/5' : ''
                          }`}
                        >
                          <span className="flex min-w-0 flex-col">
                            <span className={`truncate text-xs font-bold ${isActive ? 'text-[#0A9AE2]' : 'text-slate-700 dark:text-slate-300'}`}>
                              {s.examTitle}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400">
                              {new Date(s.takenAt).toLocaleDateString()}
                            </span>
                          </span>
                          {s.bandLabel && (
                            <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {s.bandLabel}
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="flex min-h-[150px] items-center justify-center rounded-2xl border border-dashed border-slate-200 px-4 text-center dark:border-slate-800">
          <p className="text-sm font-medium text-slate-400">
            Complete essay exams to see your writing analytics
          </p>
        </div>
      ) : (
        <>
          {selectedSession && (
            <div
              key={selectedSession.sessionId}
              className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-black text-slate-900 dark:text-slate-100">{selectedSession.examTitle}</h3>
                  <p className="mt-1 text-xs font-medium text-slate-400">
                    {new Date(selectedSession.takenAt).toLocaleDateString()}
                  </p>
                </div>
                {selectedSession.bandLabel && (
                  <span className="rounded-xl bg-[#0A9AE2]/10 px-3 py-1 text-xs font-black text-[#0A9AE2]">
                    {selectedSession.bandLabel}
                  </span>
                )}
              </div>
              {selectedSession.bandDescriptor && (
                <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">{selectedSession.bandDescriptor}</p>
              )}
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {selectedSession.criteria.map((criterion) => {
                  const colors = criterionBarColor(criterion.scorePercent);
                  const widthPercent = Math.max(0, Math.min(100, criterion.scorePercent));
                  return (
                    <div
                      key={`${selectedSession.sessionId}-${criterion.criterionName}`}
                      className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-200">
                          {criterion.criterionName}
                        </p>
                        <span className={`shrink-0 text-xs font-black ${colors.text}`}>
                          {criterion.score}/{criterion.maxScore} ({criterion.scorePercent.toFixed(0)}%)
                        </span>
                      </div>
                      <div
                        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-700/50"
                        role="progressbar"
                        aria-valuenow={Math.round(criterion.scorePercent)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${criterion.criterionName} score`}
                      >
                        <div
                          className={`h-full rounded-full ${colors.bar} transition-[width] duration-500`}
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                      {criterion.feedback && (
                        <p className="mt-2 text-xs font-medium leading-5 text-slate-500 dark:text-slate-400">
                          {criterion.feedback}
                        </p>
                      )}
                      {criterion.strengths.length > 0 && (
                        <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">
                          <span className="font-black">Strengths: </span>
                          {criterion.strengths.join(', ')}
                        </p>
                      )}
                      {criterion.improvements.length > 0 && (
                        <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                          <span className="font-black">Improve: </span>
                          {criterion.improvements.join(', ')}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function formatRoleTime(seconds: number) {
  if (seconds <= 0) return '0m';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

function RoleMetricCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone: string;
}) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${tone}`}>
        <Icon size={22} />
      </div>
      <p className="text-3xl font-black text-slate-900 dark:text-slate-100">{value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  );
}

function AdminLeaderboardCard() {
  const [entries, setEntries] = useState<import('@/features/analytics/types/analytics.types').LeaderboardEntry[]>([]);
  const [exams, setExams] = useState<{ id: string; title: string }[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch exams list once
  useEffect(() => {
    const loadExams = async () => {
      try {
        const { examService } = await import('@/features/exams/services/exams.service');
        const res = await examService.list({ limit: 50 });
        if (res.success) {
          setExams(res.data.map((e) => ({ id: e.id, title: e.title })));
        }
      } catch {
        // silent
      }
    };
    loadExams();
  }, []);

  // Fetch leaderboard when exam selection changes
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await analyticsService.getLeaderboard('ALL_TIME', selectedExamId || undefined);
        if (res.success) setEntries(res.data.entries.slice(0, 5));
      } catch {
        // silent
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [selectedExamId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Award size={14} className="text-[#FF6900]" />
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">Leaderboard</p>
        </div>
        {/* Exam selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="truncate max-w-[70px]">{selectedExamId ? exams.find(e => e.id === selectedExamId)?.title || 'Exam' : 'Global'}</span>
            <ChevronDown size={10} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-44 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => { setSelectedExamId(''); setIsDropdownOpen(false); }}
                className={`w-full px-3 py-2 text-left text-[11px] font-bold transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${!selectedExamId ? 'text-[#0A9AE2]' : 'text-slate-700 dark:text-slate-300'}`}
              >
                Global Ranking
              </button>
              {exams.map((exam) => (
                <button
                  key={exam.id}
                  type="button"
                  onClick={() => { setSelectedExamId(exam.id); setIsDropdownOpen(false); }}
                  className={`w-full px-3 py-2 text-left text-[11px] font-bold transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 truncate ${selectedExamId === exam.id ? 'text-[#0A9AE2]' : 'text-slate-700 dark:text-slate-300'}`}
                >
                  {exam.title}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-2 py-1">
              <div className="h-5 w-5 rounded-full bg-slate-100 dark:bg-slate-800" />
              <div className="h-3 flex-1 rounded bg-slate-100 dark:bg-slate-800" />
              <div className="h-3 w-8 rounded bg-slate-100 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="h-[110px] flex items-center justify-center">
          <span className="text-xs text-slate-400">No ranking data yet</span>
        </div>
      ) : (
        <div className="space-y-1.5">
          {entries.map((entry) => {
            const rankCfg = entry.rankingLevel ? RANKING_CONFIG[entry.rankingLevel] : null;
            return (
              <div key={entry.studentId} className="flex items-center gap-2">
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                  entry.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                  entry.rank === 2 ? 'bg-slate-100 text-slate-600' :
                  entry.rank === 3 ? 'bg-orange-100 text-orange-700' :
                  'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {entry.rank}
                </span>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate flex-1">
                  {entry.studentName}
                </span>
                {rankCfg && (
                  <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-black shrink-0 ${rankCfg.bg} ${rankCfg.color}`}>
                    {rankCfg.label}
                  </span>
                )}
                <span className="text-[11px] font-black text-[#0A9AE2] shrink-0">
                  {entry.score.toFixed(0)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DashboardMetricSkeleton() {
  return (
    <div className="flex h-[130px] animate-pulse flex-col items-center justify-center gap-3">
      <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-800" />
      <div className="h-3 w-28 rounded bg-slate-100 dark:bg-slate-800" />
    </div>
  );
}

function AdminDashboard({ firstName }: { firstName: string }) {
  const [stats, setStats] = useState<import('@/features/admin/services/admin.service').AdminDashboardStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { adminService } = await import('@/features/admin/services/admin.service');
        const res = await adminService.getStats();
        if (res.success) setStats(res.data);
      } catch {
        // silent
      } finally {
        setIsStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#0A9AE2]">Admin control center</p>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Welcome back, <span className="text-[#0A9AE2]">{firstName}</span>! 👋
        </h1>
        {/* <p className="max-w-2xl text-sm font-medium text-slate-500 dark:text-slate-400">
          Manage users, exam content, question approvals, practice assignments, and platform communication from one dashboard.
        </p> */}
      </header>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Student Gender Pie Chart */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400 mb-2">Students by Gender</p>
          {isStatsLoading ? (
            <DashboardMetricSkeleton />
          ) : stats?.studentGender ? (
            <>
              <div className="h-[100px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Male', value: stats.studentGender.male, fill: '#3b82f6' },
                        { name: 'Female', value: stats.studentGender.female, fill: '#ec4899' },
                        ...(stats.studentGender.unspecified > 0 ? [{ name: 'N/A', value: stats.studentGender.unspecified, fill: '#94a3b8' }] : []),
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={45}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#ec4899" />
                      {stats.studentGender.unspecified > 0 && <Cell fill="#94a3b8" />}
                      <Label
                        value={stats.totalStudents.toString()}
                        position="center"
                        style={{ fontSize: '16px', fontWeight: 900 }}
                        className="fill-slate-900 dark:fill-slate-100"
                      />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-3 mt-1">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Male {stats.studentGender.male}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-pink-500" />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Female {stats.studentGender.female}</span>
                </div>
                {stats.studentGender.unspecified > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-slate-400" />
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">N/A {stats.studentGender.unspecified}</span>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
        {/* Students by Tier Pie Chart */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400 mb-2">Students by Tier</p>
          {isStatsLoading ? (
            <DashboardMetricSkeleton />
          ) : stats?.studentTier ? (
            <>
              <div className="h-[100px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Basic', value: stats.studentTier.basic },
                        { name: 'Standard', value: stats.studentTier.standard },
                        { name: 'Premium', value: stats.studentTier.premium },
                      ].filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={45}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {stats.studentTier.basic > 0 && <Cell fill="#94a3b8" />}
                      {stats.studentTier.standard > 0 && <Cell fill="#f59e0b" />}
                      {stats.studentTier.premium > 0 && <Cell fill="#8b5cf6" />}
                      <Label
                        value={stats.totalStudents.toString()}
                        position="center"
                        style={{ fontSize: '16px', fontWeight: 900 }}
                        className="fill-slate-900 dark:fill-slate-100"
                      />
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px', fontWeight: 600 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-3 mt-1">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-slate-400" />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Basic {stats.studentTier.basic}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Standard {stats.studentTier.standard}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-violet-500" />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Premium {stats.studentTier.premium}</span>
                </div>
              </div>
            </>
          ) : null}
        </div>
        {/* Exam Participation Pie Chart */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400 mb-2">Exam Participation</p>
          {isStatsLoading ? (
            <DashboardMetricSkeleton />
          ) : stats?.examParticipation ? (
            <>
              <div className="h-[100px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Participated', value: stats.examParticipation.participated },
                        { name: 'Not yet', value: stats.examParticipation.notParticipated },
                      ].filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={45}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {stats.examParticipation.participated > 0 && <Cell fill="#10b981" />}
                      {stats.examParticipation.notParticipated > 0 && <Cell fill="#e2e8f0" />}
                      <Label
                        value={`${stats.totalStudents > 0 ? Math.round((stats.examParticipation.participated / stats.totalStudents) * 100) : 0}%`}
                        position="center"
                        style={{ fontSize: '14px', fontWeight: 900 }}
                        className="fill-slate-900 dark:fill-slate-100"
                      />
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px', fontWeight: 600 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-3 mt-1">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Joined {stats.examParticipation.participated}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-slate-200" />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Not yet {stats.examParticipation.notParticipated}</span>
                </div>
              </div>
            </>
          ) : null}
        </div>
        {/* Top Students Leaderboard Mini */}
        <AdminLeaderboardCard />
      </div>

      {/* Monthly Student Registrations Bar Chart */}
      {!isStatsLoading && stats?.monthlyRegistrations && stats.monthlyRegistrations.length > 0 && (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4">
            <h2 className="text-base font-black text-slate-900 dark:text-slate-100">New Students per Month</h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Registration trend by gender (last 6 months)</p>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart
                data={stats.monthlyRegistrations.map((m) => ({
                  month: new Date(m.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
                  Male: m.male,
                  Female: m.female,
                }))}
                margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px', fontWeight: 600 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', fontWeight: 700 }} />
                <Bar dataKey="Male" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Female" fill="#ec4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

    </div>
  );
}

function TutorDashboard({ firstName }: { firstName: string }) {
  const [stats, setStats] = useState<import('@/features/admin/services/admin.service').AdminDashboardStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { adminService } = await import('@/features/admin/services/admin.service');
        const res = await adminService.getStats();
        if (res.success) setStats(res.data);
      } catch {
        // silent — tutor may not have access to all stats
      } finally {
        setIsStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#0A9AE2]">Tutor workspace</p>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Welcome back, <span className="text-[#0A9AE2]">{firstName}</span>! 👋
        </h1>
        {/* <p className="max-w-2xl text-sm font-medium text-slate-500 dark:text-slate-400">
          Monitor student progress, review exam results, and manage question content.
        </p> */}
      </header>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Student Gender Pie Chart */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400 mb-2">Students by Gender</p>
          {isStatsLoading ? (
            <DashboardMetricSkeleton />
          ) : stats?.studentGender ? (
            <>
              <div className="h-[100px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Male', value: stats.studentGender.male, fill: '#3b82f6' },
                        { name: 'Female', value: stats.studentGender.female, fill: '#ec4899' },
                      ].filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={45}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {stats.studentGender.male > 0 && <Cell fill="#3b82f6" />}
                      {stats.studentGender.female > 0 && <Cell fill="#ec4899" />}
                      <Label
                        value={stats.totalStudents.toString()}
                        position="center"
                        style={{ fontSize: '16px', fontWeight: 900 }}
                        className="fill-slate-900 dark:fill-slate-100"
                      />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-3 mt-1">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Male {stats.studentGender.male}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-pink-500" />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Female {stats.studentGender.female}</span>
                </div>
              </div>
            </>
          ) : null}
        </div>
        {/* Students by Tier */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400 mb-2">Students by Tier</p>
          {isStatsLoading ? (
            <DashboardMetricSkeleton />
          ) : stats?.studentTier ? (
            <>
              <div className="h-[100px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Basic', value: stats.studentTier.basic },
                        { name: 'Standard', value: stats.studentTier.standard },
                        { name: 'Premium', value: stats.studentTier.premium },
                      ].filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={45}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {stats.studentTier.basic > 0 && <Cell fill="#94a3b8" />}
                      {stats.studentTier.standard > 0 && <Cell fill="#f59e0b" />}
                      {stats.studentTier.premium > 0 && <Cell fill="#8b5cf6" />}
                      <Label
                        value={stats.totalStudents.toString()}
                        position="center"
                        style={{ fontSize: '16px', fontWeight: 900 }}
                        className="fill-slate-900 dark:fill-slate-100"
                      />
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px', fontWeight: 600 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-3 mt-1">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-slate-400" />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Basic {stats.studentTier.basic}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Standard {stats.studentTier.standard}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-violet-500" />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Premium {stats.studentTier.premium}</span>
                </div>
              </div>
            </>
          ) : null}
        </div>
        {/* Exam Participation */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400 mb-2">Exam Participation</p>
          {isStatsLoading ? (
            <DashboardMetricSkeleton />
          ) : stats?.examParticipation ? (
            <>
              <div className="h-[100px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Participated', value: stats.examParticipation.participated },
                        { name: 'Not yet', value: stats.examParticipation.notParticipated },
                      ].filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={45}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {stats.examParticipation.participated > 0 && <Cell fill="#10b981" />}
                      {stats.examParticipation.notParticipated > 0 && <Cell fill="#e2e8f0" />}
                      <Label
                        value={`${stats.totalStudents > 0 ? Math.round((stats.examParticipation.participated / stats.totalStudents) * 100) : 0}%`}
                        position="center"
                        style={{ fontSize: '14px', fontWeight: 900 }}
                        className="fill-slate-900 dark:fill-slate-100"
                      />
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px', fontWeight: 600 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-3 mt-1">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Joined {stats.examParticipation.participated}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-slate-200" />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Not yet {stats.examParticipation.notParticipated}</span>
                </div>
              </div>
            </>
          ) : null}
        </div>
        {/* Leaderboard */}
        <AdminLeaderboardCard />
      </div>

      {/* Monthly Student Registrations Bar Chart */}
      {!isStatsLoading && stats?.monthlyRegistrations && stats.monthlyRegistrations.length > 0 && (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4">
            <h2 className="text-base font-black text-slate-900 dark:text-slate-100">New Students per Month</h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Registration trend by gender (last 6 months)</p>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart
                data={stats.monthlyRegistrations.map((m) => ({
                  month: new Date(m.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
                  Male: m.male,
                  Female: m.female,
                }))}
                margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px', fontWeight: 600 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', fontWeight: 700 }} />
                <Bar dataKey="Male" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Female" fill="#ec4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function ParentDashboard({ firstName }: { firstName: string }) {
  const [children, setChildren] = useState<StudentAnalytics[]>([]);
  const [leaderboard, setLeaderboard] = useState<import('@/features/analytics/types/analytics.types').Leaderboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChildIdx, setSelectedChildIdx] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const [childRes, lbRes] = await Promise.all([
          analyticsService.getChildrenAnalytics(),
          analyticsService.getLeaderboard('ALL_TIME'),
        ]);
        if (childRes.success) setChildren(childRes.data);
        if (lbRes.success) setLeaderboard(lbRes.data);
      } catch {
        setChildren([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const selectedChild = children[selectedChildIdx] ?? null;

  // Score trend data for selected child
  const scoreTrendData = selectedChild?.examHistory
    .slice()
    .sort((a, b) => new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime())
    .map((h) => ({
      exam: h.examTitle.length > 12 ? h.examTitle.slice(0, 12) + '…' : h.examTitle,
      score: h.finalScore ?? 0,
      date: new Date(h.takenAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    })) ?? [];

  // Subject performance for selected child
  const subjectPerf = selectedChild?.subjectPerformance ?? [];

  // Weak topics (score < 50%)
  const weakTopics = selectedChild?.topicPerformance.filter((t) => t.scoreAvg < 50) ?? [];

  // Find child's rank in leaderboard
  const getChildRank = (studentId: string) => {
    if (!leaderboard) return null;
    const entry = leaderboard.entries.find((e) => e.studentId === studentId);
    return entry ?? null;
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-64 animate-pulse rounded-[2rem] bg-slate-200/50 dark:bg-slate-800/50" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#0A9AE2]">Parent dashboard</p>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Welcome, <span className="text-[#0A9AE2]">{firstName}</span>!
        </h1>
        <p className="max-w-2xl text-sm font-medium text-slate-500 dark:text-slate-400">
          Monitor your children&apos;s progress, exam scores, and identify areas that need attention.
        </p>
      </header>

      {/* Child Selector */}
      {children.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {children.map((child, idx) => (
            <button
              key={child.studentId}
              onClick={() => setSelectedChildIdx(idx)}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                idx === selectedChildIdx
                  ? 'bg-[#0A9AE2] text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {child.studentName}
            </button>
          ))}
        </div>
      )}

      {/* Top Metric Cards — per selected child */}
      {selectedChild && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <RoleMetricCard icon={FileText} label="Completed exams" value={selectedChild.totalExams} tone="bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-300" />
          <RoleMetricCard icon={Trophy} label="Average score" value={selectedChild.overallAvg !== null ? `${selectedChild.overallAvg.toFixed(0)}%` : '-'} tone="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300" />
          <RoleMetricCard icon={Clock} label="Study time" value={formatRoleTime(selectedChild.totalTimeSeconds)} tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300" />
          <RoleMetricCard icon={Target} label="Subjects covered" value={subjectPerf.length} tone="bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-300" />
        </div>
      )}

      {children.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white py-16 text-center dark:border-slate-800 dark:bg-slate-900">
          <Users className="mx-auto mb-3 text-slate-300" size={40} />
          <p className="font-bold text-slate-500">No linked students yet.</p>
          <p className="text-sm text-slate-400 mt-1">Students will appear here once linked to your account.</p>
        </div>
      ) : selectedChild && (
        <>
          {/* Child Comparison Cards + Ranking */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Child Summary Card */}
            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-black text-sm">
                  {selectedChild.studentName.charAt(0)}
                </div>
                <div>
                  <p className="font-black text-slate-900 dark:text-slate-100">{selectedChild.studentName}</p>
                  <p className="text-[11px] font-medium text-slate-400">{selectedChild.totalExams} exams · {formatRoleTime(selectedChild.totalTimeSeconds)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Average</p>
                  <p className="text-xl font-black text-slate-900 dark:text-slate-100">
                    {selectedChild.overallAvg !== null ? `${selectedChild.overallAvg.toFixed(0)}%` : '-'}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Ranking</p>
                  <p className="text-xl font-black text-slate-900 dark:text-slate-100">
                    {selectedChild.rankingLevel ? RANKING_CONFIG[selectedChild.rankingLevel]?.label ?? '-' : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Ranking Position */}
            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 mb-3">
                <Award size={16} className="text-[#FF6900]" />
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">Leaderboard Position</p>
              </div>
              {(() => {
                const rank = getChildRank(selectedChild.studentId);
                if (!rank) return (
                  <div className="flex items-center justify-center h-[100px]">
                    <p className="text-sm text-slate-400">Not ranked yet</p>
                  </div>
                );
                return (
                  <div className="flex flex-col items-center justify-center h-[100px] gap-2">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-full text-xl font-black ${
                      rank.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                      rank.rank === 2 ? 'bg-slate-100 text-slate-600' :
                      rank.rank === 3 ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      #{rank.rank}
                    </div>
                    <p className="text-xs font-bold text-slate-500">Score: <span className="text-[#0A9AE2] font-black">{rank.score.toFixed(0)}</span></p>
                    {rank.rankingLevel && RANKING_CONFIG[rank.rankingLevel] && (
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-black ${RANKING_CONFIG[rank.rankingLevel]!.bg} ${RANKING_CONFIG[rank.rankingLevel]!.color}`}>
                        {RANKING_CONFIG[rank.rankingLevel]!.label}
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Weak Topics Alert */}
            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-amber-500" />
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">Needs Attention</p>
              </div>
              {weakTopics.length === 0 ? (
                <div className="flex items-center justify-center h-[100px]">
                  <div className="text-center">
                    <Target size={24} className="mx-auto text-emerald-400 mb-1" />
                    <p className="text-xs font-bold text-slate-500">All topics on track!</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[110px] overflow-y-auto scrollbar-hide">
                  {weakTopics.slice(0, 5).map((t) => (
                    <div key={t.topicId} className="flex items-center justify-between gap-2 rounded-lg bg-red-50/50 px-3 py-1.5 dark:bg-red-500/5">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">{t.topicName}</span>
                      <span className="text-[11px] font-black text-red-500 shrink-0">{t.scoreAvg.toFixed(0)}%</span>
                    </div>
                  ))}
                  {weakTopics.length > 5 && (
                    <p className="text-[10px] font-bold text-slate-400 text-center">+{weakTopics.length - 5} more</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Score Trend Chart */}
          {scoreTrendData.length > 0 && (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4">
                <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Score Trend</h2>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {selectedChild.studentName}&apos;s exam scores over time
                </p>
              </div>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <AreaChart data={scoreTrendData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0A9AE2" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0A9AE2" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px', fontWeight: 600 }} />
                    <Area type="monotone" dataKey="score" stroke="#0A9AE2" strokeWidth={2.5} fill="url(#scoreGradient)" dot={{ r: 4, fill: '#0A9AE2', strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Subject Performance Bar Chart */}
          {subjectPerf.length > 0 && (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4">
                <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Subject Performance</h2>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Average score per subject for {selectedChild.studentName}
                </p>
              </div>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart
                    data={subjectPerf.map((s) => ({
                      subject: s.subjectName.length > 10 ? s.subjectName.slice(0, 10) + '…' : s.subjectName,
                      score: Math.round(s.scoreAvg),
                    }))}
                    margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px', fontWeight: 600 }} />
                    <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                      {subjectPerf.map((s, i) => (
                        <Cell key={i} fill={s.scoreAvg >= 70 ? '#10b981' : s.scoreAvg >= 50 ? '#f59e0b' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-4 mt-2">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-400">≥70% Strong</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="text-[10px] font-bold text-slate-400">50-69% Average</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-[10px] font-bold text-slate-400">&lt;50% Weak</span>
                </div>
              </div>
            </div>
          )}

          {/* Multi-child comparison (if >1 child) */}
          {children.length > 1 && (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4">
                <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Children Comparison</h2>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Side-by-side performance overview</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {children.map((child) => {
                  const childRank = getChildRank(child.studentId);
                  return (
                    <div key={child.studentId} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-black text-xs">
                          {child.studentName.charAt(0)}
                        </div>
                        <p className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{child.studentName}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500">Average</span>
                          <span className="font-black text-slate-900 dark:text-slate-100">{child.overallAvg !== null ? `${child.overallAvg.toFixed(0)}%` : '-'}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500">Exams</span>
                          <span className="font-black text-slate-900 dark:text-slate-100">{child.totalExams}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500">Rank</span>
                          <span className="font-black text-[#0A9AE2]">{childRank ? `#${childRank.rank}` : '-'}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500">Study time</span>
                          <span className="font-black text-slate-900 dark:text-slate-100">{formatRoleTime(child.totalTimeSeconds)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const userDisplayName = user?.fullName || user?.name || 'User';
  const firstName = userDisplayName.split(' ')[0];

  if (user?.role === 'ADMIN') {
    return <AdminDashboard firstName={firstName} />;
  }

  if (user?.role === 'TUTOR') {
    return <TutorDashboard firstName={firstName} />;
  }

  if (user?.role === 'PARENT') {
    return <ParentDashboard firstName={firstName} />;
  }


  return (
    <div className="min-w-0 max-w-full overflow-x-hidden">
      <StudentPerformanceAnalytics />
    </div>
  );
}

