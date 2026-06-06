'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function NavigationProgress() {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef(0);

  useEffect(() => {
    // When pathname changes, navigation is complete
    setIsNavigating(false);
    setProgress(100);

    // Quickly fade out after completing
    const timer = setTimeout(() => setProgress(0), 150);
    return () => clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('#') || href === pathname) return;

      setIsNavigating(true);
      // Start at 30% immediately so it feels instant
      setProgress(30);
      startRef.current = performance.now();
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [pathname]);

  useEffect(() => {
    if (!isNavigating) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    // Use rAF for smoother progress animation
    const tick = () => {
      const elapsed = performance.now() - startRef.current;
      // Quick ramp: reach ~70% in 300ms, then slow crawl to 90%
      const fast = Math.min(70, 30 + (elapsed / 300) * 40);
      const slow = 70 + Math.min(20, ((elapsed - 300) / 4000) * 20);
      const next = elapsed < 300 ? fast : slow;

      setProgress((prev) => Math.max(prev, next));
      if (next < 90) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isNavigating]);

  if (progress === 0) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[9999] h-[2.5px]">
      <div
        className="h-full bg-[#0A9AE2] shadow-[0_0_10px_rgba(10,154,226,0.6)] transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
