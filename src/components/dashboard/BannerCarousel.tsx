'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { bannerService } from '@/features/banners/services/banners.service';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import type { Banner } from '@/features/banners/types/banners.types';

export const BannerCarousel = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const isHiddenRef = useRef(false);

  useEffect(() => {
    let isCancelled = false;

    const fetchBanners = async () => {
      try {
        const response = await bannerService.listActive();
        if (!isCancelled && response.success) {
          setBanners(response.data.filter((banner) => banner.imageUrl?.trim()));
        }
      } catch {
        if (!isCancelled) {
          setBanners([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchBanners();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    setCurrentIndex(0);
  }, [banners.length]);

  // Pause autoplay when tab is hidden and reset index on return
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        isHiddenRef.current = true;
      } else {
        if (isHiddenRef.current) {
          isHiddenRef.current = false;
          setIsTransitioning(false);
          setCurrentIndex(0);
          // Re-enable transition after the instant jump renders
          requestAnimationFrame(() => {
            setIsTransitioning(true);
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      if (document.hidden) return;
      setCurrentIndex((prev) => {
        // Safety clamp: never let index exceed banners.length (the clone position)
        if (prev >= banners.length) return 1;
        return prev + 1;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [banners, isPaused]);

  const handleTransitionEnd = useCallback(() => {
    if (currentIndex === banners.length) {
      // Disable transition for instant jump, then re-enable after paint
      setIsTransitioning(false);
      setCurrentIndex(0);
      requestAnimationFrame(() => {
        setIsTransitioning(true);
      });
    } else if (currentIndex === -1) {
      setIsTransitioning(false);
      setCurrentIndex(banners.length - 1);
      requestAnimationFrame(() => {
        setIsTransitioning(true);
      });
    }
  }, [currentIndex, banners.length]);

  const normalizedIndex = useMemo(() => {
    if (banners.length === 0) return 0;
    return ((currentIndex % banners.length) + banners.length) % banners.length;
  }, [banners.length, currentIndex]);

  const goToPrevious = () => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev - 1);
    setIsPaused(true);
  };

  const goToNext = () => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
    setIsPaused(true);
  };

  const goToSlide = (index: number) => {
    setIsTransitioning(true);
    setCurrentIndex(index);
    setIsPaused(true);
  };

  if (isLoading || banners.length === 0) {
    return null;
  }

  return (
    <div
      className="group relative min-w-0 max-w-full overflow-hidden bg-slate-100 aspect-[16/7] dark:bg-slate-900"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Carousel track dengan smooth slide animation + infinite loop */}
      <div
        className={`flex h-full ${isTransitioning ? 'transition-transform duration-700 ease-in-out' : ''}`}
        style={{
          transform: `translateX(${-currentIndex * 100}%)`,
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {/* Render setiap banner dengan lebar 100% */}
        {banners.map((banner, index) => (
          <a
            key={banner.id}
            href={banner.targetUrl || '#'}
            target={banner.targetUrl ? '_blank' : undefined}
            rel={banner.targetUrl ? 'noopener noreferrer' : undefined}
            className="min-w-full h-full flex-shrink-0 block"
          >
            <BannerImage banner={banner} priority={index === 0} />
          </a>
        ))}
        {/* Clone dari banner pertama untuk infinite loop */}
        {banners.length > 0 && (
          <a
            href={banners[0].targetUrl || '#'}
            target={banners[0].targetUrl ? '_blank' : undefined}
            rel={banners[0].targetUrl ? 'noopener noreferrer' : undefined}
            className="min-w-full h-full flex-shrink-0 block"
          >
            <BannerImage banner={banners[0]} priority={false} />
          </a>
        )}
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/80 hover:bg-white text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity dark:bg-slate-900/80 dark:hover:bg-slate-900 dark:text-white"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/80 hover:bg-white text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity dark:bg-slate-900/80 dark:hover:bg-slate-900 dark:text-white"
          >
            <ChevronRight size={24} />
          </button>

          {/* Dot Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  normalizedIndex === index
                    ? 'bg-white w-6'
                    : 'bg-white/50 hover:bg-white/75 w-2'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

function BannerImage({ banner, priority }: { banner: Banner; priority: boolean }) {
  const [hasFailed, setHasFailed] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  if (hasFailed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#e0f2fe_0%,#fef3c7_55%,#dcfce7_100%)] text-slate-500 dark:bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_60%,#082f49_100%)] dark:text-slate-300">
        <div className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-black shadow-sm dark:bg-slate-950/70">
          <ImageOff size={16} />
          Banner image unavailable
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-slate-100 dark:bg-slate-900">
      {!hasLoaded && (
        <div className="absolute inset-0 animate-pulse bg-[linear-gradient(90deg,#e2e8f0_0%,#f8fafc_50%,#e2e8f0_100%)] dark:bg-[linear-gradient(90deg,#0f172a_0%,#1e293b_50%,#0f172a_100%)]" />
      )}
      <img
        src={banner.imageUrl}
        alt="Banner"
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        onLoad={() => setHasLoaded(true)}
        onError={() => setHasFailed(true)}
        className={[
          'h-full w-full object-cover transition-opacity duration-300',
          hasLoaded ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
      />
    </div>
  );
}
