'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle2, Loader2, Map, Target, TrendingUp, Unlock } from 'lucide-react';
import { pathwaysService } from '../services/pathways.service';
import { usePathways } from '../hooks/usePathways';
import { PathwayCard } from './PathwayCard';
import type { PathwayDetail } from '../types/pathways.types';

export function StudentPathwayView() {
  const router = useRouter();
  const { pathways, isLoading, fetchPathways } = usePathways();
  const [pathwayDetails, setPathwayDetails] = useState<Record<string, PathwayDetail>>({});
  const [startingNode, setStartingNode] = useState<string | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void fetchPathways();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [fetchPathways]);

  const loadDetails = useCallback(async () => {
    for (const p of pathways) {
      if (pathwayDetails[p.id]) continue;
      const res = await pathwaysService.get(p.id);
      if (res.success) {
        setPathwayDetails((prev) => ({ ...prev, [p.id]: res.data }));
      }
    }
  }, [pathways, pathwayDetails]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void loadDetails();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [loadDetails]);

  const handleStartPractice = async (pathwayId: string, nodeId: string) => {
    if (startingNode) return;
    setStartingNode(nodeId);
    try {
      const res = await pathwaysService.startPractice(pathwayId, nodeId);
      if (res.success) {
        sessionStorage.setItem(`practice_node_${res.data.sessionId}`, nodeId);
        sessionStorage.setItem(`practice_pathway_${res.data.sessionId}`, pathwayId);
        sessionStorage.setItem(`practice_topic_${res.data.sessionId}`, res.data.topicId);
        router.push(`/dashboard/pathways/practice/${res.data.sessionId}`);
      }
    } finally {
      setStartingNode(null);
    }
  };

  const loadedPathways = pathways
    .map((pathway) => pathwayDetails[pathway.id])
    .filter((pathway): pathway is PathwayDetail => Boolean(pathway));
  const totalModules = loadedPathways.reduce((sum, pathway) => sum + pathway.nodes.length, 0);
  const completedModules = loadedPathways.reduce(
    (sum, pathway) => sum + pathway.nodes.filter((node) => node.progress?.completedAt).length,
    0
  );
  const unlockedModules = loadedPathways.reduce(
    (sum, pathway) => sum + pathway.nodes.filter((node) => node.progress?.isUnlocked).length,
    0
  );
  const overallProgress = totalModules === 0 ? 0 : Math.round((completedModules / totalModules) * 100);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_360px] lg:items-center">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0A9AE2]/10 text-[#0A9AE2]">
                  <Map size={23} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-[#0A9AE2]">
                    Pathways
                  </p>
                  <h1 className="text-2xl font-black leading-tight text-slate-950 dark:text-white sm:text-3xl">
                    My Learning Pathways
                  </h1>
                </div>
              </div>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                Complete each module to unlock the next topic and keep your study plan moving.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-950">
                <TrendingUp size={16} className="mx-auto mb-1 text-[#0A9AE2]" />
                <p className="text-2xl font-black text-slate-950 dark:text-white">{overallProgress}%</p>
                <p className="mt-0.5 text-[10px] font-black uppercase tracking-wide text-slate-400">Progress</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-950">
                <CheckCircle2 size={16} className="mx-auto mb-1 text-emerald-500" />
                <p className="text-2xl font-black text-slate-950 dark:text-white">{completedModules}</p>
                <p className="mt-0.5 text-[10px] font-black uppercase tracking-wide text-slate-400">Done</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-950">
                <Unlock size={16} className="mx-auto mb-1 text-[#FF6900]" />
                <p className="text-2xl font-black text-slate-950 dark:text-white">{unlockedModules}</p>
                <p className="mt-0.5 text-[10px] font-black uppercase tracking-wide text-slate-400">Unlocked</p>
              </div>
            </div>
          </div>
        </motion.div>

        {!isLoading && pathways.length > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
              <BookOpen size={14} className="text-[#0A9AE2]" />
              {pathways.length} pathway{pathways.length !== 1 ? 's' : ''}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
              <Target size={14} className="text-[#FF6900]" />
              {totalModules} module{totalModules !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={32} className="animate-spin text-[#0A9AE2]" />
          </div>
        ) : pathways.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24 text-slate-400"
          >
            <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-5">
              <BookOpen size={36} className="text-slate-300" />
            </div>
            <p className="text-lg font-black text-slate-500 dark:text-slate-400">
              No pathways assigned yet
            </p>
            <p className="text-sm mt-2 text-center max-w-sm">
              Ask your tutor to set up your personalised learning path to get started
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {pathways.map((p, idx) => {
              const detail = pathwayDetails[p.id];
              if (!detail) {
                return (
                  <div
                    key={p.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 flex items-center justify-center min-h-[200px]"
                  >
                    <Loader2 size={24} className="animate-spin text-slate-300" />
                  </div>
                );
              }
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                >
                  <PathwayCard
                    pathway={detail}
                    isTutorView={false}
                    startingNodeId={startingNode}
                    onStartPractice={(nodeId) => handleStartPractice(p.id, nodeId)}
                  />
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
