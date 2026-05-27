'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { aiRubricsService } from '@/features/ai-rubrics/services/ai-rubrics.service';
import type { CreateAiRubricPayload, AiRubric } from '@/features/ai-rubrics/types/ai-rubrics.types';
import { aiRubricWritingTypesService } from '@/features/ai-rubric-writing-types/services/ai-rubric-writing-types.service';
import type { AiRubricWritingType } from '@/features/ai-rubric-writing-types/types/ai-rubric-writing-types.types';
import { CsvTemplateDownloadButton } from '@/features/csv-templates/components/CsvTemplateDownloadButton';
import type { CsvTemplateType } from '@/features/csv-templates/services/csv-templates.service';
import { DeleteConfirmModal } from '@/features/subjects/components/DeleteConfirmModal';
import { AccessDeniedScreen } from '@/components/feedback/AccessDeniedScreen';
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
  Trash2,
  Upload,
  X,
} from 'lucide-react';

type ImportEntity = 'criteria' | 'bands' | 'calibration-notes';

const CSV_FORMATS: Record<ImportEntity, { title: string; columns: string; templateType: CsvTemplateType }> = {
  criteria: {
    title: 'Import Criteria CSV',
    columns: 'RubricID, CriterionName, CriterionDescription,\nMaxScore, SortOrder,\nHighScoringIndicators (pipe |),\nLowScoringIndicators (pipe |),\nAICalibrationNotes (pipe |)',
    templateType: 'ai-rubric-criteria',
  },
  bands: {
    title: 'Import Band Descriptors CSV',
    columns: 'RubricID, ScoreMin, ScoreMax, BandLabel, Descriptor',
    templateType: 'ai-rubric-band-descriptors',
  },
  'calibration-notes': {
    title: 'Import Calibration Notes CSV',
    columns: 'RubricID, Category, Instruction, SortOrder',
    templateType: 'ai-calibration-notes',
  },
};

type RubricFormState = {
  id: string;
  name: string;
  writingType: string;
  totalMaxScore: string;
  isActive: boolean;
};

function buildEmpty(): RubricFormState {
  return { id: '', name: '', writingType: '', totalMaxScore: '100', isActive: true };
}

