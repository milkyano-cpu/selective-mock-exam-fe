'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Map } from 'lucide-react';
import { analyticsService } from '@/features/analytics/services/analytics.service';
import { pathwayPlansService } from '../services/pathway-plans.service';
import { PathwayPlanCard } from './PathwayPlanCard';
import { PlanDetailView } from './PlanDetailView';
import type { ChildSummary } from '@/features/analytics/types/analytics.types';
import type { PathwayPlanListItem } from '../types/pathway-plans.types';

export function ParentPlanView() {
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [childrenLoading, setChildrenLoading] = useState(true);
  const [selectedChildId, setSelectedChildId] = useState('');

  const [plans, setPlans] = useState<PathwayPlanListItem[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // Load linked children for the selector.
  useEffect(() => {
    setChildrenLoading(true);
    analyticsService
      .getChildren()
      .then((res) => {
        if (res.success) {
          setChildren(res.data);
          if (res.data.length > 0) setSelectedChildId(res.data[0].studentId);
        }
      })
      .catch(() => { /* interceptor handles toast */ })
      .finally(() => setChildrenLoading(false));
  }, []);

  // Load the selected child's plans.
  const loadPlans = useCallback(async (studentId: string) => {
    setPlansLoading(true);
    try {
      const res = await pathwayPlansService.list({ studentId });
      if (res.success) setPlans(res.data);
    } catch {
      /* interceptor handles toast */
    } finally {
      setPlansLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedChildId) void loadPlans(selectedChildId);
    else setPlans([]);
  }, [selectedChildId, loadPlans]);

  const selectedChild = children.find((c) => c.studentId === selectedChildId);

  // ── Read-only plan detail (snake view) ─────────────────────────────────────
  if (selectedPlanId) {
    return (
      <PlanDetailView
        planId={selectedPlanId}
        readOnly
        onBack={() => setSelectedPlanId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">Children&apos;s Plans</h1>
        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
          Learning plans assigned by your child&apos;s tutor — view only
        </p>
      </header>

        {/* Child selector */}
        {childrenLoading ? (
          <div className="mb-6 flex gap-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-10 w-32 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : children.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 dark:bg-slate-800">
              <Map size={24} className="text-slate-300" />
            </div>
            <p className="font-semibold text-slate-500">No linked children</p>
            <p className="mt-1 text-sm">Contact support to link your child&apos;s account.</p>
          </div>
        ) : (
          <>
            {children.length > 1 && (
              <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1">
                {children.map((child) => {
                  const active = child.studentId === selectedChildId;
                  return (
                    <button
                      key={child.studentId}
                      type="button"
                      onClick={() => setSelectedChildId(child.studentId)}
                      className={[
                        'whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold transition-all',
                        active
                          ? 'text-white'
                          : 'border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300',
                      ].join(' ')}
                      style={active ? { background: '#0A9AE2' } : undefined}
                    >
                      {child.studentName}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Plans grid */}
            {plansLoading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  >
                    {/* title + subtitle */}
                    <div className="mb-3 flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="h-4 w-32 rounded bg-slate-200/70 dark:bg-slate-700" />
                        <div className="h-3 w-24 rounded bg-slate-100 dark:bg-slate-800" />
                      </div>
                      <div className="h-5 w-16 rounded-full bg-slate-100 dark:bg-slate-800" />
                    </div>
                    {/* progress bar */}
                    <div className="mb-2 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800" />
                    {/* mastered line */}
                    <div className="mb-3 h-3 w-36 rounded bg-slate-100 dark:bg-slate-800" />
                    {/* subject pills */}
                    <div className="flex gap-1.5">
                      <div className="h-5 w-20 rounded-full bg-slate-100 dark:bg-slate-800" />
                      <div className="h-5 w-16 rounded-full bg-slate-100 dark:bg-slate-800" />
                    </div>
                  </div>
                ))}
              </div>
            ) : plans.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20 text-slate-400"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 dark:bg-slate-800">
                  <Map size={24} className="text-slate-300" />
                </div>
                <p className="font-semibold text-slate-500">No plans assigned yet</p>
                <p className="mt-1 text-sm">
                  Contact {selectedChild?.studentName ?? 'your child'}&apos;s tutor to assign a learning plan
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {plans.map((plan) => (
                  <PathwayPlanCard
                    key={plan.id}
                    plan={plan}
                    subtitle={plan.tutorName ? `Tutor: ${plan.tutorName}` : 'Tutor-assigned'}
                    readOnlyNote={`Read only — managed by ${selectedChild?.studentName ?? 'your child'}'s tutor`}
                    onClick={() => setSelectedPlanId(plan.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
    </div>
  );
}
