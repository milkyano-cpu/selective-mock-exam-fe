'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Map } from 'lucide-react';
import { usePathwayPlans } from '@/features/pathway-plans/hooks/usePathwayPlans';
import { PathwayPlanCard } from '@/features/pathway-plans/components/PathwayPlanCard';
import { PlanDetailView } from '@/features/pathway-plans/components/PlanDetailView';
import { pathwaysService } from '../services/pathways.service';

export function StudentPathwayView() {
  const router = useRouter();
  const { plans, isLoading, fetchPlans } = usePathwayPlans();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [startingNode, setStartingNode] = useState<string | null>(null);

  useEffect(() => {
    void fetchPlans();
  }, [fetchPlans]);

  const handleStartPractice = async (pathwayId: string, nodeId: string) => {
    if (startingNode) return;
    setStartingNode(nodeId);
    try {
      const res = await pathwaysService.startPractice(pathwayId, nodeId);
      if (res.success) {
        router.push(`/dashboard/practice/sessions/${res.data.sessionId}`);
      }
    } finally {
      setStartingNode(null);
    }
  };

  // ── Plan detail (snake view) ───────────────────────────────────────────────
  if (selectedPlanId) {
    return (
      <PlanDetailView
        planId={selectedPlanId}
        onBack={() => setSelectedPlanId(null)}
        onStartPractice={handleStartPractice}
        startingNodeId={startingNode}
      />
    );
  }

  // ── Plan list ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">My Plans</h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Learning plans assigned by your tutor</p>
        </header>

        {isLoading ? (
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
            className="flex flex-col items-center justify-center py-24 text-slate-400"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 dark:bg-slate-800">
              <Map size={28} className="text-slate-300" />
            </div>
            <p className="text-lg font-black text-slate-500 dark:text-slate-400">
              No plans assigned yet
            </p>
            <p className="mt-1 text-sm">Your tutor will set up your learning plan</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => (
              <PathwayPlanCard
                key={plan.id}
                plan={plan}
                subtitle={plan.tutorName ? `Assigned by ${plan.tutorName}` : 'Assigned by your tutor'}
                onClick={() => setSelectedPlanId(plan.id)}
              />
            ))}
          </div>
        )}
    </div>
  );
}
