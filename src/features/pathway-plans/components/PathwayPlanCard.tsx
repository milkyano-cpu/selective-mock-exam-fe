'use client';

import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import type { PathwayPlanListItem } from '../types/pathway-plans.types';

// Subject pill colours cycle through a fixed palette, matching the sample UI.
const SUBJECT_TONES = [
  'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
  'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300',
  'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
  'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
  'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300',
];

type DueBadge = {
  label: string;
  className: string;
};

/**
 * Map the remaining time until the due date to a coloured badge.
 * > 7 days → green, ≤ 7 days → amber, past → red/Overdue.
 */
function getDueBadge(dueDate: string | null): DueBadge | null {
  if (!dueDate) return null;

  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return null;

  const now = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  const daysLeft = Math.round((startOfDue - startOfToday) / msPerDay);

  if (daysLeft < 0) {
    return {
      label: 'Overdue',
      className: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300',
    };
  }

  let label: string;
  if (daysLeft === 0) label = 'Due today';
  else if (daysLeft === 1) label = 'Due tomorrow';
  else label = `Due in ${daysLeft} days`;

  const className =
    daysLeft > 7
      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300'
      : 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300';

  return { label, className };
}

interface PathwayPlanCardProps {
  plan: PathwayPlanListItem;
  /** Subtitle text, e.g. "Assigned by Ms. Sarah" or "Tutor: Ms. Sarah". */
  subtitle?: string;
  onClick?: () => void;
  /** Tutor-only delete affordance. Read-only views (parent/student) omit it. */
  onDelete?: () => void;
  /** Read-only footnote shown to parents. */
  readOnlyNote?: string;
}

export function PathwayPlanCard({
  plan,
  subtitle,
  onClick,
  onDelete,
  readOnlyNote,
}: PathwayPlanCardProps) {
  const dueBadge = plan.isComplete ? null : getDueBadge(plan.dueDate);
  const progressPercent = plan.isComplete ? 100 : plan.progressPercent;

  const interactive = Boolean(onClick);
  const Wrapper = interactive ? motion.button : motion.div;

  return (
    <Wrapper
      type={interactive ? 'button' : undefined}
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={[
        'relative w-full rounded-3xl border border-slate-100 bg-white p-5 text-left shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900',
        interactive ? 'hover:border-slate-200 hover:shadow-md dark:hover:border-slate-700' : '',
      ].join(' ')}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-black leading-tight text-slate-900 dark:text-white">
            {plan.name}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
          )}
        </div>

        {plan.isComplete ? (
          <span className="whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
            Complete
          </span>
        ) : dueBadge ? (
          <span
            className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${dueBadge.className}`}
          >
            {dueBadge.label}
          </span>
        ) : null}

        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
            aria-label="Delete plan"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={[
            'h-2 rounded-full transition-all duration-700',
            plan.isComplete ? 'bg-emerald-500' : 'bg-[#0A9AE2]',
          ].join(' ')}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <p
        className={[
          'mb-3 text-xs font-semibold',
          plan.isComplete ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400',
        ].join(' ')}
      >
        {plan.completedNodes} of {plan.totalNodes} topics mastered
      </p>

      {/* Subject pills */}
      {plan.subjects.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {plan.subjects.map((subject, idx) => (
            <span
              key={subject.id}
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${SUBJECT_TONES[idx % SUBJECT_TONES.length]}`}
            >
              {subject.name}
            </span>
          ))}
        </div>
      )}

      {readOnlyNote && (
        <p className="mt-3 text-center text-xs font-semibold text-slate-300 dark:text-slate-600">
          {readOnlyNote}
        </p>
      )}
    </Wrapper>
  );
}
