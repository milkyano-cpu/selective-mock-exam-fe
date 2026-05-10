'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { PdfPreview } from '@/features/resources/components/pdf-preview';
import { resourceService } from '@/features/resources/services/resources.service';
import type { Resource, ResourceType, Tier } from '@/features/resources/types/resources.types';
import { AlertTriangle, ExternalLink, FileText, FolderOpen, Loader2, Pencil, Plus, Search, Trash2, Upload, Video, X } from 'lucide-react';

type FilterType = 'ALL' | ResourceType;
type VideoInputMode = 'UPLOAD' | 'URL';
const TIER_OPTIONS: { value: Tier; label: string }[] = [
  { value: 'BASIC', label: 'Basic' },
  { value: 'STANDARD', label: 'Standard' },
  { value: 'PREMIUM', label: 'Premium' },
];

const initialForm = {
  title: '',
  description: '',
  type: 'FILE' as ResourceType,
  videoUrl: '',
  allowedTiers: ['BASIC', 'STANDARD', 'PREMIUM'] as Tier[],
};

function getResourceUrl(resource: Resource) {
  return resource.type === 'VIDEO' ? resource.fileUrl || resource.videoUrl : resource.fileUrl;
}

function getResourcePreviewUrl(resource: Resource) {
  return resource.fileUrl ? `/api/resources/${resource.id}/preview` : getResourceUrl(resource);
}

function formatFileSize(size: number | null) {
  if (!size) return '';
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function isEmbeddableVideoUrl(url: string) {
  return url.includes('youtube.com/embed/') || url.includes('player.vimeo.com/video/');
}

function isDirectVideoUrl(url: string) {
  const cleanUrl = url.split('?')[0]?.toLowerCase() ?? '';
  return cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.ogg');
}

function isPdfResource(resource: Resource) {
  return resource.mimeType === 'application/pdf' || resource.fileName?.toLowerCase().endsWith('.pdf');
}

function toEmbedVideoUrl(url: string | null) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace('/', '');
      return id ? `https://www.youtube.com/embed/${id}` : url;
    }

    if (parsed.hostname.includes('youtube.com')) {
      const id = parsed.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : url;
    }

    if (parsed.hostname.includes('vimeo.com') && !parsed.hostname.includes('player.')) {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : url;
    }
  } catch {
    return url;
  }

  return url;
}

