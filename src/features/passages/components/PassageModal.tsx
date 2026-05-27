'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, Image as ImageIcon, Loader2, Search, X } from 'lucide-react';
import type { PassageDetail } from '../types/passages.types';
import { imagesService } from '@/features/images/services/images.service';
import { subjectsService } from '@/features/subjects/services/subjects.service';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import type { Subject, Topic } from '@/features/subjects/types/subjects.types';

// ── Schema ────────────────────────────────────────────────────────────────────

const passageSchema = z.object({
  title:                z.string().max(500, 'Maximum 500 characters').optional().or(z.literal('')),
  text:                 z.string().max(20000, 'Maximum 20000 characters').optional().or(z.literal('')),
  passageFormat:        z.enum(['text', 'poem', 'article', 'visual_text', 'image_only']),
  passageType:          z.enum(['comprehension', 'poem', 'visual']),
  imageRef:             z.string().max(255).optional().or(z.literal('')),
  imageDisplayPosition: z.enum(['above', 'below', 'inline']).optional().or(z.literal('')),
  latexEnabled:         z.boolean().optional(),
  subjectId:            z.string().optional().or(z.literal('')),
  difficulty:           z.enum(['EASY', 'MEDIUM', 'HARD']).optional().or(z.literal('')),
  topicId:              z.string().optional().or(z.literal('')),
  imageAltText:         z.string().max(500).optional().or(z.literal('')),
  imageCaption:         z.string().max(1000).optional().or(z.literal('')),
  notes:                z.string().max(5000).optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  if ((data.passageFormat === 'image_only' || data.passageFormat === 'visual_text') && !data.imageRef?.trim()) {
    ctx.addIssue({
      code: 'custom',
      path: ['imageRef'],
      message: 'Image Ref is required for image-based passage formats',
    });
  }
  if (data.passageFormat !== 'image_only' && !data.text?.trim()) {
    ctx.addIssue({
      code: 'custom',
      path: ['text'],
      message: 'Passage Text is required unless the format is Image Only',
    });
  }
  if (!data.subjectId?.trim()) {
    ctx.addIssue({ code: 'custom', path: ['subjectId'], message: 'Subject is required' });
  }
  if (!data.topicId?.trim()) {
    ctx.addIssue({ code: 'custom', path: ['topicId'], message: 'Topic is required' });
  }
  if (!data.difficulty) {
    ctx.addIssue({ code: 'custom', path: ['difficulty'], message: 'Difficulty is required' });
  }
});

export type PassageFormValues = z.infer<typeof passageSchema>;

interface PassageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: PassageFormValues) => Promise<void>;
  initialData?: PassageDetail | null;
  isLoading?: boolean;
}

type ImageSuggestion = {
  fileName: string;
  url: string | null;
};

// ── Shared input classes ──────────────────────────────────────────────────────

const inputCls = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 transition-all focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const selectCls = `${inputCls} appearance-none pr-10`;
const labelCls = 'text-sm font-bold text-slate-700 dark:text-slate-300';

