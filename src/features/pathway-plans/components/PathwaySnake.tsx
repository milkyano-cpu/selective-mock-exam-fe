'use client';

import { motion } from 'framer-motion';
import { Check, Clock, Lock, Play } from 'lucide-react';
import type { PathwayDetail, PathwayNodeItem } from '@/features/pathways/types/pathways.types';

type NodeState = 'completed' | 'active' | 'waiting' | 'locked';

// Snake geometry — mirrors pathways-v2-sample.html.
const LEFT_X = 100;
const RIGHT_X = 220;
const FIRST_Y = 70;
const STEP_Y = 150;

function nodeState(node: PathwayNodeItem): NodeState {
  const p = node.progress;
  const isCompleted = Boolean(p?.completedAt);
  const isUnlocked = p?.isUnlocked ?? false;
  if (isCompleted) return 'completed';
  if (!isUnlocked) return 'locked';
  if (node.questionCount === 0) return 'waiting';
  return 'active';
}

// Center coordinates of node i (0-indexed). Odd nodes sit on the left.
function nodeCenter(i: number) {
  const x = i % 2 === 0 ? RIGHT_X : LEFT_X;
  const y = FIRST_Y + i * STEP_Y;
  return { x, y };
}

// Connector stroke colour is driven by the *destination* node's state.
function connectorStroke(toState: NodeState): { color: string; dashed: boolean } {
  switch (toState) {
    case 'completed':
      return { color: '#86efac', dashed: false };
    case 'active':
      return { color: '#bfdbfe', dashed: true };
    case 'waiting':
      return { color: '#fde68a', dashed: true };
    default:
      return { color: '#e2e8f0', dashed: true };
  }
}

interface PathwaySnakeProps {
  pathway: PathwayDetail;
  readOnly?: boolean;
  startingNodeId?: string | null;
  onStartPractice?: (nodeId: string) => void;
}

