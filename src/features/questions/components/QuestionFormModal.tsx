'use client';

import { X, Loader2, ChevronsUpDown, Check, Search } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { subjectsService } from '@/features/subjects/services/subjects.service';
import type { Subject, Topic } from '@/features/subjects/types/subjects.types';
import { passagesService } from '@/features/passages/services/passages.service';
import type { PassageListItem } from '@/features/passages/types/passages.types';
import { aiRubricsService } from '@/features/ai-rubrics/services/ai-rubrics.service';
import type { AiRubric } from '@/features/ai-rubrics/types/ai-rubrics.types';
import type { Question, CreateQuestionPayload } from '../types/questions.types';
import { questionsService } from '../services/questions.service';
import { LatexRenderer } from '@/components/ui/LatexRenderer';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

// ── Zod schema ────────────────────────────────────────────────────────────────

const formSchema = z
  .object({
    subjectId:        z.string().min(1, 'Subject is required'),
    topicId:          z.string().min(1, 'Topic is required'),
    passageId:        z.string().optional(),
    aiRubricId:         z.string().optional(),
    type:             z.enum(['MCQ', 'ESSAY']),
    difficulty:       z.enum(['EASY', 'MEDIUM', 'HARD']),
    questionText:     z.string().min(1, 'Question text is required').max(5000, 'Max 5000 characters'),
    optionA:          z.string().optional(),
    optionB:          z.string().optional(),
    optionC:          z.string().optional(),
    optionD:          z.string().optional(),
    optionE:          z.string().optional(),
    correctAnswer:    z.string().optional(),
    essayAnswer:      z.string().optional(),
    explanation:      z.string().max(5000).optional(),
    timeLimitSeconds: z.string().min(1, 'Time limit is required'),
    imageRef:         z.string().optional(),
    imageUrl:         z.string().optional(),
    subtopicsRaw:     z.string().optional(),
    notes:            z.string().max(2000).optional(),
    adaptiveTags:     z.string().max(2000).optional(),
    skillTags:        z.string().max(2000).optional(),
    questionId:       z.string().max(100).optional(),
    latexEnabled:    z.boolean().default(false),
    markingType:      z.enum(['AUTO', 'AI_RUBRIC']),
    maxMarks:         z.string().min(1, 'Max marks is required'),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'MCQ') {
      if (!data.optionA?.trim()) ctx.addIssue({ code: 'custom', path: ['optionA'], message: 'Option A is required' });
      if (!data.optionB?.trim()) ctx.addIssue({ code: 'custom', path: ['optionB'], message: 'Option B is required' });
      if (!data.optionC?.trim()) ctx.addIssue({ code: 'custom', path: ['optionC'], message: 'Option C is required' });
      if (!data.optionD?.trim()) ctx.addIssue({ code: 'custom', path: ['optionD'], message: 'Option D is required' });
      if (!data.optionE?.trim()) ctx.addIssue({ code: 'custom', path: ['optionE'], message: 'Option E is required' });
      
      const validKeys = ['A','B','C','D','E'];
      if (!data.correctAnswer || !validKeys.includes(data.correctAnswer)) {
        ctx.addIssue({ code: 'custom', path: ['correctAnswer'], message: 'Select the correct answer' });
      }
    }
    if (data.type === 'MCQ' && data.markingType === 'AI_RUBRIC') {
      ctx.addIssue({ code: 'custom', path: ['markingType'], message: 'MCQ questions must use Auto marking' });
    }
    if (data.type === 'MCQ' && data.aiRubricId) {
      ctx.addIssue({ code: 'custom', path: ['aiRubricId'], message: 'MCQ questions must not use an AI Rubric' });
    }
    if (data.type === 'ESSAY' && data.markingType === 'AUTO') {
      ctx.addIssue({ code: 'custom', path: ['markingType'], message: 'Essay questions must use AI Rubric marking' });
    }
    const parsedMaxMarks = parseInt(data.maxMarks, 10);
    if (!Number.isFinite(parsedMaxMarks) || parsedMaxMarks < 1) {
      ctx.addIssue({ code: 'custom', path: ['maxMarks'], message: 'Max marks must be a positive integer' });
    }
  });