export function PassageModal({ isOpen, onClose, onSubmit, initialData, isLoading }: PassageModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<PassageFormValues>({
    resolver: zodResolver(passageSchema),
    defaultValues: {
      title: '',
      text: '',
      passageFormat: 'text',
      passageType: 'comprehension',
      imageRef: '',
      imageDisplayPosition: '',
      latexEnabled: false,
      subjectId: '',
      difficulty: '',
      topicId: '',
      imageAltText: '',
      imageCaption: '',
      notes: '',
    },
  });

  // ── Subjects & Topics ─────────────────────────────────────────────────────
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(false);

  const subjectIdValue = watch('subjectId');
  const passageFormatValue = watch('passageFormat');

  // Fetch all subjects once on open
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoadingSubjects(true);
    subjectsService.listSubjects({ limit: 100 }, { feedbackContext: 'options' }).then((res) => {
      if (!cancelled && res.success) setSubjects(res.data);
    }).catch(() => { /* mdwClient interceptor fires the toast */ }).finally(() => {
      if (!cancelled) setLoadingSubjects(false);
    });
    return () => { cancelled = true; };
  }, [isOpen]);

  // Fetch topics when subject changes
  useEffect(() => {
    if (!subjectIdValue) {
      setTopics([]);
      return;
    }
    let cancelled = false;
    setLoadingTopics(true);
    subjectsService.listTopics(subjectIdValue, { limit: 100 }, { feedbackContext: 'options' }).then((res) => {
      if (!cancelled && res.success) setTopics(res.data);
    }).catch(() => { /* mdwClient interceptor fires the toast */ }).finally(() => {
      if (!cancelled) setLoadingTopics(false);
    });
    return () => { cancelled = true; };
  }, [subjectIdValue, subjects]);

  // ── Image Ref autocomplete ────────────────────────────────────────────────
  const [imageSuggestions, setImageSuggestions] = useState<ImageSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const imageRefValue = watch('imageRef');

  const searchImages = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setImageSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setIsSearching(true);
    try {
      const res = await imagesService.list({ search: query, limit: 10 });
      if (res.success && res.data) {
        const suggestions = res.data.map((img) => ({
          fileName: img.fileName,
          url: img.url ?? null,
        }));
        setImageSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
      } else {
        setImageSuggestions([]);
        setShowSuggestions(false);
      }
    } catch {
      setImageSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchImages(imageRefValue ?? '');
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [imageRefValue, searchImages]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Reset on open ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    reset({
      title:                initialData?.title ?? '',
      text:                 initialData?.text ?? '',
      passageFormat:        initialData?.passageFormat ?? 'text',
      passageType:          initialData?.passageType ?? 'comprehension',
      imageRef:             initialData?.imageRef ?? '',
      imageDisplayPosition: initialData?.imageDisplayPosition ?? '',
      latexEnabled:         initialData?.latexEnabled ?? false,
      subjectId:            initialData?.subjectId ?? '',
      difficulty:           initialData?.difficulty ?? '',
      topicId:              initialData?.topicId ?? '',
      imageAltText:         initialData?.imageAltText ?? '',
      imageCaption:         initialData?.imageCaption ?? '',
      notes:                initialData?.notes ?? '',
    });
    setImageSuggestions([]);
    setShowSuggestions(false);
  }, [initialData, isOpen, reset]);

  if (!isOpen) return null;

  const selectImage = (fileName: string) => {
    setValue('imageRef', fileName, { shouldValidate: true });
    setShowSuggestions(false);
  };

  const needsImageRef = passageFormatValue === 'image_only' || passageFormatValue === 'visual_text';
  const needsContent = passageFormatValue !== 'image_only';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
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
          {/* Title — required */}
          <div className="space-y-1.5">
            <label htmlFor="title" className={labelCls}>
              Title
            </label>
            <input
              id="title"
              {...register('title')}
              placeholder="Enter passage title"
              className={inputCls}
            />
            {errors.title && <p className="mt-1 text-xs font-bold text-red-500">{errors.title.message}</p>}
          </div>

          {/* Row: Passage Type + Format + Difficulty */}
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label htmlFor="passageType" className={labelCls}>
                Passage Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="passageType"
                  {...register('passageType')}
                  className={selectCls}
                >
                  <option value="comprehension">Comprehension</option>
                  <option value="poem">Poem</option>
                  <option value="visual">Visual</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              </div>
              {errors.passageType && <p className="mt-1 text-xs font-bold text-red-500">{errors.passageType.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="passageFormat" className={labelCls}>
                Passage Format <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="passageFormat"
                  {...register('passageFormat')}
                  className={selectCls}
                >
                  <option value="text">Text</option>
                  <option value="poem">Poem</option>
                  <option value="article">Article</option>
                  <option value="visual_text">Visual Text</option>
                  <option value="image_only">Image Only</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              </div>
              {errors.passageFormat && <p className="mt-1 text-xs font-bold text-red-500">{errors.passageFormat.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="difficulty" className={labelCls}>
                Difficulty <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="difficulty"
                  {...register('difficulty')}
                  className={selectCls}
                >
                  <option value="">— Select difficulty —</option>
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              </div>
              {errors.difficulty && <p className="mt-1 text-xs font-bold text-red-500">{errors.difficulty.message}</p>}
            </div>
          </div>

          {/* Passage Text - required unless format is image_only */}
          {needsContent && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="text" className={labelCls}>
                  Passage Text <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="text"
                  {...register('text')}
                  rows={8}
                  placeholder="Paste the full passage text here..."
                  className={`${inputCls} resize-y`}
                />
                {errors.text && <p className="mt-1 text-xs font-bold text-red-500">{errors.text.message}</p>}
              </div>

              {/* LaTeX toggle */}
              <Controller
                name="latexEnabled"
                control={control}
                render={({ field }) => (
                  <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={field.value ?? false}
                      onClick={() => field.onChange(!field.value)}
                      className={`relative h-5 w-9 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-[#0A9AE2]/30 ${
                        field.value ? 'bg-[#0A9AE2]' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                          field.value ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Enable LaTeX rendering
                    </span>
                  </label>
                )}
              />
            </div>
          )}

          {/* Image Ref - required when format is image_only or visual_text */}
          {needsImageRef && (
            <div className="relative space-y-1.5" ref={suggestionRef}>
              <label htmlFor="imageRef" className={labelCls}>
                Image Ref <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  id="imageRef"
                  {...register('imageRef')}
                  placeholder="Search image file name..."
                  autoComplete="off"
                  onFocus={() => { if (imageSuggestions.length > 0) setShowSuggestions(true); }}
                  className={`${inputCls} pl-9`}
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" size={14} />
                )}
              </div>
              {errors.imageRef && <p className="mt-1 text-xs font-bold text-red-500">{errors.imageRef.message}</p>}

              {showSuggestions && imageSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                  {imageSuggestions.map((img) => (
                    <button
                      key={img.fileName}
                      type="button"
                      onClick={() => selectImage(img.fileName)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#0A9AE2] dark:bg-blue-500/10">
                        <ImageIcon size={13} />
                      </div>
                      <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                        {img.fileName}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Image Display Position — visible when type has image */}
          {needsImageRef && (
            <div className="space-y-1.5">
              <label htmlFor="imageDisplayPosition" className={labelCls}>Image Display Position</label>
              <div className="relative">
                <select
                  id="imageDisplayPosition"
                  {...register('imageDisplayPosition')}
                  className={selectCls}
                >
                  <option value="">— Select position —</option>
                  <option value="above">Above passage text</option>
                  <option value="below">Below passage text</option>
                  <option value="inline">Inline with passage text</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              </div>
            </div>
          )}

          {/* Row: Subject + Topic */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className={labelCls}>
                Subject <span className="text-red-500">*</span>
              </label>
              <Controller
                name="subjectId"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value ?? ''}
                    onChange={(val) => {
                      field.onChange(val);
                      setValue('topicId', '');
                    }}
                    options={[
                      { value: '', label: '— Select subject —' },
                      ...subjects.map((s) => ({ value: s.id, label: s.name })),
                    ]}
                    placeholder="Select subject"
                    searchPlaceholder="Search subject..."
                    disabled={loadingSubjects}
                  />
                )}
              />
              {errors.subjectId && <p className="mt-1 text-xs font-bold text-red-500">{errors.subjectId.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className={labelCls}>
                Topic <span className="text-red-500">*</span>
              </label>
              <Controller
                name="topicId"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    options={[
                      { value: '', label: '— Select topic —' },
                      ...topics.map((t) => ({ value: t.id, label: t.name })),
                    ]}
                    placeholder="Select topic"
                    searchPlaceholder="Search topic..."
                    disabled={!subjectIdValue || loadingTopics}
                  />
                )}
              />
              {errors.topicId && <p className="mt-1 text-xs font-bold text-red-500">{errors.topicId.message}</p>}
            </div>
          </div>

          {/* Image Alt Text + Caption — visible when type has image */}
          {needsImageRef && (
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="imageAltText" className={labelCls}>Image Alt Text</label>
                <input
                  id="imageAltText"
                  {...register('imageAltText')}
                  placeholder="Describe the image..."
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="imageCaption" className={labelCls}>Image Caption</label>
                <input
                  id="imageCaption"
                  {...register('imageCaption')}
                  placeholder="Optional caption..."
                  className={inputCls}
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <label htmlFor="notes" className={labelCls}>Notes</label>
            <textarea
              id="notes"
              {...register('notes')}
              rows={3}
              placeholder="Optional notes about this passage..."
              className={`${inputCls} resize-y`}
            />
            {errors.notes && <p className="mt-1 text-xs font-bold text-red-500">{errors.notes.message}</p>}
          </div>

          {/* Actions */}
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
