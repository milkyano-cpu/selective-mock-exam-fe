'use client';

import { Bell, Menu, Moon, Search, Sun } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';

interface NavbarProps {
  onMenuClick: () => void;
}

export const Navbar = ({ onMenuClick }: NavbarProps) => {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const isDarkMode = mounted && theme === 'dark';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md transition-colors lg:px-8 dark:border-slate-800 dark:bg-slate-950/80">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu size={20} />
        </button>
        
        <div className="hidden w-64 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition-colors md:flex lg:w-96 dark:border-slate-800 dark:bg-slate-900">
          <Search size={18} className="text-slate-400 dark:text-slate-500" />
          <input 
            type="text" 
            placeholder="Search exams, topics..." 
            className="w-full border-none bg-transparent text-sm text-slate-600 outline-none placeholder:text-slate-400 dark:text-slate-200 dark:placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-4">
        <button
          type="button"
          onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button className="relative rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
          <Bell size={20} />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full border-2 border-white bg-orange-500 dark:border-slate-950"></span>
        </button>
      </div>
    </header>
  );
};