export default function ResourcesPage() {
  const user = useAuthStore((state) => state.user);
  const [resources, setResources] = useState<Resource[]>([]);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', allowedTiers: initialForm.allowedTiers });
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');
  const [viewingResource, setViewingResource] = useState<Resource | null>(null);
  const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<'blocked' | 'error' | ''>('');
  const [videoInputMode, setVideoInputMode] = useState<VideoInputMode>('UPLOAD');
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const isAuthorized = user?.role === 'ADMIN' || user?.role === 'TUTOR' || user?.role === 'STUDENT';
  const canManage = user?.role === 'ADMIN' || user?.role === 'TUTOR';

  const loadResources = async () => {
    setIsLoading(true);
    try {
      const response = await resourceService.list({
        type: filter === 'ALL' ? undefined : filter,
        search: searchQuery || undefined,
        limit: 50,
      });
      setResources(response.data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthorized) return;
    const timeout = window.setTimeout(() => {
      void loadResources();
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [filter, searchQuery, isAuthorized]);

  useEffect(() => {
    if (!viewingResource?.fileUrl) {
      setPreviewObjectUrl(null);
      setPreviewError('');
      setIsPreviewLoading(false);
      return;
    }

    const abortController = new AbortController();
    let objectUrl: string | null = null;

    setPreviewObjectUrl(null);
    setPreviewError('');
    setIsPreviewLoading(true);

    fetch(`/api/resources/${viewingResource.id}/preview`, {
      credentials: 'include',
      signal: abortController.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Preview failed: ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (abortController.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setPreviewObjectUrl(objectUrl);
      })
      .catch((err) => {
        if (abortController.signal.aborted) return;
        const isBlocked = err instanceof TypeError && err.message === 'Failed to fetch';
        setPreviewError(isBlocked ? 'blocked' : 'error');
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setIsPreviewLoading(false);
        }
      });

    return () => {
      abortController.abort();
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [viewingResource]);

  const filteredResources = useMemo(() => resources, [resources]);

  const resetModal = () => {
    setForm(initialForm);
    setVideoInputMode('UPLOAD');
    setFile(null);
    setErrorMessage('');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetModal();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');

    if (form.type === 'FILE' && !file) {
      setErrorMessage('Please select a file to upload.');
      return;
    }

    if (form.type === 'VIDEO' && videoInputMode === 'UPLOAD' && !file) {
      setErrorMessage('Please select a video file to upload.');
      return;
    }

    if (form.type === 'VIDEO' && videoInputMode === 'URL' && !form.videoUrl.trim()) {
      setErrorMessage('Please enter a video URL or switch to upload mode.');
      return;
    }

    if (form.allowedTiers.length === 0) {
      setErrorMessage('Please select at least one tier.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await resourceService.create({
        title: form.title,
        description: form.description,
        type: form.type,
        videoUrl: form.type === 'VIDEO' && videoInputMode === 'URL' ? form.videoUrl : null,
        allowedTiers: form.allowedTiers,
      });

      if ((form.type === 'FILE' || (form.type === 'VIDEO' && videoInputMode === 'UPLOAD')) && file) {
        await resourceService.uploadFile(created.data.id, file);
      }

      await loadResources();
      closeModal();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save resource.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Delete this resource?');
    if (!confirmed) return;
    await resourceService.remove(id);
    await loadResources();
  };

  const openEditModal = (resource: Resource) => {
    setEditingResource(resource);
    setEditForm({
      title: resource.title,
      description: resource.description || '',
      allowedTiers: resource.allowedTiers.length > 0 ? resource.allowedTiers : initialForm.allowedTiers,
    });
    setEditError('');
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingResource) return;
    setEditError('');
    if (editForm.allowedTiers.length === 0) {
      setEditError('Please select at least one tier.');
      return;
    }
    setIsEditSubmitting(true);
    try {
      await resourceService.update(editingResource.id, {
        title: editForm.title,
        description: editForm.description,
        allowedTiers: editForm.allowedTiers,
      });
      setIsEditModalOpen(false);
      setEditingResource(null);
      await loadResources();
    } catch (error) {
      setEditError(error instanceof Error ? error.message : 'Failed to update resource.');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-lg font-semibold text-slate-500">You do not have access to this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            Resources
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            Manage learning materials — files and videos for students.
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0A9AE2] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#0889c9]"
          >
            <Plus size={18} />
            Add Resource
          </button>
        )}
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition-colors focus:border-[#0A9AE2] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
        <div className="flex gap-2">
          {(['ALL', 'FILE', 'VIDEO'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={[
                'rounded-xl px-4 py-2 text-xs font-bold transition-colors',
                filter === type
                  ? 'bg-[#0A9AE2] text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
              ].join(' ')}
            >
              {type === 'ALL' ? 'All' : type === 'FILE' ? 'Files' : 'Videos'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="animate-spin text-[#0A9AE2]" size={32} />
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#0A9AE2]/10 text-[#0A9AE2]">
            <FolderOpen size={40} />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">No resources yet</h2>
          <p className="mt-2 max-w-sm text-sm font-medium text-slate-500 dark:text-slate-400">
            Upload files or add video links to create learning materials for your students.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          {/* Mobile list */}
          <ul className="divide-y divide-slate-100 dark:divide-slate-800 sm:hidden">
            {filteredResources.map((resource) => {
              return (
                <li key={resource.id} className="flex items-start gap-3 px-4 py-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${resource.type === 'VIDEO' ? 'bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300' : 'bg-sky-100 text-[#0A9AE2] dark:bg-sky-500/10 dark:text-sky-300'}`}>
                    {resource.type === 'VIDEO' ? <Video size={18} /> : <FileText size={18} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => setViewingResource(resource)}
                      className="truncate text-sm font-bold text-slate-900 hover:text-[#0A9AE2] dark:text-slate-100 dark:hover:text-[#0A9AE2]"
                    >
                      {resource.title}
                    </button>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{resource.description || 'No description'}</p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {resource.type}{resource.fileSize ? ` · ${formatFileSize(resource.fileSize)}` : ''} · {new Date(resource.createdAt).toLocaleDateString()}
                    </p>
                    <p className="mt-1 text-[10px] font-bold text-[#0A9AE2]">
                      {resource.allowedTiers.map((tier) => TIER_OPTIONS.find((option) => option.value === tier)?.label ?? tier).join(', ')}
                    </p>
                  </div>
                  {canManage && (
                    <div className="flex shrink-0 gap-1">
                      <button
                        onClick={() => openEditModal(resource)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => void handleDelete(resource.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/60">
                  <th className="px-6 py-3.5 text-left text-xs font-black uppercase tracking-wider text-slate-500">Resource</th>
                  <th className="px-6 py-3.5 text-left text-xs font-black uppercase tracking-wider text-slate-500">Description</th>
                  <th className="px-6 py-3.5 text-left text-xs font-black uppercase tracking-wider text-slate-500">Type</th>
                  <th className="px-6 py-3.5 text-left text-xs font-black uppercase tracking-wider text-slate-500">Tier Access</th>
                  <th className="px-6 py-3.5 text-left text-xs font-black uppercase tracking-wider text-slate-500">Size</th>
                  <th className="px-6 py-3.5 text-left text-xs font-black uppercase tracking-wider text-slate-500">Created</th>
                  <th className="px-6 py-3.5 text-right text-xs font-black uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredResources.map((resource) => {
                  return (
                    <tr key={resource.id} className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${resource.type === 'VIDEO' ? 'bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300' : 'bg-sky-100 text-[#0A9AE2] dark:bg-sky-500/10 dark:text-sky-300'}`}>
                            {resource.type === 'VIDEO' ? <Video size={16} /> : <FileText size={16} />}
                          </div>
                          <button
                            type="button"
                            onClick={() => setViewingResource(resource)}
                            className="font-bold text-slate-900 hover:text-[#0A9AE2] hover:underline dark:text-slate-100 dark:hover:text-[#0A9AE2]"
                          >
                            {resource.title}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        <p className="line-clamp-1 max-w-md">{resource.description || <span className="italic text-slate-400">No description</span>}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${resource.type === 'VIDEO' ? 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300' : 'bg-sky-50 text-[#0A9AE2] dark:bg-sky-500/10 dark:text-sky-300'}`}>
                          {resource.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {resource.allowedTiers.map((tier) => (
                            <span key={tier} className="rounded-full bg-[#0A9AE2]/10 px-2 py-0.5 text-[10px] font-black text-[#0A9AE2]">
                              {TIER_OPTIONS.find((option) => option.value === tier)?.label ?? tier}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                        {resource.fileSize ? formatFileSize(resource.fileSize) : '—'}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                        {new Date(resource.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {canManage && (
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => openEditModal(resource)}
                              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                              title="Edit"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => void handleDelete(resource.id)}
                              className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                              title="Delete"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Add Resource</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Upload a file or add a learning video link.</p>
              </div>
              <button type="button" onClick={closeModal} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Type</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(['FILE', 'VIDEO'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, type }));
                        setFile(null);
                        setErrorMessage('');
                      }}
                      className={[
                        'rounded-2xl border px-4 py-3 text-sm font-bold transition-colors',
                        form.type === type
                          ? 'border-[#0A9AE2] bg-[#0A9AE2]/10 text-[#0A9AE2]'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800',
                      ].join(' ')}
                    >
                      {type === 'FILE' ? 'File' : 'Video'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Title</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#0A9AE2] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="mt-2 h-24 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#0A9AE2] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Tier Access</label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {TIER_OPTIONS.map((tier) => {
                    const isSelected = form.allowedTiers.includes(tier.value);
                    return (
                      <button
                        key={tier.value}
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({
                            ...prev,
                            allowedTiers: isSelected
                              ? prev.allowedTiers.filter((value) => value !== tier.value)
                              : [...prev.allowedTiers, tier.value],
                          }));
                          setErrorMessage('');
                        }}
                        className={[
                          'rounded-2xl border px-3 py-2.5 text-xs font-black transition-colors',
                          isSelected
                            ? 'border-[#0A9AE2] bg-[#0A9AE2]/10 text-[#0A9AE2]'
                            : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800',
                        ].join(' ')}
                      >
                        {tier.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {form.type === 'FILE' ? (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition-colors hover:border-[#0A9AE2] dark:border-slate-700 dark:bg-slate-950">
                  <Upload className="mb-2 text-[#0A9AE2]" size={28} />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{file ? file.name : 'Choose file'}</span>
                  <span className="mt-1 text-xs text-slate-500">PDF, document, image, or other learning file</span>
                  <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                </label>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Video Source</label>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {(['UPLOAD', 'URL'] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => {
                            setVideoInputMode(mode);
                            setFile(null);
                            setErrorMessage('');
                          }}
                          className={[
                            'rounded-2xl border px-4 py-3 text-sm font-bold transition-colors',
                            videoInputMode === mode
                              ? 'border-[#0A9AE2] bg-[#0A9AE2]/10 text-[#0A9AE2]'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800',
                          ].join(' ')}
                        >
                          {mode === 'UPLOAD' ? 'Upload Video' : 'Video URL'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {videoInputMode === 'UPLOAD' ? (
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition-colors hover:border-[#0A9AE2] dark:border-slate-700 dark:bg-slate-950">
                      <Upload className="mb-2 text-[#0A9AE2]" size={28} />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{file ? file.name : 'Choose video file'}</span>
                      <span className="mt-1 text-xs text-slate-500">MP4, WebM, or other browser-playable video</span>
                      <input type="file" accept="video/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                    </label>
                  ) : (
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Video URL</label>
                      <input
                        required
                        type="url"
                        value={form.videoUrl}
                        onChange={(e) => setForm((prev) => ({ ...prev, videoUrl: e.target.value }))}
                        placeholder="https://youtube.com/..."
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#0A9AE2] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      />
                    </div>
                  )}
                </div>
              )}

              {errorMessage && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-300">
                  {errorMessage}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={closeModal} className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0A9AE2] px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-[#0889c9] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                Save Resource
              </button>
            </div>
          </form>
        </div>
      )}

      {viewingResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="flex h-[85vh] w-full max-w-5xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 dark:border-slate-800">
              <div>
                <h2 className="line-clamp-1 text-lg font-black text-slate-900 dark:text-slate-100">{viewingResource.title}</h2>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {viewingResource.type} {viewingResource.fileSize ? `· ${formatFileSize(viewingResource.fileSize)}` : ''}
                </p>
              </div>
              <button type="button" onClick={() => setViewingResource(null)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 bg-slate-100 p-4 dark:bg-slate-950">
              {(() => {
                const resourceUrl = getResourceUrl(viewingResource);
                const previewUrl = getResourcePreviewUrl(viewingResource);
                const embedUrl = viewingResource.type === 'VIDEO' ? toEmbedVideoUrl(resourceUrl) : previewUrl;

                if (!resourceUrl) {
                  return (
                    <div className="flex h-full items-center justify-center rounded-2xl bg-white text-sm font-semibold text-slate-500 dark:bg-slate-900">
                      No preview available.
                    </div>
                  );
                }

                if (viewingResource.fileUrl && isPreviewLoading) {
                  return (
                    <div className="flex h-full items-center justify-center rounded-2xl bg-white dark:bg-slate-900">
                      <Loader2 className="animate-spin text-[#0A9AE2]" size={32} />
                    </div>
                  );
                }

                if (viewingResource.fileUrl && previewError) {
                  return (
                    <div className="flex h-full flex-col items-center justify-center gap-4 rounded-2xl bg-white px-6 text-center dark:bg-slate-900">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                        <AlertTriangle size={28} />
                      </div>
                      {previewError === 'blocked' ? (
                        <>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Preview blocked by browser extension</p>
                          <p className="max-w-md text-xs text-slate-500 dark:text-slate-400">
                            Your ad blocker or download manager is preventing the file from loading.
                            Please disable it for this site, then try again.
                          </p>
                        </>
                      ) : (
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Failed to load preview</p>
                      )}
                      <a
                        href={`/api/resources/${viewingResource.id}/preview`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl bg-[#0A9AE2] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#0889c9]"
                      >
                        <ExternalLink size={16} />
                        Open in New Tab
                      </a>
                    </div>
                  );
                }

                if (viewingResource.type === 'VIDEO' && (viewingResource.fileUrl || isDirectVideoUrl(resourceUrl))) {
                  return (
                    <video controls className="h-full w-full rounded-2xl bg-black" src={previewObjectUrl ?? previewUrl ?? resourceUrl}>
                      Your browser does not support the video tag.
                    </video>
                  );
                }

                if (viewingResource.type === 'VIDEO' && embedUrl && isEmbeddableVideoUrl(embedUrl)) {
                  return (
                    <iframe
                      src={embedUrl}
                      title={viewingResource.title}
                      className="h-full w-full rounded-2xl bg-black"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  );
                }

                if (previewObjectUrl && isPdfResource(viewingResource)) {
                  return <PdfPreview sourceUrl={previewObjectUrl} title={viewingResource.title} />;
                }

                return (
                  <embed
                    src={previewObjectUrl ?? previewUrl ?? resourceUrl}
                    type={viewingResource.mimeType || 'application/pdf'}
                    className="h-full w-full rounded-2xl border-0 bg-white"
                  />
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Edit Resource Modal */}
      {isEditModalOpen && editingResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <form onSubmit={handleEditSubmit} className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Edit Resource</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Update title or description.</p>
              </div>
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Title</label>
                <input
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#0A9AE2] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="mt-2 h-24 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#0A9AE2] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Tier Access</label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {TIER_OPTIONS.map((tier) => {
                    const isSelected = editForm.allowedTiers.includes(tier.value);
                    return (
                      <button
                        key={tier.value}
                        type="button"
                        onClick={() => {
                          setEditForm((prev) => ({
                            ...prev,
                            allowedTiers: isSelected
                              ? prev.allowedTiers.filter((value) => value !== tier.value)
                              : [...prev.allowedTiers, tier.value],
                          }));
                          setEditError('');
                        }}
                        className={[
                          'rounded-2xl border px-3 py-2.5 text-xs font-black transition-colors',
                          isSelected
                            ? 'border-[#0A9AE2] bg-[#0A9AE2]/10 text-[#0A9AE2]'
                            : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800',
                        ].join(' ')}
                      >
                        {tier.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {editError && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-300">
                  {editError}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                Cancel
              </button>
              <button
                type="submit"
                disabled={isEditSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0A9AE2] px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-[#0889c9] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isEditSubmitting && <Loader2 size={16} className="animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
