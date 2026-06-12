'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
}

type PdfDocument = Awaited<ReturnType<typeof pdfjsLib.getDocument>['promise']>;
type PdfRenderTask = ReturnType<Awaited<ReturnType<PdfDocument['getPage']>>['render']>;

interface PdfPreviewProps {
  sourceUrl: string;
  title: string;
}

const MIN_SCALE = 0.6;
const MAX_SCALE = 2.4;
const SCALE_STEP = 0.2;

/**
 * A single PDF page in the continuous scroll view. It reserves its natural size
 * up front (so the scrollbar is correct) and only paints the canvas once it is
 * near the viewport — keeping large PDFs responsive.
 */
function PdfPageView({
  pdfDoc,
  pageNumber,
  scale,
  root,
}: {
  pdfDoc: PdfDocument;
  pageNumber: number;
  scale: number;
  root: Element | null;
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [shouldRender, setShouldRender] = useState(false);

  // Reserve space using the page's natural dimensions at the current scale.
  useEffect(() => {
    let cancelled = false;
    pdfDoc.getPage(pageNumber).then((page) => {
      if (cancelled) return;
      const viewport = page.getViewport({ scale });
      setSize({ width: viewport.width, height: viewport.height });
    });
    return () => {
      cancelled = true;
    };
  }, [pdfDoc, pageNumber, scale]);

  // Lazily flag the page for rendering once it scrolls near the viewport.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setShouldRender(true);
      },
      { root: root ?? undefined, rootMargin: '400px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [root]);

  // Paint the page to canvas (and repaint on zoom) once it is flagged visible.
  useEffect(() => {
    if (!shouldRender || !size) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    let renderTask: PdfRenderTask | null = null;

    pdfDoc
      .getPage(pageNumber)
      .then((page) => {
        if (cancelled) return;
        const viewport = page.getViewport({ scale });
        const outputScale = window.devicePixelRatio || 1;
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        context.setTransform(outputScale, 0, 0, outputScale, 0, 0);

        renderTask = page.render({ canvas, canvasContext: context, viewport });
        return renderTask.promise;
      })
      .catch((err) => {
        // RenderingCancelledException is expected on zoom/unmount — ignore it.
        if (err?.name !== 'RenderingCancelledException') {
          /* leave the placeholder in place */
        }
      });

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [shouldRender, size, pdfDoc, pageNumber, scale]);

  return (
    <div
      ref={wrapperRef}
      data-page={pageNumber}
      className="mx-auto bg-white shadow-xl"
      style={size ? { width: size.width, height: size.height } : { width: '100%', height: 480 }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
}

export function PdfPreview({ sourceUrl, title }: PdfPreviewProps) {
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PdfDocument | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isCancelled = false;
    const loadingTask = pdfjsLib.getDocument(sourceUrl);

    setPdfDoc(null);
    setNumPages(0);
    setCurrentPage(1);
    setError('');
    setIsLoading(true);

    loadingTask.promise
      .then((doc) => {
        if (isCancelled) return;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
      })
      .catch(() => {
        if (!isCancelled) setError('Failed to open PDF file.');
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
      void loadingTask.destroy();
    };
  }, [sourceUrl]);

  // Track the page that is most visible to drive the "current / total" indicator.
  useEffect(() => {
    if (!scrollEl || !pdfDoc) return;
    const pageEls = Array.from(scrollEl.querySelectorAll<HTMLElement>('[data-page]'));
    if (pageEls.length === 0) return;

    const ratios = new Map<number, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const page = Number((entry.target as HTMLElement).dataset.page);
          ratios.set(page, entry.intersectionRatio);
        }
        let best = currentPage;
        let bestRatio = -1;
        ratios.forEach((ratio, page) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            best = page;
          }
        });
        if (bestRatio > 0) setCurrentPage(best);
      },
      { root: scrollEl, threshold: [0.1, 0.25, 0.5, 0.75, 1] }
    );

    pageEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollEl, pdfDoc, numPages]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl bg-white dark:bg-slate-900">
        <Loader2 className="animate-spin text-[#0A9AE2]" size={32} />
      </div>
    );
  }

  if (error || !pdfDoc) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl bg-white px-6 text-center dark:bg-slate-900">
        <p className="text-sm font-bold text-red-500">{error || 'Failed to open PDF file.'}</p>
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl bg-[#0A9AE2] px-4 py-2 text-sm font-bold text-white hover:bg-[#0889c9]"
        >
          Open in New Tab
        </a>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-slate-200 dark:bg-slate-950">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <p className="min-w-0 flex-1 truncate text-sm font-bold text-slate-700 dark:text-slate-200">{title}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {currentPage} / {numPages}
          </span>
          <button
            type="button"
            onClick={() => setScale((current) => Math.max(MIN_SCALE, Math.round((current - SCALE_STEP) * 10) / 10))}
            disabled={scale <= MIN_SCALE}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
          >
            <ZoomOut size={16} />
          </button>
          <button
            type="button"
            onClick={() => setScale((current) => Math.min(MAX_SCALE, Math.round((current + SCALE_STEP) * 10) / 10))}
            disabled={scale >= MAX_SCALE}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
          >
            <ZoomIn size={16} />
          </button>
        </div>
      </div>
      <div ref={setScrollEl} className="flex-1 overflow-auto p-4">
        <div className="flex flex-col items-center gap-4">
          {Array.from({ length: numPages }, (_, index) => (
            <PdfPageView key={index + 1} pdfDoc={pdfDoc} pageNumber={index + 1} scale={scale} root={scrollEl} />
          ))}
        </div>
      </div>
    </div>
  );
}
