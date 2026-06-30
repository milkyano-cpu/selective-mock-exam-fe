"use client";

import { useEffect, useState } from "react";
import { Brain, CheckCircle2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Layers3, Loader2, Pencil, Plus, Sparkles, Trash2, type LucideIcon } from "lucide-react";
import { isAxiosError } from "axios";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { DeleteConfirmModal } from "@/features/subjects/components/DeleteConfirmModal";
import { QuestionLatexRenderer } from "@/components/ui/QuestionLatexRenderer";
import { showClientErrorAlert, showClientSuccessToast } from "@/lib/errorAlert";
import mdwClient from "@/lib/mdwClient";

type Rating = "again" | "hard" | "good" | "easy";

type Flashcard = {
  id: string;
  questionId: string | null;
  frontContent: string;
  backContent: string;
  source: "manual" | "question";
  latexEnabled?: boolean;
  createdAt: string;
  review: {
    easeFactor: number;
    intervalDays: number;
    repetitions: number;
    nextReviewDate: string;
    isDue: boolean;
  };
};

type Stats = {
  total: number;
  due: number;
  newCards: number;
  reviewed: number;
};

const emptyStats: Stats = { total: 0, due: 0, newCards: 0, reviewed: 0 };

type SessionSummary = Record<Rating, number>;

const emptySessionSummary: SessionSummary = { again: 0, hard: 0, good: 0, easy: 0 };

const PAGE_SIZE = 10;

type ListMeta = { total: number; totalPages: number };

