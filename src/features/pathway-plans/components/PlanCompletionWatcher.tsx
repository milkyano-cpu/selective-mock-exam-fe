'use client';

import { useEffect, useState } from 'react';
import { pathwayPlansService } from '../services/pathway-plans.service';
import { PlanCompleteCelebration } from './PlanCompleteCelebration';
import type { PathwayPlanDetail } from '../types/pathway-plans.types';

const STORAGE_KEY = 'aspire.pathways.celebratedPlans';

function readCelebrated(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function markCelebrated(planId: string) {
  if (typeof window === 'undefined') return;
  try {
    const set = readCelebrated();
    set.add(planId);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    /* ignore quota / serialization errors */
  }
}

/**
 * Shows the completion celebration for the exact plan a just-finished pathway
 * session belongs to. The result page passes the session's `planId` (now part
 * of the practice session response); we fetch that one plan and, if it's
 * complete and hasn't been celebrated yet, show the overlay once.
 *
 * Pass `planId={null}` for non-pathway sessions — the watcher then does nothing.
 */
export function PlanCompletionWatcher({ planId }: { planId: string | null }) {
  const [plan, setPlan] = useState<PathwayPlanDetail | null>(null);

  useEffect(() => {
    if (!planId) return;
    let cancelled = false;

    (async () => {
      try {
        // Skip the network call entirely if we've already celebrated this plan.
        if (readCelebrated().has(planId)) return;

        const res = await pathwayPlansService.get(planId);
        if (cancelled || !res.success) return;

        if (res.data.isComplete) {
          markCelebrated(planId);
          setPlan(res.data);
        }
      } catch {
        /* non-critical — skip celebration on error */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [planId]);

  if (!plan) return null;

  return (
    <PlanCompleteCelebration
      planName={plan.name}
      subjects={plan.subjects}
      totalTopics={plan.totalNodes}
      onClose={() => setPlan(null)}
    />
  );
}
