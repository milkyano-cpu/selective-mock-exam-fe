'use client';

import { useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Loader2,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import type { ImportPassagesResult } from '../types/passages.types';

interface ImportPassageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportCsv: (file: File) => Promise<ImportPassagesResult | null>;
}

type Phase = 'upload' | 'results';

export function ImportPassageModal({ isOpen, onClose, onImportCsv }: ImportPassageModalProps) {
  const [phase, setPhase] = useState<Phase>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ImportPassagesResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  function resetState() {
    setPhase('upload');
    setFile(null);
    setResult(null);
    setIsLoading(false);
    setDragOver(false);
    setImportError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleClose() {
    resetState();
    onClose();
  }

  function handleFileSelect(selected: File | null) {
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith('.csv')) {
      setImportError('Please select a CSV file.');
      return;
    }
    setImportError(null);
    setFile(selected);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files[0] ?? null);
  }

  async function handleImport() {
    if (!file) return;
    setIsLoading(true);
    setImportError(null);
    try {
      const res = await onImportCsv(file);
      if (res) {
        setResult(res);
        setPhase('results');
        return;
      }
      setImportError('Import failed. Please check your file format and try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {phase === 'upload' ? 'Import Passages (CSV)' : 'Import Results'}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X size={20} />
          </button>
        </div>

        {phase === 'upload' && (
          <div className="space-y-5 overflow-y-auto p-6">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 transition-all ${
                dragOver
                  ? 'border-[#0A9AE2] bg-blue-50 dark:bg-blue-500/10'
                  : file
                    ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-500/10'
                    : 'border-slate-200 bg-slate-50 hover:border-[#0A9AE2] hover:bg-blue-50/40 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-[#0A9AE2] dark:hover:bg-blue-500/10'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
              />
              {file ? (
                <>
                  <FileText className="text-emerald-500" size={40} />
                  <div className="text-center">
                    <p className="font-bold text-slate-900 dark:text-slate-100">{file.name}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {(file.size / 1024).toFixed(1)} KB - Click to change
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="text-slate-400" size={40} />
                  <div className="text-center">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      Drop your .csv file here
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      or click to browse - max 500 passages
                    </p>
                  </div>
                </>
              )}
            </div>

            {importError && (
              <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                <XCircle size={16} className="shrink-0" />
                {importError}
              </div>
            )}

            <div className="flex gap-3 pt-2 pb-8 sm:pb-0">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 rounded-xl bg-slate-100 px-4 py-3.5 font-bold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={!file || isLoading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0A9AE2] px-4 py-3.5 font-bold text-white shadow-lg shadow-blue-100 transition-all hover:bg-[#0864B6] disabled:bg-slate-300 dark:shadow-none"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <><Upload size={18} /> Import</>}
              </button>
            </div>
          </div>
        )}

        {phase === 'results' && result && (
          <div className="space-y-5 overflow-y-auto p-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-800/50">
                <p className="text-2xl font-black text-slate-900 dark:text-white">{result.total}</p>
                <p className="text-xs font-bold text-slate-500">Total Rows</p>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-center dark:border-emerald-500/20 dark:bg-emerald-500/10">
                <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{result.created}</p>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-500">Created</p>
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-center dark:border-blue-500/20 dark:bg-blue-500/10">
                <p className="text-2xl font-black text-blue-700 dark:text-blue-400">{result.updated}</p>
                <p className="text-xs font-bold text-blue-600 dark:text-blue-500">Updated</p>
              </div>
              <div className={`rounded-xl border p-4 text-center ${result.failed > 0 ? 'border-red-100 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10' : 'border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50'}`}>
                <p className={`text-2xl font-black ${result.failed > 0 ? 'text-red-700 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>{result.failed}</p>
                <p className={`text-xs font-bold ${result.failed > 0 ? 'text-red-600 dark:text-red-500' : 'text-slate-400'}`}>Failed</p>
              </div>
            </div>

            {result.failed === 0 ? (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                <CheckCircle2 size={18} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">All rows imported successfully.</p>
              </div>
            ) : result.created + result.updated > 0 ? (
              <div className="flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 dark:border-amber-500/20 dark:bg-amber-500/10">
                <AlertTriangle size={18} className="shrink-0 text-amber-600 dark:text-amber-400" />
                <p className="text-sm font-bold text-amber-700 dark:text-amber-400">Partial import: {result.failed} row{result.failed !== 1 ? 's' : ''} failed.</p>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 dark:border-red-500/20 dark:bg-red-500/10">
                <XCircle size={18} className="shrink-0 text-red-600 dark:text-red-400" />
                <p className="text-sm font-bold text-red-700 dark:text-red-400">Import failed: no rows were saved.</p>
              </div>
            )}

            {result.errors.length > 0 && (
              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="sticky top-0 border-b border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-700 dark:bg-slate-800">
                  <p className="text-xs font-black text-slate-600 dark:text-slate-300">Errors ({result.errors.length})</p>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {result.errors.map((err) => (
                    <div key={`${err.row}-${err.reason}`} className="flex items-start gap-3 px-4 py-3">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20">
                        <FileText size={10} className="text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-slate-700 dark:text-slate-200">Row {err.row}:</span>{' '}
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{err.reason}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={resetState}
                className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Import Again
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 rounded-xl bg-[#0A9AE2] py-2.5 text-sm font-bold text-white transition-all hover:bg-[#0864B6]"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
