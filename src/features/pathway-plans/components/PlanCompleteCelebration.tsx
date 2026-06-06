'use client';

import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import type { PlanSubjectSummary } from '../types/pathway-plans.types';

const SUBJECT_TONES = [
  'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
  'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300',
  'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
  'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
  'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300',
];

interface PlanCompleteCelebrationProps {
  planName: string;
  subjects: PlanSubjectSummary[];
  totalTopics: number;
  onClose: () => void;
}

export function PlanCompleteCelebration({
  planName,
  subjects,
  totalTopics,
  onClose,
}: PlanCompleteCelebrationProps) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-6"
      style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl dark:bg-slate-900"
      >
        {/* Trophy */}
        <div
          className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl"
          style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)' }}
        >
          <Trophy size={36} className="text-amber-600" />
        </div>

        <h1 className="mb-1 text-2xl font-black text-slate-900 dark:text-white">
          Plan Complete!
        </h1>
        <p className="mb-5 text-base font-bold text-slate-500 dark:text-slate-400">
          {planName}
        </p>

        {subjects.length > 0 && (
          <div className="mb-6 flex flex-wrap justify-center gap-2">
            {subjects.map((subject, idx) => (
              <span
                key={subject.id}
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${SUBJECT_TONES[idx % SUBJECT_TONES.length]}`}
              >
                {subject.name}
              </span>
            ))}
          </div>
        )}

        <p className="mb-6 text-sm text-slate-400">
          All {totalTopics} topic{totalTopics !== 1 ? 's' : ''} mastered. Outstanding work — you&apos;re
          ready for the next challenge.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-2xl bg-[#0A9AE2] py-3 text-sm font-bold text-white transition-colors hover:bg-[#0659AA]"
        >
          Back to My Plans
        </button>
      </motion.div>
    </div>
  );
}
