'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Map, Plus, BookOpen, Calendar } from 'lucide-react';
import { DeleteConfirmModal } from '@/features/subjects/components/DeleteConfirmModal';
import { pathwaysService } from '../services/pathways.service';
import { pathwayPlansService } from '@/features/pathway-plans/services/pathway-plans.service';
import { usePathwayPlans } from '@/features/pathway-plans/hooks/usePathwayPlans';
import { CreatePathwayPlanModal } from '@/features/pathway-plans/components/CreatePathwayPlanModal';
import { EditPathwayPlanModal } from '@/features/pathway-plans/components/EditPathwayPlanModal';
import { PathwayCard } from './PathwayCard';
import { AddPathwayModal } from './AddPathwayModal';
import { AddNodeModal } from './AddNodeModal';
import { ReorderNodesModal } from './ReorderNodesModal';
import { QuestionPickerModal } from './QuestionPickerModal';
import type { PathwayDetail, PathwayNodeItem } from '../types/pathways.types';
import type { PathwayPlanListItem, PathwayPlanDetail } from '@/features/pathway-plans/types/pathway-plans.types';

function formatDueDate(dueDate: string | null): string | null {
  if (!dueDate) return null;
  const d = new Date(dueDate);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function TutorPathwayView() {
  const { plans, isLoading: plansLoading, fetchPlans } = usePathwayPlans();

  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [planDetail, setPlanDetail] = useState<PathwayPlanDetail | null>(null);
  const [planDetailLoading, setPlanDetailLoading] = useState(false);
  // Full pathway details (with nodes) keyed by pathwayId.
  const [pathwayDetails, setPathwayDetails] = useState<Record<string, PathwayDetail>>({});

  // Modals
  const [createPlanOpen, setCreatePlanOpen] = useState(false);
  const [editPlanOpen, setEditPlanOpen] = useState(false);
  const [addPathwayOpen, setAddPathwayOpen] = useState(false);
  const [deletePlan, setDeletePlan] = useState<PathwayPlanListItem | null>(null);
  const [addNodeState, setAddNodeState] = useState<{ open: boolean; pathway: PathwayDetail | null }>({
    open: false,
    pathway: null,
  });
  const [pickerState, setPickerState] = useState<{
    open: boolean;
    pathway: PathwayDetail | null;
    node: PathwayNodeItem | null;
  }>({ open: false, pathway: null, node: null });
  const [reorderState, setReorderState] = useState<{ open: boolean; pathway: PathwayDetail | null }>({
    open: false,
    pathway: null,
  });

  useEffect(() => {
    void fetchPlans();
  }, [fetchPlans]);

  // Load the selected plan + each of its pathways' full node detail.
  const loadPlanDetail = useCallback(async (planId: string) => {
    setPlanDetailLoading(true);
    setPathwayDetails({});
    try {
      const res = await pathwayPlansService.get(planId);
      if (!res.success) return;
      setPlanDetail(res.data);

      const details: Record<string, PathwayDetail> = {};
      await Promise.all(
        res.data.pathways.map(async (p) => {
          const detailRes = await pathwaysService.get(p.id);
          if (detailRes.success) details[p.id] = detailRes.data;
        })
      );
      setPathwayDetails(details);
    } finally {
      setPlanDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedPlanId) {
      void loadPlanDetail(selectedPlanId);
    } else {
      setPlanDetail(null);
      setPathwayDetails({});
    }
  }, [selectedPlanId, loadPlanDetail]);

  const refreshPlanDetail = () => {
    if (selectedPlanId) void loadPlanDetail(selectedPlanId);
  };

  const handlePlanCreated = (plan: PathwayPlanListItem, intent: 'link' | 'done') => {
    setCreatePlanOpen(false);
    void fetchPlans();
    setSelectedPlanId(plan.id);
    if (intent === 'link') {
      // Give the detail a beat to load before opening the add-pathway modal.
      setAddPathwayOpen(true);
    }
  };

  const handlePathwayCreated = (pathway: PathwayDetail) => {
    setPathwayDetails((prev) => ({ ...prev, [pathway.id]: pathway }));
    setAddPathwayOpen(false);
    // Re-fetch the open plan so its pathways list includes the new subject
    // (the rendered list comes from planDetail.pathways, not pathwayDetails).
    refreshPlanDetail();
    void fetchPlans();
  };

  const handleRemovePathway = async (pathwayId: string) => {
    if (!selectedPlanId) return;
    const res = await pathwayPlansService.removePathway(selectedPlanId, pathwayId);
    if (res.success) {
      setPathwayDetails((prev) => {
        const next = { ...prev };
        delete next[pathwayId];
        return next;
      });
      refreshPlanDetail();
      void fetchPlans();
    }
  };

  const handleNodeAdded = (pathwayId: string, node: PathwayNodeItem) => {
    setPathwayDetails((prev) => {
      const detail = prev[pathwayId];
      if (!detail) return prev;
      return {
        ...prev,
        [pathwayId]: {
          ...detail,
          nodes: [...detail.nodes, node],
          nodeCount: detail.nodes.length + 1,
        },
      };
    });
  };

  const handleNodeQuestionsSaved = (pathwayId: string, nodeId: string, questionCount: number) => {
    setPathwayDetails((prev) => {
      const detail = prev[pathwayId];
      if (!detail) return prev;
      return {
        ...prev,
        [pathwayId]: {
          ...detail,
          nodes: detail.nodes.map((n) => (n.id === nodeId ? { ...n, questionCount } : n)),
        },
      };
    });
  };

  const handleReordered = (pathwayId: string, nodes: PathwayNodeItem[]) => {
    setPathwayDetails((prev) => {
      const detail = prev[pathwayId];
      if (!detail) return prev;
      return { ...prev, [pathwayId]: { ...detail, nodes } };
    });
  };

  const handleConfirmDeletePlan = async () => {
    if (!deletePlan) return;
    const res = await pathwayPlansService.remove(deletePlan.id);
    if (res.success) {
      if (selectedPlanId === deletePlan.id) setSelectedPlanId('');
      void fetchPlans();
    }
    setDeletePlan(null);
  };

  // After an edit, refresh the plan list and the open detail header.
  const handlePlanUpdated = () => {
    void fetchPlans();
    refreshPlanDetail();
  };

  const existingSubjectIds = planDetail?.pathways.map((p) => p.subjectId) ?? [];

  return (
    <div className="min-h-screen bg-slate-50 p-4 dark:bg-slate-950 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
          {/* ── Left: Plan list ──────────────────────────────────────── */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Map size={18} className="text-[#0A9AE2]" />
                  <h3 className="font-black text-slate-900 dark:text-white">My Plans</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setCreatePlanOpen(true)}
                  className="flex items-center gap-1 rounded-xl bg-[#0A9AE2] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#0659AA]"
                >
                  <Plus size={12} strokeWidth={3} />
                  New Plan
                </button>
              </div>

              {plansLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
                  ))}
                </div>
              ) : plans.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">
                  No plans yet. Create one to get started.
                </p>
              ) : (
                <div className="space-y-2">
                  {plans.map((plan) => {
                    const active = plan.id === selectedPlanId;
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={[
                          'w-full rounded-2xl border p-3 text-left transition-colors',
                          active
                            ? 'border-[#0A9AE2] bg-blue-50 dark:bg-blue-500/10'
                            : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800',
                        ].join(' ')}
                      >
                        <p
                          className={[
                            'text-sm font-black',
                            active ? 'text-[#0A9AE2]' : 'text-slate-700 dark:text-slate-200',
                          ].join(' ')}
                        >
                          {plan.name}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {plan.studentName ? `${plan.studentName} · ` : ''}
                          {plan.isComplete
                            ? 'Complete'
                            : `${plan.completedNodes}/${plan.totalNodes} topics`}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>

          {/* ── Right: Plan detail ───────────────────────────────────── */}
          <div>
            {!selectedPlanId ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 dark:bg-slate-800">
                  <Map size={28} className="text-slate-300" />
                </div>
                <p className="font-semibold text-slate-500">Select a plan to edit</p>
                <p className="mt-1 text-sm">Or create a new plan from the left panel</p>
              </div>
            ) : (
              <>
                {/* Plan header */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-5 flex items-start justify-between"
                >
                  <div>
                    <h1 className="text-xl font-black text-slate-900 dark:text-white">
                      {planDetail?.name ?? 'Loading…'}
                    </h1>
                    {planDetail && (planDetail.studentName || planDetail.dueDate) && (
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-400">
                        {planDetail.studentName && <span>{planDetail.studentName}</span>}
                        {planDetail.studentName && planDetail.dueDate && <span>·</span>}
                        {planDetail.dueDate && (
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar size={13} />
                            Due {formatDueDate(planDetail.dueDate)}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  {planDetail && (
                    <button
                      type="button"
                      onClick={() => setEditPlanOpen(true)}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Edit Plan
                    </button>
                  )}
                </motion.div>

                {planDetailLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div
                        key={i}
                        className="min-h-[200px] animate-pulse rounded-3xl border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
                      />
                    ))}
                  </div>
                ) : !planDetail || planDetail.pathways.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 py-16 text-slate-400 dark:border-slate-800">
                    <BookOpen size={28} className="mb-3 text-slate-300" />
                    <p className="font-semibold text-slate-500">No subjects in this plan yet</p>
                    <button
                      type="button"
                      onClick={() => setAddPathwayOpen(true)}
                      className="mt-4 flex items-center gap-2 rounded-xl bg-[#0A9AE2] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#0659AA]"
                    >
                      <Plus size={15} strokeWidth={3} />
                      Add Subject to Plan
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-4">
                      {planDetail.pathways.map((p) => {
                        const detail = pathwayDetails[p.id];
                        if (!detail) {
                          return (
                            <div
                              key={p.id}
                              className="min-h-[200px] animate-pulse rounded-3xl border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
                            />
                          );
                        }
                        return (
                          <PathwayCard
                            key={p.id}
                            pathway={detail}
                            isTutorView
                            onRemove={() => handleRemovePathway(p.id)}
                            onAddTopic={() => setAddNodeState({ open: true, pathway: detail })}
                            onEditNodeQuestions={(node) =>
                              setPickerState({ open: true, pathway: detail, node })
                            }
                            onReorder={() => setReorderState({ open: true, pathway: detail })}
                          />
                        );
                      })}
                    </div>

                    {/* Add subject to plan */}
                    <button
                      type="button"
                      onClick={() => setAddPathwayOpen(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-slate-200 py-4 text-sm font-bold text-slate-400 transition-colors hover:border-[#0A9AE2] hover:bg-blue-50 hover:text-[#0A9AE2] dark:border-slate-700"
                    >
                      <Plus size={16} strokeWidth={2.5} />
                      Add Subject to Plan
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────── */}
      <CreatePathwayPlanModal
        isOpen={createPlanOpen}
        onClose={() => setCreatePlanOpen(false)}
        onCreated={handlePlanCreated}
      />

      <EditPathwayPlanModal
        isOpen={editPlanOpen}
        plan={planDetail}
        onClose={() => setEditPlanOpen(false)}
        onUpdated={handlePlanUpdated}
        onDelete={() => {
          setEditPlanOpen(false);
          setDeletePlan(plans.find((p) => p.id === selectedPlanId) ?? null);
        }}
      />

      {selectedPlanId && (
        <AddPathwayModal
          isOpen={addPathwayOpen}
          planId={selectedPlanId}
          existingSubjectIds={existingSubjectIds}
          onClose={() => setAddPathwayOpen(false)}
          onCreated={handlePathwayCreated}
        />
      )}

      {addNodeState.pathway && (
        <AddNodeModal
          isOpen={addNodeState.open}
          pathwayId={addNodeState.pathway.id}
          subjectId={addNodeState.pathway.subjectId}
          existingTopicIds={addNodeState.pathway.nodes.map((n) => n.topicId)}
          onClose={() => setAddNodeState({ open: false, pathway: null })}
          onAdded={(node) => handleNodeAdded(addNodeState.pathway!.id, node)}
          onAddQuestions={(node) =>
            setPickerState({ open: true, pathway: addNodeState.pathway, node })
          }
        />
      )}

      {pickerState.pathway && pickerState.node && (
        <QuestionPickerModal
          isOpen={pickerState.open}
          nodeId={pickerState.node.id}
          subjectId={pickerState.pathway.subjectId}
          topicId={pickerState.node.topicId}
          topicName={pickerState.node.topic.name}
          subjectName={pickerState.pathway.subject.name}
          nodeLabel={`Node ${pickerState.node.orderIndex + 1} — ${pickerState.node.topic.name}`}
          thresholdCorrect={pickerState.pathway.thresholdCorrect}
          onClose={() => setPickerState({ open: false, pathway: null, node: null })}
          onSaved={(count) => {
            handleNodeQuestionsSaved(pickerState.pathway!.id, pickerState.node!.id, count);
            setPickerState({ open: false, pathway: null, node: null });
          }}
        />
      )}

      {reorderState.pathway && (
        <ReorderNodesModal
          isOpen={reorderState.open}
          pathwayId={reorderState.pathway.id}
          nodes={reorderState.pathway.nodes}
          onClose={() => setReorderState({ open: false, pathway: null })}
          onReordered={(nodes) => {
            handleReordered(reorderState.pathway!.id, nodes);
            setReorderState({ open: false, pathway: null });
          }}
        />
      )}

      <DeleteConfirmModal
        isOpen={Boolean(deletePlan)}
        title="Delete this plan?"
        message={
          deletePlan
            ? `Deleting "${deletePlan.name}" removes every subject, topic, and the student's progress inside it. This action cannot be undone.`
            : ''
        }
        onConfirm={handleConfirmDeletePlan}
        onClose={() => setDeletePlan(null)}
      />
    </div>
  );
}
