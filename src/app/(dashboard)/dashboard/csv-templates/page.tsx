'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  Plus,
} from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { CsvTemplateDownloadButton } from '@/features/csv-templates/components/CsvTemplateDownloadButton';
import { AccessDeniedScreen } from '@/components/feedback/AccessDeniedScreen';
import {
  CSV_TEMPLATE_OPTIONS,
  csvTemplatesService,
  type CsvTemplateItem,
  type CsvTemplateType,
} from '@/features/csv-templates/services/csv-templates.service';

function formatSize(size: number | null) {
  if (size === null) return '-';
  if (size < 1024) return `${size} B`;
  return `${(size / 1024).toFixed(1)} KB`;
}

function formatDate(value: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function CsvTemplatesPage() {
  const user = useAuthStore((s) => s.user);
  const canManage = user?.role === 'ADMIN';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [templates, setTemplates] = useState<CsvTemplateItem[]>([]);
  const [selectedType, setSelectedType] = useState<CsvTemplateType>(CSV_TEMPLATE_OPTIONS[0].type);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    if (!canManage) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await csvTemplatesService.list();
      setTemplates(res.data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to load CSV templates');
    } finally {
      setIsLoading(false);
    }
  }, [canManage]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadTemplates(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadTemplates]);

  async function handleInsert() {
    if (!file) {
      setError('File CSV is required');
      return;
    }

    setIsUploading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await csvTemplatesService.upload(selectedType, file);
      setMessage(`${res.data.label} template uploaded`);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadTemplates();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to upload CSV template');
    } finally {
      setIsUploading(false);
    }
  }

  if (!canManage) {
    return <AccessDeniedScreen />;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            CSV Templates <span className="text-[#0A9AE2]">.</span>
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 sm:text-base">
            Upload template files used by CSV import modals.
          </p>
        </div>

      </header>

      {(message || error) && (
        <div className="space-y-2">
          {message && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
              <CheckCircle2 size={16} />
              {message}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-4 border-b border-slate-100 p-5 dark:border-slate-800 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Intended Use</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as CsvTemplateType)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              {CSV_TEMPLATE_OPTIONS.map((option) => (
                <option key={option.type} value={option.type}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">File CSV</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-200 file:px-3 file:py-1.5 file:text-xs file:font-black file:text-slate-700 hover:bg-slate-100 focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:file:bg-slate-800 dark:file:text-slate-300"
            />
          </div>
          <button
            type="button"
            onClick={() => void handleInsert()}
            disabled={isUploading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0A9AE2] px-5 py-3 text-sm font-black text-white shadow-sm shadow-blue-100 hover:bg-[#0864B6] disabled:opacity-60 dark:shadow-none"
          >
            {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Insert
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">Template</th>
                <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">Object Key</th>
                <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">Size</th>
                <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">Updated</th>
                <th className="px-6 py-3 text-right text-xs font-black uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="mx-auto animate-spin text-[#0A9AE2]" />
                  </td>
                </tr>
              ) : templates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-sm font-bold text-slate-400">
                    No templates found
                  </td>
                </tr>
              ) : templates.map((template) => (
                <tr key={template.type} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0A9AE2]/10 text-[#0A9AE2]">
                        <FileSpreadsheet size={18} />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 dark:text-slate-100">{template.label}</p>
                        <p className="text-xs font-medium text-slate-400">{template.fileName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">{template.objectKey}</td>
                  <td className="px-6 py-4 font-bold text-slate-600 dark:text-slate-300">{formatSize(template.size)}</td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{formatDate(template.lastModified)}</td>
                  <td className="px-6 py-4 text-right">
                    {template.available ? (
                      <CsvTemplateDownloadButton templateType={template.type} label="Download" />
                    ) : (
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-400 dark:bg-slate-800">
                        Not uploaded
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
