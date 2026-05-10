'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, ChevronRight, Clock, Plus, Trash2 } from 'lucide-react';
import { BannerCarousel } from '@/components/dashboard/BannerCarousel';
import { countdownService } from '@/features/countdowns/services/countdown.service';
import type { CountdownItem } from '@/features/countdowns/types/countdowns.types';

export function StudentUtilityRail() {
  const [activeCountdown, setActiveCountdown] = useState<CountdownItem | null>(null);
  const [isCountdownLoading, setIsCountdownLoading] = useState(false);
  const [countdownNowMs, setCountdownNowMs] = useState(() => Date.now());

  useEffect(() => {
    let isCancelled = false;

    const loadActiveCountdown = async () => {
      setIsCountdownLoading(true);

      try {
        const response = await countdownService.getActive();
        if (!isCancelled && response.success) {
          setActiveCountdown(response.data);
        }
      } catch {
        if (!isCancelled) {
          setActiveCountdown(null);
        }
      } finally {
        if (!isCancelled) {
          setIsCountdownLoading(false);
        }
      }
    };

    void loadActiveCountdown();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!activeCountdown) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setCountdownNowMs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeCountdown]);

  const hasLiveCountdown = activeCountdown
    ? new Date(activeCountdown.targetAt).getTime() > countdownNowMs
    : false;
  const countdownItems = getCountdownItems(hasLiveCountdown ? activeCountdown?.targetAt ?? null : null, countdownNowMs);
  const countdownHeading = isCountdownLoading
    ? 'Loading active countdown...'
    : hasLiveCountdown && activeCountdown
      ? activeCountdown.title
      : 'No active exam countdown right now.';
  const countdownMetaLabel = hasLiveCountdown && activeCountdown
    ? formatCountdownDateTime(activeCountdown.targetAt)
    : isCountdownLoading
      ? 'Loading schedule'
      : 'Waiting for admin activation';
  const countdownStatusLabel = hasLiveCountdown
    ? 'Active'
    : isCountdownLoading
      ? 'Loading'
      : 'Unavailable';

  return (
    <aside className="min-w-0 space-y-4 overflow-visible pb-3 pr-3">
      <div className="relative min-w-0 overflow-hidden rounded-[2rem] shadow-[0_18px_50px_rgba(14,116,144,0.12)]">
        <div className="relative overflow-hidden bg-[linear-gradient(135deg,#ecfeff_0%,#eef2ff_48%,#fff7ed_100%)] dark:bg-[linear-gradient(135deg,#082f49_0%,#1e1b4b_52%,#2a1208_100%)]">
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
            <p className="max-w-xs text-sm font-black text-slate-400 dark:text-slate-500">
              Banner campaign will appear here
            </p>
          </div>
          <div className="relative z-10">
            <BannerCarousel reserveSpace />
          </div>
        </div>
      </div>

      <CountdownReminderCard
        countdownItems={countdownItems}
        heading={countdownHeading}
        metaLabel={countdownMetaLabel}
        statusLabel={countdownStatusLabel}
        hasLiveCountdown={hasLiveCountdown}
        isLoading={isCountdownLoading}
      />
      <ReminderCalendar />
    </aside>
  );
}