export default function AiRubricsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const canManage = user?.role === 'ADMIN' || user?.role === 'TUTOR';

  const [aiRubrics, setAiRubrics] = useState<AiRubric[]>([]);
  const [writingTypes, setWritingTypes] = useState<AiRubricWritingType[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editing, setEditing] = useState<AiRubric | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<RubricFormState>(buildEmpty());
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importingEntity, setImportingEntity] = useState<ImportEntity | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deactivating, setDeactivating] = useState<AiRubric | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const loadAiRubrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await aiRubricsService.list({ page: 1, limit: 100, search: search || undefined, activeOnly: false });
      if (res.success) setAiRubrics(res.data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to load rubrics');
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (!canManage) return;
    const t = window.setTimeout(() => void loadAiRubrics(), 0);
    void aiRubricWritingTypesService.list({ feedbackContext: 'options' }).then((res) => {
      if (res.success) setWritingTypes(res.data);
    }).catch(() => { /* mdwClient interceptor fires the toast */ });
    return () => window.clearTimeout(t);
  }, [canManage, loadAiRubrics]);

  const openCreate = () => { setEditing(null); setForm(buildEmpty()); setIsFormOpen(true); setError(null); setMessage(null); };

  const openEdit = async (e: React.MouseEvent, aiRubric: AiRubric) => {
    e.stopPropagation();
    setError(null); setMessage(null);
    try {
      const res = await aiRubricsService.getById(aiRubric.id);
      if (res.success) {
        setEditing(aiRubric);
        setForm({
          id: res.data.id,
          name: res.data.name,
          writingType: res.data.writingType ?? '',
          totalMaxScore: String(res.data.totalMaxScore),
          isActive: res.data.isActive,
        });
        setIsFormOpen(true);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to load rubric for editing');
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true); setError(null); setMessage(null);
    const totalMaxScore = parseInt(form.totalMaxScore, 10);
    if (!Number.isFinite(totalMaxScore) || totalMaxScore < 1) {
      setError('Total max score must be a positive integer');
      setIsSaving(false);
      return;
    }

    try {
      if (editing) {
        await aiRubricsService.update(editing.id, {
          name: form.name.trim(),
          writingType: form.writingType.trim() || null,
          totalMaxScore,
          isActive: form.isActive,
        });
        setMessage('Rubric updated');
      } else {
        const payload: CreateAiRubricPayload = {
          id: form.id.trim(),
          name: form.name.trim(),
          writingType: form.writingType.trim() || null,
          totalMaxScore,
          isActive: form.isActive,
        };
        await aiRubricsService.create(payload);
        setMessage('Rubric created');
      }
      setIsFormOpen(false);
      await loadAiRubrics();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to save rubric');
    } finally {
      setIsSaving(false);
    }
  };

  const openDeactivate = (e: React.MouseEvent, r: AiRubric) => {
    e.stopPropagation();
    setDeactivating(r);
  };

  const onConfirmDeactivate = async () => {
    if (!deactivating) return;
    setIsDeactivating(true);
    setError(null); setMessage(null);
    try {
      await aiRubricsService.deactivate(deactivating.id);
      setMessage('Rubric deactivated');
      setDeactivating(null);
      await loadAiRubrics();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to deactivate');
    } finally {
      setIsDeactivating(false);
    }
  };

  const openImport = (entity: ImportEntity) => {
    setImportingEntity(entity);
    setImportFile(null);
    setError(null);
    setMessage(null);
  };

  const closeImport = () => {
    setImportingEntity(null);
    setImportFile(null);
  };

  const submitImport = async () => {
    if (!importingEntity || !importFile) return;
    setIsUploading(true);
    setError(null);
    setMessage(null);
    try {
      const upload =
        importingEntity === 'criteria' ? aiRubricsService.importCriteriaCsv :
        importingEntity === 'bands' ? aiRubricsService.importBandsCsv :
        aiRubricsService.importCalibrationNotesCsv;
      const res = await upload(importFile);
      setMessage(`${res.data.imported} row(s) imported. ${res.data.failed} failed.`);
      if (res.data.errors.length > 0) {
        setError(res.data.errors.slice(0, 5).map((e) => `Row ${e.row}: ${e.reason}`).join('\n'));
      }
      closeImport();
      await loadAiRubrics();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to import CSV');
    } finally {
      setIsUploading(false);
    }
  };

  if (!canManage) {
    return <AccessDeniedScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">AI Rubrics <span className="text-[#0A9AE2]">.</span></h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 sm:text-base">Manage essay rubric templates. Click a row to manage its criteria, bands and calibration notes.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => openImport('criteria')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"><Upload size={15} /> Import Criteria</button>
          <button onClick={() => openImport('bands')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"><Upload size={15} /> Import Bands</button>
          <button onClick={() => openImport('calibration-notes')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"><Upload size={15} /> Import Notes</button>
          <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-[#0A9AE2] px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-100 hover:bg-[#0864B6] dark:shadow-none"><Plus size={16} /> New Rubric</button>
        </div>
      </header>

      {/* Messages */}
      {(message || error) && (
        <div className="space-y-2">
          {message && <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"><CheckCircle2 size={16} />{message}</div>}
          {error && <div className="whitespace-pre-line rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"><AlertTriangle size={16} className="mr-2 inline" />{error}</div>}
        </div>
      )}

      {/* Table */}
      <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="relative max-w-sm flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search rubrics..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
          </div>
          <button onClick={() => void loadAiRubrics()} disabled={isLoading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">Rubric</th>
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
                <tr><td colSpan={5} className="px-6 py-16 text-center text-sm font-bold text-slate-400">No rubrics found</td></tr>
              ) : aiRubrics.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => router.push(`/dashboard/ai-rubrics/${r.id}`)}
                  className="cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-black text-slate-900 dark:text-slate-100">{r.name}</span>
                      <span className="font-mono text-xs text-slate-400">{r.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{r.writingType || '-'}</td>
                  <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">{r.totalMaxScore}</td>
                  <td className="px-6 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-black ${r.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>{r.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/ai-rubrics/${r.id}`); }} title="Open detail" className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10"><Eye size={16} /></button>
                      <button onClick={(e) => void openEdit(e, r)} title="Edit rubric metadata" className="rounded-lg p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10"><Pencil size={16} /></button>
                      {r.isActive && <button onClick={(e) => openDeactivate(e, r)} title="Deactivate" className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"><Trash2 size={16} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Create / Edit modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <form onSubmit={submit} className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[#0A9AE2]/10 p-2 text-[#0A9AE2]"><ClipboardCheck size={20} /></div>
                <div>
                  <h2 className="font-black text-slate-900 dark:text-slate-100">{editing ? 'Edit Rubric' : 'Create Rubric'}</h2>
                  <p className="text-xs font-medium text-slate-400">{editing ? 'Update rubric metadata.' : 'Create a new rubric, then open its detail to add criteria, bands & notes.'}</p>
                </div>
              </div>
              <button type="button" onClick={() => setIsFormOpen(false)} className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Rubric ID</label>
                  <input required disabled={!!editing} value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium focus:border-[#0A9AE2] focus:outline-none disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Name</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Writing Type</label>
                  <select value={form.writingType} onChange={(e) => setForm({ ...form, writingType: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                    <option value="">(None)</option>
                    {writingTypes.map((wt) => (
                      <option key={wt.id} value={wt.name}>{wt.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Total Max Score</label>
                  <input required type="number" min="1" value={form.totalMaxScore} onChange={(e) => setForm({ ...form, totalMaxScore: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active</label>
              </div>
            </div>
            <div className="flex gap-3 border-t border-slate-100 p-5 dark:border-slate-800">
              <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 rounded-xl bg-slate-100 py-3 font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300">Cancel</button>
              <button type="submit" disabled={isSaving} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0A9AE2] py-3 font-bold text-white hover:bg-[#0864B6] disabled:opacity-60">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CSV Import modal */}
      {importingEntity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="flex w-full max-w-md flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
              <h2 className="font-black text-slate-900 dark:text-slate-100">{CSV_FORMATS[importingEntity].title}</h2>
              <button onClick={closeImport} className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
            </div>
            <div className="space-y-4 p-5">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs font-medium text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                <p className="mb-1 font-bold">CSV format (RubricID column required — one file can target multiple rubrics):</p>
                <pre className="whitespace-pre-wrap font-mono text-xs">{CSV_FORMATS[importingEntity].columns}</pre>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  CSV Template
                </p>
                <CsvTemplateDownloadButton
                  templateType={CSV_FORMATS[importingEntity].templateType}
                  label="Download"
                />
              </div>
              <input type="file" accept=".csv" onChange={(e) => setImportFile(e.target.files?.[0] ?? null)} className="block w-full text-sm font-medium" />
            </div>
            <div className="flex gap-3 border-t border-slate-100 p-5 dark:border-slate-800">
              <button type="button" onClick={closeImport} className="flex-1 rounded-xl bg-slate-100 py-3 font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300">Cancel</button>
              <button type="button" disabled={!importFile || isUploading} onClick={() => void submitImport()} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0A9AE2] py-3 font-bold text-white hover:bg-[#0864B6] disabled:opacity-60">
                {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Upload
              </button>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={!!deactivating}
        onClose={() => setDeactivating(null)}
        onConfirm={onConfirmDeactivate}
        title="Deactivate Rubric"
        message={`Are you sure you want to deactivate "${deactivating?.name ?? 'this rubric'}"?`}
        isLoading={isDeactivating}
      />
    </div>
  );
}
