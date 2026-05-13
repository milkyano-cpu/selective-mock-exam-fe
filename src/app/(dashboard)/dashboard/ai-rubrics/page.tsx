'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { ImportAiRubricModal } from '@/features/ai-rubrics/components/ImportAiRubricModal';
import { aiRubricsService } from '@/features/ai-rubrics/services/ai-rubrics.service';
import type { CreateAiRubricPayload, ImportAiRubricsResult, AiRubric, AiRubricDetail } from '@/features/ai-rubrics/types/ai-rubrics.types';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldAlert,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

type FormState = {
  id: string;
  name: string;
  description: string;
  writingType: string;
  totalMaxScore: string;
  isDefault: boolean;
  isActive: boolean;
  criteria: CriterionFormState[];
};

type CriterionFormState = {
  criterionName: string;
  criterionDescription: string;
  maxScore: string;
  sortOrder: string;
  bandDescriptors: BandDescriptorFormState[];
};

type BandDescriptorFormState = {
  scoreMin: string;
  scoreMax: string;
  descriptor: string;
};

function buildEmptyForm(): FormState {
  return {
    id: '',
    name: '',
    description: '',
    writingType: '',
    totalMaxScore: '20',
    isDefault: false,
    isActive: true,
    criteria: [],
  };
}

function buildEmptyCriterion(): CriterionFormState {
  return {
    criterionName: '',
    criterionDescription: '',
    maxScore: '',
    sortOrder: '',
    bandDescriptors: [],
  };
}

function buildEmptyBandDescriptor(): BandDescriptorFormState {
  return {
    scoreMin: '',
    scoreMax: '',
    descriptor: '',
  };
}

function buildForm(aiRubric: AiRubricDetail | null): FormState {
  if (!aiRubric) return buildEmptyForm();
  return {
    id: aiRubric.id,
    name: aiRubric.name,
    description: aiRubric.description ?? '',
    writingType: aiRubric.writingType ?? '',
    totalMaxScore: String(aiRubric.totalMaxScore),
    isDefault: aiRubric.isDefault,
    isActive: aiRubric.isActive,
    criteria: aiRubric.criteria.map((criterion) => ({
      criterionName: criterion.criterionName,
      criterionDescription: criterion.criterionDescription,
      maxScore: String(criterion.maxScore),
      sortOrder: String(criterion.sortOrder),
      bandDescriptors: (criterion.bandDescriptors ?? []).map((band) => ({
        scoreMin: String(band.scoreMin),
        scoreMax: String(band.scoreMax),
        descriptor: band.descriptor,
      })),
    })),
  };
}