function CountdownReminderCard({
  countdownItems,
  heading,
  metaLabel,
  statusLabel,
  hasLiveCountdown,
  isLoading,
}: {
  countdownItems: { label: string; value: string }[];
  heading: string;
  metaLabel: string;
  statusLabel: string;
  hasLiveCountdown: boolean;
  isLoading: boolean;
}) {
  return (
    <section className="relative min-w-0 overflow-hidden rounded-[1.35rem] border-[3px] border-slate-950 bg-[#FFF8E7] shadow-[8px_8px_0_#0f172a] dark:border-white dark:bg-slate-950 dark:shadow-[8px_8px_0_#38bdf8]">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full border-[3px] border-slate-950 bg-[#FF6900] dark:border-white" />
      <div className="absolute -bottom-10 left-10 h-20 w-20 rotate-12 border-[3px] border-slate-950 bg-[#50c9c3] dark:border-white" />
      <div className="relative border-b-[3px] border-slate-950 bg-[#FDE047] px-5 py-4 text-slate-950 dark:border-white">
        <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(#0f172a_1px,transparent_1px)] [background-size:10px_10px]" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="h-3 w-3 rounded-full border-2 border-slate-950 bg-[#22C55E]" />
              <p className="text-[10px] font-black uppercase tracking-[0.24em]">Exam countdown</p>
            </div>
            <h2 className="line-clamp-2 text-lg font-black leading-tight">
              {isLoading ? 'Loading countdown...' : hasLiveCountdown ? heading : 'No active countdown yet'}
            </h2>
            <p className="mt-2 inline-flex max-w-full rounded-full border-2 border-slate-950 bg-white px-3 py-1 text-xs font-black shadow-[3px_3px_0_#0f172a]">
              <span className="truncate">{metaLabel}</span>
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <span className={[
              'rounded-full border-2 border-slate-950 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide shadow-[3px_3px_0_#0f172a]',
              hasLiveCountdown
                ? 'bg-[#22C55E] text-slate-950'
                : 'bg-white text-slate-950',
            ].join(' ')}>
              {statusLabel}
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-slate-950 bg-[#0A9AE2] text-white shadow-[3px_3px_0_#0f172a]">
              <Clock size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="relative p-4">
        <div className="grid grid-cols-4 gap-2">
          {countdownItems.map((item) => (
            <div
              key={item.label}
              className="relative overflow-hidden rounded-xl border-[3px] border-slate-950 bg-white px-2 py-3 text-center shadow-[4px_4px_0_#0f172a] transition-transform hover:-translate-y-0.5 dark:border-white dark:bg-slate-900 dark:shadow-[4px_4px_0_#38bdf8]"
            >
              <div className="absolute inset-x-0 top-0 h-2 bg-[#0A9AE2]" />
              <p className="mt-1 text-2xl font-black leading-none text-slate-950 dark:text-white">{item.value}</p>
              <p className="mt-1 truncate text-[9px] font-black uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border-[3px] border-slate-950 bg-white shadow-[4px_4px_0_#0f172a] dark:border-white dark:bg-slate-900 dark:shadow-[4px_4px_0_#38bdf8]">
          <div className="h-2 bg-[linear-gradient(90deg,#0A9AE2_0%,#FF6900_45%,#22C55E_100%)]" />
          <div className="flex items-center justify-between gap-3 px-3 py-3">
            <div className="min-w-0">
              <p className="truncate text-[10px] font-black uppercase tracking-[0.18em] text-[#FF6900]">Ready check</p>
              <p className="mt-0.5 text-xs font-black text-slate-800 dark:text-slate-200">
                {hasLiveCountdown ? 'Stay ready for the next mock exam.' : 'Admin countdown will appear here once activated.'}
              </p>
            </div>
            <Link
              href="/dashboard/exams"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border-2 border-slate-950 bg-[#0A9AE2] px-3 py-1.5 text-[10px] font-black text-white shadow-[3px_3px_0_#0f172a] transition-transform hover:-translate-y-0.5 dark:border-white"
            >
              Exams <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReminderCalendar() {
  const wobblyCardRadius = '255px 18px 235px 22px / 18px 235px 20px 255px';
  const wobblyPanelRadius = '22px 255px 18px 235px / 235px 18px 255px 22px';
  const wobblyButtonRadius = '18px 235px 20px 255px / 255px 20px 235px 18px';
  const handBodyFont = "var(--font-patrick-hand), 'Patrick Hand', cursive";
  const handHeadingFont = "var(--font-kalam), 'Kalam', cursive";
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => formatDateKey(new Date()));
  const [draft, setDraft] = useState('');
  const [reminders, setReminders] = useState<Record<string, string>>({});
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem('aspire_student_reminders');
        if (stored) {
          const parsed = JSON.parse(stored) as Record<string, string>;
          setReminders(parsed);
          setDraft(parsed[selectedDate] ?? '');
        }
      } catch {
        setReminders({});
      } finally {
        setIsReady(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [selectedDate]);

  useEffect(() => {
    if (!isReady) return;
    const timer = window.setTimeout(() => {
      window.localStorage.setItem('aspire_student_reminders', JSON.stringify(reminders));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isReady, reminders]);

  const calendarDays = buildCalendarDays(visibleMonth);
  const selectedReminder = reminders[selectedDate];
  const upcomingReminders = Object.entries(reminders)
    .sort(([a], [b]) => a.localeCompare(b));

  const handleSelectDate = (dateKey: string) => {
    setSelectedDate(dateKey);
    setDraft(reminders[dateKey] ?? '');
  };

  const handleSaveReminder = () => {
    const text = draft.trim();
    setReminders((prev) => {
      const next = { ...prev };
      if (text) {
        next[selectedDate] = text;
      } else {
        delete next[selectedDate];
      }
      return next;
    });
    setDraft('');
  };

  const handleRemoveReminder = (dateKey: string) => {
    setReminders((prev) => {
      const next = { ...prev };
      delete next[dateKey];
      return next;
    });
    if (dateKey === selectedDate) {
      setDraft('');
    }
  };

  const goToMonth = (offset: number) => {
    setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  return (
    <div
      className="relative w-full min-w-0 self-start overflow-visible border-[3px] border-[#2d2d2d] bg-[#fdfbf7] shadow-[6px_6px_0_0_#2d2d2d]"
      style={{
        borderRadius: wobblyCardRadius,
        fontFamily: handBodyFont,
        backgroundImage: 'radial-gradient(#e5e0d8 1px, transparent 1px)',
        backgroundSize: '18px 18px',
      }}
    >
      <div className="pointer-events-none absolute left-1/2 top-[-13px] z-10 h-6 w-24 -translate-x-1/2 rotate-1 border-2 border-[#2d2d2d]/25 bg-[#e5e0d8]/80" />
      <div className="pointer-events-none absolute -right-3 top-10 h-9 w-9 rotate-12 border-[3px] border-[#2d2d2d] bg-[#ff4d4d]" style={{ borderRadius: '42% 58% 48% 52% / 55% 42% 58% 45%' }} />
      <div className="pointer-events-none absolute -left-3 bottom-28 h-12 w-12 -rotate-6 border-2 border-dashed border-[#2d5da1]" style={{ borderRadius: '55% 45% 50% 50% / 40% 58% 42% 60%' }} />

      <div
        className="relative m-3 border-[3px] border-[#2d2d2d] bg-white px-3.5 py-3 shadow-[3px_3px_0_0_rgba(45,45,45,0.18)]"
        style={{ borderRadius: wobblyPanelRadius }}
      >
        <div className="relative flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="-rotate-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#ff4d4d]">Important dates</p>
            <h2 className="mt-0.5 truncate text-[22px] font-black leading-tight text-[#2d2d2d]" style={{ fontFamily: handHeadingFont }}>
              Study reminder calendar
            </h2>
            <p className="mt-0.5 truncate text-[14px] font-bold leading-relaxed text-[#2d2d2d]/70">Deadlines, tryouts, milestones.</p>
          </div>
          <div
            className="flex h-10 w-10 shrink-0 rotate-2 items-center justify-center border-[3px] border-[#2d2d2d] bg-[#fff9c4] text-[#2d5da1] shadow-[3px_3px_0_0_#2d2d2d]"
            style={{ borderRadius: wobblyButtonRadius }}
          >
            <CalendarDays size={19} strokeWidth={2.7} />
          </div>
        </div>
      </div>

      <div className="relative px-3 pb-3">
        <div
          className="mb-3 flex -rotate-1 items-center justify-between gap-2 border-[3px] border-[#2d2d2d] bg-[#fff9c4] px-2 py-1.5 shadow-[4px_4px_0_0_#2d2d2d]"
          style={{ borderRadius: wobblyPanelRadius }}
        >
          <button
            type="button"
            onClick={() => goToMonth(-1)}
            className="flex h-8 w-8 items-center justify-center border-[3px] border-[#2d2d2d] bg-white text-[#2d2d2d] shadow-[3px_3px_0_0_#2d2d2d] transition-transform duration-100 hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[#2d5da1] hover:text-white hover:shadow-[2px_2px_0_0_#2d2d2d] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
            style={{ borderRadius: wobblyButtonRadius }}
          >
            <ChevronRight size={16} strokeWidth={2.8} className="rotate-180" />
          </button>
          <p className="min-w-0 rotate-1 truncate px-3 py-1.5 text-[17px] font-black leading-none text-[#2d2d2d]" style={{ fontFamily: handHeadingFont }}>
            {visibleMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
          </p>
          <button
            type="button"
            onClick={() => goToMonth(1)}
            className="flex h-8 w-8 items-center justify-center border-[3px] border-[#2d2d2d] bg-white text-[#2d2d2d] shadow-[3px_3px_0_0_#2d2d2d] transition-transform duration-100 hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[#2d5da1] hover:text-white hover:shadow-[2px_2px_0_0_#2d2d2d] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
            style={{ borderRadius: wobblyButtonRadius }}
          >
            <ChevronRight size={16} strokeWidth={2.8} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[12px] font-black uppercase tracking-wide text-[#2d2d2d]">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <span
              key={`${day}-${index}`}
              className="border-2 border-dashed border-[#2d2d2d] bg-white/80 py-0.5"
              style={{ borderRadius: index % 2 === 0 ? wobblyButtonRadius : wobblyPanelRadius }}
            >
              {day}
            </span>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1">
          {calendarDays.map((day) => {
            const hasReminder = Boolean(reminders[day.key]);
            const isSelected = selectedDate === day.key;
            return (
              <button
                key={day.key}
                type="button"
                onClick={() => handleSelectDate(day.key)}
                className={[
                  'relative flex aspect-square min-h-8 items-center justify-center border-2 text-[15px] font-black leading-none tabular-nums transition-transform duration-100 hover:rotate-1',
                  day.inCurrentMonth ? 'border-[#2d2d2d] text-[#2d2d2d]' : 'border-[#e5e0d8] text-[#2d2d2d]/35',
                  isSelected
                    ? 'bg-[#ff4d4d] text-white shadow-[3px_3px_0_0_#2d2d2d]'
                    : hasReminder
                      ? 'bg-[#fff9c4] text-[#2d5da1] shadow-[2px_2px_0_0_#2d2d2d]'
                      : 'bg-white hover:bg-[#fff9c4]',
                ].join(' ')}
                style={{ borderRadius: day.date.getDate() % 2 === 0 ? wobblyButtonRadius : wobblyPanelRadius }}
              >
                {day.date.getDate()}
                {hasReminder && !isSelected && (
                  <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-[#ff4d4d]" />
                )}
              </button>
            );
          })}
        </div>

        <div
          className="mt-3 rotate-1 border-[3px] border-[#2d2d2d] bg-[#fff9c4] p-2.5 shadow-[4px_4px_0_0_#2d2d2d]"
          style={{ borderRadius: wobblyPanelRadius }}
        >
          <p
            className="inline-flex -rotate-1 border-2 border-[#2d2d2d] bg-white px-2.5 py-0.5 text-[11px] font-black uppercase tracking-[0.12em] text-[#2d2d2d] shadow-[2px_2px_0_0_#2d2d2d]"
            style={{ borderRadius: wobblyButtonRadius }}
          >
            {formatReadableDate(selectedDate)}
          </p>
          <div className="mt-2 flex gap-2">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Exam, tryout, lesson, deadline..."
              className="min-w-0 flex-1 border-2 border-[#2d2d2d] bg-white px-3 py-1.5 text-[14px] font-bold text-[#2d2d2d] outline-none placeholder:text-[#2d2d2d]/40 focus:border-[#2d5da1] focus:ring-2 focus:ring-[#2d5da1]/20"
              style={{ borderRadius: wobblyButtonRadius, fontFamily: handBodyFont }}
            />
            <button
              type="button"
              onClick={handleSaveReminder}
              className="flex h-9 w-9 shrink-0 items-center justify-center border-[3px] border-[#2d2d2d] bg-white text-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] transition-transform duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-[#ff4d4d] hover:text-white hover:shadow-[2px_2px_0_0_#2d2d2d] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
              style={{ borderRadius: wobblyButtonRadius }}
            >
              <Plus size={18} strokeWidth={2.8} />
            </button>
          </div>
        </div>

        <div className="mt-3 max-h-40 space-y-2 overflow-y-auto">
          {upcomingReminders.length > 0 ? (
            upcomingReminders.map(([dateKey, note]) => (
              <div
                key={dateKey}
                className="flex -rotate-1 items-center gap-2 border-2 border-[#2d2d2d] bg-white px-2.5 py-1.5 text-[14px] font-bold text-[#2d2d2d] shadow-[3px_3px_0_0_rgba(45,45,45,0.14)]"
                style={{ borderRadius: wobblyPanelRadius }}
              >
                <span
                  className="shrink-0 border-2 border-[#2d2d2d] bg-[#e5e0d8] px-2 py-0.5 text-[11px] font-black text-[#2d5da1]"
                  style={{ borderRadius: wobblyButtonRadius }}
                >
                  {formatShortCalendarDate(dateKey)}
                </span>
                <span className="min-w-0 flex-1 truncate">{note}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveReminder(dateKey)}
                  className="shrink-0 text-[#2d2d2d]/35 transition-colors hover:text-[#ff4d4d]"
                >
                  <Trash2 size={15} strokeWidth={2.8} />
                </button>
              </div>
            ))
          ) : (
            <p
              className="border-2 border-dashed border-[#2d2d2d] bg-white px-3 py-2 text-center text-[14px] font-bold text-[#2d2d2d]/60"
              style={{ borderRadius: wobblyPanelRadius }}
            >
              Mark exam dates, school events, or study deadlines here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildCalendarDays(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      date,
      key: formatDateKey(date),
      inCurrentMonth: date.getMonth() === month.getMonth(),
    };
  });
}

function formatReadableDate(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
}

function formatShortCalendarDate(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  });
}

function getCountdownItems(targetAt: string | null, nowMs: number) {
  if (!targetAt) {
    return [
      { label: 'Days', value: '00' },
      { label: 'Hours', value: '00' },
      { label: 'Minutes', value: '00' },
      { label: 'Seconds', value: '00' },
    ];
  }

  const diffMs = Math.max(new Date(targetAt).getTime() - nowMs, 0);
  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const formatUnit = (value: number) => String(value).padStart(2, '0');

  return [
    { label: 'Days', value: formatUnit(days) },
    { label: 'Hours', value: formatUnit(hours) },
    { label: 'Minutes', value: formatUnit(minutes) },
    { label: 'Seconds', value: formatUnit(seconds) },
  ];
}

function formatCountdownDateTime(value: string) {
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