type FormInput = z.input<typeof formSchema>;
type FormValues = z.output<typeof formSchema>;

// ── Props ─────────────────────────────────────────────────────────────────────

interface QuestionFormModalProps {
  isOpen:       boolean;
  onClose:      () => void;
  onSubmit:     (payload: CreateQuestionPayload) => Promise<void>;
  initialData?: Question | null;
  isLoading?:   boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const DIFFICULTY_LABELS: Record<string, string> = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
};

const TOPICS_PAGE_LIMIT = 100;

function RequiredAsterisk() {
  return <span className="ml-1 text-red-500">*</span>;
}

function buildDefaultValues(q: Question | null | undefined): FormInput {
  if (!q) {
    return {
      subjectId: '', topicId: '', passageId: '', aiRubricId: '', type: 'MCQ', difficulty: 'MEDIUM',
      questionText: '', optionA: '', optionB: '', optionC: '', optionD: '',
      optionE: '', correctAnswer: '', essayAnswer: '', explanation: '',
      timeLimitSeconds: '', imageRef: '', imageUrl: '', subtopicsRaw: '', notes: '', questionId: '',
      adaptiveTags: '', skillTags: '',
      latexEnabled: false, markingType: 'AUTO', maxMarks: '1',
    };
  }

  const opts = q.options ?? [];
  return {
    subjectId:        q.subjectId,
    topicId:          q.topicId,
    passageId:        q.passageId ?? '',
    aiRubricId:         q.aiRubricId ?? '',
    type:             q.type,
    difficulty:       q.difficulty,
    questionText:     q.questionText,
    optionA:          opts.find(o => o.key === 'A')?.text ?? '',
    optionB:          opts.find(o => o.key === 'B')?.text ?? '',
    optionC:          opts.find(o => o.key === 'C')?.text ?? '',
    optionD:          opts.find(o => o.key === 'D')?.text ?? '',
    optionE:          opts.find(o => o.key === 'E')?.text ?? '',
    correctAnswer:    q.type === 'MCQ' ? q.correctAnswer : '',
    essayAnswer:      q.type === 'ESSAY' ? q.correctAnswer : '',
    explanation:      q.explanation ?? '',
    timeLimitSeconds: q.timeLimitSeconds != null ? String(q.timeLimitSeconds) : '',
    imageRef:         q.imageRef ?? '',
    imageUrl:         q.imageUrls?.length ? q.imageUrls.join(' | ') : (q.imageUrl ?? ''),
    subtopicsRaw:     (q.subtopics ?? []).join(', '),
    notes:            q.notes ?? '',
    adaptiveTags:     (q.adaptiveTags ?? []).join(', '),
    skillTags:        (q.skillTags ?? []).join(', '),
    questionId:       q.questionId ?? '',
    latexEnabled:    q.latexEnabled ?? false,
    markingType:      q.markingType ?? (q.type === 'ESSAY' ? 'AI_RUBRIC' : 'AUTO'),
    maxMarks:         String(q.maxMarks ?? (q.type === 'ESSAY' ? 20 : 1)),
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function QuestionFormModal({ isOpen, onClose, onSubmit, initialData, isLoading }: QuestionFormModalProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics]     = useState<Topic[]>([]);
  const [passages, setPassages] = useState<PassageListItem[]>([]);
  const [aiRubrics, setAiRubrics]   = useState<AiRubric[]>([]);
  const [passageSearch, setPassageSearch] = useState('');
  const [isPassagePickerOpen, setIsPassagePickerOpen] = useState(false);
  const passagePickerRef = useRef<HTMLDivElement | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: buildDefaultValues(null),
  });

  const selectedType      = watch('type');
  const selectedSubjectId = watch('subjectId');
  const selectedPassageId = watch('passageId');
  const latexEnabled     = watch('latexEnabled');
  const initialPassageId  = initialData?.passageId ?? '';

  const loadTopicsForSubject = useCallback(async (subjectId: string) => {
    const firstPage = await subjectsService.listTopics(subjectId, { page: 1, limit: TOPICS_PAGE_LIMIT });

    if (!firstPage.success) {
      setTopics([]);
      return;
    }

    if ((firstPage.meta?.totalPages ?? 1) <= 1) {
      setTopics(firstPage.data);
      return;
    }

    const remainingPages = await Promise.all(
      Array.from({ length: firstPage.meta.totalPages - 1 }, (_, index) =>
        subjectsService.listTopics(subjectId, { page: index + 2, limit: TOPICS_PAGE_LIMIT })
      )
    );

    const allTopics = [
      ...firstPage.data,
      ...remainingPages.flatMap((response) => (response.success ? response.data : [])),
    ];

    setTopics(allTopics);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    Promise.all([
      subjectsService.listSubjects({ page: 1, limit: 100 }),
      passagesService.list({ page: 1, limit: 100 }),
      aiRubricsService.list({ page: 1, limit: 100, activeOnly: true }),
    ]).then(async ([subjectsRes, passagesRes, aiRubricsRes]) => {
      if (subjectsRes.success) setSubjects(subjectsRes.data);
      if (aiRubricsRes.success) setAiRubrics(aiRubricsRes.data);

      if (passagesRes.success) {
        let nextPassages = passagesRes.data;
        if (initialPassageId && !nextPassages.some((passage) => passage.id === initialPassageId)) {
          const detailRes = await passagesService.getById(initialPassageId).catch(() => null);
          if (detailRes?.success) {
            nextPassages = [detailRes.data, ...nextPassages];
          }
        }
        setPassages(nextPassages);
      }
    }).catch((error) => {
      console.error('Failed to load subjects, passages, and aiRubrics:', error);
    });
  }, [initialPassageId, isOpen]);

  // Load topics when subjectId changes
  useEffect(() => {
    if (!selectedSubjectId) { setTopics([]); return; }
    loadTopicsForSubject(selectedSubjectId).catch(() => {
      setTopics([]);
    });
  }, [loadTopicsForSubject, selectedSubjectId]);

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      reset(buildDefaultValues(initialData));
      setPassageSearch('');
      setIsPassagePickerOpen(false);
      if (initialData?.subjectId) {
        loadTopicsForSubject(initialData.subjectId).catch(() => {
          setTopics([]);
        });
      } else {
        setTopics([]);
      }
    }
  }, [isOpen, initialData, loadTopicsForSubject, reset]);

  useEffect(() => {
    if (!isPassagePickerOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!passagePickerRef.current) return;
      if (!passagePickerRef.current.contains(event.target as Node)) {
        setIsPassagePickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPassagePickerOpen]);

  // Clear topicId when subject changes (in edit mode the subject may differ)
  const handleSubjectChange = async (subjectId: string) => {
    setValue('subjectId', subjectId);
    setValue('topicId', '');
    setTopics([]);

    // Auto-generate Question ID if creating new question
    if (!initialData && subjectId) {
      try {
        const res = await questionsService.getNextId(subjectId);
        if (res.success) {
          setValue('questionId', res.data.questionId);
        }
      } catch (error) {
        console.error('Failed to auto-generate Question ID:', error);
      }
    }
  };

  const handleAiRubricChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const selectedAiRubric = aiRubrics.find((aiRubric) => aiRubric.id === event.target.value);
    if (selectedAiRubric) {
      setValue('maxMarks', String(selectedAiRubric.totalMaxScore), { shouldDirty: true, shouldValidate: true });
    }
  };

  const onFormSubmit = async (values: FormValues) => {
    const subtopics = values.subtopicsRaw
      ? values.subtopicsRaw.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const timeLimitSeconds = values.timeLimitSeconds
      ? parseInt(values.timeLimitSeconds, 10) || undefined
      : undefined;

    const payload: CreateQuestionPayload = {
      subjectId:        values.subjectId,
      topicId:          values.topicId,
      passageId:        values.passageId || (initialData ? null : undefined),
      aiRubricId:         values.type === 'ESSAY' ? (values.aiRubricId || null) : null,
      type:             values.type,
      difficulty:       values.difficulty,
      questionText:     values.questionText,
      latexEnabled:    values.latexEnabled,
      markingType:      values.markingType,
      maxMarks:         parseInt(values.maxMarks, 10),
      explanation:      values.explanation?.trim() || undefined,
      timeLimitSeconds,
      imageRef:         values.imageRef?.trim() || (initialData ? null : undefined),
      imageUrl:         values.imageUrl?.trim() || undefined,
      imageUrls:        values.imageUrl?.trim()
                          ? values.imageUrl.split('|').map((item) => item.trim()).filter(Boolean)
                          : undefined,
      subtopics:        subtopics.length ? subtopics : undefined,
      notes:            values.notes?.trim() || undefined,
      adaptiveTags:     values.adaptiveTags?.trim()
                          ? values.adaptiveTags.split(',').map((s) => s.trim()).filter(Boolean)
                          : [],
      skillTags:        values.skillTags?.trim()
                          ? values.skillTags.split(',').map((s) => s.trim()).filter(Boolean)
                          : [],
      questionId:       values.questionId?.trim() || undefined,
    };

    if (values.type === 'MCQ') {
      const options: CreateQuestionPayload['options'] = [
        { key: 'A', text: values.optionA! },
        { key: 'B', text: values.optionB! },
        { key: 'C', text: values.optionC! },
        { key: 'D', text: values.optionD! },
        { key: 'E', text: values.optionE! },
      ];
      payload.options = options;
      payload.correctAnswer = values.correctAnswer;
    } else {
      payload.correctAnswer = values.essayAnswer?.trim() || undefined;
    }

    await onSubmit(payload);
  };

  if (!isOpen) return null;

  const isEdit = !!initialData;
  const filteredPassages = passages.filter((passage) => {
    if (!passageSearch.trim()) return true;
    const query = passageSearch.toLowerCase();
    return [passage.title, passage.externalId, passage.content]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(query));
  });
  const selectedPassage = passages.find((passage) => passage.id === selectedPassageId);
  const selectedPassageLabel = selectedPassage
    ? `${selectedPassage.title || 'Untitled Passage'}${selectedPassage.externalId ? ` • ${selectedPassage.externalId}` : ''}`
    : 'No linked passage';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-t-3xl">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {isEdit ? 'Edit Question' : 'Create Question'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-5">
          {/* Type toggle */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Question Type<RequiredAsterisk /></label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <div className="flex gap-2">
                  {(['MCQ', 'ESSAY'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        field.onChange(t);
                        setValue('markingType', t === 'ESSAY' ? 'AI_RUBRIC' : 'AUTO');
                        setValue('maxMarks', t === 'ESSAY' ? '20' : '1');
                        if (t === 'MCQ') setValue('aiRubricId', '');
                      }}
                      className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                        field.value === t
                          ? 'bg-[#0A9AE2] text-white shadow-lg shadow-blue-100 dark:shadow-none'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                      }`}
                    >
                      {t === 'MCQ' ? 'Multiple Choice (MCQ)' : 'Essay'}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Marking Type<RequiredAsterisk /></label>
              <Controller
                name="markingType"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select marking type"
                    searchPlaceholder="Search marking types..."
                    options={[
                      { value: 'AUTO', label: 'Auto' },
                      { value: 'AI_RUBRIC', label: 'AI Rubric' },
                    ]}
                  />
                )}
              />
              {errors.markingType && <p className="text-xs text-red-500 font-bold">{errors.markingType.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Max Marks<RequiredAsterisk /></label>
              <input
                type="number"
                min="1"
                step="1"
                {...register('maxMarks')}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 transition-all focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
              {errors.maxMarks && <p className="text-xs text-red-500 font-bold">{errors.maxMarks.message}</p>}
            </div>
          </div>

          {selectedType === 'ESSAY' && (
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">AI Rubric</label>
              <select
                {...register('aiRubricId', { onChange: handleAiRubricChange })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 transition-all focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="">Use default AI Rubric</option>
                {aiRubrics.map((aiRubric) => (
                  <option key={aiRubric.id} value={aiRubric.id}>
                    {aiRubric.name} ({aiRubric.id}) - {aiRubric.totalMaxScore} marks
                  </option>
                ))}
              </select>
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
                Leave blank to use the active default AI Rubric during essay scoring.
              </p>
              {errors.aiRubricId && <p className="text-xs text-red-500 font-bold">{errors.aiRubricId.message}</p>}
            </div>
          )}
          {/* Subject + Topic row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Subject<RequiredAsterisk /></label>
              <Controller
                name="subjectId"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value}
                    onChange={handleSubjectChange}
                    placeholder="Select subject..."
                    searchPlaceholder="Search subjects..."
                    options={subjects.map((subject) => ({
                      value: subject.id,
                      label: subject.name,
                    }))}
                    triggerClassName="bg-slate-50 dark:bg-slate-950"
                  />
                )}
              />
              {errors.subjectId && <p className="text-xs text-red-500 font-bold">{errors.subjectId.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Topic<RequiredAsterisk /></label>
              <Controller
                name="topicId"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={selectedSubjectId ? 'Select topic...' : 'Select subject first'}
                    searchPlaceholder="Search topics..."
                    disabled={!selectedSubjectId}
                    options={topics.map((topic) => ({
                      value: topic.id,
                      label: topic.name,
                    }))}
                    triggerClassName="bg-slate-50 dark:bg-slate-950"
                  />
                )}
              />
              {errors.topicId && <p className="text-xs text-red-500 font-bold">{errors.topicId.message}</p>}
            </div>
          </div>

          {/* Subtopics */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Subtopics <span className="text-slate-400 font-medium">(comma-separated)</span></label>
            <input
              {...register('subtopicsRaw')}
              placeholder="e.g. Algebra, Indices, Simplification"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 transition-all focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Linked Passage</label>
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">Optional for standalone questions</span>
            </div>

            <Controller
              name="passageId"
              control={control}
              render={({ field }) => (
                <div ref={passagePickerRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsPassagePickerOpen((prev) => !prev)}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left font-medium text-slate-900 transition-all hover:border-slate-300 focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <div className="min-w-0">
                      <p className={`truncate ${selectedPassage ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}`}>
                        {selectedPassageLabel}
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-slate-400 dark:text-slate-500">
                        {selectedPassage ? 'Passage linked to this question' : 'Choose a passage or leave this question standalone'}
                      </p>
                    </div>
                    <ChevronsUpDown size={16} className="ml-3 shrink-0 text-slate-400" />
                  </button>

                  {isPassagePickerOpen && (
                    <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
                      <div className="border-b border-slate-100 p-3 dark:border-slate-800">
                        <div className="relative">
                          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            value={passageSearch}
                            onChange={(e) => setPassageSearch(e.target.value)}
                            placeholder="Search passage by title, external ID, or content..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 font-medium text-slate-900 transition-all focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                          />
                        </div>
                      </div>

                      <div className="max-h-72 overflow-y-auto p-2">
                        <button
                          type="button"
                          onClick={() => {
                            field.onChange('');
                            setIsPassagePickerOpen(false);
                          }}
                          className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
                            {!field.value && <Check size={14} className="text-[#0A9AE2]" />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-900 dark:text-slate-100">No linked passage</p>
                            <p className="mt-0.5 text-xs font-medium text-slate-400 dark:text-slate-500">Keep this question standalone.</p>
                          </div>
                        </button>

                        {filteredPassages.length === 0 ? (
                          <div className="px-3 py-6 text-center text-sm font-medium text-slate-400 dark:text-slate-500">
                            No passages matched your search.
                          </div>
                        ) : (
                          filteredPassages.map((passage) => {
                            const isSelected = field.value === passage.id;
                            return (
                              <button
                                key={passage.id}
                                type="button"
                                onClick={() => {
                                  field.onChange(passage.id);
                                  setIsPassagePickerOpen(false);
                                }}
                                className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                              >
                                <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
                                  {isSelected && <Check size={14} className="text-[#0A9AE2]" />}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="truncate font-bold text-slate-900 dark:text-slate-100">{passage.title || 'Untitled Passage'}</p>
                                    {passage.externalId && (
                                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                        {passage.externalId}
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-1 line-clamp-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                                    {passage.content}
                                  </p>
                                  <p className="mt-1 text-[11px] font-bold text-slate-400 dark:text-slate-500">
                                    {passage._count.questions} linked question{passage._count.questions !== 1 ? 's' : ''}
                                  </p>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            />

            {selectedPassage ? (
              <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 dark:border-blue-500/20 dark:bg-blue-500/10">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-slate-100">{selectedPassage.title || 'Untitled Passage'}</span>
                  {selectedPassage.externalId && (
                    <span className="inline-flex rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                      {selectedPassage.externalId}
                    </span>
                  )}
                  <span className="inline-flex rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                    {selectedPassage._count.questions} Questions
                  </span>
                </div>
                <p className="mt-2 line-clamp-3 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
                  {selectedPassage.content}
                </p>
              </div>
            ) : (
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
                Questions without a selected passage will remain standalone.
              </p>
            )}
          </div>

          {/* Difficulty */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Difficulty<RequiredAsterisk /></label>
            <div className="flex gap-2">
              {(['EASY', 'MEDIUM', 'HARD'] as const).map(d => {
                const colors: Record<string, string> = {
                  EASY:   'bg-emerald-500 text-white shadow-emerald-100',
                  MEDIUM: 'bg-amber-500 text-white shadow-amber-100',
                  HARD:   'bg-red-500 text-white shadow-red-100',
                };
                return (
                  <Controller
                    key={d}
                    name="difficulty"
                    control={control}
                    render={({ field }) => (
                      <button
                        type="button"
                        onClick={() => field.onChange(d)}
                        className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                          field.value === d
                            ? `${colors[d]} shadow-lg dark:shadow-none`
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                        }`}
                      >
                        {DIFFICULTY_LABELS[d]}
                      </button>
                    )}
                  />
                );
              })}
            </div>
          </div>

          {/* Question Text */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Question Text<RequiredAsterisk /></label>
            <textarea
              {...register('questionText')}
              placeholder="Enter the question..."
              rows={4}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 transition-all focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 resize-none"
            />
            {errors.questionText && <p className="text-xs text-red-500 font-bold">{errors.questionText.message}</p>}
          </div>

          {/* latexEnabled toggle */}
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
            <Controller
              name="latexEnabled"
              control={control}
              render={({ field }) => (
                <input
                  type="checkbox"
                  id="latexEnabled"
                  checked={field.value}
                  onChange={e => field.onChange(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0A9AE2] focus:ring-[#0A9AE2] cursor-pointer"
                />
              )}
            />
            <label htmlFor="latexEnabled" className="flex flex-col gap-0.5 cursor-pointer">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Render as LaTeX format</span>
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                Question text and answer options will be rendered with KaTeX
              </span>
            </label>
          </div>

          {/* Live LaTeX preview for question text when latexEnabled is on */}
          {latexEnabled && watch('questionText') && (
            <div className="rounded-xl border border-purple-200 bg-purple-50/50 px-4 py-3 dark:border-purple-500/20 dark:bg-purple-500/5">
              <p className="text-xs font-bold text-purple-500 uppercase tracking-wide mb-2">LaTeX Preview</p>
              <div className="text-slate-900 dark:text-slate-100 overflow-x-auto">
                <LatexRenderer latex={watch('questionText')} displayMode />
              </div>
            </div>
          )}

          {/* Image Reference */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Image Ref</label>
            <input
              {...register('imageRef')}
              placeholder="file-name.png"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 transition-all focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          {/* Image URL */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Legacy Image URL(s)</label>
            <input
              {...register('imageUrl')}
              placeholder="https://... or q1-a.png | q1-b.png"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 transition-all focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
              Use `|` to separate multiple image URLs or required image filenames.
            </p>
          </div>

          {/* Time Limit */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Time Limit (seconds)<RequiredAsterisk /></label>
            <input
              {...register('timeLimitSeconds')}
              type="number"
              min={5}
              max={3600}
              placeholder="e.g. 60"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 transition-all focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
            {errors.timeLimitSeconds && <p className="text-xs text-red-500 font-bold">{errors.timeLimitSeconds.message}</p>}
          </div>

          {/* Question ID */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Question ID
              <span className="ml-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">(Auto-generated)</span>
            </label>
            <input
              {...register('questionId')}
              readOnly
              tabIndex={-1}
              placeholder="Select a subject first..."
              className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 font-mono font-bold text-slate-500 cursor-not-allowed select-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
            />
          </div>

          {/* MCQ options */}
          {selectedType === 'MCQ' && (
            <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Answer Options<RequiredAsterisk /></p>
              <div className="space-y-3">
                {(['A', 'B', 'C', 'D'] as const).map(key => (
                  <div key={key} className="flex items-center gap-3">
                    <Controller
                      name="correctAnswer"
                      control={control}
                      render={({ field }) => (
                        <button
                          type="button"
                          onClick={() => field.onChange(key)}
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold text-sm transition-all ${
                            field.value === key
                              ? 'bg-[#0A9AE2] text-white shadow-md shadow-blue-200 dark:shadow-none'
                              : 'bg-white border-2 border-slate-200 text-slate-500 hover:border-[#0A9AE2] dark:bg-slate-900 dark:border-slate-700'
                          }`}
                        >
                          {key}
                        </button>
                      )}
                    />
                    <input
                      {...register(`option${key}` as 'optionA' | 'optionB' | 'optionC' | 'optionD')}
                      placeholder={`Option ${key}...`}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-medium text-slate-900 transition-all focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                ))}
                {/* Option E — shown when filled or when correctAnswer is E */}
                <div className="flex items-center gap-3">
                  <Controller
                    name="correctAnswer"
                    control={control}
                    render={({ field }) => (
                      <button
                        type="button"
                        onClick={() => field.onChange('E')}
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold text-sm transition-all ${
                          field.value === 'E'
                            ? 'bg-[#0A9AE2] text-white shadow-md shadow-blue-200 dark:shadow-none'
                            : 'bg-white border-2 border-slate-200 text-slate-500 hover:border-[#0A9AE2] dark:bg-slate-900 dark:border-slate-700'
                        }`}
                      >
                        E
                      </button>
                    )}
                  />
                  <input
                    {...register('optionE')}
                    placeholder="Option E..."
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-medium text-slate-900 transition-all focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
              {(errors.optionA || errors.optionB || errors.optionC || errors.optionD || errors.optionE) && (
                <p className="text-xs text-red-500 font-bold">Options A–E are required</p>
              )}
              {errors.correctAnswer && (
                <p className="text-xs text-red-500 font-bold">{errors.correctAnswer.message}</p>
              )}
              <p className="text-xs text-slate-500">Click a letter to mark it as the correct answer.</p>
              {latexEnabled && (
                <div className="mt-1 space-y-2 rounded-xl border border-purple-100 bg-purple-50/50 p-3 dark:border-purple-500/20 dark:bg-purple-500/5">
                  <p className="text-xs font-bold text-purple-500 uppercase tracking-wide">Options LaTeX Preview</p>
                  {(['A', 'B', 'C', 'D', 'E'] as const).map(key => {
                    const text = watch(`option${key}` as 'optionA' | 'optionB' | 'optionC' | 'optionD' | 'optionE') ?? '';
                    if (!text.trim()) return null;
                    return (
                      <div key={key} className="flex items-start gap-2">
                        <span className="text-xs font-black text-purple-500 w-4 shrink-0 mt-1">{key}.</span>
                        <div className="text-slate-700 dark:text-slate-300 text-sm overflow-x-auto">
                          <LatexRenderer latex={text} displayMode={false} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Essay model answer */}
          {selectedType === 'ESSAY' && (
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Model Answer / AI Rubric <span className="text-slate-400 font-medium">(optional)</span>
              </label>
              <textarea
                {...register('essayAnswer')}
                placeholder="Enter model answer or grading AI Rubric..."
                rows={4}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 transition-all focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 resize-none"
              />
            </div>
          )}

          {/* Explanation */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Explanation</label>
            <textarea
              {...register('explanation')}
              placeholder="Explain why the correct answer is right..."
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 transition-all focus:border-[#0A9AE2] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 resize-none"
            />
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4 pb-8 sm:pb-4 border-t border-slate-100 dark:border-slate-800">
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
              className="flex-1 py-3.5 px-4 bg-[#0A9AE2] text-white font-bold rounded-xl shadow-lg shadow-blue-100 hover:bg-[#0864B6] disabled:opacity-60 transition-all flex items-center justify-center gap-2 dark:shadow-none"
            >
              {isLoading
                ? <Loader2 className="animate-spin" size={20} />
                : isEdit ? 'Save Changes' : 'Create Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
