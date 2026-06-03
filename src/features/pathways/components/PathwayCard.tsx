'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowUpDown, BookOpen, BookOpenCheck, CheckCircle2, Loader2, Lock, Plus, Target, Trash2, Unlock } from 'lucide-react';
import { PathwayNode } from './PathwayNode';
import type { PathwayDetail, PathwayNodeItem } from '../types/pathways.types';



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
  /** Tutor: open the question picker for a specific node. */
  onEditNodeQuestions?: (node: PathwayNodeItem) => void;
  /** Tutor: open the reorder-nodes modal for this pathway. */
  onReorder?: () => void;
  /** Tutor: remove a single node from the pathway (inline-confirmed in the row). */
  onRemoveNode?: (node: PathwayNodeItem) => void | Promise<void>;
}

export function PathwayCard({
  pathway,
  isTutorView = false,
  onRemove,
  onAddTopic,
  onStartPractice,
  startingNodeId,
  onEditNodeQuestions,
  onReorder,
  onRemoveNode,
}: PathwayCardProps) {
  const [removing, setRemoving] = useState(false);
  const [confirmingNodeId, setConfirmingNodeId] = useState<string | null>(null);
  const [removingNodeId, setRemovingNodeId] = useState<string | null>(null);
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

  const handleRemoveNode = async (node: PathwayNodeItem) => {
    if (removingNodeId) return;
    setRemovingNodeId(node.id);
    try {
      await onRemoveNode?.(node);
      setConfirmingNodeId(null);
    } finally {
      setRemovingNodeId(null);
    }
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
      className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Card header — icon + subject + threshold·nodes, with Reorder/Remove */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0A9AE2]/10">
            <BookOpen size={16} className="text-[#0A9AE2]" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white">
              {pathway.subject.name}
            </h2>
            <p className="text-xs text-slate-400">
              Threshold: {pathway.thresholdCorrect} correct · {pathway.nodes.length} node
              {pathway.nodes.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onReorder && pathway.nodes.length > 1 && (
            <button
              type="button"
              onClick={onReorder}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <ArrowUpDown size={11} />
              Reorder
            </button>
          )}
          <button
            type="button"
            onClick={handleRemove}
            disabled={removing}
            className="rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-60 dark:hover:bg-red-500/10"
          >
            {removing ? 'Removing…' : 'Remove'}
          </button>
        </div>
      </div>

      {/* Node rows — four states matching the sample design */}
      <div className="px-5 pb-3">
        {pathway.nodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <p className="text-sm font-medium">No topics yet</p>
            <p className="mt-1 text-xs">Add topics to build this pathway</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pathway.nodes.map((node, i) => {
              const isCompleted = Boolean(node.progress?.completedAt);
              const isUnlocked = node.progress?.isUnlocked ?? false;
              const hasQuestions = node.questionCount > 0;
              // Locked = not yet reachable by the student and no questions curated.
              const isLocked = !isUnlocked && !hasQuestions && !isCompleted;

              const rowClass = isCompleted
                ? 'border-emerald-100 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10'
                : hasQuestions
                  ? 'border-blue-100 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/10'
                  : isLocked
                    ? 'border-slate-100 bg-slate-50 opacity-60 dark:border-slate-800 dark:bg-slate-800/40'
                    : 'border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10';

              const indexClass = isCompleted
                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300'
                : hasQuestions
                  ? 'bg-blue-100 text-[#0A9AE2] dark:bg-blue-500/20 dark:text-blue-300'
                  : isLocked
                    ? 'bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-400'
                    : 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300';

              const nameClass = isCompleted
                ? 'text-emerald-700 dark:text-emerald-300'
                : hasQuestions
                  ? 'text-[#0A9AE2]'
                  : isLocked
                    ? 'text-slate-400'
                    : 'text-amber-700 dark:text-amber-300';

              const isConfirming = confirmingNodeId === node.id;
              return (
                <div
                  key={node.id}
                  className={['rounded-2xl border', rowClass].join(' ')}
                >
                  <div className="flex items-center gap-3 p-3">
                    <div
                      className={[
                        'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg text-xs font-black',
                        indexClass,
                      ].join(' ')}
                    >
                      {i + 1}
                    </div>
                    <p className={['flex-1 truncate text-sm font-bold', nameClass].join(' ')}>
                      {node.topic.name}
                    </p>

                    {/* Right-side affordances per state */}
                    {isCompleted ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onEditNodeQuestions?.(node)}
                          className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-600 transition-colors hover:bg-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300"
                          title="Edit questions"
                        >
                          {node.questionCount} question{node.questionCount !== 1 ? 's' : ''}
                        </button>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300">
                          Mastered
                        </span>
                      </>
                    ) : hasQuestions ? (
                      <>
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-[#0A9AE2] dark:bg-blue-500/20 dark:text-blue-300">
                          {node.questionCount} question{node.questionCount !== 1 ? 's' : ''}
                        </span>
                        <button
                          type="button"
                          onClick={() => onEditNodeQuestions?.(node)}
                          className="rounded-lg px-2 py-0.5 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                        >
                          Edit
                        </button>
                      </>
                    ) : isLocked ? (
                      <button
                        type="button"
                        onClick={() => onEditNodeQuestions?.(node)}
                        className="rounded-lg px-2 py-0.5 text-xs font-bold text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                      >
                        Add Questions
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onEditNodeQuestions?.(node)}
                        className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700 transition-colors hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-300"
                      >
                        <Plus size={10} strokeWidth={3} />
                        Add Questions
                      </button>
                    )}

                    {onRemoveNode && (
                      <button
                        type="button"
                        onClick={() => setConfirmingNodeId(node.id)}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                        title="Remove node"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {isConfirming && (
                    <div className="border-t border-red-200/70 px-3 py-3 dark:border-red-500/20">
                      <p className="flex items-start gap-2 text-xs font-semibold text-red-700 dark:text-red-300">
                        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                        Removing this node will delete the student&apos;s progress for this topic.
                      </p>
                      <div className="mt-3 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmingNodeId(null)}
                          disabled={removingNodeId === node.id}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveNode(node)}
                          disabled={removingNodeId === node.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
                        >
                          {removingNodeId === node.id ? <Loader2 size={12} className="animate-spin" /> : null}
                          Yes, remove node
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Topic — compact dashed button, matching the sample */}
      {isTutorView && (
        <div className="px-5 pb-5">
          <button
            type="button"
            onClick={onAddTopic}
            className="group flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-slate-300 py-2.5 text-xs font-bold text-slate-400 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-400 dark:border-slate-700"
          >
            <Plus size={13} strokeWidth={3} className="transition-transform group-hover:scale-110" />
            Add Topic
          </button>
        </div>
      )}
    </motion.div>
  );
}
