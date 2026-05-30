'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { pathwayPlansService } from '../services/pathway-plans.service';
import { pathwaysService } from '@/features/pathways/services/pathways.service';
import { PathwaySnake } from './PathwaySnake';
import type { PathwayDetail } from '@/features/pathways/types/pathways.types';
import type { PathwayPlanDetail } from '../types/pathway-plans.types';

interface PlanDetailViewProps {
  planId: string;
  /** Read-only hides the Start buttons (parent view). */
  readOnly?: boolean;
  onBack: () => void;
  /** Notifies the parent page when a node practice should start (student only). */
  onStartPractice?: (pathwayId: string, nodeId: string) => void;
  startingNodeId?: string | null;
}

const SUBJECT_PILL_ACTIVE = { background: '#0A9AE2', color: 'white' };

export function PlanDetailView({
  planId,
  readOnly = false,
  onBack,
  onStartPractice,
  startingNodeId,
}: PlanDetailViewProps) {
  const [plan, setPlan] = useState<PathwayPlanDetail | null>(null);
  const [pathwayDetails, setPathwayDetails] = useState<Record<string, PathwayDetail>>({});
  const [activePathwayId, setActivePathwayId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await pathwayPlansService.get(planId);
      if (!res.success) return;
      setPlan(res.data);
      if (res.data.pathways.length > 0) {
        setActivePathwayId((prev) => prev || res.data.pathways[0].id);
      }

      const details: Record<string, PathwayDetail> = {};
      await Promise.all(
        res.data.pathways.map(async (p) => {
          const detailRes = await pathwaysService.get(p.id);
          if (detailRes.success) details[p.id] = detailRes.data;
        })
      );
      setPathwayDetails(details);
    } finally {
      setIsLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleStart = (pathwayId: string, nodeId: string) => {
    if (readOnly) return;
    onStartPractice?.(pathwayId, nodeId);
  };

  const activeDetail = pathwayDetails[activePathwayId];
  const progressPercent = plan?.progressPercent ?? 0;

  // Human-friendly due-date subtitle, e.g. "Due in 5 days" / "Overdue".
  const dueLabel = (() => {
    if (!plan?.dueDate || plan.isComplete) return null;
    const due = new Date(plan.dueDate);
    if (Number.isNaN(due.getTime())) return null;
    const now = new Date();
    const msPerDay = 1000 * 60 * 60 * 24;
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startDue = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
    const daysLeft = Math.round((startDue - startToday) / msPerDay);
    if (daysLeft < 0) return 'Overdue';
    if (daysLeft === 0) return 'Due today';
    if (daysLeft === 1) return 'Due tomorrow';
    return `Due in ${daysLeft} days`;
  })();

  if (isLoading && !plan) {
    return (
      <div>
        <div className="mb-6 h-8 w-48 animate-pulse rounded bg-slate-200/70 dark:bg-slate-800" />
        <div className="mb-8 h-2.5 w-full animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
        <div className="h-96 animate-pulse rounded-3xl bg-white dark:bg-slate-900" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="py-8 text-center text-slate-400">
        <p>Plan not found.</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 rounded-xl bg-[#0A9AE2] px-5 py-2.5 text-sm font-bold text-white"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div>
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={onBack}
              className="mb-2 flex items-center gap-1 text-xs font-bold text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
            >
              <ChevronLeft size={12} strokeWidth={3} />
              {readOnly ? "Children's Plans" : 'My Plans'}
            </button>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">{plan.name}</h1>
            {(plan.tutorName || dueLabel) && (
              <p className="mt-0.5 text-sm text-slate-400">
                {plan.tutorName ? `Assigned by ${plan.tutorName}` : ''}
                {plan.tutorName && dueLabel ? ' · ' : ''}
                {dueLabel ?? ''}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {plan.completedNodes}
              <span className="text-xl font-normal text-slate-300">/{plan.totalNodes}</span>
            </p>
            <p className="text-xs text-slate-400">topics mastered</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-8 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className={[
              'h-2.5 rounded-full transition-all duration-700',
              plan.isComplete ? 'bg-emerald-500' : 'bg-[#0A9AE2]',
            ].join(' ')}
            style={{ width: `${plan.isComplete ? 100 : progressPercent}%` }}
          />
        </div>

        {/* Subject selector pills */}
        {plan.pathways.length > 0 && (
          <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-1">
            {plan.pathways.map((p) => {
              const active = p.id === activePathwayId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActivePathwayId(p.id)}
                  className={[
                    'whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold transition-all',
                    active
                      ? ''
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300',
                  ].join(' ')}
                  style={active ? SUBJECT_PILL_ACTIVE : undefined}
                >
                  {p.subject.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Active subject snake */}
        {plan.pathways.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <p className="font-semibold text-slate-500">No subjects in this plan yet</p>
            <p className="mt-1 text-sm">Your tutor is still setting this up.</p>
          </div>
        ) : activeDetail ? (
          <motion.div
            key={activePathwayId}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <PathwaySnake
              pathway={activeDetail}
              readOnly={readOnly}
              startingNodeId={startingNodeId}
              onStartPractice={(nodeId) => handleStart(activeDetail.id, nodeId)}
            />
          </motion.div>
        ) : (
          <div className="h-96 animate-pulse rounded-3xl bg-white dark:bg-slate-900" />
        )}
    </div>
  );
}
