'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpenCheck, CheckCircle2, Lock, PlusCircle, Target, Trash2, Unlock } from 'lucide-react';
import { PathwayNode } from './PathwayNode';
import type { PathwayDetail } from '../types/pathways.types';



const NODES_PER_ROW = 3;
const ROW_HEIGHT = 160;
const PADDING_Y = 60;

const getNodePosition = (index: number) => {
  const r = Math.floor(index / NODES_PER_ROW);
  let c = index % NODES_PER_ROW;
  if (r % 2 === 1) {
    c = NODES_PER_ROW - 1 - c;
  }
  
  let x = ((c + 0.5) / NODES_PER_ROW) * 100;
  let y = PADDING_Y + (r + 0.5) * ROW_HEIGHT;

  const offset = [
    { x: 2, y: 15 },
    { x: -2, y: -15 },
    { x: -2, y: 10 },
    { x: 2, y: -10 },
    { x: -1, y: 20 },
    { x: 1, y: -20 },
  ][index % 6];

  x += offset.x;
  y += offset.y;

  return { x, y, r, c };
};




interface PathwayCardProps {
  pathway: PathwayDetail;
  isTutorView?: boolean;
  onRemove?: () => void;
  onAddTopic?: () => void;
  onStartPractice?: (nodeId: string) => void;
  startingNodeId?: string | null;
}

