import { X, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { Subject } from '../types/subjects.types';

const subjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(150, 'Maximum 150 characters'),
  questionCode: z.string()
    .min(1, 'Question Code is required')
    .max(10, 'Maximum 10 characters')
    .regex(/^[A-Z0-9]+$/, 'Only uppercase letters and numbers allowed'),
  description: z.string().max(500, 'Maximum 500 characters').nullable().optional(),
});

type SubjectFormValues = z.infer<typeof subjectSchema>;

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SubjectFormValues) => Promise<void>;
  initialData?: Subject | null;
  isLoading?: boolean;
  apiError?: string | null;
}

export function SubjectModal({ isOpen, onClose, onSubmit, initialData, isLoading, apiError }: SubjectModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: '',
      questionCode: '',
      description: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          name: initialData.name,
          questionCode: initialData.questionCode || '',
          description: initialData.description || '',
        });
      } else {
        reset({ name: '', questionCode: '', description: '' });
      }
    }
  }, [isOpen, initialData, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {initialData ? 'Edit Subject' : 'Create Subject'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Subject Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              {...register('name')}
              placeholder="e.g. Mathematics"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 transition-all focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
            {errors.name && <p className="text-xs text-red-500 font-bold mt-1">{errors.name.message}</p>}
            {apiError && !apiError.toLowerCase().includes('question code') && (
              <p className="text-red-500 text-xs font-medium bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2 mt-1">
                {apiError}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="questionCode" className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Question Code <span className="text-red-500">*</span>
            </label>
            <input
              id="questionCode"
              {...register('questionCode')}
              placeholder="e.g. MT"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 transition-all focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 uppercase"
            />
            <p className="text-[10px] text-slate-400 font-medium">Used for Question ID format: Q-{"{CODE}"}-NNN</p>
            {errors.questionCode && <p className="text-xs text-red-500 font-bold mt-1">{errors.questionCode.message}</p>}
            {apiError && apiError.toLowerCase().includes('question code') && (
              <p className="text-red-500 text-xs font-medium bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2 mt-1">
                {apiError}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="description" className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Description (Optional)
            </label>
            <textarea
              id="description"
              {...register('description')}
              placeholder="Enter subject description..."
              rows={4}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 transition-all focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 resize-none"
            />
            {errors.description && <p className="text-xs text-red-500 font-bold mt-1">{errors.description.message}</p>}
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
              className="flex-1 py-3.5 px-4 bg-[#0A9AE2] text-white font-bold rounded-xl shadow-lg shadow-blue-100 hover:bg-[#0864B6] disabled:bg-slate-300 transition-all flex items-center justify-center gap-2 dark:shadow-none"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : (initialData ? 'Save Changes' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
