import Link from 'next/link';
import { ArrowRight, BookOpenCheck, Clock3, Target } from 'lucide-react';

const studyPlanBlocks = [
  {
    title: 'Daily revision block',
    description: 'Follow a focused plan for today with short, high-retention study sessions.',
    icon: Clock3,
  },
  {
    title: 'Priority topics',
    description: 'See which exam topics need the most attention before the next mock test.',
    icon: Target,
  },
  {
    title: 'Structured practice flow',
    description: 'Move from concept review into timed practice without losing momentum.',
    icon: BookOpenCheck,
  },
];

export default function StudyPlanPage() {
  return (
    <div className="w-full max-w-5xl space-y-8">
      <header className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900 lg:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#0A9AE2]">Study-Plan</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">Your study flow is being organized here.</h1>
        <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400 sm:text-base">
          This space will guide students through what to review today, what to practice next, and how to stay aligned with upcoming exams.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/dashboard/exams" className="inline-flex items-center gap-2 rounded-xl bg-[#0A9AE2] px-5 py-3 text-sm font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]">
            Go to Mock Test <ArrowRight size={16} />
          </Link>
          <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800">
            Back to Home
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {studyPlanBlocks.map((block) => (
          <div key={block.title} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0A9AE2]/10 text-[#0A9AE2]">
              <block.icon size={22} />
            </div>
            <h2 className="mt-5 text-lg font-black text-slate-900 dark:text-slate-100">{block.title}</h2>
            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">{block.description}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