export function PathwayCard({
  pathway,
  isTutorView = false,
  onRemove,
  onAddTopic,
  onStartPractice,
  startingNodeId,
}: PathwayCardProps) {
  const [removing, setRemoving] = useState(false);
  const completedCount = pathway.nodes.filter((node) => node.progress?.completedAt).length;
  const unlockedCount = pathway.nodes.filter((node) => node.progress?.isUnlocked).length;
  const lockedCount = Math.max(pathway.nodes.length - unlockedCount, 0);
  const progressPercent = pathway.nodes.length === 0
    ? 0
    : Math.round((completedCount / pathway.nodes.length) * 100);
  const nextNode = pathway.nodes.find((node) => node.progress?.isUnlocked && !node.progress?.completedAt);

  const handleRemove = async () => {
    if (removing) return;
    setRemoving(true);
    await onRemove?.();
    setRemoving(false);
  };

  if (!isTutorView) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="border-b border-slate-100 bg-gradient-to-r from-white via-sky-50 to-white px-5 py-5 dark:border-slate-800 dark:from-slate-900 dark:via-slate-800/70 dark:to-slate-900 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0A9AE2] text-white shadow-lg shadow-blue-500/20">
                  <BookOpenCheck size={22} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-wide text-[#0A9AE2]">
                    Learning pathway
                  </p>
                  <h3 className="truncate text-2xl font-black leading-tight text-slate-950 dark:text-white">
                    {pathway.subject.name}
                  </h3>
                </div>
              </div>

              {nextNode && (
                <p className="mt-4 max-w-xl text-sm font-semibold leading-relaxed text-slate-500 dark:text-slate-400">
                  Next up: <span className="text-slate-800 dark:text-slate-200">{nextNode.topic.name}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 sm:min-w-[260px]">
              <div className="rounded-2xl border border-slate-100 bg-white/80 p-3 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                <p className="text-xl font-black text-slate-950 dark:text-white">{progressPercent}%</p>
                <p className="mt-0.5 text-[10px] font-black uppercase tracking-wide text-slate-400">Done</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white/80 p-3 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                <p className="text-xl font-black text-[#0A9AE2]">{unlockedCount}</p>
                <p className="mt-0.5 text-[10px] font-black uppercase tracking-wide text-slate-400">Open</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white/80 p-3 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                <p className="text-xl font-black text-slate-500 dark:text-slate-300">{pathway.nodes.length}</p>
                <p className="mt-0.5 text-[10px] font-black uppercase tracking-wide text-slate-400">Modules</p>
              </div>
            </div>
          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:ring-slate-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#0A9AE2] to-emerald-400 transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
              <CheckCircle2 size={14} className="text-emerald-500" />
              {completedCount} completed
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
              <Unlock size={14} className="text-[#0A9AE2]" />
              {unlockedCount} unlocked
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
              <Lock size={14} className="text-slate-400" />
              {lockedCount} locked
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
              <Target size={14} className="text-[#FF6900]" />
              Goal: {pathway.thresholdCorrect} correct
            </span>
          </div>
        </div>

        <div className="px-4 py-5 sm:px-6">
          {pathway.nodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-10 text-slate-400 dark:border-slate-800">
              <p className="text-sm font-bold">No modules yet</p>
              <p className="mt-1 text-xs">Your tutor is still building this pathway.</p>
            </div>
          ) : (
            <div 
              className="relative mx-auto w-full max-w-3xl" 
              style={{ height: `${Math.max(1, Math.ceil(pathway.nodes.length / NODES_PER_ROW)) * ROW_HEIGHT + (PADDING_Y * 2)}px` }}
            >
              {/* SVG Path Background */}
              <svg 
                className="absolute inset-0 pointer-events-none" 
                style={{ width: '100%', height: '100%' }}
                viewBox={`0 0 100 ${Math.max(1, Math.ceil(pathway.nodes.length / NODES_PER_ROW)) * ROW_HEIGHT + (PADDING_Y * 2)}`}
                preserveAspectRatio="none"
              >
                {pathway.nodes.map((_, i) => {
                  if (i === pathway.nodes.length - 1) return null;
                  const p0 = getNodePosition(i);
                  const p1 = getNodePosition(i + 1);
                  
                  const isNextUnlocked = pathway.nodes[i + 1].progress?.isUnlocked ?? false;
                  const strokeClass = isNextUnlocked 
                    ? 'stroke-[#0A9AE2] drop-shadow-[0_0_6px_rgba(10,154,226,0.5)]' 
                    : 'stroke-slate-200 dark:stroke-slate-700';

                  let d = `M ${p0.x} ${p0.y}`;
                  if (p0.r === p1.r) {
                    const midX = (p0.x + p1.x) / 2;
                    d += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
                  } else {
                    const isRightEdge = p0.c === NODES_PER_ROW - 1;
                    const extension = isRightEdge ? 12 : -12; 
                    d += ` C ${p0.x + extension} ${p0.y}, ${p1.x + extension} ${p1.y}, ${p1.x} ${p1.y}`;
                  }

                  return (
                    <path
                      key={`path-${i}`}
                      d={d}
                      fill="none"
                      strokeWidth="4"
                      strokeDasharray="8 8"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                      className={`transition-all duration-500 ${strokeClass}`}
                    />
                  );
                })}
              </svg>

              {/* Nodes */}
              {pathway.nodes.map((node, i) => {
                const pos = getNodePosition(i);
                return (
                  <motion.div
                    key={node.id}
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.4, type: "spring", bounce: 0.4 }}
                    className="absolute z-10 flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${pos.x}%`,
                      top: `${pos.y}px`
                    }}
                  >
                    <PathwayNode
                      node={node}
                      thresholdCorrect={pathway.thresholdCorrect}
                      isFirst={i === 0}
                      sizeCls="w-16 h-16 sm:w-20 sm:h-20"
                      iconSize={26}
                      isTutorView={false}
                      variant="path"
                      isStarting={startingNodeId === node.id}
                      onStartPractice={() => onStartPractice?.(node.id)}
                    />
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden"
    >
      {/* Card header */}
      <div className="flex items-start justify-between px-6 pt-6 pb-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            {pathway.subject.name}
          </h3>
          <p className="text-sm text-slate-400 mt-0.5">
            {pathway.nodes.length} module{pathway.nodes.length !== 1 ? 's' : ''}
          </p>
        </div>

        {isTutorView && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={removing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 active:bg-red-700 text-white text-sm font-bold transition-colors disabled:opacity-60"
          >
            <Trash2 size={14} />
            {removing ? 'Removing…' : 'Remove Pathway'}
          </button>
        )}
      </div>

      {/* Node map layout */}
      <div className="relative px-6 pb-4 min-h-[120px]">
        {pathway.nodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <p className="text-sm font-medium">No topics yet</p>
            <p className="text-xs mt-1">Add topics to build this pathway</p>
          </div>
        ) : (
          <div 
            className="relative mx-auto w-full max-w-3xl" 
            style={{ height: `${Math.max(1, Math.ceil(pathway.nodes.length / NODES_PER_ROW)) * ROW_HEIGHT + (PADDING_Y * 2)}px` }}
          >
            {/* SVG Path Background */}
            <svg 
              className="absolute inset-0 pointer-events-none" 
              style={{ width: '100%', height: '100%' }}
              viewBox={`0 0 100 ${Math.max(1, Math.ceil(pathway.nodes.length / NODES_PER_ROW)) * ROW_HEIGHT + (PADDING_Y * 2)}`}
              preserveAspectRatio="none"
            >
              {pathway.nodes.map((_, i) => {
                if (i === pathway.nodes.length - 1) return null;
                const p0 = getNodePosition(i);
                const p1 = getNodePosition(i + 1);

                let d = `M ${p0.x} ${p0.y}`;
                if (p0.r === p1.r) {
                  const midX = (p0.x + p1.x) / 2;
                  d += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
                } else {
                  const isRightEdge = p0.c === NODES_PER_ROW - 1;
                  const extension = isRightEdge ? 12 : -12; 
                  d += ` C ${p0.x + extension} ${p0.y}, ${p1.x + extension} ${p1.y}, ${p1.x} ${p1.y}`;
                }

                return (
                  <path
                    key={`path-${i}`}
                    d={d}
                    fill="none"
                    strokeWidth="4"
                    strokeDasharray="8 8"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    className="stroke-slate-200 dark:stroke-slate-700"
                  />
                );
              })}
            </svg>

            {/* Nodes */}
            {pathway.nodes.map((node, i) => {
              const pos = getNodePosition(i);
              return (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, scale: 0.5, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.4, type: "spring", bounce: 0.4 }}
                  className="absolute z-10 flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}px`
                  }}
                >
                  <PathwayNode
                    node={node}
                    thresholdCorrect={pathway.thresholdCorrect}
                    isFirst={i === 0}
                    sizeCls="w-16 h-16 sm:w-20 sm:h-20"
                    iconSize={26}
                    isTutorView={isTutorView}
                    onStartPractice={() => onStartPractice?.(node.id)}
                  />
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Topic button (tutor only) */}
      {isTutorView && (
        <div className="px-6 pb-6">
          <button
            type="button"
            onClick={onAddTopic}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-500 hover:border-[#0A9AE2] hover:text-[#0A9AE2] transition-colors text-sm font-semibold group"
          >
            <PlusCircle size={18} className="group-hover:scale-110 transition-transform" />
            Add Topic
          </button>
        </div>
      )}
    </motion.div>
  );
}
