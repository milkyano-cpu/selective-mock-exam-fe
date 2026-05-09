'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, ClipboardList, Plus, ArrowUpDown, BookOpen, Loader2, TrendingUp } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { adminService } from '@/features/admin/services/admin.service';
import type { UserItem } from '@/features/admin/services/admin.service';
import { pathwaysService } from '../services/pathways.service';
import { usePathways } from '../hooks/usePathways';
import { PathwayCard } from './PathwayCard';
import { AddPathwayModal } from './AddPathwayModal';
import { AddNodeModal } from './AddNodeModal';
import { ReorderNodesModal } from './ReorderNodesModal';
import { PathwayProgressModal } from './PathwayProgressModal';
import type { PathwayDetail, PathwayNodeItem } from '../types/pathways.types';

export function TutorPathwayView() {
  const [students, setStudents] = useState<UserItem[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const { pathways, setPathways, isLoading, fetchPathways } = usePathways();
  const [pathwayDetails, setPathwayDetails] = useState<Record<string, PathwayDetail>>({});

  // Modals
  const [addPathwayOpen, setAddPathwayOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [addNodeState, setAddNodeState] = useState<{ open: boolean; pathway: PathwayDetail | null }>({
    open: false,
    pathway: null,
  });
  const [reorderState, setReorderState] = useState<{ open: boolean; pathway: PathwayDetail | null }>({
    open: false,
    pathway: null,
  });

  // Load students on mount
  useEffect(() => {
    setStudentsLoading(true);
    adminService
      .listUsers({ role: 'STUDENT', limit: 100 })
      .then((res) => {
        if (res.success) setStudents(res.data);
      })
      .finally(() => setStudentsLoading(false));
  }, []);

  // Fetch pathways when student changes
  useEffect(() => {
    if (!selectedStudentId) {
      setPathways([]);
      setPathwayDetails({});
      return;
    }
    fetchPathways(selectedStudentId);
  }, [selectedStudentId, fetchPathways, setPathways]);

  // Load full detail for each pathway
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
    loadDetails();
  }, [loadDetails]);

  const handlePathwayCreated = (pathway: PathwayDetail) => {
    setPathwayDetails((prev) => ({ ...prev, [pathway.id]: pathway }));
    setPathways((prev) => [
      ...prev,
      {
        id: pathway.id,
        studentId: pathway.studentId,
        subjectId: pathway.subjectId,
        tutorId: pathway.tutorId,
        thresholdCorrect: pathway.thresholdCorrect,
        nodeCount: pathway.nodes.length,
        subject: pathway.subject,
        createdAt: pathway.createdAt,
        updatedAt: pathway.updatedAt,
      },
    ]);
  };

  const handleRemovePathway = async (pathwayId: string) => {
    const res = await pathwaysService.remove(pathwayId);
    if (res.success) {
      setPathways((prev) => prev.filter((p) => p.id !== pathwayId));
      setPathwayDetails((prev) => {
        const next = { ...prev };
        delete next[pathwayId];
        return next;
      });
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
    setAddNodeState({ open: false, pathway: null });
  };

  const handleReordered = (pathwayId: string, nodes: PathwayNodeItem[]) => {
    setPathwayDetails((prev) => {
      const detail = prev[pathwayId];
      if (!detail) return prev;
      return { ...prev, [pathwayId]: { ...detail, nodes } };
    });
  };

  const selectedStudent = students.find((s) => s.id === selectedStudentId);
  const assignedSubjectIds = pathways.map((p) => p.subjectId);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
          {/* ── Left Panel ────────────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Select Student */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-4">
                <Users size={18} className="text-[#0A9AE2]" />
                <h3 className="font-black text-slate-900 dark:text-white">Select Student</h3>
              </div>

              {studentsLoading ? (
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Loader2 size={14} className="animate-spin" />
                  Loading students…
                </div>
              ) : (
                <SearchableSelect
                  value={selectedStudentId}
                  onChange={setSelectedStudentId}
                  placeholder="Select a student…"
                  searchPlaceholder="Search by name…"
                  emptyText="No students found."
                  options={students.map((s) => ({
                    value: s.id,
                    label: s.fullName,
                    searchText: s.email,
                  }))}
                />
              )}
            </motion.div>

            {/* Assessments (assigned pathways list) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-1">
                <ClipboardList size={18} className="text-[#0A9AE2]" />
                <h3 className="font-black text-slate-900 dark:text-white">Assessments</h3>
              </div>
              <p className="text-xs text-slate-400 mb-4">Student&apos;s assigned assessments</p>

              {!selectedStudentId ? (
                <p className="text-sm text-slate-400">Select a student to view pathways.</p>
              ) : isLoading ? (
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Loader2 size={14} className="animate-spin" />
                  Loading…
                </div>
              ) : pathways.length === 0 ? (
                <p className="text-sm text-slate-400">No pathways assigned yet.</p>
              ) : (
                <select
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:border-[#0A9AE2] focus:outline-none"
                  defaultValue=""
                >
                  <option value="" disabled>
                    {pathways.length} pathway{pathways.length !== 1 ? 's' : ''} assigned
                  </option>
                  {pathways.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.subject.name}
                    </option>
                  ))}
                </select>
              )}
            </motion.div>
          </div>

          {/* ── Right Panel ───────────────────────────────────────────── */}
          <div>
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between mb-6"
            >
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                  Pathway Editor
                </h1>
                {selectedStudent && (
                  <p className="text-sm text-slate-400 mt-0.5">
                    Editing pathways for{' '}
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      {selectedStudent.fullName}
                    </span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Progress Report */}
                {selectedStudentId && pathways.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setProgressOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <TrendingUp size={15} />
                    Progress Report
                  </button>
                )}

                {/* Change Node Index — opens reorder for first pathway if any */}
                {pathways.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const firstDetail = pathwayDetails[pathways[0].id];
                      if (firstDetail) {
                        setReorderState({ open: true, pathway: firstDetail });
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ArrowUpDown size={15} />
                    Change Node Index
                  </button>
                )}

                {selectedStudentId && (
                  <button
                    type="button"
                    onClick={() => setAddPathwayOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A9AE2] hover:bg-[#0659AA] text-white text-sm font-bold transition-colors shadow-sm shadow-[#0A9AE2]/20"
                  >
                    <Plus size={15} />
                    Add Pathway
                  </button>
                )}
              </div>
            </motion.div>

            {/* Content */}
            {!selectedStudentId ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                  <Users size={28} className="text-slate-300" />
                </div>
                <p className="font-semibold text-slate-500">Select a student to get started</p>
                <p className="text-sm mt-1">Choose a student from the left panel</p>
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 size={32} className="animate-spin text-[#0A9AE2]" />
              </div>
            ) : pathways.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                  <BookOpen size={28} className="text-slate-300" />
                </div>
                <p className="font-semibold text-slate-500">No pathways yet</p>
                <p className="text-sm mt-1">Click &ldquo;Add Pathway&rdquo; to create one</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {pathways.map((p) => {
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
                    <PathwayCard
                      key={p.id}
                      pathway={detail}
                      isTutorView
                      onRemove={() => handleRemovePathway(p.id)}
                      onAddTopic={() => setAddNodeState({ open: true, pathway: detail })}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <PathwayProgressModal
        isOpen={progressOpen}
        studentName={selectedStudent?.fullName ?? ''}
        pathwayDetails={pathwayDetails}
        onClose={() => setProgressOpen(false)}
      />

      <AddPathwayModal
        isOpen={addPathwayOpen}
        studentId={selectedStudentId}
        onClose={() => setAddPathwayOpen(false)}
        onCreated={handlePathwayCreated}
      />

      {addNodeState.pathway && (
        <AddNodeModal
          isOpen={addNodeState.open}
          pathwayId={addNodeState.pathway.id}
          subjectId={addNodeState.pathway.subjectId}
          existingTopicIds={addNodeState.pathway.nodes.map((n) => n.topicId)}
          onClose={() => setAddNodeState({ open: false, pathway: null })}
          onAdded={(node) => handleNodeAdded(addNodeState.pathway!.id, node)}
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
    </div>
  );
}
