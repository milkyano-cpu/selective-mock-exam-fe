'use client';

import { X, CheckCircle2, Lock, BookOpen, TrendingUp, Target, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PathwayDetail, PathwayNodeItem } from '../types/pathways.types';

interface PathwayProgressModalProps {
  isOpen: boolean;
  studentName: string;
  pathwayDetails: Record<string, PathwayDetail>;
  onClose: () => void;
}

function nodeStatus(node: PathwayNodeItem): 'locked' | 'unlocked' | 'completed' {
  if (node.progress?.completedAt) return 'completed';
  if (node.progress?.isUnlocked) return 'unlocked';
  return 'locked';
}

function PathwayProgressCard({
  pathway,
  index,
}: {
  pathway: PathwayDetail;
  index: number;
}) {
  const totalNodes = pathway.nodes.length;
  const completedNodes = pathway.nodes.filter((n) => n.progress?.completedAt).length;
  const unlockedNodes = pathway.nodes.filter(
    (n) => n.progress?.isUnlocked && !n.progress?.completedAt
  ).length;
  const pct = totalNodes > 0 ? Math.round((completedNodes / totalNodes) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden"
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0A9AE2]/10 flex items-center justify-center flex-shrink-0">
            <BookOpen size={16} className="text-[#0A9AE2]" />
          </div>
          <div>
            <h4 className="font-black text-slate-900 dark:text-white text-sm">
              {pathway.subject.name}
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {completedNodes} of {totalNodes} topics completed
            </p>
          </div>
        </div>

        {/* Circular % badge */}
        <div className="relative w-12 h-12 flex-shrink-0">
          <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
            <circle cx="20" cy="20" r="16" fill="none" stroke="#e2e8f0" strokeWidth="4" />
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke={pct === 100 ? '#22c55e' : '#0A9AE2'}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 16}`}
              strokeDashoffset={`${2 * Math.PI * 16 * (1 - pct / 100)}`}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-black text-slate-700 dark:text-slate-200">
              {pct}%
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5 pt-3 pb-1">
        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.06 + 0.2 }}
            className={`h-full rounded-full ${pct === 100 ? 'bg-green-500' : 'bg-[#0A9AE2]'}`}
          />
        </div>
        <div className="flex items-center gap-4 mt-2 mb-3 text-[10px] font-semibold">
          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <CheckCircle2 size={10} /> {completedNodes} completed
          </span>
          <span className="flex items-center gap-1 text-[#0A9AE2]">
            <BookOpen size={10} /> {unlockedNodes} in progress
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <Lock size={10} /> {totalNodes - completedNodes - unlockedNodes} locked
          </span>
        </div>
      </div>

      {/* Node table */}
      <div className="px-5 pb-4">
        <div className="space-y-1.5">
          {pathway.nodes.map((node, idx) => {
            const status = nodeStatus(node);
            const correct = node.progress?.correctAnswers ?? 0;
            const attempts = node.progress?.totalAttempts ?? 0;

            return (
              <div
                key={node.id}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs ${
                  status === 'completed'
                    ? 'bg-green-50 dark:bg-green-900/20'
                    : status === 'unlocked'
                      ? 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700'
                      : 'opacity-50'
                }`}
              >
                {/* Order index */}
                <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px] font-black text-slate-500 flex-shrink-0">
                  {idx + 1}
                </span>

                {/* Status icon */}
                {status === 'completed' ? (
                  <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" />
                ) : status === 'unlocked' ? (
                  <BookOpen size={13} className="text-[#0A9AE2] flex-shrink-0" />
                ) : (
                  <Lock size={11} className="text-slate-300 flex-shrink-0" />
                )}

                {/* Topic name */}
                <span
                  className={`flex-1 font-semibold truncate ${
                    status === 'completed'
                      ? 'text-green-700 dark:text-green-300'
                      : status === 'unlocked'
                        ? 'text-slate-700 dark:text-slate-200'
                        : 'text-slate-400'
                  }`}
                >
                  {node.topic.name}
                </span>

                {/* Score */}
                {status !== 'locked' && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span
                      className={`font-black tabular-nums ${
                        status === 'completed' ? 'text-green-600' : 'text-[#0A9AE2]'
                      }`}
                    >
                      {correct}
                    </span>
                    <span className="text-slate-300">/</span>
                    <span className="text-slate-400 font-medium">{pathway.thresholdCorrect}</span>
                    {attempts > 0 && (
                      <span className="text-[9px] text-slate-300 font-medium ml-1">
                        ({attempts} tries)
                      </span>
                    )}
                  </div>
                )}

                {/* Status chip */}
                <span
                  className={`text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                    status === 'completed'
                      ? 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400'
                      : status === 'unlocked'
                        ? 'bg-[#0A9AE2]/10 text-[#0A9AE2]'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                  }`}
                >
                  {status}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

export function PathwayProgressModal({
  isOpen,
  studentName,
  pathwayDetails,
  onClose,
}: PathwayProgressModalProps) {
  const pathways = Object.values(pathwayDetails);

  // Aggregate stats
  const totalNodes = pathways.reduce((s, p) => s + p.nodes.length, 0);
  const completedNodes = pathways.reduce(
    (s, p) => s + p.nodes.filter((n) => n.progress?.completedAt).length,
    0
  );
  const overallPct = totalNodes > 0 ? Math.round((completedNodes / totalNodes) * 100) : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0A9AE2]/10 flex items-center justify-center">
              <TrendingUp size={20} className="text-[#0A9AE2]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Progress Report
              </h2>
              <p className="text-xs text-slate-400">{studentName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Summary strip */}
        {pathways.length > 0 && (
          <div className="mx-6 mb-4 flex-shrink-0">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#0A9AE2]/5 dark:bg-[#0A9AE2]/10 rounded-2xl px-4 py-3 text-center">
                <p className="text-2xl font-black text-[#0A9AE2]">{pathways.length}</p>
                <p className="text-[10px] font-semibold text-slate-500 mt-0.5">Pathways</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl px-4 py-3 text-center">
                <p className="text-2xl font-black text-green-600">{completedNodes}</p>
                <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
                  Topics Done
                </p>
              </div>
              <div
                className={`rounded-2xl px-4 py-3 text-center ${
                  overallPct === 100
                    ? 'bg-green-50 dark:bg-green-900/20'
                    : 'bg-slate-50 dark:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <p
                    className={`text-2xl font-black ${
                      overallPct === 100 ? 'text-green-600' : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {overallPct}%
                  </p>
                  {overallPct === 100 && <Award size={16} className="text-green-500" />}
                </div>
                <p className="text-[10px] font-semibold text-slate-500 mt-0.5">Overall</p>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable pathway list */}
        <div className="overflow-y-auto px-6 pb-6 flex-1 space-y-4">
          <AnimatePresence>
            {pathways.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Target size={36} className="text-slate-200 mb-3" />
                <p className="font-semibold text-slate-500">No pathways assigned yet</p>
              </div>
            ) : (
              pathways.map((pathway, idx) => (
                <PathwayProgressCard key={pathway.id} pathway={pathway} index={idx} />
              ))
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
