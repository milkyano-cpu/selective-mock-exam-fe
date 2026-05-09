import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, X } from 'lucide-react';
import type { PassageDetail } from '../types/passages.types';

const passageSchema = z.object({
  externalId: z.string().max(100, 'Maximum 100 characters').optional().or(z.literal('')),
  title: z.string().max(500, 'Maximum 500 characters').optional().or(z.literal('')),
  content: z.string().min(1, 'Content is required').max(20000, 'Maximum 20000 characters'),
});

type PassageFormValues = z.infer<typeof passageSchema>;

interface PassageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: PassageFormValues) => Promise<void>;
  initialData?: PassageDetail | null;
  isLoading?: boolean;
}

export function PassageModal({ isOpen, onClose, onSubmit, initialData, isLoading }: PassageModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PassageFormValues>({
    resolver: zodResolver(passageSchema),
    defaultValues: {
      externalId: '',
      title: '',
      content: '',
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    reset({
      externalId: initialData?.externalId ?? '',
      title: initialData?.title ?? '',
      content: initialData?.content ?? '',
    });
  }, [initialData, isOpen, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {initialData ? 'Edit Passage' : 'Create Passage'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="externalId" className="text-sm font-bold text-slate-700 dark:text-slate-300">
                External ID
              </label>
              <input
                id="externalId"
                {...register('externalId')}
                placeholder="e.g. RC-001"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 transition-all focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
              {errors.externalId && <p className="mt-1 text-xs font-bold text-red-500">{errors.externalId.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="title" className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Title
              </label>
              <input
                id="title"
                {...register('title')}
                placeholder="Optional passage title"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 transition-all focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
              {errors.title && <p className="mt-1 text-xs font-bold text-red-500">{errors.title.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="content" className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Passage Content
            </label>
            <textarea
              id="content"
              {...register('content')}
              rows={12}
              placeholder="Paste the full passage text here..."
              className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 transition-all focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
            {errors.content && <p className="mt-1 text-xs font-bold text-red-500">{errors.content.message}</p>}
          </div>

          <div className="flex gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 rounded-xl bg-slate-100 px-4 py-3.5 font-bold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0A9AE2] px-4 py-3.5 font-bold text-white transition-all hover:bg-[#0864B6] disabled:bg-slate-300"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : initialData ? 'Save Changes' : 'Create Passage'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
