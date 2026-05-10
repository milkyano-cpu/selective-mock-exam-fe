'use client';

import { useEffect, useState, useTransition } from 'react';
import { usePathname } from 'next/navigation';

export function NavigationProgress() {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // When pathname changes, navigation is complete
    setIsNavigating(false);
    setProgress(100);

    const timer = setTimeout(() => setProgress(0), 200);
    return () => clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    // Intercept link clicks to detect navigation start
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('#') || href === pathname) return;

      setIsNavigating(true);
      setProgress(20);
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [pathname]);

  useEffect(() => {
    if (!isNavigating) return;

    // Gradually increase progress while navigating
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + (90 - prev) * 0.1;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isNavigating]);

  if (progress === 0) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[9999] h-[3px]">
      <div
        className="h-full bg-[#0A9AE2] shadow-[0_0_8px_rgba(10,154,226,0.5)] transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
