'use client';

import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

export type SearchableSelectOption = {
  value: string;
  label: string;
  searchText?: string;
  disabled?: boolean;
};

type SearchableSelectProps = {
  value: string;
  options: SearchableSelectOption[];
  onChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  triggerClassName?: string;
  dropdownClassName?: string;
};

export function SearchableSelect({
  value,
  options,
  onChange,
  placeholder,
  searchPlaceholder = 'Search...',
  emptyText = 'No options found.',
  disabled = false,
  triggerClassName = '',
  dropdownClassName = '',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return options;

    return options.filter((option) =>
      `${option.label} ${option.searchText ?? ''}`.toLowerCase().includes(query)
    );
  }, [options, search]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const focusTimer = window.setTimeout(() => {
      searchInputRef.current?.focus({ preventScroll: true });
    }, 0);

    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          if (disabled) return;
          setSearch('');
          setIsOpen((current) => !current);
        }}
        disabled={disabled}
        className={`flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-900 shadow-sm transition-all hover:border-slate-300 focus:border-[#0A9AE2] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:border-slate-600 ${triggerClassName}`}
      >
        <span className={selectedOption ? '' : 'text-slate-400 dark:text-slate-500'}>
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronsUpDown size={16} className="shrink-0 text-slate-400" />
      </button>

      {isOpen && (
        <div className={`absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] dark:border-slate-700 dark:bg-slate-900 ${dropdownClassName}`}>
          <div className="border-b border-slate-100 p-3 dark:border-slate-800">
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition-all focus:border-[#0A9AE2] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="custom-scrollbar max-h-64 overflow-y-auto p-2">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                {emptyText}
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      if (option.disabled) return;
                      onChange(option.value);
                      setSearch('');
                      setIsOpen(false);
                    }}
                    disabled={option.disabled}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all ${
                      isSelected
                        ? 'bg-[#0A9AE2]/10 text-[#0A9AE2] dark:bg-[#0A9AE2]/15'
                        : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/80'
                    } ${option.disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && <Check size={16} className="shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
