import { AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  isLoading?: boolean;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isLoading,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-6 dark:bg-red-500/20">
          <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-500" />
        </div>
        
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          {title}
        </h2>
        
        <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">
          {message}
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-3.5 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-3.5 px-4 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-100 hover:bg-red-700 disabled:bg-slate-300 transition-all flex items-center justify-center gap-2 dark:shadow-none"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
