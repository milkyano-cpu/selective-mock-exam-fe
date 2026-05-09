'use client';

import { BookOpen, CheckCircle2, Lock, PlayCircle, Target } from 'lucide-react';
import type { PathwayNodeItem } from '../types/pathways.types';

interface PathwayNodeProps {
  node: PathwayNodeItem;
  thresholdCorrect: number;
  isFirst: boolean;
  sizeCls: string;
  iconSize: number;
  isTutorView?: boolean;
  onStartPractice?: () => void;
  isStarting?: boolean;
  variant?: 'path' | 'step';
}

export function PathwayNode({
  node,
  thresholdCorrect,
  isFirst,
  sizeCls,
  iconSize,
  isTutorView = false,
  onStartPractice,
  isStarting = false,
  variant = 'path',
}: PathwayNodeProps) {
  const progress = node.progress;
  const isUnlocked = progress?.isUnlocked ?? false;
  const isCompleted = progress?.completedAt !== null && progress?.completedAt !== undefined;
  const correctAnswers = progress?.correctAnswers ?? 0;
  const totalAttempts = progress?.totalAttempts ?? 0;
  const progressPercent = Math.min(100, Math.round((correctAnswers / Math.max(thresholdCorrect, 1)) * 100));

  const isLocked = !isTutorView && !isUnlocked;
  const statusLabel = isCompleted ? 'Completed' : isLocked ? 'Locked' : totalAttempts > 0 ? 'Continue' : 'Ready';

  const circleClasses = [
    'relative overflow-hidden rounded-full border-4 flex items-center justify-center transition-all duration-200 select-none',
    sizeCls,
    isCompleted
      ? 'border-[#0A9AE2] bg-[#0A9AE2]/10'
      : isLocked
        ? 'border-slate-200 bg-slate-100 opacity-60 cursor-not-allowed'
        : 'border-slate-200 bg-white shadow-md hover:shadow-xl hover:scale-105 cursor-pointer active:scale-95',
  ].join(' ');

  const handleClick = () => {
    if (!isLocked && !isTutorView && onStartPractice) {
      onStartPractice();
    }
  };

  if (variant === 'step') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isLocked || isTutorView || isStarting}
        className={[
          'group relative w-full overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-[#0A9AE2]/30',
          isCompleted
            ? 'border-emerald-200 bg-emerald-50/80 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-500/10'
            : isLocked
              ? 'border-slate-200 bg-slate-50 opacity-75 dark:border-slate-800 dark:bg-slate-900/70'
              : 'border-slate-200 bg-white shadow-sm hover:-translate-y-0.5 hover:border-[#0A9AE2]/40 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-[#0A9AE2]/50',
        ].join(' ')}
        title={isLocked ? 'Complete previous topics to unlock this module' : `Practice ${node.topic.name}`}
      >
        <div className="flex items-center gap-4">
          <div
            className={[
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-colors',
              isCompleted
                ? 'border-emerald-200 bg-white text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10'
                : isLocked
                  ? 'border-slate-200 bg-white text-slate-300 dark:border-slate-700 dark:bg-slate-800'
                  : 'border-[#0A9AE2]/20 bg-[#0A9AE2]/10 text-[#0A9AE2] group-hover:bg-[#0A9AE2] group-hover:text-white',
            ].join(' ')}
          >
            {isCompleted ? (
              <CheckCircle2 size={22} />
            ) : isLocked ? (
              <Lock size={19} />
            ) : (
              <BookOpen size={22} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={[
                  'rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide',
                  isCompleted
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                    : isLocked
                      ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                      : 'bg-blue-100 text-[#0A9AE2] dark:bg-blue-500/20 dark:text-blue-300',
                ].join(' ')}
              >
                {statusLabel}
              </span>
              {isFirst && !isTutorView && (
                <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[#FF6900] dark:bg-orange-500/20">
                  Start here
                </span>
              )}
            </div>
            <p className="mt-2 truncate text-base font-black text-slate-900 dark:text-slate-100">
              {node.topic.name}
            </p>
            <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <Target size={13} />
              <span>{correctAnswers} of {thresholdCorrect} correct</span>
              {totalAttempts > 0 && <span>{totalAttempts} attempt{totalAttempts !== 1 ? 's' : ''}</span>}
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className={[
                  'h-full rounded-full transition-all duration-500',
                  isCompleted ? 'bg-emerald-500' : isLocked ? 'bg-slate-200 dark:bg-slate-700' : 'bg-[#0A9AE2]',
                ].join(' ')}
                style={{ width: `${isLocked ? 0 : progressPercent}%` }}
              />
            </div>
          </div>

          {!isLocked && !isTutorView && (
            <div className="hidden shrink-0 items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white transition-transform group-hover:translate-x-0.5 dark:bg-slate-100 dark:text-slate-900 sm:inline-flex">
              <PlayCircle size={15} />
              {isStarting ? 'Starting' : isCompleted ? 'Review' : 'Practice'}
            </div>
          )}
        </div>
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* START label */}
      {isFirst && !isTutorView && (
        <span className="text-[10px] font-black uppercase tracking-widest text-[#0A9AE2]">
          START
        </span>
      )}

      {/* Circle node */}
      <button
        type="button"
        onClick={handleClick}
        disabled={isLocked || isTutorView}
        className={circleClasses}
        title={node.topic.name}
      >
        {/* Icon */}
        {isCompleted ? (
          <CheckCircle2 size={iconSize} className="text-[#0A9AE2] relative z-10" />
        ) : isLocked ? (
          <Lock size={iconSize - 4} className="text-slate-300 relative z-10" />
        ) : (
          <BookOpen size={iconSize} className="text-slate-500 relative z-10" />
        )}

        {/* Blue wave arc at the bottom */}
        <svg
          className="absolute bottom-0 left-0 w-full"
          viewBox="0 0 80 22"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0,11 Q20,1 40,11 Q60,21 80,11 L80,22 L0,22 Z"
            fill={isLocked ? '#e2e8f0' : '#0A9AE2'}
            opacity={isLocked ? 0.5 : 0.9}
          />
        </svg>
      </button>

      {/* Topic name */}
      <p className="max-w-[90px] text-center text-[10px] font-semibold text-slate-600 leading-tight">
        {node.topic.name}
      </p>

      {/* Progress indicator */}
      {!isLocked && !isTutorView && (
        <p className="text-[9px] text-slate-400 font-medium">
          {correctAnswers} / {thresholdCorrect}
        </p>
      )}
    </div>
  );
}