export function PathwaySnake({
  pathway,
  readOnly = false,
  startingNodeId,
  onStartPractice,
}: PathwaySnakeProps) {
  const nodes = pathway.nodes;
  const completed = nodes.filter((n) => n.progress?.completedAt).length;
  const subjectProgress = nodes.length === 0 ? 0 : Math.round((completed / nodes.length) * 100);

  const svgHeight = nodes.length > 0 ? FIRST_Y + (nodes.length - 1) * STEP_Y + 70 : 0;

  return (
    <div>
      {/* Subject summary */}
      <div className="mb-6 max-w-xs">
        <div className="flex items-center gap-3">
          <p className="text-lg font-black text-slate-900 dark:text-white">
            {completed}
            <span className="font-normal text-slate-300">/{nodes.length}</span>
          </p>
          <div className="h-2 flex-1 rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-2 rounded-full transition-all"
              style={{ width: `${subjectProgress}%`, background: '#0A9AE2' }}
            />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {pathway.thresholdCorrect} correct
            </p>
            <p className="text-xs text-slate-400">per topic</p>
          </div>
        </div>
      </div>

      {nodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <p className="text-sm font-bold text-slate-500">No topics yet</p>
          <p className="mt-1 text-xs">Your tutor is still building this subject.</p>
        </div>
      ) : (
        <div className="relative" style={{ width: 320, height: svgHeight }}>
          {/* Connectors */}
          <svg className="absolute inset-0" width={320} height={svgHeight}>
            {nodes.slice(0, -1).map((_, i) => {
              const from = nodeCenter(i);
              const to = nodeCenter(i + 1);
              const { color, dashed } = connectorStroke(nodeState(nodes[i + 1]));
              const midY = (from.y + to.y) / 2;
              const d = `M ${from.x} ${from.y} C ${from.x} ${midY} ${to.x} ${midY} ${to.x} ${to.y}`;
              return (
                <path
                  key={`conn-${i}`}
                  d={d}
                  stroke={color}
                  strokeWidth={9}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={dashed ? '16 11' : undefined}
                />
              );
            })}
          </svg>

          {/* Nodes */}
          {nodes.map((node, i) => {
            const center = nodeCenter(i);
            const state = nodeState(node);
            return (
              <div
                key={node.id}
                className="absolute"
                style={{ left: center.x, top: center.y - 32, transform: 'translateX(-50%)' }}
              >
                <SnakeNode
                  node={node}
                  state={state}
                  threshold={pathway.thresholdCorrect}
                  isStarting={startingNodeId === node.id}
                  readOnly={readOnly}
                  onStart={() => onStartPractice?.(node.id)}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      {nodes.length > 0 && (
        <div className="mt-6 flex flex-nowrap items-center gap-x-2 gap-y-2 sm:flex-wrap sm:gap-3">
          <LegendDot className="bg-emerald-500" label="Mastered" />
          <LegendDot style={{ background: '#0A9AE2' }} label="In Progress" />
          <LegendDot className="bg-amber-300" label="Waiting for questions" shortLabel="Waiting" />
          <LegendDot className="bg-slate-300" label="Locked" />
        </div>
      )}
    </div>
  );
}

function LegendDot({
  className,
  style,
  label,
  shortLabel,
}: {
  className?: string;
  style?: React.CSSProperties;
  label: string;
  /** Optional condensed label shown on mobile so the legend stays one line. */
  shortLabel?: string;
}) {
  return (
    <div className="flex items-center gap-1 sm:gap-1.5">
      <div className={`h-2.5 w-2.5 shrink-0 rounded-full sm:h-3 sm:w-3 ${className ?? ''}`} style={style} />
      <span className="whitespace-nowrap text-[11px] font-semibold text-slate-500 dark:text-slate-400 sm:text-xs">
        {shortLabel ? (
          <>
            <span className="sm:hidden">{shortLabel}</span>
            <span className="hidden sm:inline">{label}</span>
          </>
        ) : (
          label
        )}
      </span>
    </div>
  );
}

interface SnakeNodeProps {
  node: PathwayNodeItem;
  state: NodeState;
  threshold: number;
  isStarting: boolean;
  readOnly: boolean;
  onStart: () => void;
}

function SnakeNode({ node, state, threshold, isStarting, readOnly, onStart }: SnakeNodeProps) {
  const correct = node.progress?.correctAnswers ?? 0;

  // Each block is centered on the node coordinate via translateX(-50%).
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', bounce: 0.4, duration: 0.4 }}
      className="flex flex-col items-center"
      style={{ width: 145 }}
    >
      {state === 'completed' && (
        <>
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500"
            style={{ boxShadow: '0 6px 18px rgba(16,185,129,0.4)' }}
          >
            <Check size={28} strokeWidth={3} className="text-white" />
          </div>
          <p className="mt-2.5 text-center text-xs font-black leading-tight text-emerald-700 dark:text-emerald-400">
            {node.topic.name}
          </p>
          <p className="mt-0.5 text-xs font-semibold text-emerald-500">Mastered</p>
        </>
      )}

      {state === 'active' && (
        <>
          <div className="relative flex items-center justify-center">
            <div
              className="absolute h-20 w-20 animate-ping rounded-full"
              style={{ background: '#0A9AE2', opacity: 0.2 }}
            />
            <div
              className="absolute h-24 w-24 animate-ping rounded-full"
              style={{ background: '#0A9AE2', opacity: 0.1, animationDelay: '0.4s' }}
            />
            <button
              type="button"
              onClick={onStart}
              disabled={readOnly || isStarting}
              aria-label={`Start ${node.topic.name}`}
              className={[
                'relative z-10 flex h-16 w-16 items-center justify-center rounded-full transition-transform',
                readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-105 active:scale-95',
                isStarting ? 'opacity-60' : '',
              ].join(' ')}
              style={{ background: '#0A9AE2', boxShadow: '0 6px 22px rgba(10,154,226,0.5)' }}
            >
              <Play size={26} className="text-white" fill="white" />
            </button>
          </div>
          <p className="mt-3 text-center text-xs font-black leading-tight" style={{ color: '#0A9AE2' }}>
            {node.topic.name}
          </p>
          <p className="mt-0.5 text-xs font-semibold text-slate-400">
            {correct} / {threshold} correct
          </p>
          {!readOnly && (
            <button
              type="button"
              onClick={onStart}
              disabled={isStarting}
              className="mt-2.5 rounded-xl px-5 py-1.5 text-xs font-black text-white transition-opacity disabled:opacity-60"
              style={{ background: '#0A9AE2' }}
            >
              {isStarting ? 'Starting…' : 'Start'}
            </button>
          )}
        </>
      )}

      {state === 'waiting' && (
        <>
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100"
            style={{ boxShadow: '0 4px 14px rgba(245,158,11,0.2)' }}
          >
            <Clock size={24} className="text-amber-600" />
          </div>
          <p className="mt-2.5 text-center text-xs font-black leading-tight text-amber-700 dark:text-amber-400">
            {node.topic.name}
          </p>
          <p className="mt-0.5 text-center text-xs font-semibold text-amber-500">
            Waiting for questions
          </p>
        </>
      )}

      {state === 'locked' && (
        <div className="flex flex-col items-center opacity-40">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700">
            <Lock size={22} className="text-slate-400" />
          </div>
          <p className="mt-2.5 text-center text-xs font-black leading-tight text-slate-400">
            {node.topic.name}
          </p>
          <p className="mt-0.5 text-xs font-semibold text-slate-300">Locked</p>
        </div>
      )}
    </motion.div>
  );
}
