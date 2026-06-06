'use client';

import { useState } from 'react';
import { GripVertical, X, Loader2, ArrowUpDown } from 'lucide-react';
import { pathwaysService } from '../services/pathways.service';
import type { PathwayNodeItem } from '../types/pathways.types';

interface ReorderNodesModalProps {
  isOpen: boolean;
  pathwayId: string;
  nodes: PathwayNodeItem[];
  onClose: () => void;
  onReordered: (nodes: PathwayNodeItem[]) => void;
}

export function ReorderNodesModal({
  isOpen,
  pathwayId,
  nodes,
  onClose,
  onReordered,
}: ReorderNodesModalProps) {
  const [items, setItems] = useState<PathwayNodeItem[]>(
    [...nodes].sort((a, b) => a.orderIndex - b.orderIndex)
  );
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync items when nodes prop changes
  const handleOpen = () => {
    setItems([...nodes].sort((a, b) => a.orderIndex - b.orderIndex));
    setDraggingIdx(null);
    setDragOverIdx(null);
    setError(null);
  };

  const handleDragStart = (idx: number) => {
    setDraggingIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };

  const handleDrop = (targetIdx: number) => {
    if (draggingIdx === null || draggingIdx === targetIdx) {
      setDraggingIdx(null);
      setDragOverIdx(null);
      return;
    }
    const reordered = [...items];
    const [moved] = reordered.splice(draggingIdx, 1);
    reordered.splice(targetIdx, 0, moved);
    setItems(reordered);
    setDraggingIdx(null);
    setDragOverIdx(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const order = items.map((node, idx) => ({ nodeId: node.id, orderIndex: idx }));
      const res = await pathwaysService.reorderNodes(pathwayId, { order });
      if (res.success) {
        onReordered(res.data);
        onClose();
      } else {
        setError(res.message);
      }
    } catch {
      setError('Failed to save order. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  // Sync on open
  if (items.length !== nodes.length) {
    handleOpen();
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0A9AE2]/10 flex items-center justify-center">
              <ArrowUpDown size={20} className="text-[#0A9AE2]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Reorder Nodes</h2>
              <p className="text-xs text-slate-400">Drag to rearrange topic order</p>
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

        <div className="px-6 pb-6 space-y-4">
          {items.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No nodes to reorder.</p>
          ) : (
            <ul className="space-y-2 max-h-72 overflow-y-auto">
              {items.map((node, idx) => (
                <li
                  key={node.id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={() => handleDrop(idx)}
                  onDragEnd={() => {
                    setDraggingIdx(null);
                    setDragOverIdx(null);
                  }}
                  className={[
                    'flex items-center gap-3 p-3 rounded-2xl border cursor-grab active:cursor-grabbing select-none transition-all duration-150',
                    draggingIdx === idx
                      ? 'opacity-40 border-[#0A9AE2] bg-[#0A9AE2]/5'
                      : dragOverIdx === idx
                        ? 'border-[#0A9AE2] bg-[#0A9AE2]/5 scale-[1.02] shadow-md'
                        : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-600',
                  ].join(' ')}
                >
                  <GripVertical size={16} className="text-slate-300 flex-shrink-0" />
                  <span className="w-6 h-6 rounded-full bg-[#0A9AE2]/10 text-[#0A9AE2] text-[10px] font-black flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex-1 truncate">
                    {node.topic.name}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {error && (
            <p className="text-red-500 text-xs font-medium bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || items.length === 0}
              className="flex-1 py-2.5 rounded-xl bg-[#0A9AE2] hover:bg-[#0659AA] text-white text-sm font-bold disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : null}
              {isSaving ? 'Saving…' : 'Save Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
