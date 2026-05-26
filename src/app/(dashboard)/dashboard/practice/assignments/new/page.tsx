'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { isAxiosError } from 'axios';
import {
  ArrowLeft,
  ClipboardList,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  User,
  BookOpen,
  Plus,
  Layers,
} from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { practiceService } from '@/features/practice/services/practice.service';
import { adminService } from '@/features/admin/services/admin.service';
import type { UserItem } from '@/features/admin/services/admin.service';
import { questionsService } from '@/features/questions/services/questions.service';
import type { Question, QuestionDifficulty } from '@/features/questions/types/questions.types';
import { subjectsService } from '@/features/subjects/services/subjects.service';
import type { Subject, Topic } from '@/features/subjects/types/subjects.types';

type Step = 'student' | 'questions' | 'confirm';

const DIFFICULTY_COLORS: Record<QuestionDifficulty, string> = {
  EASY: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  HARD: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const ASSIGNMENT_ELIGIBLE_TIERS = new Set(['STANDARD', 'PREMIUM']);

const canReceiveAssignment = (student: UserItem) => ASSIGNMENT_ELIGIBLE_TIERS.has(student.tier);

export default function NewAssignmentPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [step, setStep] = useState<Step>('student');

  // ── Step 1: Student selection ──────────────────────────────────────────────
  const [studentSearch, setStudentSearch] = useState('');
  const [students, setStudents] = useState<UserItem[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<UserItem | null>(null);
  const studentSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Step 2: Question selection ─────────────────────────────────────────────
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [difficultyFilter, setDifficultyFilter] = useState<'ALL' | QuestionDifficulty>('ALL');
  const [questionSearch, setQuestionSearch] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionPage, setQuestionPage] = useState(1);
  const [questionTotalPages, setQuestionTotalPages] = useState(1);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role !== 'TUTOR' && user.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  // Load subjects once
  useEffect(() => {
    subjectsService
      .listSubjects({ limit: 100, publishedOnly: true, practiceOnly: true })
      .then((res) => {
        if (res.success) setSubjects(res.data);
      })
      .catch(() => {});
  }, []);

  // Load topics when subject changes
  useEffect(() => {
    if (!selectedSubjectId) { setTopics([]); setSelectedTopicId(''); return; }
    subjectsService
      .listTopics(selectedSubjectId, { limit: 100, publishedOnly: true, practiceOnly: true })
      .then((res) => {
        if (res.success) { setTopics(res.data); setSelectedTopicId(''); }
      })
      .catch(() => {});
  }, [selectedSubjectId]);

  // Student search with debounce
  useEffect(() => {
    if (studentSearchTimeout.current) clearTimeout(studentSearchTimeout.current);
    if (!studentSearch.trim()) { setStudents([]); return; }
    studentSearchTimeout.current = setTimeout(async () => {
      setIsLoadingStudents(true);
      try {
        const res = await adminService.listUsers({
          role: 'STUDENT',
          search: studentSearch.trim(),
          limit: 10,
          tiers: 'STANDARD,PREMIUM',
        });
        if (res.success) setStudents(res.data.filter(canReceiveAssignment));
      } catch {
        setStudents([]);
      } finally {
        setIsLoadingStudents(false);
      }
    }, 350);
  }, [studentSearch]);

  // Load questions
  const loadQuestions = useCallback(async () => {
    setIsLoadingQuestions(true);
    try {
      const res = await questionsService.list({
        page: questionPage,
        limit: 15,
        status: 'PUBLISHED',
        isPracticeAllowed: true,
        subjectId: selectedSubjectId || undefined,
        topicId: selectedTopicId || undefined,
        difficulty: difficultyFilter !== 'ALL' ? difficultyFilter : undefined,
        search: questionSearch.trim() || undefined,
      });
      if (res.success) {
        setQuestions(res.data);
        setQuestionTotalPages(res.meta.totalPages);
      }
    } finally {
      setIsLoadingQuestions(false);
    }
  }, [questionPage, selectedSubjectId, selectedTopicId, difficultyFilter, questionSearch]);

  useEffect(() => {
    if (step === 'questions') loadQuestions();
  }, [step, loadQuestions]);

  const toggleQuestion = (q: Question) => {
    setSelectedQuestions((prev) =>
      prev.find((x) => x.id === q.id)
        ? prev.filter((x) => x.id !== q.id)
        : [...prev, q]
    );
  };

  const handleSubmit = async () => {
    if (!selectedStudent || selectedQuestions.length === 0) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await practiceService.createAssignment({
        studentId: selectedStudent.id,
        questionIds: selectedQuestions.map((q) => q.id),
        topicId: selectedTopicId || undefined,
      });
      if (res.success) {
        setSuccessMsg(
          `Assignment created for ${res.data.studentName} — ${res.data.questionCount} questions`
        );
        setTimeout(() => router.push('/dashboard/practice/assignments'), 1600);
      }
    } catch (err) {
      setSubmitError(
        isAxiosError(err)
          ? err.response?.data?.message || 'Failed to create assignment'
          : 'An unexpected error occurred'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || (user.role !== 'TUTOR' && user.role !== 'ADMIN')) return null;

  return (
    <div className="w-full space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/dashboard/practice/assignments')}
            className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0A9AE2]/10 flex items-center justify-center">
              <ClipboardList size={20} className="text-[#0A9AE2]" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">New Assignment</h1>
              <p className="text-xs text-slate-400">Assign a curated practice set to a student</p>
            </div>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {(['student', 'questions', 'confirm'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (s === 'student') setStep('student');
                  if (s === 'questions' && selectedStudent) setStep('questions');
                  if (s === 'confirm' && selectedStudent && selectedQuestions.length > 0)
                    setStep('confirm');
                }}
                className={[
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
                  step === s
                    ? 'bg-[#0A9AE2] text-white'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500',
                ].join(' ')}
              >
                <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black">
                  {i + 1}
                </span>
                {s === 'student' ? 'Student' : s === 'questions' ? 'Questions' : 'Confirm'}
              </button>
              {i < 2 && <div className="w-6 h-px bg-slate-200 dark:bg-slate-700" />}
            </div>
          ))}
        </div>

        {/* ── STEP 1: STUDENT ── */}
        {step === 'student' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 space-y-4"
          >
            <h2 className="font-black text-slate-800 dark:text-slate-100">Select Student</h2>
            <div className="flex items-start gap-2.5 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-100">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-[#0A9AE2]" />
              <div className="min-w-0">
                <p className="font-bold">Assignments are for Standard and Premium students only.</p>
                <p className="mt-0.5 text-xs text-sky-700 dark:text-sky-300">
                  Basic students will not appear in this search.
                </p>
              </div>
            </div>

            {selectedStudent ? (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#0A9AE2]/5 border border-[#0A9AE2]/20">
                <div className="w-10 h-10 rounded-xl bg-[#0A9AE2]/10 flex items-center justify-center flex-shrink-0">
                  <User size={18} className="text-[#0A9AE2]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">
                    {selectedStudent.fullName}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{selectedStudent.email}</p>
                  <span className="mt-1 inline-flex w-fit rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20">
                    {selectedStudent.tier}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="w-7 h-7 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search student by name or email…"
                    className="w-full pl-9 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A9AE2]/30"
                  />
                </div>
                {isLoadingStudents && (
                  <div className="flex justify-center py-3">
                    <Loader2 size={20} className="animate-spin text-[#0A9AE2]" />
                  </div>
                )}
                {students.length > 0 && (
                  <div className="divide-y divide-slate-50 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                    {students.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSelectedStudent(s);
                          setStudentSearch('');
                          setStudents([]);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                          <User size={15} className="text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                            {s.fullName}
                          </p>
                          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                            <p className="text-xs text-slate-400 truncate">{s.email}</p>
                            <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-black text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20">
                              {s.tier}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {studentSearch.trim() && !isLoadingStudents && students.length === 0 && (
                  <p className="text-center text-sm text-slate-400 py-3">
                    No Standard or Premium students found
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setStep('questions')}
                disabled={!selectedStudent}
                className="px-6 py-2.5 rounded-2xl bg-[#0A9AE2] hover:bg-[#0659AA] text-white text-sm font-bold transition-colors disabled:opacity-40"
              >
                Next: Select Questions →
              </button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 2: QUESTIONS ── */}
        {step === 'questions' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Selected questions chip bar */}
            {selectedQuestions.length > 0 && (
              <div className="bg-[#0A9AE2]/5 border border-[#0A9AE2]/20 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#0A9AE2]">
                    {selectedQuestions.length} question{selectedQuestions.length !== 1 ? 's' : ''} selected
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedQuestions([])}
                    className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedQuestions.map((q) => (
                    <span
                      key={q.id}
                      className="flex items-center gap-1 text-xs font-medium bg-white dark:bg-slate-900 border border-[#0A9AE2]/30 text-slate-700 dark:text-slate-200 rounded-lg px-2 py-0.5"
                    >
                      {q.questionId ?? q.id.slice(0, 8)}
                      <button
                        type="button"
                        onClick={() => toggleQuestion(q)}
                        className="ml-0.5 text-slate-400 hover:text-red-500"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-4 space-y-3">
              <h2 className="font-black text-slate-800 dark:text-slate-100 text-sm">Filter Questions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* Subject dropdown */}
                <div>
                  <SearchableSelect
                    value={selectedSubjectId}
                    options={[
                      { value: '', label: 'All subjects' },
                      ...subjects.map((s) => ({ value: s.id, label: s.name })),
                    ]}
                    onChange={(value) => {
                      setSelectedSubjectId(value);
                      setSelectedTopicId('');
                      setQuestionPage(1);
                    }}
                    placeholder="All subjects"
                    searchPlaceholder="Search subjects..."
                    emptyText="No subjects found."
                    triggerClassName="px-3 py-2.5 text-xs shadow-none"
                    dropdownClassName="top-[calc(100%+0.25rem)] rounded-xl"
                  />
                </div>

                {/* Topic dropdown */}
                <div>
                  <SearchableSelect
                    value={selectedTopicId}
                    options={[
                      { value: '', label: 'All topics' },
                      ...topics.map((t) => ({ value: t.id, label: t.name })),
                    ]}
                    onChange={(value) => {
                      setSelectedTopicId(value);
                      setQuestionPage(1);
                    }}
                    placeholder="All topics"
                    searchPlaceholder="Search topics..."
                    emptyText="No topics found."
                    disabled={!selectedSubjectId}
                    triggerClassName="px-3 py-2.5 text-xs shadow-none"
                    dropdownClassName="top-[calc(100%+0.25rem)] rounded-xl"
                  />
                </div>

                {/* Difficulty dropdown */}
                <div>
                  <SearchableSelect
                    value={difficultyFilter}
                    options={[
                      { value: 'ALL', label: 'All difficulties' },
                      { value: 'EASY', label: 'Easy' },
                      { value: 'MEDIUM', label: 'Medium' },
                      { value: 'HARD', label: 'Hard' },
                    ]}
                    onChange={(value) => {
                      setDifficultyFilter(value as 'ALL' | QuestionDifficulty);
                      setQuestionPage(1);
                    }}
                    placeholder="All difficulties"
                    searchPlaceholder="Search difficulties..."
                    emptyText="No difficulties found."
                    triggerClassName="px-3 py-2.5 text-xs shadow-none"
                    dropdownClassName="top-[calc(100%+0.25rem)] rounded-xl"
                  />
                </div>
              </div>

              {/* Question text search */}
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={questionSearch}
                  onChange={(e) => { setQuestionSearch(e.target.value); setQuestionPage(1); }}
                  placeholder="Search question text…"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A9AE2]/30"
                />
              </div>
            </div>

            {/* Question list */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden">
              {isLoadingQuestions ? (
                <div className="flex justify-center py-12">
                  <Loader2 size={28} className="animate-spin text-[#0A9AE2]" />
                </div>
              ) : questions.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  No practice-eligible questions match the current filters
                </div>
              ) : (
                <div className="divide-y divide-slate-50 dark:divide-slate-800">
                  {questions.map((q) => {
                    const isSelected = !!selectedQuestions.find((x) => x.id === q.id);
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => toggleQuestion(q)}
                        className={[
                          'w-full flex items-start gap-3 px-5 py-4 text-left transition-colors',
                          isSelected
                            ? 'bg-[#0A9AE2]/5 dark:bg-[#0A9AE2]/10'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50',
                        ].join(' ')}
                      >
                        {/* Checkbox */}
                        <div
                          className={[
                            'w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors',
                            isSelected
                              ? 'bg-[#0A9AE2] border-[#0A9AE2]'
                              : 'border-slate-300 dark:border-slate-600',
                          ].join(' ')}
                        >
                          {isSelected && <CheckCircle2 size={12} className="text-white" />}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-800 dark:text-slate-100 line-clamp-2 text-left">
                            {q.questionText}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {q.questionId && (
                              <span className="text-[10px] font-mono text-slate-400">
                                #{q.questionId}
                              </span>
                            )}
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${DIFFICULTY_COLORS[q.difficulty]}`}>
                              {q.difficulty}
                            </span>
                            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                              {q.type}
                            </span>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400">
                              <BookOpen size={10} />
                              {q.topicName}
                            </div>
                          </div>
                        </div>

                        {/* Add/Remove indicator */}
                        <div className={`flex-shrink-0 text-xs font-bold transition-colors ${isSelected ? 'text-[#0A9AE2]' : 'text-slate-300 dark:text-slate-600'}`}>
                          {isSelected ? <X size={14} /> : <Plus size={14} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Question pagination */}
              {questionTotalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-slate-50 dark:border-slate-800">
                  <span className="text-xs text-slate-400">Page {questionPage} of {questionTotalPages}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={questionPage === 1}
                      onClick={() => setQuestionPage((p) => p - 1)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      disabled={questionPage === questionTotalPages}
                      onClick={() => setQuestionPage((p) => p + 1)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep('student')}
                className="px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep('confirm')}
                disabled={selectedQuestions.length === 0}
                className="px-6 py-2.5 rounded-2xl bg-[#0A9AE2] hover:bg-[#0659AA] text-white text-sm font-bold transition-colors disabled:opacity-40"
              >
                Next: Review →
              </button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 3: CONFIRM ── */}
        {step === 'confirm' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 space-y-5">
              <h2 className="font-black text-slate-800 dark:text-slate-100">Review Assignment</h2>

              {/* Summary cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4">
                  <p className="text-xs font-bold text-slate-400 mb-1 flex items-center gap-1">
                    <User size={11} /> Student
                  </p>
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">
                    {selectedStudent?.fullName}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{selectedStudent?.email}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4">
                  <p className="text-xs font-bold text-slate-400 mb-1 flex items-center gap-1">
                    <Layers size={11} /> Questions
                  </p>
                  <p className="font-black text-3xl text-[#0A9AE2]">{selectedQuestions.length}</p>
                  <p className="text-xs text-slate-400">Practice questions</p>
                </div>
              </div>

              {/* Difficulty breakdown */}
              {selectedQuestions.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-400 mb-2">Difficulty breakdown</p>
                  <div className="flex gap-2 flex-wrap">
                    {(['EASY', 'MEDIUM', 'HARD'] as QuestionDifficulty[]).map((d) => {
                      const count = selectedQuestions.filter((q) => q.difficulty === d).length;
                      if (count === 0) return null;
                      return (
                        <span
                          key={d}
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg ${DIFFICULTY_COLORS[d]}`}
                        >
                          {d.charAt(0) + d.slice(1).toLowerCase()}: {count}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Question list preview */}
              <div>
                <p className="text-xs font-bold text-slate-400 mb-2">Selected questions</p>
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {selectedQuestions.map((q, i) => (
                    <div
                      key={q.id}
                      className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800"
                    >
                      <span className="text-xs font-black text-slate-300 dark:text-slate-600 w-5 flex-shrink-0 mt-0.5">
                        {i + 1}.
                      </span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 flex-1">
                        {q.questionText}
                      </p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 ${DIFFICULTY_COLORS[q.difficulty]}`}>
                        {q.difficulty[0]}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 flex-shrink-0">
                        {q.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {submitError && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-900/20 p-3 text-sm font-bold text-red-600 dark:text-red-400">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  {submitError}
                </div>
              )}

              {successMsg && (
                <div className="flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-900/20 p-3 text-sm font-bold text-green-700 dark:text-green-400">
                  <CheckCircle2 size={16} className="flex-shrink-0" />
                  {successMsg}
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep('questions')}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !!successMsg}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#0A9AE2] hover:bg-[#0659AA] text-white text-sm font-bold transition-colors disabled:opacity-60"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ClipboardList size={16} />
                )}
                {isSubmitting ? 'Creating…' : 'Create Assignment'}
              </button>
            </div>
          </motion.div>
        )}
      </div>
  );
}
