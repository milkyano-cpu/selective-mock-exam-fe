'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { aiRubricsService } from '@/features/ai-rubrics/services/ai-rubrics.service';
import type {
  AiCalibrationNote,
  AiCalibrationNoteInput,
  AiRubricBandDescriptor,
  AiRubricBandDescriptorInput,
  AiRubricCriterion,
  AiRubricCriterionInput,
  AiRubricDetail,
} from '@/features/ai-rubrics/types/ai-rubrics.types';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  Save,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react';

type TabKey = 'criteria' | 'bands' | 'notes';

export default function AiRubricDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const rubricId = params?.id ?? '';
  const user = useAuthStore((s) => s.user);
  const canManage = user?.role === 'ADMIN' || user?.role === 'TUTOR';

  const [rubric, setRubric] = useState<AiRubricDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('criteria');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadRubric = useCallback(async () => {
    if (!rubricId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await aiRubricsService.getById(rubricId);
      if (res.success) setRubric(res.data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to load rubric');
    } finally {
      setIsLoading(false);
    }
  }, [rubricId]);

  useEffect(() => { if (canManage) void loadRubric(); }, [canManage, loadRubric]);

  if (!canManage) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <ShieldAlert className="mx-auto mb-4 text-red-500" size={48} />
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">Access Denied</h2>
        </div>
      </div>
    );
  }

  if (isLoading && !rubric) {
    return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="animate-spin text-[#0A9AE2]" size={32} /></div>;
  }

  if (!rubric) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/ai-rubrics" className="inline-flex items-center gap-2 text-sm font-bold text-[#0A9AE2]"><ArrowLeft size={16} /> Back to rubrics</Link>
        <p className="text-sm font-bold text-slate-500">Rubric not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <Link href="/dashboard/ai-rubrics" className="inline-flex w-fit items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#0A9AE2]"><ArrowLeft size={16} /> Back to rubrics</Link>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">{rubric.name} <span className="text-[#0A9AE2]">.</span></h1>
            <p className="font-mono text-xs text-slate-400">{rubric.id}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
              {rubric.writingType && <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">{rubric.writingType}</span>}
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{rubric.totalMaxScore}</span>
              <span className={`rounded-full px-2.5 py-0.5 ${rubric.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-500'}`}>{rubric.isActive ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
          <button onClick={() => router.push('/dashboard/ai-rubrics')} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
        </div>
      </div>

      {/* Messages */}
      {(message || error) && (
        <div className="space-y-2">
          {message && <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"><CheckCircle2 size={16} />{message}</div>}
          {error && <div className="whitespace-pre-line rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"><AlertTriangle size={16} className="mr-2 inline" />{error}</div>}
        </div>
      )}

      {/* Tabs */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex gap-1 border-b border-slate-100 px-2 dark:border-slate-800">
          <TabButton active={activeTab === 'criteria'} onClick={() => setActiveTab('criteria')} label="Criteria" count={rubric.criteria.length} />
          <TabButton active={activeTab === 'bands'} onClick={() => setActiveTab('bands')} label="Band Descriptors" count={rubric.bandDescriptors.length} />
          <TabButton active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} label="Calibration Notes" count={rubric.calibrationNotes.length} />
        </div>
        <div className="p-4 sm:p-6">
          {activeTab === 'criteria' && (
            <CriteriaTab rubricId={rubricId} items={rubric.criteria} onChanged={(msg) => { setMessage(msg); setError(null); void loadRubric(); }} onError={(msg) => { setError(msg); setMessage(null); }} />
          )}
          {activeTab === 'bands' && (
            <BandsTab rubricId={rubricId} items={rubric.bandDescriptors} onChanged={(msg) => { setMessage(msg); setError(null); void loadRubric(); }} onError={(msg) => { setError(msg); setMessage(null); }} />
          )}
          {activeTab === 'notes' && (
            <NotesTab rubricId={rubricId} items={rubric.calibrationNotes} onChanged={(msg) => { setMessage(msg); setError(null); void loadRubric(); }} onError={(msg) => { setError(msg); setMessage(null); }} />
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Shared
// ═══════════════════════════════════════════════════════════════════════════

function TabButton({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-colors ${
        active ? 'border-[#0A9AE2] text-[#0A9AE2]' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
      }`}
    >
      {label}
      <span className={`rounded-full px-2 py-0.5 text-xs font-black ${active ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>{count}</span>
    </button>
  );
}

function TabToolbar({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
      <button onClick={onCreate} className="inline-flex items-center gap-2 rounded-xl bg-[#0A9AE2] px-4 py-2 text-sm font-bold text-white hover:bg-[#0864B6]">
        <Plus size={15} /> New
      </button>
    </div>
  );
}

function ModalShell({ title, onClose, children, footer }: { title: string; onClose: () => void; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
          <h2 className="font-black text-slate-900 dark:text-slate-100">{title}</h2>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        <div className="flex gap-3 border-t border-slate-100 p-5 dark:border-slate-800">{footer}</div>
      </div>
    </div>
  );
}

function StringList({ items, onChange, label, placeholder }: { items: string[]; onChange: (next: string[]) => void; label: string; placeholder: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-500">{label}</label>
        <button type="button" onClick={() => onChange([...items, ''])} className="text-xs font-bold text-[#0A9AE2]">+ Add</button>
      </div>
      {items.map((v, i) => (
        <div key={i} className="flex gap-2">
          <input value={v} onChange={(e) => { const n = [...items]; n[i] = e.target.value; onChange(n); }} placeholder={placeholder} className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
          <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="rounded-lg p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"><X size={14} /></button>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CRITERIA TAB
// ═══════════════════════════════════════════════════════════════════════════

type CriteriaTabProps = {
  rubricId: string;
  items: AiRubricCriterion[];
  onChanged: (msg: string) => void;
  onError: (msg: string) => void;
};

function CriteriaTab({ rubricId, items, onChanged, onError }: CriteriaTabProps) {
  const [editing, setEditing] = useState<AiRubricCriterion | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const openCreate = () => { setEditing(null); setIsFormOpen(true); };
  const openEdit = (c: AiRubricCriterion) => { setEditing(c); setIsFormOpen(true); };

  const submit = async (form: CriterionFormState) => {
    const payload: AiRubricCriterionInput = {
      criterionName: form.criterionName.trim(),
      criterionDescription: form.criterionDescription.trim(),
      maxScore: parseInt(form.maxScore, 10),
      sortOrder: form.sortOrder ? parseInt(form.sortOrder, 10) : undefined,
      highScoringIndicators: form.highScoringIndicators.map((s) => s.trim()).filter(Boolean),
      lowScoringIndicators: form.lowScoringIndicators.map((s) => s.trim()).filter(Boolean),
      aiCalibrationNotes: form.aiCalibrationNotes.map((s) => s.trim()).filter(Boolean),
    };
    if (!payload.criterionName || !payload.criterionDescription || !Number.isFinite(payload.maxScore) || payload.maxScore < 1) {
      onError('Name, description, and a positive maxScore are required.');
      return;
    }
    setIsSaving(true);
    try {
      if (editing) {
        await aiRubricsService.updateCriterion(rubricId, editing.id, payload);
        onChanged('Criterion updated');
      } else {
        await aiRubricsService.createCriterion(rubricId, payload);
        onChanged('Criterion created');
      }
      setIsFormOpen(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      onError(msg || 'Failed to save criterion');
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async (c: AiRubricCriterion) => {
    if (!confirm(`Delete criterion "${c.criterionName}"?`)) return;
    try {
      await aiRubricsService.deleteCriterion(rubricId, c.id);
      onChanged('Criterion deleted');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      onError(msg || 'Failed to delete criterion');
    }
  };

  return (
    <div>
      <TabToolbar onCreate={openCreate} />
      {items.length === 0 ? (
        <p className="py-12 text-center text-sm font-bold text-slate-400">No criteria yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-black uppercase text-slate-500">#</th>
                <th className="px-4 py-3 text-left text-xs font-black uppercase text-slate-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-black uppercase text-slate-500">Description</th>
                <th className="px-4 py-3 text-left text-xs font-black uppercase text-slate-500">Max Score</th>
                <th className="px-4 py-3 text-right text-xs font-black uppercase text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {[...items].sort((a, b) => a.sortOrder - b.sortOrder).map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{c.sortOrder}</td>
                  <td className="px-4 py-3 font-black text-slate-800 dark:text-slate-100">{c.criterionName}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{c.criterionDescription}</td>
                  <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">{c.maxScore}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(c)} title="Edit" className="rounded-lg p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10"><Pencil size={15} /></button>
                      <button onClick={() => void remove(c)} title="Delete" className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isFormOpen && (
        <CriterionFormModal initial={editing} onSubmit={submit} onCancel={() => setIsFormOpen(false)} isSaving={isSaving} />
      )}
    </div>
  );
}

type CriterionFormState = {
  criterionName: string;
  criterionDescription: string;
  maxScore: string;
  sortOrder: string;
  highScoringIndicators: string[];
  lowScoringIndicators: string[];
  aiCalibrationNotes: string[];
};

function CriterionFormModal({ initial, onSubmit, onCancel, isSaving }: {
  initial: AiRubricCriterion | null;
  onSubmit: (form: CriterionFormState) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<CriterionFormState>(() => initial ? {
    criterionName: initial.criterionName,
    criterionDescription: initial.criterionDescription,
    maxScore: String(initial.maxScore),
    sortOrder: String(initial.sortOrder),
    highScoringIndicators: initial.highScoringIndicators ?? [],
    lowScoringIndicators: initial.lowScoringIndicators ?? [],
    aiCalibrationNotes: initial.aiCalibrationNotes ?? [],
  } : {
    criterionName: '', criterionDescription: '', maxScore: '', sortOrder: '',
    highScoringIndicators: [], lowScoringIndicators: [], aiCalibrationNotes: [],
  });

  return (
    <ModalShell
      title={initial ? 'Edit Criterion' : 'New Criterion'}
      onClose={onCancel}
      footer={
        <>
          <button onClick={onCancel} className="flex-1 rounded-xl bg-slate-100 py-3 font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300">Cancel</button>
          <button disabled={isSaving} onClick={() => onSubmit(form)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0A9AE2] py-3 font-bold text-white hover:bg-[#0864B6] disabled:opacity-60">
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-slate-500">Name</label>
            <input required value={form.criterionName} onChange={(e) => setForm({ ...form, criterionName: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500">Max Score</label>
            <input required type="number" min="1" value={form.maxScore} onChange={(e) => setForm({ ...form, maxScore: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500">Sort Order</label>
            <input type="number" min="0" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500">Description (Measures)</label>
          <textarea required value={form.criterionDescription} onChange={(e) => setForm({ ...form, criterionDescription: e.target.value })} rows={3} className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
        </div>
        <StringList items={form.highScoringIndicators} onChange={(v) => setForm({ ...form, highScoringIndicators: v })} label="High Scoring Indicators" placeholder="e.g. Thoughtful, original interpretation" />
        <StringList items={form.lowScoringIndicators} onChange={(v) => setForm({ ...form, lowScoringIndicators: v })} label="Low Scoring Indicators" placeholder="e.g. Loose prompt link" />
        <StringList items={form.aiCalibrationNotes} onChange={(v) => setForm({ ...form, aiCalibrationNotes: v })} label="AI Calibration Notes" placeholder="e.g. Reward emotional maturity..." />
      </div>
    </ModalShell>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BANDS TAB
// ═══════════════════════════════════════════════════════════════════════════

function BandsTab({ rubricId, items, onChanged, onError }: { rubricId: string; items: AiRubricBandDescriptor[]; onChanged: (m: string) => void; onError: (m: string) => void }) {
  const [editing, setEditing] = useState<AiRubricBandDescriptor | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const openCreate = () => { setEditing(null); setIsFormOpen(true); };
  const openEdit = (b: AiRubricBandDescriptor) => { setEditing(b); setIsFormOpen(true); };

  const submit = async (form: { bandLabel: string; scoreMin: string; scoreMax: string; descriptor: string }) => {
    const payload: AiRubricBandDescriptorInput = {
      bandLabel: form.bandLabel.trim(),
      scoreMin: parseInt(form.scoreMin, 10),
      scoreMax: parseInt(form.scoreMax, 10),
      descriptor: form.descriptor.trim(),
    };
    if (!payload.bandLabel || !payload.descriptor || !Number.isFinite(payload.scoreMin) || !Number.isFinite(payload.scoreMax) || payload.scoreMax < payload.scoreMin) {
      onError('Label, descriptor, and valid score range are required.');
      return;
    }
    setIsSaving(true);
    try {
      if (editing) {
        await aiRubricsService.updateBand(rubricId, editing.id, payload);
        onChanged('Band descriptor updated');
      } else {
        await aiRubricsService.createBand(rubricId, payload);
        onChanged('Band descriptor created');
      }
      setIsFormOpen(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      onError(msg || 'Failed to save band');
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async (b: AiRubricBandDescriptor) => {
    if (!confirm(`Delete band "${b.bandLabel}"?`)) return;
    try {
      await aiRubricsService.deleteBand(rubricId, b.id);
      onChanged('Band descriptor deleted');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      onError(msg || 'Failed to delete band');
    }
  };

  return (
    <div>
      <TabToolbar onCreate={openCreate} />
      {items.length === 0 ? (
        <p className="py-12 text-center text-sm font-bold text-slate-400">No band descriptors yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-black uppercase text-slate-500">Label</th>
                <th className="px-4 py-3 text-left text-xs font-black uppercase text-slate-500">Range</th>
                <th className="px-4 py-3 text-left text-xs font-black uppercase text-slate-500">Descriptor</th>
                <th className="px-4 py-3 text-right text-xs font-black uppercase text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {[...items].sort((a, b) => b.scoreMin - a.scoreMin).map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-black text-slate-800 dark:text-slate-100">{b.bandLabel}</td>
                  <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">{b.scoreMin} - {b.scoreMax}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{b.descriptor}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(b)} title="Edit" className="rounded-lg p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10"><Pencil size={15} /></button>
                      <button onClick={() => void remove(b)} title="Delete" className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {isFormOpen && (
        <BandFormModal initial={editing} onSubmit={submit} onCancel={() => setIsFormOpen(false)} isSaving={isSaving} />
      )}
    </div>
  );
}

function BandFormModal({ initial, onSubmit, onCancel, isSaving }: {
  initial: AiRubricBandDescriptor | null;
  onSubmit: (form: { bandLabel: string; scoreMin: string; scoreMax: string; descriptor: string }) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState(() => initial ? {
    bandLabel: initial.bandLabel,
    scoreMin: String(initial.scoreMin),
    scoreMax: String(initial.scoreMax),
    descriptor: initial.descriptor,
  } : { bandLabel: '', scoreMin: '', scoreMax: '', descriptor: '' });

  return (
    <ModalShell
      title={initial ? 'Edit Band Descriptor' : 'New Band Descriptor'}
      onClose={onCancel}
      footer={
        <>
          <button onClick={onCancel} className="flex-1 rounded-xl bg-slate-100 py-3 font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300">Cancel</button>
          <button disabled={isSaving} onClick={() => onSubmit(form)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0A9AE2] py-3 font-bold text-white hover:bg-[#0864B6] disabled:opacity-60">
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500">Label</label>
            <input required value={form.bandLabel} onChange={(e) => setForm({ ...form, bandLabel: e.target.value })} placeholder="e.g. Exceptional" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500">Score Min</label>
            <input required type="number" min="0" value={form.scoreMin} onChange={(e) => setForm({ ...form, scoreMin: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500">Score Max</label>
            <input required type="number" min="0" value={form.scoreMax} onChange={(e) => setForm({ ...form, scoreMax: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500">Descriptor</label>
          <textarea required value={form.descriptor} onChange={(e) => setForm({ ...form, descriptor: e.target.value })} rows={3} className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
        </div>
      </div>
    </ModalShell>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// NOTES TAB
// ═══════════════════════════════════════════════════════════════════════════

function NotesTab({ rubricId, items, onChanged, onError }: { rubricId: string; items: AiCalibrationNote[]; onChanged: (m: string) => void; onError: (m: string) => void }) {
  const [editing, setEditing] = useState<AiCalibrationNote | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const sorted = useMemo(() => [...items].sort((a, b) => a.sortOrder - b.sortOrder), [items]);

  const submit = async (form: { category: string; instruction: string; sortOrder: string }) => {
    const payload: AiCalibrationNoteInput = {
      category: form.category.trim() || null,
      instruction: form.instruction.trim(),
      sortOrder: form.sortOrder ? parseInt(form.sortOrder, 10) : undefined,
    };
    if (!payload.instruction) {
      onError('Instruction is required.');
      return;
    }
    setIsSaving(true);
    try {
      if (editing) {
        await aiRubricsService.updateCalibrationNote(rubricId, editing.id, payload);
        onChanged('Calibration note updated');
      } else {
        await aiRubricsService.createCalibrationNote(rubricId, payload);
        onChanged('Calibration note created');
      }
      setIsFormOpen(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      onError(msg || 'Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async (n: AiCalibrationNote) => {
    if (!confirm('Delete this calibration note?')) return;
    try {
      await aiRubricsService.deleteCalibrationNote(rubricId, n.id);
      onChanged('Calibration note deleted');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      onError(msg || 'Failed to delete note');
    }
  };

  return (
    <div>
      <TabToolbar onCreate={() => { setEditing(null); setIsFormOpen(true); }} />
      {sorted.length === 0 ? (
        <p className="py-12 text-center text-sm font-bold text-slate-400">No calibration notes yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-black uppercase text-slate-500">#</th>
                <th className="px-4 py-3 text-left text-xs font-black uppercase text-slate-500">Category</th>
                <th className="px-4 py-3 text-left text-xs font-black uppercase text-slate-500">Instruction</th>
                <th className="px-4 py-3 text-right text-xs font-black uppercase text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sorted.map((n) => (
                <tr key={n.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{n.sortOrder}</td>
                  <td className="px-4 py-3">{n.category ? <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-black text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">{n.category}</span> : <span className="text-xs text-slate-400">—</span>}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{n.instruction}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => { setEditing(n); setIsFormOpen(true); }} title="Edit" className="rounded-lg p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10"><Pencil size={15} /></button>
                      <button onClick={() => void remove(n)} title="Delete" className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {isFormOpen && (
        <NoteFormModal initial={editing} onSubmit={submit} onCancel={() => setIsFormOpen(false)} isSaving={isSaving} />
      )}
    </div>
  );
}

function NoteFormModal({ initial, onSubmit, onCancel, isSaving }: {
  initial: AiCalibrationNote | null;
  onSubmit: (form: { category: string; instruction: string; sortOrder: string }) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState(() => initial ? {
    category: initial.category ?? '',
    instruction: initial.instruction,
    sortOrder: String(initial.sortOrder),
  } : { category: '', instruction: '', sortOrder: '' });

  return (
    <ModalShell
      title={initial ? 'Edit Calibration Note' : 'New Calibration Note'}
      onClose={onCancel}
      footer={
        <>
          <button onClick={onCancel} className="flex-1 rounded-xl bg-slate-100 py-3 font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300">Cancel</button>
          <button disabled={isSaving} onClick={() => onSubmit(form)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0A9AE2] py-3 font-bold text-white hover:bg-[#0864B6] disabled:opacity-60">
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500">Category</label>
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. General / Creative" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500">Sort Order</label>
            <input type="number" min="0" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500">Instruction</label>
          <textarea required value={form.instruction} onChange={(e) => setForm({ ...form, instruction: e.target.value })} rows={4} className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
        </div>
      </div>
    </ModalShell>
  );
}
