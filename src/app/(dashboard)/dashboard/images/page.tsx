'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { AlertTriangle, ImageIcon, Loader2, Pencil, Plus, Save, Search, Trash2, Upload, X } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { imagesService } from '@/features/images/services/images.service';
import type { MasterImage } from '@/features/images/types/images.types';

const initialUploadForm = {
  fileName: '',
  altText: '',
  caption: '',
};

function formatDate(value: string | null) {
  if (!value) return 'Permanent';
  return new Intl.DateTimeFormat('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export default function ImagesPage() {
  const user = useAuthStore((state) => state.user);
  const canManage = user?.role === 'ADMIN' || user?.role === 'TUTOR';
  const [images, setImages] = useState<MasterImage[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState(initialUploadForm);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPanelOpen, setUploadPanelOpen] = useState(false);
  const [editing, setEditing] = useState<MasterImage | null>(null);
  const [editForm, setEditForm] = useState({ altText: '', caption: '' });
  const [rowActionId, setRowActionId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadImages = async () => {
    if (!canManage) return;
    setIsLoading(true);
    try {
      const response = await imagesService.list({
        search: search.trim() || undefined,
        limit: 100,
      });
      setImages(response.data);
    } catch (error) {
      setMessage(getErrorMessage(error, 'Failed to load images.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!canManage) return;
    const timeout = window.setTimeout(() => {
      void loadImages();
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [canManage, search]);

  if (!canManage) {
    return null;
  }

  const resetUpload = () => {
    setUploadForm(initialUploadForm);
    setUploadFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    if (!uploadFile) {
      setMessage('Please select an image file.');
      return;
    }

    setIsUploading(true);
    try {
      await imagesService.upload(uploadFile, uploadForm);
      resetUpload();
      setUploadPanelOpen(false);
      await loadImages();
    } catch (error) {
      setMessage(getErrorMessage(error, 'Failed to upload image.'));
    } finally {
      setIsUploading(false);
    }
  };

  const openEdit = (image: MasterImage) => {
    setEditing(image);
    setEditForm({
      altText: image.altText || '',
      caption: image.caption || '',
    });
    setMessage('');
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;

    setRowActionId(editing.uuid);
    setMessage('');
    try {
      await imagesService.update(editing.uuid, {
        altText: editForm.altText.trim() || null,
        caption: editForm.caption.trim() || null,
      });
      setEditing(null);
      await loadImages();
    } catch (error) {
      setMessage(getErrorMessage(error, 'Failed to update image.'));
    } finally {
      setRowActionId(null);
    }
  };

  const handleUploadPendingFile = async (image: MasterImage, file: File | null) => {
    if (!file) return;
    setRowActionId(image.uuid);
    setMessage('');
    try {
      await imagesService.uploadFile(image.uuid, file);
      await loadImages();
    } catch (error) {
      setMessage(getErrorMessage(error, 'Failed to upload file.'));
    } finally {
      setRowActionId(null);
    }
  };

  const handleDelete = async (image: MasterImage) => {
    const confirmed = window.confirm(`Delete ${image.fileName}?`);
    if (!confirmed) return;

    setRowActionId(image.uuid);
    setMessage('');
    try {
      await imagesService.remove(image.uuid);
      await loadImages();
    } catch (error) {
      setMessage(getErrorMessage(error, 'Failed to delete image.'));
    } finally {
      setRowActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Images <span className="text-[#0A9AE2]">.</span>
          </h1>
          <p className="text-sm sm:text-base font-medium text-slate-500 dark:text-slate-400">
            Manage image assets used by passages and questions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => { setMessage(''); setUploadPanelOpen(true); }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0A9AE2] px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-100 transition-all hover:bg-[#0864B6] dark:shadow-none"
          >
            <Plus size={16} />
            Upload Image
          </button>
        </div>
      </header>

      {message && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          <AlertTriangle size={16} />
          {message}
        </div>
      )}

      {uploadPanelOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <form onSubmit={handleUpload} className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Upload Image</h2>
              <button type="button" onClick={() => { resetUpload(); setUploadPanelOpen(false); }} className="rounded-md p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>
            <p className="mt-1 text-sm font-bold text-slate-500">Add a new image to the library.</p>
            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-black uppercase text-slate-500">File</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        setUploadFile(file);
                        if (file) {
                          setUploadForm((form) => ({
                            ...form,
                            fileName: form.fileName ? form.fileName : file.name,
                          }));
                        }
                      }}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase text-slate-500">File Name</label>
                <input
                  value={uploadForm.fileName}
                  onChange={(event) => setUploadForm((form) => ({ ...form, fileName: event.target.value }))}
                  placeholder={uploadFile?.name || 'Use uploaded file name'}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase text-slate-500">Alt Text</label>
                <input
                  value={uploadForm.altText}
                  onChange={(event) => setUploadForm((form) => ({ ...form, altText: event.target.value }))}
                  placeholder="Alt text"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase text-slate-500">Caption</label>
                <input
                  value={uploadForm.caption}
                  onChange={(event) => setUploadForm((form) => ({ ...form, caption: event.target.value }))}
                  placeholder="Caption"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => { resetUpload(); setUploadPanelOpen(false); }} className="flex-1 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#0A9AE2] px-4 py-2.5 text-sm font-bold text-white disabled:bg-slate-300"
              >
                {isUploading ? <Loader2 size={17} className="animate-spin" /> : <Upload size={17} />}
                Upload
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-4 py-4 dark:border-slate-800 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search images..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm font-medium outline-none transition-all focus:border-[#0A9AE2] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">Image</th>
                <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">Metadata</th>
                <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">Usage</th>
                <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">Expiry</th>
                <th className="px-6 py-3 text-right text-xs font-black uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-[#0A9AE2]" />
                      <span className="font-medium text-slate-400">Loading images...</span>
                    </div>
                  </td>
                </tr>
              ) : images.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <ImageIcon className="text-slate-200 dark:text-slate-800" size={48} />
                      <p className="font-medium text-slate-500">No images found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                images.map((image) => {
                  const linkedCount = image.passageCount + image.questionCount;
                  const isBusy = rowActionId === image.uuid;
                  return (
                    <tr key={image.uuid} className="group transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950">
                            {image.url ? (
                              <img src={image.url} alt={image.altText || image.fileName} className="h-full w-full object-contain" />
                            ) : (
                              <ImageIcon size={22} className="text-slate-300" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#0A9AE2] transition-colors">{image.fileName}</p>
                            <p className="mt-1 text-xs font-bold text-slate-400">{image.url ? 'Uploaded' : 'Pending file'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="max-w-xs truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{image.altText || 'No alt text'}</p>
                        <p className="mt-1 max-w-xs truncate text-xs font-medium text-slate-500">{image.caption || 'No caption'}</p>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">
                        {image.passageCount} passage, {image.questionCount} question
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">{formatDate(image.expiredDate)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!image.url && (
                            <label className="cursor-pointer rounded-lg p-2 text-slate-400 transition-all hover:bg-[#0A9AE2]/10 hover:text-[#0A9AE2]" title="Upload file">
                              {isBusy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                className="hidden"
                                onChange={(event) => {
                                  void handleUploadPendingFile(image, event.target.files?.[0] ?? null);
                                  event.currentTarget.value = '';
                                }}
                              />
                            </label>
                          )}
                          <button
                            type="button"
                            onClick={() => openEdit(image)}
                            className="rounded-lg p-2 text-slate-400 transition-all hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10"
                            title="Edit metadata"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(image)}
                            disabled={linkedCount > 0 || isBusy}
                            className="rounded-lg p-2 text-slate-400 transition-all hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-red-500/10"
                            title={linkedCount > 0 ? 'Image is linked' : 'Delete image'}
                          >
                            {isBusy ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <form onSubmit={handleUpdate} className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Edit Image</h2>
              <button type="button" onClick={() => setEditing(null)} className="rounded-md p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>
            <p className="mt-1 text-sm font-bold text-slate-500">{editing.fileName}</p>
            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-black uppercase text-slate-500">Alt Text</label>
                <input
                  value={editForm.altText}
                  onChange={(event) => setEditForm((form) => ({ ...form, altText: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase text-slate-500">Caption</label>
                <textarea
                  value={editForm.caption}
                  onChange={(event) => setEditForm((form) => ({ ...form, caption: event.target.value }))}
                  rows={4}
                  className="mt-1 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => setEditing(null)} className="flex-1 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                Cancel
              </button>
              <button type="submit" disabled={rowActionId === editing.uuid} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#0A9AE2] px-4 py-2.5 text-sm font-bold text-white disabled:bg-slate-300">
                {rowActionId === editing.uuid ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
