"use client";

import { useEffect, useMemo, useState } from "react";
import { Brain, CheckCircle2, Layers3, Plus, RotateCcw, Sparkles, Trash2, type LucideIcon } from "lucide-react";
import { isAxiosError } from "axios";
import { FeaturePaywall } from "@/components/billing/FeaturePaywall";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { hasPremiumAccess } from "@/features/membership/access";
import { DeleteConfirmModal } from "@/features/subjects/components/DeleteConfirmModal";
import mdwClient from "@/lib/mdwClient";

type Rating = "again" | "hard" | "good" | "easy";

type Flashcard = {
  id: string;
  questionId: string | null;
  frontContent: string;
  backContent: string;
  source: "manual" | "question";
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

const statCards: Array<[string, keyof Stats, LucideIcon]> = [
  ["Due today", "due", Brain],
  ["Total cards", "total", Layers3],
  ["New cards", "newCards", Plus],
  ["Reviewed", "reviewed", CheckCircle2],
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
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const activeCard = dueCards[0] ?? null;

  const reviewProgress = useMemo(() => {
    if (stats.due === 0) return "No due cards";
    const remaining = dueCards.length;
    return `${remaining} card${remaining === 1 ? "" : "s"} left today`;
  }, [dueCards.length, stats.due]);

  async function loadData() {
    setError("");
    const [listRes, dueRes, statsRes] = await Promise.all([
      readJson<{ data: Flashcard[] }>("/api/flashcards?limit=50"),
      readJson<{ data: Flashcard[] }>("/api/flashcards/due"),
      readJson<{ data: Stats }>("/api/flashcards/stats"),
    ]);
    setCards(listRes.data);
    setDueCards(dueRes.data);
    setStats(statsRes.data);
  }

  useEffect(() => {
    if (!user) return;
    if (user?.role === "STUDENT" && !hasPremiumAccess(user)) {
      return;
    }

    const timer = window.setTimeout(() => {
      loadData()
        .catch((err) => setError(getVisibleError(err, "Failed to load flashcards")))
        .finally(() => setIsLoading(false));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [user]);

  async function handleSaveCard() {
    setError("");
    setMessage("");
    try {
      if (editingId) {
        await readJson(`/api/flashcards/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ frontContent, backContent }),
        });
        setMessage("Flashcard updated.");
      } else {
        await readJson("/api/flashcards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ frontContent, backContent }),
        });
        setMessage("Flashcard created.");
      }
      setFrontContent("");
      setBackContent("");
      setEditingId(null);
      await loadData();
    } catch (err) {
      setError(getVisibleError(err, "Failed to save flashcard"));
    }
  }

  async function handleReview(rating: Rating) {
    if (!activeCard) return;
    setError("");
    setMessage("");
    try {
      await readJson(`/api/flashcards/${activeCard.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });
      setIsFlipped(false);
      setMessage("Review saved.");
      await loadData();
    } catch (err) {
      setError(getVisibleError(err, "Failed to save review"));
    }
  }

  async function handleGenerate() {
    setError("");
    setMessage("");
    try {
      const res = await readJson<{ data: { created: number; skipped: number } }>("/api/flashcards/generate-from-mistakes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 50 }),
      });
      setMessage(`Generated ${res.data.created} card${res.data.created === 1 ? "" : "s"} from mistakes.`);
      await loadData();
    } catch (err) {
      setError(getVisibleError(err, "Failed to generate flashcards"));
    }
  }

  async function onConfirmDelete() {
    if (!deletingId) return;
    setIsDeleting(true);
    setError("");
    setMessage("");
    try {
      await readJson(`/api/flashcards/${deletingId}`, { method: "DELETE" });
      setMessage("Flashcard deleted.");
      await loadData();
    } catch (err) {
      setError(getVisibleError(err, "Failed to delete flashcard"));
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

  if (user?.role === "STUDENT" && !hasPremiumAccess(user)) {
    return (
      <FeaturePaywall
        title="Flash Cards are for Premium students"
        description="Upgrade to Premium to unlock SM-2 review, and cards generated from your mistakes."
      />
    );
  }

  return (
    <div className="w-full max-w-6xl space-y-8">
      <header className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900 lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#0A9AE2]">Active Recall</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">Anki-style flashcard review</h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400 sm:text-base">
              Review due cards daily with SM-2 spaced repetition, then generate new cards from questions you missed.
            </p>
          </div>
          <button onClick={handleGenerate} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0A9AE2] px-5 py-3 text-sm font-black text-white transition-transform hover:scale-[1.02] active:scale-[0.98]">
            <Sparkles size={18} /> Generate from mistakes
          </button>
        </div>
      </header>

      {(message || error) && (
        <div className={`rounded-2xl border px-4 py-3 text-sm font-bold ${error ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300" : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"}`}>
          {error || message}
        </div>
      )}

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map(([label, statKey, Icon]) => (
          <div key={label} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{label}</p>
              <Icon className="text-[#0A9AE2]" size={20} />
            </div>
            <p className="mt-3 text-3xl font-black text-slate-900 dark:text-slate-100">{stats[statKey]}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Daily Review</h2>
              <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">{reviewProgress}</p>
            </div>
            <button onClick={() => setIsFlipped(false)} className="rounded-xl border border-slate-200 p-3 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              <RotateCcw size={18} />
            </button>
          </div>

          <div className="mt-6 min-h-80 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950">
            {isLoading ? (
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Loading review queue...</p>
            ) : activeCard ? (
              <button onClick={() => setIsFlipped((value) => !value)} className="flex min-h-64 w-full flex-col items-center justify-center whitespace-pre-wrap rounded-[1.5rem] bg-white p-8 text-center text-lg font-black leading-relaxed text-slate-900 shadow-sm transition hover:scale-[1.01] dark:bg-slate-900 dark:text-slate-100">
                {isFlipped ? activeCard.backContent : activeCard.frontContent}
                <span className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{isFlipped ? "Back" : "Tap to reveal answer"}</span>
              </button>
            ) : (
              <div className="flex min-h-64 flex-col items-center justify-center text-center">
                <CheckCircle2 className="text-emerald-500" size={42} />
                <h3 className="mt-4 text-xl font-black text-slate-900 dark:text-slate-100">All done for today</h3>
                <p className="mt-2 max-w-sm text-sm font-medium text-slate-500 dark:text-slate-400">Your SM-2 queue is clear. New cards will appear when their next review date arrives.</p>
              </div>
            )}
          </div>

          {activeCard && isFlipped && (
            <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                ["again", "Again", "bg-red-500"],
                ["hard", "Hard", "bg-amber-500"],
                ["good", "Good", "bg-[#0A9AE2]"],
                ["easy", "Easy", "bg-emerald-500"],
              ].map(([rating, label, color]) => (
                <button key={rating} onClick={() => handleReview(rating as Rating)} className={`${color} rounded-2xl px-4 py-3 text-sm font-black text-white transition-transform hover:scale-[1.02] active:scale-[0.98]`}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">{editingId ? "Edit card" : "Create manual card"}</h2>
          <textarea value={frontContent} onChange={(event) => setFrontContent(event.target.value)} placeholder="Front side / question" className="mt-5 min-h-32 w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-900 outline-none focus:border-[#0A9AE2] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
          <textarea value={backContent} onChange={(event) => setBackContent(event.target.value)} placeholder="Back side / answer" className="mt-3 min-h-32 w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-900 outline-none focus:border-[#0A9AE2] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
          <div className="mt-4 flex gap-3">
            <button disabled={!frontContent.trim() || !backContent.trim()} onClick={handleSaveCard} className="flex-1 rounded-2xl bg-[#0A9AE2] px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">
              {editingId ? "Save changes" : "Add card"}
            </button>
            {editingId && (
              <button onClick={() => { setEditingId(null); setFrontContent(""); setBackContent(""); }} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-600 dark:border-slate-700 dark:text-slate-300">
                Cancel
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Card Library</h2>
        <div className="mt-5 space-y-3">
          {cards.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 p-5 text-sm font-bold text-slate-500 dark:bg-slate-950 dark:text-slate-400">No flashcards yet. Create one manually or generate from mistakes.</p>
          ) : (
            cards.map((card) => (
              <div key={card.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-black uppercase text-[#0A9AE2] dark:bg-sky-500/10 dark:text-sky-300">{card.source}</span>
                      <span className="text-xs font-bold text-slate-400">EF {card.review.easeFactor.toFixed(2)} · {card.review.intervalDays}d · {card.review.repetitions} reps</span>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm font-black text-slate-900 dark:text-slate-100">{card.frontContent}</p>
                    <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-sm font-medium text-slate-500 dark:text-slate-400">{card.backContent}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(card)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Edit</button>
                    <button onClick={() => setDeletingId(card.id)} className="rounded-xl border border-red-200 px-3 py-2 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
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
