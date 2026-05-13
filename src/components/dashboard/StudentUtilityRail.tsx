'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, ChevronRight, Clock, Plus, Trash2 } from 'lucide-react';
import { BannerCarousel } from '@/components/dashboard/BannerCarousel';
import { countdownService } from '@/features/countdowns/services/countdown.service';
import type { CountdownItem } from '@/features/countdowns/types/countdowns.types';
import { studentCalendarService } from '@/features/student-calendar/services/student-calendar.service';
import type {
  StudentCalendarReminder,
  UpsertStudentCalendarReminderPayload,
} from '@/features/student-calendar/types/student-calendar.types';

const LEGACY_REMINDERS_STORAGE_KEY = 'aspire_student_reminders';

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
    <aside className="min-w-0 space-y-4 overflow-visible pb-3">
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
    <section className="relative mb-2 mr-2 min-w-0 overflow-hidden rounded-[1.35rem] border-[3px] border-slate-950 bg-[#FFF8E7] shadow-[8px_8px_0_#0f172a] dark:border-white dark:bg-slate-950 dark:shadow-[8px_8px_0_#38bdf8]">
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
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => formatDateKey(new Date()));
  const [draft, setDraft] = useState('');
  const [reminders, setReminders] = useState<Record<string, string>>({});
  const [isReady, setIsReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const selectedDateRef = useRef(selectedDate);

  useEffect(() => {
    selectedDateRef.current = selectedDate;
  }, [selectedDate]);

  useEffect(() => {
    let isCancelled = false;

    const loadReminders = async () => {
      try {
        const response = await studentCalendarService.listReminders();
        if (isCancelled) return;

        let nextReminders = remindersToRecord(response.data);
        const legacyReminders = readLegacyReminders();

        if (legacyReminders.length > 0) {
          try {
            for (let index = 0; index < legacyReminders.length; index += 365) {
              await studentCalendarService.importReminders(legacyReminders.slice(index, index + 365));
            }

            const refreshed = await studentCalendarService.listReminders();
            if (isCancelled) return;

            nextReminders = remindersToRecord(refreshed.data);
            window.localStorage.removeItem(LEGACY_REMINDERS_STORAGE_KEY);
          } catch {
            nextReminders = { ...legacyRemindersToRecord(legacyReminders), ...nextReminders };
          }
        }

        setReminders(nextReminders);
        setDraft(nextReminders[selectedDateRef.current] ?? '');
      } catch {
        if (!isCancelled) {
          setReminders({});
          setDraft('');
        }
      } finally {
        if (!isCancelled) {
          setIsReady(true);
        }
      }
    };

    void loadReminders();

    return () => {
      isCancelled = true;
    };
  }, []);

  const calendarDays = buildCalendarDays(visibleMonth);
  const upcomingReminders = Object.entries(reminders)
    .sort(([a], [b]) => a.localeCompare(b));

  const handleSelectDate = (dateKey: string) => {
    setSelectedDate(dateKey);
    setDraft(reminders[dateKey] ?? '');
  };

  const handleSaveReminder = async () => {
    const text = draft.trim();
    const previousReminders = reminders;
    const nextReminders = { ...reminders };

    if (text) {
      nextReminders[selectedDate] = text;
    } else {
      delete nextReminders[selectedDate];
    }

    setReminders(nextReminders);
    setDraft('');

    try {
      setIsSaving(true);
      if (text) {
        const response = await studentCalendarService.saveReminder({ date: selectedDate, note: text });
        setReminders((current) => ({ ...current, [response.data.date]: response.data.note }));
      } else if (previousReminders[selectedDate]) {
        await studentCalendarService.removeReminder(selectedDate);
      }
    } catch {
      setReminders(previousReminders);
      setDraft(previousReminders[selectedDate] ?? '');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveReminder = async (dateKey: string) => {
    const previousReminders = reminders;
    const nextReminders = { ...reminders };
    delete nextReminders[dateKey];
    setReminders(nextReminders);

    if (dateKey === selectedDate) {
      setDraft('');
    }

    try {
      setIsSaving(true);
      await studentCalendarService.removeReminder(dateKey);
    } catch {
      setReminders(previousReminders);
      if (dateKey === selectedDate) {
        setDraft(previousReminders[dateKey] ?? '');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const goToMonth = (offset: number) => {
    setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const todayKey = formatDateKey(new Date());

  return (
    <section className="relative mb-[6px] mr-[6px] mt-4 min-w-0 overflow-hidden rounded-[1.35rem] border-[3px] border-slate-950 bg-[#FFF0F6] shadow-[6px_6px_0_#0f172a] dark:border-white dark:bg-slate-950 dark:shadow-[6px_6px_0_#38bdf8]">
      {/* Decorative shapes */}
      <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full border-[3px] border-slate-950 bg-[#C4B5FD] dark:border-white" />
      <div className="absolute -bottom-5 left-8 h-12 w-12 rotate-12 border-[3px] border-slate-950 bg-[#FBCFE8] dark:border-white" />

      {/* Header */}
      <div className="relative border-b-[3px] border-slate-950 bg-[#C4B5FD] px-4 py-3 text-slate-950 dark:border-white">
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(#0f172a_1px,transparent_1px)] [background-size:10px_10px]" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full border-2 border-slate-950 bg-[#F43F5E]" />
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-950">Important dates</p>
            </div>
            <h2 className="text-base font-black leading-tight text-slate-950">
              Study reminder
            </h2>
            <p className="mt-0.5 text-[11px] font-bold text-slate-800/80">Deadlines, tryouts, milestones.</p>
          </div>
          <div className="flex shrink-0 items-center justify-center pt-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border-[3px] border-slate-950 bg-[#FDE047] text-slate-950 shadow-[3px_3px_0_#0f172a]">
              <CalendarDays size={18} strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </div>

      {/* Zigzag separator */}
      <svg className="block w-full text-[#C4B5FD]" viewBox="0 0 400 8" preserveAspectRatio="none" style={{ height: 8, marginTop: -1 }}>
        <path d="M0,0 L10,8 L20,0 L30,8 L40,0 L50,8 L60,0 L70,8 L80,0 L90,8 L100,0 L110,8 L120,0 L130,8 L140,0 L150,8 L160,0 L170,8 L180,0 L190,8 L200,0 L210,8 L220,0 L230,8 L240,0 L250,8 L260,0 L270,8 L280,0 L290,8 L300,0 L310,8 L320,0 L330,8 L340,0 L350,8 L360,0 L370,8 L380,0 L390,8 L400,0 L400,8 L0,8 Z" fill="currentColor" />
      </svg>

      <div className="relative p-3 pt-1">
        {/* Month navigation */}
        <div className="mb-3 flex items-center justify-between gap-2 overflow-hidden rounded-xl border-[3px] border-slate-950 bg-white px-1.5 py-1.5 shadow-[3px_3px_0_#0f172a] dark:border-white dark:bg-slate-900 dark:shadow-[3px_3px_0_#38bdf8]">
          <button
            type="button"
            onClick={() => goToMonth(-1)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-slate-950 bg-[#FBCFE8] text-slate-950 transition-transform hover:-translate-y-0.5 active:translate-y-0 dark:border-white dark:bg-slate-700 dark:text-white"
          >
            <ChevronRight size={14} strokeWidth={3} className="rotate-180" />
          </button>
          <p className="min-w-0 truncate px-1 text-[13px] font-black leading-none text-slate-950 dark:text-white">
            {visibleMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
          </p>
          <button
            type="button"
            onClick={() => goToMonth(1)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-slate-950 bg-[#FBCFE8] text-slate-950 transition-transform hover:-translate-y-0.5 active:translate-y-0 dark:border-white dark:bg-slate-700 dark:text-white"
          >
            <ChevronRight size={14} strokeWidth={3} />
          </button>
        </div>

        {/* Weekday labels as pills */}
        <div className="mb-1.5 grid grid-cols-7 gap-1 text-center">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day, index) => (
            <span
              key={`${day}-${index}`}
              className={[
                'rounded-md py-0.5 text-[8px] font-black uppercase tracking-wider',
                index === 0 || index === 6
                  ? 'bg-[#FBCFE8] text-slate-950 dark:bg-pink-900/40 dark:text-pink-200'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
              ].join(' ')}
            >
              {day}
            </span>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="mb-3 grid grid-cols-7 gap-1">
          {calendarDays.map((day) => {
            const hasReminder = Boolean(reminders[day.key]);
            const isSelected = selectedDate === day.key;
            const isToday = day.key === todayKey;
            return (
              <button
                key={day.key}
                type="button"
                onClick={() => handleSelectDate(day.key)}
                className={[
                  'relative flex h-7 items-center justify-center rounded-lg border-2 text-[11px] font-black leading-none transition-all hover:-translate-y-0.5',
                  day.inCurrentMonth ? 'text-slate-950 dark:text-white' : 'text-slate-300 dark:text-slate-700',
                  isSelected
                    ? 'border-slate-950 bg-[#F43F5E] text-white shadow-[2px_2px_0_#0f172a] dark:border-white dark:shadow-[2px_2px_0_#38bdf8]'
                    : isToday
                      ? 'border-[3px] border-[#7C3AED] bg-[#EDE9FE] text-[#7C3AED] shadow-[2px_2px_0_#7C3AED] dark:border-violet-400 dark:bg-violet-950/50 dark:text-violet-300'
                      : hasReminder
                        ? 'border-slate-950 bg-[#FDE047] text-slate-950 shadow-[2px_2px_0_#0f172a] dark:border-white dark:bg-yellow-500'
                        : 'border-transparent bg-white hover:border-slate-300 hover:bg-[#FFF0F6] dark:bg-slate-900 dark:hover:border-slate-600',
                ].join(' ')}
              >
                {day.date.getDate()}
                {hasReminder && !isSelected && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F43F5E] opacity-50" />
                    <span className="relative inline-flex h-2 w-2 rounded-full border border-slate-950 bg-[#F43F5E]" />
                  </span>
                )}
              </button>
            );
          })}
        </div>


        {/* Input area */}
        <div className="overflow-hidden rounded-xl border-[3px] border-slate-950 bg-white shadow-[3px_3px_0_#0f172a] dark:border-white dark:bg-slate-900 dark:shadow-[3px_3px_0_#38bdf8]">
          <div className="h-1.5 bg-[linear-gradient(90deg,#C4B5FD_0%,#F43F5E_50%,#FDE047_100%)]" />
          <div className="p-2.5">
            <p className="inline-flex rounded-md border-2 border-slate-950 bg-[#C4B5FD] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-slate-950">
              {formatReadableDate(selectedDate)}
            </p>
            <div className="mt-1.5 flex gap-1.5">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => { if (event.key === 'Enter') void handleSaveReminder(); }}
                placeholder="Exam, tryout, lesson..."
                className="min-w-0 flex-1 rounded-lg border-2 border-slate-950 bg-[#FAFAFA] px-2.5 py-1.5 text-xs font-bold text-slate-950 outline-none placeholder:text-slate-400 focus:border-[#7C3AED] focus:bg-white dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={() => void handleSaveReminder()}
                disabled={!isReady || isSaving}
                className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-lg border-[3px] border-slate-950 bg-[#F43F5E] text-white shadow-[2px_2px_0_#0f172a] transition-transform hover:-translate-y-0.5 active:translate-y-0 active:shadow-none dark:border-white"
              >
                <Plus size={16} strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>

        {/* Reminders list */}
        <div className="mt-3 max-h-[120px] space-y-1.5 overflow-y-auto pr-1 custom-scrollbar">
          {upcomingReminders.length > 0 ? (
            upcomingReminders.map(([dateKey, note]) => (
              <div
                key={dateKey}
                className="flex items-center gap-2 rounded-lg border-2 border-slate-950 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-950 shadow-[2px_2px_0_#0f172a] transition-transform hover:-translate-y-0.5 dark:border-white dark:bg-slate-900 dark:text-white"
              >
                <span className="shrink-0 rounded-md border-2 border-slate-950 bg-[#FDE047] px-1.5 py-0.5 text-[9px] font-black text-slate-950">
                  {formatShortCalendarDate(dateKey)}
                </span>
                <span className="min-w-0 flex-1 truncate">{note}</span>
                <button
                  type="button"
                  onClick={() => void handleRemoveReminder(dateKey)}
                  disabled={isSaving}
                  className="shrink-0 rounded-md p-0.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-[#F43F5E] dark:text-slate-500 dark:hover:bg-red-950/30"
                >
                  <Trash2 size={14} strokeWidth={2.5} />
                </button>
              </div>
            ))
          ) : (
            <div className="rounded-xl border-[3px] border-dashed border-slate-300 bg-[#FFF0F6] px-2 py-3 text-center dark:border-slate-600 dark:bg-slate-800/50">
              <p className="text-[10px] font-black text-slate-500 dark:text-slate-400">
                {isReady ? 'Mark exam dates or events here.' : 'Loading reminders...'}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function remindersToRecord(reminderItems: StudentCalendarReminder[]) {
  return reminderItems.reduce<Record<string, string>>((acc, reminder) => {
    acc[reminder.date] = reminder.note;
    return acc;
  }, {});
}

function legacyRemindersToRecord(reminderItems: UpsertStudentCalendarReminderPayload[]) {
  return reminderItems.reduce<Record<string, string>>((acc, reminder) => {
    acc[reminder.date] = reminder.note;
    return acc;
  }, {});
}

function readLegacyReminders(): UpsertStudentCalendarReminderPayload[] {
  try {
    const stored = window.localStorage.getItem(LEGACY_REMINDERS_STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored) as Record<string, unknown>;
    return Object.entries(parsed)
      .filter(([date, note]) => /^\d{4}-\d{2}-\d{2}$/.test(date) && typeof note === 'string' && note.trim())
      .map(([date, note]) => ({ date, note: (note as string).trim() }));
  } catch {
    return [];
  }
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