// Question content is authored in LaTeX, so a card can contain math ($...$,
// \(...\)) or text commands (\textbf{}, \frac{}, \begin{}) even when the
// source question's latexEnabled flag was never set. Detecting the markup
// directly means such cards render formatted instead of showing raw source.
const LATEX_MARKUP = /\$[^$\n]+\$|\$\$[\s\S]+?\$\$|\\[([]|\\[a-zA-Z]+\{/;

function shouldRenderLatex(card: Flashcard, text: string): boolean {
  return (card.latexEnabled ?? false) || LATEX_MARKUP.test(text);
}

// Sliding window of up to 5 page numbers centred on the current page.
function getPageWindow(current: number, total: number): number[] {
  const start = Math.max(1, Math.min(current - 2, total - 4));
  const end = Math.min(total, start + 4);
  const pages: number[] = [];
  for (let i = start; i <= end; i += 1) pages.push(i);
  return pages;
}

const statCards: Array<[string, keyof Stats, LucideIcon]> = [
  ["Due today", "due", Brain],
  ["Total cards", "total", Layers3],
  ["New cards", "newCards", Plus],
  ["Reviewed", "reviewed", CheckCircle2],
];

const ratingButtons: Array<{ rating: Rating; label: string; hint: string; className: string }> = [
  { rating: "again", label: "Again", hint: "+1 min", className: "border-red-300 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400" },
  { rating: "hard", label: "Hard", hint: "+1 day", className: "border-amber-300 bg-amber-50 text-amber-600 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400" },
  { rating: "good", label: "Good", hint: "+3 days", className: "border-[#0A9AE2]/40 bg-blue-50 text-[#0A9AE2] dark:border-[#0A9AE2]/30 dark:bg-blue-950/40" },
  { rating: "easy", label: "Easy", hint: "+7 days", className: "border-green-300 bg-green-50 text-green-600 dark:border-green-900 dark:bg-green-950/40 dark:text-green-400" },
];

const summaryChips: Array<{ rating: Rating; label: string; className: string }> = [
  { rating: "again", label: "Again", className: "border-red-200 text-red-600 dark:border-red-900 dark:text-red-400" },
  { rating: "hard", label: "Hard", className: "border-amber-200 text-amber-600 dark:border-amber-900 dark:text-amber-400" },
  { rating: "good", label: "Good", className: "border-blue-200 text-[#0A9AE2] dark:border-blue-900" },
  { rating: "easy", label: "Easy", className: "border-green-200 text-green-600 dark:border-green-900 dark:text-green-400" },
];

async function readJson<T>(url: string, init?: RequestInit) {
  const response = await mdwClient.request<T & { success?: boolean; message?: string }>({
    url: url.startsWith("/api/") ? url.slice(4) : url,
    method: init?.method ?? "GET",
    headers: init?.headers ? Object.fromEntries(new Headers(init.headers).entries()) : undefined,
    data: init?.body,
  });
  const data = response.data;
  if (data.success === false) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

function getVisibleError(error: unknown, fallback: string): string {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export default function FlashcardsPage() {
  const user = useAuthStore((s) => s.user);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [frontContent, setFrontContent] = useState("");
  const [backContent, setBackContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<ListMeta>({ total: 0, totalPages: 1 });
  const [sessionSummary, setSessionSummary] = useState<SessionSummary>(emptySessionSummary);
  const [sessionActive, setSessionActive] = useState(false);

  const activeCard = dueCards[0] ?? null;
  const totalReviewed = sessionSummary.again + sessionSummary.hard + sessionSummary.good + sessionSummary.easy;

  async function loadList(targetPage: number) {
    const res = await readJson<{ data: Flashcard[]; meta: ListMeta }>(
      `/api/flashcards?page=${targetPage}&limit=${PAGE_SIZE}`
    );
    // After deletions the last page can become empty — step back to a real page.
    if (res.data.length === 0 && targetPage > 1) {
      await loadList(targetPage - 1);
      return;
    }
    setCards(res.data);
    setMeta({ total: res.meta.total, totalPages: Math.max(1, res.meta.totalPages) });
    setPage(targetPage);
  }

  async function loadData() {
    const [, dueRes, statsRes] = await Promise.all([
      loadList(page),
      readJson<{ data: Flashcard[] }>("/api/flashcards/due"),
      readJson<{ data: Stats }>("/api/flashcards/stats"),
    ]);
    setDueCards(dueRes.data);
    setStats(statsRes.data);
  }

  function goToPage(target: number) {
    if (target < 1 || target > meta.totalPages || target === page) return;
    loadList(target).catch((err) => void showClientErrorAlert(getVisibleError(err, "Failed to load flashcards"), "Couldn't load flashcards"));
  }

  useEffect(() => {
    if (!user) return;

    const timer = window.setTimeout(() => {
      // A fresh page load starts a fresh review session.
      setSessionSummary(emptySessionSummary);
      setSessionActive(false);
      loadData()
        .catch((err) => void showClientErrorAlert(getVisibleError(err, "Failed to load flashcards"), "Couldn't load flashcards"))
        .finally(() => setIsLoading(false));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [user]);

  async function handleSaveCard() {
    const wasEditing = Boolean(editingId);
    try {
      if (editingId) {
        await readJson(`/api/flashcards/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ frontContent, backContent }),
        });
      } else {
        await readJson("/api/flashcards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ frontContent, backContent }),
        });
      }
      setFrontContent("");
      setBackContent("");
      setEditingId(null);
      await loadData();
      void showClientSuccessToast(
        wasEditing ? "Your changes have been saved." : "Your new card is ready to review.",
        wasEditing ? "Flashcard updated" : "Flashcard created",
      );
    } catch (err) {
      void showClientErrorAlert(getVisibleError(err, "Failed to save flashcard"), "Couldn't save flashcard");
    }
  }

  async function handleReview(rating: Rating) {
    if (!activeCard) return;
    try {
      await readJson(`/api/flashcards/${activeCard.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });
      setSessionActive(true);
      setSessionSummary((prev) => ({ ...prev, [rating]: prev[rating] + 1 }));
      setIsFlipped(false);
      await loadData();
    } catch (err) {
      void showClientErrorAlert(getVisibleError(err, "Failed to save review"), "Couldn't save review");
    }
  }

  async function handleGenerate() {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const res = await readJson<{ data: { created: number; skipped: number } }>("/api/flashcards/generate-from-mistakes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 50 }),
      });
      await loadData();
      void showClientSuccessToast(
        res.data.created > 0
          ? `Added ${res.data.created} new card${res.data.created === 1 ? "" : "s"} from questions you missed.`
          : "No new cards to add — your recent mistakes are already in the deck.",
        "Generate from mistakes",
      );
    } catch (err) {
      void showClientErrorAlert(getVisibleError(err, "Failed to generate flashcards"), "Couldn't generate flashcards");
    } finally {
      setIsGenerating(false);
    }
  }

  async function onConfirmDelete() {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await readJson(`/api/flashcards/${deletingId}`, { method: "DELETE" });
      await loadData();
      void showClientSuccessToast("The flashcard has been removed.", "Flashcard deleted");
    } catch (err) {
      void showClientErrorAlert(getVisibleError(err, "Failed to delete flashcard"), "Couldn't delete flashcard");
    } finally {
      setDeletingId(null);
      setIsDeleting(false);
    }
  }

  function startEdit(card: Flashcard) {
    setEditingId(card.id);
    setFrontContent(card.frontContent);
    setBackContent(card.backContent);
  }

  return (
    <div className="w-full max-w-6xl space-y-6">
      <header className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900 lg:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#0A9AE2]">Active Recall</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">Anki-style flashcard review</h1>
            <p className="mt-2 max-w-xl text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
              Review due cards daily with SM-2 spaced repetition, then generate new cards from questions you missed.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#0A9AE2] px-5 py-3 text-sm font-black text-white transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
          >
            {isGenerating ? <Loader2 size={16} strokeWidth={2.5} className="animate-spin" /> : <Sparkles size={16} strokeWidth={2.5} />}
            {isGenerating ? "Generating…" : "Generate from mistakes"}
          </button>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map(([label, statKey, Icon]) => (
          <div key={label} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{label}</p>
              <Icon className="text-[#0A9AE2]" size={20} />
            </div>
            {isLoading ? (
              <div className="mt-3 h-9 w-12 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
            ) : (
              <p className="mt-3 text-3xl font-black text-slate-900 dark:text-slate-100">{stats[statKey]}</p>
            )}
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Daily Review</p>
            {!isLoading && (
              activeCard ? (
                /* stats.due is the real backlog — dueCards is capped by the
                   /flashcards/due fetch limit, so its length can stay flat. */
                <span className="rounded-full bg-[#0A9AE2]/10 px-2.5 py-0.5 text-xs font-black text-[#0A9AE2]">
                  {Math.max(stats.due, 1)} card{Math.max(stats.due, 1) === 1 ? "" : "s"} left today
                </span>
              ) : (
                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-black text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Done for today
                </span>
              )
            )}
          </div>

          {isLoading ? (
            <div className="flex h-44 w-full animate-pulse flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">
              <div className="h-4 w-3/4 rounded-lg bg-slate-100 dark:bg-slate-700" />
              <div className="mt-3 h-4 w-1/2 rounded-lg bg-slate-100 dark:bg-slate-700" />
            </div>
          ) : activeCard ? (
            <>
              {/* Flip card */}
              <div className="h-44 w-full cursor-pointer" style={{ perspective: "1000px" }} onClick={() => setIsFlipped((value) => !value)}>
                <div
                  className="relative h-full w-full transition-transform duration-500 ease-in-out"
                  style={{ transformStyle: "preserve-3d", transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
                >
                  {/* Front */}
                  <div
                    className="absolute inset-0 overflow-y-auto rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800"
                    style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                  >
                    <div className="flex min-h-full flex-col items-center justify-center text-center">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Question</p>
                      <div className="mt-3 whitespace-pre-wrap text-base font-bold leading-snug text-slate-800 dark:text-slate-200">
                        <QuestionLatexRenderer text={activeCard.frontContent} latexEnabled={shouldRenderLatex(activeCard, activeCard.frontContent)} />
                      </div>
                      <p className="mt-4 text-xs font-medium text-slate-400">Tap to reveal answer</p>
                    </div>
                  </div>
                  {/* Back */}
                  <div
                    className="absolute inset-0 overflow-y-auto rounded-3xl border-2 border-[#0A9AE2] bg-blue-50 p-5 dark:border-[#0A9AE2]/50 dark:bg-blue-950/30"
                    style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                  >
                    <div className="flex min-h-full flex-col items-start justify-center">
                      <p className="text-xs font-bold uppercase tracking-widest text-[#0A9AE2]">Answer</p>
                      <div className="mt-2 whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300">
                        <QuestionLatexRenderer text={activeCard.backContent} latexEnabled={shouldRenderLatex(activeCard, activeCard.backContent)} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rating buttons */}
              <div className={`mt-4 grid grid-cols-4 gap-2 ${isFlipped ? "" : "opacity-40"}`}>
                {ratingButtons.map(({ rating, label, className }) => (
                  <button
                    key={rating}
                    disabled={!isFlipped}
                    onClick={() => handleReview(rating)}
                    className={`rounded-xl border-2 py-2.5 text-xs font-black transition-transform ${className} ${isFlipped ? "hover:scale-[1.03] active:scale-[0.97]" : "cursor-default"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {isFlipped ? (
                <div className="mt-2 grid grid-cols-4 gap-2 text-center">
                  {ratingButtons.map(({ rating, hint }) => (
                    <p key={rating} className="text-[10px] font-medium text-slate-400">{hint}</p>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-center text-[10px] font-medium text-slate-400">Tap card to reveal answer first</p>
              )}
            </>
          ) : (
            <>
              {sessionActive && totalReviewed > 0 && (
                <div className="rounded-3xl border border-green-200 bg-green-50 p-5 dark:border-green-900/40 dark:bg-green-950/20">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} className="shrink-0 text-green-600" strokeWidth={2.5} />
                    <p className="text-sm font-black text-green-800 dark:text-green-300">
                      Session complete! You reviewed {totalReviewed} card{totalReviewed === 1 ? "" : "s"}.
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {summaryChips.map(({ rating, label, className }) => (
                      <span key={rating} className={`rounded-full border bg-white px-3 py-1 text-xs font-black dark:bg-slate-900 ${className}`}>
                        {label}: {sessionSummary[rating]}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className={`flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 py-6 text-center dark:border-slate-700 ${sessionActive && totalReviewed > 0 ? "mt-4" : ""}`}>
                <Brain size={28} className="text-slate-400" strokeWidth={1.5} />
                <p className="mt-2 text-sm font-black text-slate-500 dark:text-slate-400">All done for today</p>
                <p className="mt-1 text-xs font-medium text-slate-400">Come back tomorrow for your next review</p>
              </div>
            </>
          )}
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{editingId ? "Edit Card" : "Add Card Manually"}</p>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Front (question)</label>
              <textarea
                rows={3}
                value={frontContent}
                onChange={(event) => setFrontContent(event.target.value)}
                placeholder="e.g. What is the difference between an inference and an observation?"
                className="mt-1 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-[#0A9AE2] focus:ring-2 focus:ring-[#0A9AE2]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Back (answer)</label>
              <textarea
                rows={3}
                value={backContent}
                onChange={(event) => setBackContent(event.target.value)}
                placeholder="e.g. An observation is directly seen/measured. An inference is a conclusion drawn from evidence."
                className="mt-1 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-[#0A9AE2] focus:ring-2 focus:ring-[#0A9AE2]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
            <div className="flex gap-2">
              <button
                disabled={!frontContent.trim() || !backContent.trim()}
                onClick={handleSaveCard}
                className="flex-1 rounded-2xl bg-[#FF6900] px-4 py-2.5 text-sm font-black text-white transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {editingId ? "Save Changes" : "Save Card"}
              </button>
              <button
                onClick={() => { setEditingId(null); setFrontContent(""); setBackContent(""); }}
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Card Library{" "}
          {!isLoading && <span className="font-normal text-slate-400">({meta.total} card{meta.total === 1 ? "" : "s"})</span>}
        </p>
        <div className="mt-4 space-y-2">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-700">
                <div className="h-4 w-20 rounded-full bg-slate-100 dark:bg-slate-800" />
                <div className="mt-3 h-4 w-3/4 rounded-lg bg-slate-100 dark:bg-slate-800" />
                <div className="mt-2 h-3 w-1/2 rounded-lg bg-slate-100 dark:bg-slate-800" />
              </div>
            ))
          ) : cards.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 p-5 text-sm font-bold text-slate-500 dark:bg-slate-950 dark:text-slate-400">No flashcards yet. Create one manually or generate from mistakes.</p>
          ) : (
            cards.map((card) => (
              <div
                key={card.id}
                className={`flex items-start justify-between gap-4 rounded-2xl border px-4 py-3 ${
                  card.review.isDue
                    ? "border-amber-200 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-950/10"
                    : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/50"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {card.source === "question" ? (
                      <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">From mistakes</span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-600 dark:bg-slate-700 dark:text-slate-400">Manual</span>
                    )}
                    {card.review.isDue && (
                      <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Due now</span>
                    )}
                  </div>
                  <div className="mt-1.5 line-clamp-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                    <QuestionLatexRenderer text={card.frontContent} latexEnabled={shouldRenderLatex(card, card.frontContent)} />
                  </div>
                  <div className="mt-0.5 line-clamp-1 text-xs text-slate-400">
                    <QuestionLatexRenderer text={card.backContent} latexEnabled={shouldRenderLatex(card, card.backContent)} />
                  </div>
                  <div className="mt-1.5 flex gap-3 text-[10px] font-medium text-slate-400">
                    <span>EF: {card.review.easeFactor.toFixed(2)}</span>
                    <span>Interval: {card.review.intervalDays}d</span>
                    <span>Reps: {card.review.repetitions}</span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => startEdit(card)}
                    aria-label="Edit flashcard"
                    className="rounded-xl border border-slate-200 p-1.5 text-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeletingId(card.id)}
                    aria-label="Delete flashcard"
                    className="rounded-xl border border-slate-200 p-1.5 text-red-400 hover:bg-red-50 dark:border-slate-700 dark:hover:bg-red-950/30"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {!isLoading && meta.total > 0 && (
          <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-5 dark:border-slate-800 sm:flex-row">
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
              Showing {(page - 1) * PAGE_SIZE + 1}–{(page - 1) * PAGE_SIZE + cards.length} of {meta.total}
            </p>
            {meta.totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => goToPage(1)}
                  disabled={page <= 1}
                  aria-label="First page"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <ChevronsLeft size={16} />
                </button>
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  aria-label="Previous page"
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <ChevronLeft size={16} /> Prev
                </button>
                {getPageWindow(page, meta.totalPages).map((p) => (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    aria-current={p === page ? "page" : undefined}
                    className={`min-w-9 rounded-xl px-3 py-2 text-sm font-black transition ${
                      p === page
                        ? "bg-[#0A9AE2] text-white"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= meta.totalPages}
                  aria-label="Next page"
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Next <ChevronRight size={16} />
                </button>
                <button
                  onClick={() => goToPage(meta.totalPages)}
                  disabled={page >= meta.totalPages}
                  aria-label="Last page"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <ChevronsRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      <DeleteConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={onConfirmDelete}
        title="Delete Flashcard"
        message="Are you sure you want to delete this flashcard? This action cannot be undone."
        isLoading={isDeleting}
      />
    </div>
  );
}
