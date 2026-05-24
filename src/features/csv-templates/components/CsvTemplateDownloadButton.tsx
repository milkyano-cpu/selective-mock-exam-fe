'use client';

import { Download, Loader2 } from 'lucide-react';
import { useState } from 'react';
import {
  csvTemplatesService,
  type CsvTemplateType,
} from '../services/csv-templates.service';

interface CsvTemplateDownloadButtonProps {
  templateType: CsvTemplateType;
  label?: string;
  className?: string;
}

export function CsvTemplateDownloadButton({
  templateType,
  label = 'Download Template',
  className,
}: CsvTemplateDownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleDownload() {
    setIsLoading(true);
    try {
      const response = await csvTemplatesService.getDownload(templateType);
      const link = document.createElement('a');
      link.href = response.data.url;
      link.download = response.data.fileName;
      link.rel = 'noopener noreferrer';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(message || 'Template CSV belum tersedia.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleDownload()}
      disabled={isLoading}
      className={className ?? 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 transition-colors hover:border-[#0A9AE2] hover:text-[#0A9AE2] disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-[#0A9AE2] dark:hover:text-[#0A9AE2]'}
    >
      {isLoading ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
      {label}
    </button>
  );
}
