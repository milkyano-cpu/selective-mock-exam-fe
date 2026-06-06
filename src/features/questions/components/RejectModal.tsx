'use client';

import { X, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';

const rejectSchema = z.object({
  rejectionNote: z.string().min(1, 'Rejection note is required').max(1000, 'Maximum 1000 characters'),
});

type RejectFormValues = z.infer<typeof rejectSchema>;

interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (note: string) => Promise<void>;
  isLoading?: boolean;
}

export function RejectModal({ isOpen, onClose, onSubmit, isLoading }: RejectModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RejectFormValues>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { rejectionNote: '' },
  });

  useEffect(() => {
    if (isOpen) reset({ rejectionNote: '' });
  }, [isOpen, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Reject Question</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => onSubmit(d.rejectionNote))} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="rejectionNote" className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Rejection Note
            </label>
            <textarea
              id="rejectionNote"
              {...register('rejectionNote')}
              placeholder="Explain why this question is being rejected..."
              rows={5}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 transition-all focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 resize-none"
            />
            {errors.rejectionNote && (
              <p className="text-xs text-red-500 font-bold mt-1">{errors.rejectionNote.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4 pb-8 sm:pb-0 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-3.5 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3.5 px-4 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-100 hover:bg-red-700 disabled:bg-slate-300 transition-all flex items-center justify-center gap-2 dark:shadow-none"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Reject Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
