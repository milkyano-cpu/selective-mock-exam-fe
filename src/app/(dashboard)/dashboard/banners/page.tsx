'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useBanners } from '@/features/banners/hooks/useBanners';
import { showApiSuccessToast } from '@/lib/errorAlert';
import { AccessDeniedScreen } from '@/components/feedback/AccessDeniedScreen';
import { Image as ImageIcon, Plus, X, Loader2, ChevronLeft, ChevronRight, Trash2, Edit2, Upload } from 'lucide-react';
import type { Banner, UpdateBannerPayload } from '@/features/banners/types/banners.types';
import { DeleteConfirmModal } from '@/features/subjects/components/DeleteConfirmModal';

const PAGE_LIMIT = 20;

export default function BannersPage() {
  const user = useAuthStore((s) => s.user);
  const { banners, meta, isLoading, fetchBanners, createBanner, updateBanner, deleteBanner, uploadBannerImage } = useBanners();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [form, setForm] = useState({ imageFile: null as File | null, imageUrl: '', targetUrl: '', isActive: true });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    void fetchBanners({ page, limit: PAGE_LIMIT });
  }, [page, fetchBanners]);

  const resetForm = () => {
    setForm({ imageFile: null, imageUrl: '', targetUrl: '', isActive: true });
    setImagePreview(null);
    setErrorMsg(null);
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm((p) => ({ ...p, imageFile: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      // Edit mode: update targetUrl, isActive, and optionally upload new image
      setIsSubmitting(true);
      setErrorMsg(null);

      try {
        // If user selected a new image, upload it first
        if (form.imageFile) {
          const uploadSuccess = await uploadBannerImage(editingId, form.imageFile);
          if (!uploadSuccess) {
            setIsSubmitting(false);
            return;
          }
        }

        // Then update other fields
        const success = await updateBanner(editingId, {
          targetUrl: form.targetUrl || null,
          isActive: form.isActive,
        });

        if (!success) {
          setIsSubmitting(false);
          return;
        }

        void showApiSuccessToast('save');
        resetForm();
        setIsModalOpen(false);
        void fetchBanners({ page, limit: PAGE_LIMIT });
      } catch {
        // mdwClient interceptor handles toast for thrown errors
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Create mode: create banner, then upload image
      if (!form.imageFile) {
        setErrorMsg('Image file is required');
        return;
      }

      setIsSubmitting(true);
      setErrorMsg(null);

      try {
        // Step 1: Create a banner with placeholder imageUrl
        const newBanner = await createBanner({
          imageUrl: '', // Empty, will be updated after upload
          targetUrl: form.targetUrl || null,
          isActive: form.isActive,
        });

        if (!newBanner) {
          setIsSubmitting(false);
          return;
        }

        // Step 2: Upload the image to the newly created banner
        const uploadSuccess = await uploadBannerImage(newBanner.id, form.imageFile);
        if (!uploadSuccess) {
          resetForm();
          setIsModalOpen(false);
          setIsSubmitting(false);
          void fetchBanners({ page: 1, limit: PAGE_LIMIT });
          return;
        }

        void showApiSuccessToast('save');
        resetForm();
        setIsModalOpen(false);
        void fetchBanners({ page: 1, limit: PAGE_LIMIT });
      } catch {
        // mdwClient interceptor handles toast for thrown errors
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingId(banner.id);
    setForm({ imageFile: null, imageUrl: banner.imageUrl, targetUrl: banner.targetUrl || '', isActive: banner.isActive });
    setImagePreview(banner.imageUrl);
    setIsModalOpen(true);
  };

  const handleUploadImage = async (bannerId: string, file: File) => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const success = await uploadBannerImage(bannerId, file);
      if (success) {
        void showApiSuccessToast('save');
        void fetchBanners({ page, limit: PAGE_LIMIT });
      }
    } catch {
      // mdwClient interceptor handles toast for thrown errors
    } finally {
      setIsSubmitting(false);
    }
  };

  const onConfirmDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await deleteBanner(deletingId);
      void fetchBanners({ page, limit: PAGE_LIMIT });
    } finally {
      setDeletingId(null);
      setIsDeleting(false);
    }
  };

  if (!user || user.role !== 'ADMIN') {
    return <AccessDeniedScreen />;
  }

  return (
    <div className="space-y-4 sm:space-y-8">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1 sm:gap-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Banners <span className="text-[#0A9AE2]">.</span>
          </h1>
          <p className="text-sm sm:text-base font-medium text-slate-500 dark:text-slate-400">
            Manage carousel banners displayed on dashboard.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0A9AE2] text-white text-sm font-bold rounded-xl shadow-sm shadow-blue-100 hover:bg-[#0864B6] transition-all dark:shadow-none"
        >
          <Plus size={16} /> New Banner
        </button>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
                <th className="px-6 py-3.5 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Preview</th>
                <th className="px-6 py-3.5 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Target URL</th>
                <th className="px-6 py-3.5 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3.5 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3.5 text-right text-xs font-black text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" style={{ width: j === 0 ? '80px' : '45%' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : banners.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <ImageIcon size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                    <p className="font-bold text-slate-400 dark:text-slate-500">No banners yet</p>
                  </td>
                </tr>
              ) : (
                banners.map((banner) => (
                  <tr key={banner.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <img src={banner.imageUrl} alt="Banner preview" className="h-12 w-20 object-cover rounded-lg" />
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400 truncate max-w-xs">{banner.targetUrl || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                        banner.isActive
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {banner.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(banner.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleUploadImage(banner.id, file);
                          e.target.value = '';
                        }}
                        className="hidden"
                        id={`upload-${banner.id}`}
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(banner)}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
                        >
                          <Edit2 size={13} /> Edit
                        </button>
                        <button
                          onClick={() => setDeletingId(banner.id)}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{meta.total} banner{meta.total !== 1 ? 's' : ''}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
                <ChevronLeft size={14} /> Prev
              </button>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{page} / {meta.totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages} className="flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">{editingId ? 'Edit Banner' : 'New Banner'}</h2>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Upload image and set target URL.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={18} className="text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              {errorMsg && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">{errorMsg}</div>}

              {!editingId && (
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-900 dark:text-slate-100">Banner Image *</label>
                  {!imagePreview ? (
                    <div className="relative">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl hover:border-[#0A9AE2] hover:bg-slate-50 transition-colors dark:border-slate-700 dark:hover:bg-slate-900"
                      >
                        <Upload size={16} className="text-slate-400" />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Click to upload image
                        </span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 group">
                        <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setForm((p) => ({ ...p, imageFile: null }));
                            setImagePreview(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={18} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-sm font-bold text-slate-600 dark:border-slate-700 dark:hover:bg-slate-900 dark:text-slate-400 transition-colors"
                      >
                        <Upload size={14} /> Change Image
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              )}

              {editingId && imagePreview && (
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-900 dark:text-slate-100">Current Image</label>
                  <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                    <img src={imagePreview} alt="Current" className="w-full h-40 object-cover" />
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-sm font-bold text-slate-600 dark:border-slate-700 dark:hover:bg-slate-900 dark:text-slate-400"
                  >
                    <Upload size={14} /> Replace Image
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-900 dark:text-slate-100">Target URL (optional)</label>
                <input value={form.targetUrl} onChange={(e) => setForm((p) => ({ ...p, targetUrl: e.target.value }))} type="url" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-[#0A9AE2] focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100" placeholder="https://..." />
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} className="rounded-lg border-slate-300 accent-[#0A9AE2]" />
                <label htmlFor="isActive" className="text-sm font-bold text-slate-900 dark:text-slate-100">Active (show on carousel)</label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 rounded-xl bg-slate-100 py-3 font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0A9AE2] py-3 font-bold text-white hover:bg-[#0864B6] disabled:opacity-60">
                  {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <>Save Banner</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={onConfirmDelete}
        title="Delete Banner"
        message="Are you sure you want to delete this banner? This action cannot be undone."
        isLoading={isDeleting}
      />
    </div>
  );
}