export default function AiRubricsPage() {
  const user = useAuthStore((state) => state.user);

  const [aiRubrics, setAiRubrics] = useState<AiRubric[]>([]);
  const [selected, setSelected] = useState<AiRubricDetail | null>(null);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editing, setEditing] = useState<AiRubric | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [form, setForm] = useState<FormState>(buildEmptyForm());
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canManage = user?.role === 'ADMIN' || user?.role === 'TUTOR';

  const loadAiRubrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await aiRubricsService.list({ page: 1, limit: 100, search: search || undefined, activeOnly: false });
      if (res.success) setAiRubrics(res.data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to load aiRubrics');
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (!canManage) return;
    const timeoutId = window.setTimeout(() => void loadAiRubrics(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [canManage, loadAiRubrics]);

  const openCreate = () => {
    setEditing(null);
    setForm(buildEmptyForm());
    setIsFormOpen(true);
    setError(null);
    setMessage(null);
  };

  const openEdit = async (aiRubric: AiRubric) => {
    setError(null);
    setMessage(null);
    try {
      const res = await aiRubricsService.getById(aiRubric.id);
      if (res.success) {
        setEditing(aiRubric);
        setForm(buildForm(res.data));
        setIsFormOpen(true);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to load aiRubric for editing');
    }
  };

  const loadDetail = async (id: string) => {
    setError(null);
    try {
      const res = await aiRubricsService.getById(id);
      if (res.success) setSelected(res.data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to load aiRubric detail');
    }
  };

  const updateCriterion = (index: number, patch: Partial<CriterionFormState>) => {
    setForm((current) => ({
      ...current,
      criteria: current.criteria.map((criterion, criterionIndex) =>
        criterionIndex === index ? { ...criterion, ...patch } : criterion
      ),
    }));
  };

  const updateBandDescriptor = (criterionIndex: number, bandIndex: number, patch: Partial<BandDescriptorFormState>) => {
    setForm((current) => ({
      ...current,
      criteria: current.criteria.map((criterion, currentCriterionIndex) => {
        if (currentCriterionIndex !== criterionIndex) return criterion;
        return {
          ...criterion,
          bandDescriptors: criterion.bandDescriptors.map((band, currentBandIndex) =>
            currentBandIndex === bandIndex ? { ...band, ...patch } : band
          ),
        };
      }),
    }));
  };

  const addCriterion = () => {
    setForm((current) => ({
      ...current,
      criteria: [...current.criteria, { ...buildEmptyCriterion(), sortOrder: String(current.criteria.length) }],
    }));
  };

  const removeCriterion = (index: number) => {
    setForm((current) => ({
      ...current,
      criteria: current.criteria.filter((_, criterionIndex) => criterionIndex !== index),
    }));
  };

  const addBandDescriptor = (criterionIndex: number) => {
    setForm((current) => ({
      ...current,
      criteria: current.criteria.map((criterion, currentCriterionIndex) =>
        currentCriterionIndex === criterionIndex
          ? { ...criterion, bandDescriptors: [...criterion.bandDescriptors, buildEmptyBandDescriptor()] }
          : criterion
      ),
    }));
  };

  const removeBandDescriptor = (criterionIndex: number, bandIndex: number) => {
    setForm((current) => ({
      ...current,
      criteria: current.criteria.map((criterion, currentCriterionIndex) =>
        currentCriterionIndex === criterionIndex
          ? { ...criterion, bandDescriptors: criterion.bandDescriptors.filter((_, currentBandIndex) => currentBandIndex !== bandIndex) }
          : criterion
      ),
    }));
  };

  const submitForm = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setMessage(null);

    const totalMaxScore = parseInt(form.totalMaxScore, 10);
    if (!Number.isFinite(totalMaxScore) || totalMaxScore < 1) {
      setError('Total max score must be a positive integer');
      setIsSaving(false);
      return;
    }

    const criteria = form.criteria.map((criterion, index) => {
      const maxScore = parseInt(criterion.maxScore, 10);
      const sortOrder = criterion.sortOrder ? parseInt(criterion.sortOrder, 10) : index;
      const bandDescriptors = criterion.bandDescriptors.map((band) => ({
        scoreMin: parseInt(band.scoreMin, 10),
        scoreMax: parseInt(band.scoreMax, 10),
        descriptor: band.descriptor.trim(),
      }));

      return {
        criterionName: criterion.criterionName.trim(),
        criterionDescription: criterion.criterionDescription.trim(),
        maxScore,
        sortOrder,
        bandDescriptors,
      };
    });

    for (const [index, criterion] of criteria.entries()) {
      if (!criterion.criterionName || !criterion.criterionDescription) {
        setError(`Criterion ${index + 1} must include a name and description.`);
        setIsSaving(false);
        return;
      }
      if (!Number.isFinite(criterion.maxScore) || criterion.maxScore < 1) {
        setError(`Criterion ${index + 1} max score must be a positive integer.`);
        setIsSaving(false);
        return;
      }
      for (const [bandIndex, band] of criterion.bandDescriptors.entries()) {
        if (!Number.isFinite(band.scoreMin) || !Number.isFinite(band.scoreMax) || band.scoreMin < 0 || band.scoreMax < band.scoreMin || !band.descriptor) {
          setError(`Band ${bandIndex + 1} in criterion ${index + 1} must have a valid range and descriptor.`);
          setIsSaving(false);
          return;
        }
      }
    }

    if (criteria.length > 0) {
      const criteriaTotal = criteria.reduce((sum, criterion) => sum + criterion.maxScore, 0);
      if (criteriaTotal !== totalMaxScore) {
        setError(`Sum of criterion max scores (${criteriaTotal}) must equal total max score (${totalMaxScore}).`);
        setIsSaving(false);
        return;
      }
    }

    const payload: CreateAiRubricPayload = {
      id: form.id.trim(),
      name: form.name.trim(),
      description: form.description.trim() || null,
      writingType: form.writingType.trim() || null,
      totalMaxScore,
      isDefault: form.isDefault,
      isActive: form.isActive,
      criteria,
    };

    try {
      if (editing) {
        await aiRubricsService.update(editing.id, {
          name: payload.name,
          description: payload.description,
          writingType: payload.writingType,
          totalMaxScore: payload.totalMaxScore,
          isDefault: payload.isDefault,
          isActive: payload.isActive,
          criteria: payload.criteria,
        });
        setMessage('AiRubric updated');
      } else {
        await aiRubricsService.create(payload);
        setMessage('AiRubric created');
      }
      setIsFormOpen(false);
      await loadAiRubrics();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to save aiRubric');
    } finally {
      setIsSaving(false);
    }
  };

  const markDefault = async (aiRubric: AiRubric) => {
    setError(null);
    setMessage(null);
    try {
      await aiRubricsService.update(aiRubric.id, { isDefault: true, isActive: true });
      setMessage(`${aiRubric.name} is now the default aiRubric`);
      await loadAiRubrics();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to set default aiRubric');
    }
  };

  const deactivate = async (aiRubric: AiRubric) => {
    if (!confirm(`Deactivate aiRubric "${aiRubric.name}"?`)) return;
    setError(null);
    setMessage(null);
    try {
      await aiRubricsService.deactivate(aiRubric.id);
      setMessage('AiRubric deactivated');
      await loadAiRubrics();
      if (selected?.id === aiRubric.id) setSelected(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to deactivate aiRubric');
    }
  };

  const importCsv = async (file: File): Promise<ImportAiRubricsResult | null> => {
    setError(null);
    setMessage(null);
    try {
      const res = await aiRubricsService.importCsv(file);
      setMessage(`${res.data.imported} aiRubric(s) imported. ${res.data.failed} row(s) failed.`);
      if (res.data.errors.length > 0) {
        setError(res.data.errors.slice(0, 3).map((item) => `Row ${item.row}: ${item.reason}`).join('\n'));
      }
      await loadAiRubrics();
      return res.data;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to import aiRubrics CSV');
      return null;
    }
  };

  if (!canManage) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <ShieldAlert className="mx-auto mb-4 text-red-500" size={48} />
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">Access Denied</h2>
          <p className="mt-2 font-medium text-slate-500">You don&apos;t have permission to manage aiRubrics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            AI Rubrics <span className="text-[#0A9AE2]">.</span>
          </h1>
          <p className="text-sm sm:text-base font-medium text-slate-500 dark:text-slate-400">
            Manage essay aiRubric templates, criteria, descriptors.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setIsImportOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
            <Upload size={16} />
            Import CSV
          </button>
          <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-[#0A9AE2] px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-100 hover:bg-[#0864B6] dark:shadow-none">
            <Plus size={16} /> New AiRubric
          </button>
        </div>
      </header>

      {(message || error) && (
        <div className="space-y-2">
          {message && <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"><CheckCircle2 size={16} />{message}</div>}
          {error && <div className="whitespace-pre-line rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"><AlertTriangle size={16} className="mr-2 inline" />{error}</div>}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="relative max-w-sm flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search aiRubrics..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
          </div>
          <button onClick={() => void loadAiRubrics()} disabled={isLoading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">AiRubric</th>
                <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">Writing Type</th>
                <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">Score</th>
                <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-6 py-3 text-right text-xs font-black uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center"><Loader2 className="mx-auto animate-spin text-[#0A9AE2]" /></td></tr>
              ) : aiRubrics.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-16 text-center text-sm font-bold text-slate-400">No aiRubrics found</td></tr>
              ) : aiRubrics.map((aiRubric) => (
                <tr key={aiRubric.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 dark:text-slate-100">{aiRubric.name}</span>
                        {aiRubric.isDefault && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"><Star size={10} /> Default</span>}
                      </div>
                      <span className="font-mono text-xs text-slate-400">{aiRubric.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{aiRubric.writingType || '-'}</td>
                  <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">{aiRubric.totalMaxScore} marks</td>
                  <td className="px-6 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-black ${aiRubric.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>{aiRubric.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => void loadDetail(aiRubric.id)} title="View detail" className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10"><Eye size={16} /></button>
                      <button onClick={() => void openEdit(aiRubric)} title="Edit aiRubric" className="rounded-lg p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10"><Pencil size={16} /></button>
                      {!aiRubric.isDefault && <button onClick={() => void markDefault(aiRubric)} title="Mark as default" className="rounded-lg p-2 text-slate-400 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-500/10"><Star size={16} /></button>}
                      {aiRubric.isActive && <button onClick={() => void deactivate(aiRubric)} title="Deactivate" className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"><Trash2 size={16} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">{selected.name}</h2>
              <p className="font-mono text-xs text-slate-400">{selected.id}</p>
              {selected.description && <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">{selected.description}</p>}
            </div>
            <button onClick={() => setSelected(null)} className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
          </div>
          <div className="space-y-4">
            {selected.criteria.length === 0 ? <p className="text-sm font-bold text-slate-400">No criteria imported yet.</p> : selected.criteria.map((criterion) => (
              <div key={criterion.id} className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-slate-800 dark:text-slate-100">{criterion.criterionName}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{criterion.criterionDescription}</p>
                  </div>
                  <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-black text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">{criterion.maxScore} marks</span>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {(criterion.bandDescriptors ?? []).map((band) => (
                    <div key={band.id} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950">
                      <p className="text-xs font-black text-slate-500">Score {band.scoreMin}-{band.scoreMax}</p>
                      <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{band.descriptor}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <form onSubmit={submitForm} className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[#0A9AE2]/10 p-2 text-[#0A9AE2]"><ClipboardCheck size={20} /></div>
                <div>
                  <h2 className="font-black text-slate-900 dark:text-slate-100">{editing ? 'Edit AiRubric' : 'Create AiRubric'}</h2>
                  <p className="text-xs font-medium text-slate-400">Manage aiRubric metadata, criteria, and band descriptors.</p>
                </div>
              </div>
              <button type="button" onClick={() => setIsFormOpen(false)} className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">AiRubric ID</label>
                  <input required disabled={!!editing} value={form.id} onChange={(event) => setForm({ ...form, id: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium focus:border-[#0A9AE2] focus:outline-none disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Name</label>
                  <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Writing Type</label>
                  <input value={form.writingType} onChange={(event) => setForm({ ...form, writingType: event.target.value })} placeholder="selective_entry" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Total Max Score</label>
                  <input required type="number" min="1" value={form.totalMaxScore} onChange={(event) => setForm({ ...form, totalMaxScore: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Description</label>
                <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
              </div>
              <section className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-slate-100">Criteria</h3>
                    <p className="text-xs font-medium text-slate-400">Criterion max scores must add up to the total max score.</p>
                  </div>
                  <button type="button" onClick={addCriterion} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-bold text-[#0A9AE2] shadow-sm hover:bg-blue-50 dark:bg-slate-900 dark:hover:bg-slate-800">
                    <Plus size={15} /> Add Criterion
                  </button>
                </div>

                {form.criteria.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-center text-sm font-bold text-slate-400 dark:border-slate-700 dark:bg-slate-900">
                    No criteria yet. Add criteria manually or import from CSV.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {form.criteria.map((criterion, criterionIndex) => (
                      <div key={criterionIndex} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <h4 className="font-black text-slate-800 dark:text-slate-100">Criterion {criterionIndex + 1}</h4>
                          <button type="button" onClick={() => removeCriterion(criterionIndex)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
                            <Trash2 size={13} /> Remove
                          </button>
                        </div>
                        <div className="grid gap-3 md:grid-cols-4">
                          <div className="space-y-1.5 md:col-span-2">
                            <label className="text-xs font-bold text-slate-500">Name</label>
                            <input required value={criterion.criterionName} onChange={(event) => updateCriterion(criterionIndex, { criterionName: event.target.value })} placeholder="Ideas and content" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500">Max Score</label>
                            <input required type="number" min="1" value={criterion.maxScore} onChange={(event) => updateCriterion(criterionIndex, { maxScore: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500">Sort Order</label>
                            <input type="number" min="0" value={criterion.sortOrder} onChange={(event) => updateCriterion(criterionIndex, { sortOrder: event.target.value })} placeholder={String(criterionIndex)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                          </div>
                        </div>
                        <div className="mt-3 space-y-1.5">
                          <label className="text-xs font-bold text-slate-500">Description</label>
                          <textarea required value={criterion.criterionDescription} onChange={(event) => updateCriterion(criterionIndex, { criterionDescription: event.target.value })} rows={2} placeholder="What this criterion evaluates" className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                        </div>

                        <div className="mt-4 space-y-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <h5 className="text-sm font-black text-slate-700 dark:text-slate-200">Band Descriptors</h5>
                              <p className="text-xs font-medium text-slate-400">Define score ranges and descriptions for AI/tutor guidance.</p>
                            </div>
                            <button type="button" onClick={() => addBandDescriptor(criterionIndex)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-bold text-[#0A9AE2] shadow-sm hover:bg-blue-50 dark:bg-slate-900 dark:hover:bg-slate-800">
                              <Plus size={13} /> Add Band
                            </button>
                          </div>
                          {criterion.bandDescriptors.length === 0 ? (
                            <p className="rounded-lg border border-dashed border-slate-200 bg-white p-3 text-center text-xs font-bold text-slate-400 dark:border-slate-700 dark:bg-slate-900">No band descriptors yet.</p>
                          ) : (
                            <div className="space-y-2">
                              {criterion.bandDescriptors.map((band, bandIndex) => (
                                <div key={bandIndex} className="grid gap-2 rounded-lg bg-white p-3 dark:bg-slate-900 md:grid-cols-[100px_100px_1fr_auto]">
                                  <input required type="number" min="0" value={band.scoreMin} onChange={(event) => updateBandDescriptor(criterionIndex, bandIndex, { scoreMin: event.target.value })} placeholder="Min" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                                  <input required type="number" min="0" value={band.scoreMax} onChange={(event) => updateBandDescriptor(criterionIndex, bandIndex, { scoreMax: event.target.value })} placeholder="Max" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                                  <input required value={band.descriptor} onChange={(event) => updateBandDescriptor(criterionIndex, bandIndex, { descriptor: event.target.value })} placeholder="Descriptor for this score range" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                                  <button type="button" onClick={() => removeBandDescriptor(criterionIndex, bandIndex)} className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300"><input type="checkbox" checked={form.isDefault} onChange={(event) => setForm({ ...form, isDefault: event.target.checked })} /> Default aiRubric</label>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} /> Active</label>
              </div>
            </div>
            <div className="flex gap-3 border-t border-slate-100 p-5 dark:border-slate-800">
              <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 rounded-xl bg-slate-100 py-3 font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300">Cancel</button>
              <button type="submit" disabled={isSaving} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0A9AE2] py-3 font-bold text-white hover:bg-[#0864B6] disabled:opacity-60">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      <ImportAiRubricModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportCsv={importCsv}
      />
    </div>
  );
}
