'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, ZoomIn, ZoomOut } from 'lucide-react';
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

export function PdfPreview({ sourceUrl, title }: PdfPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PdfDocument | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [isLoading, setIsLoading] = useState(true);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isCancelled = false;
    const loadingTask = pdfjsLib.getDocument(sourceUrl);

    setPdfDoc(null);
    setPageNumber(1);
    setError('');
    setIsLoading(true);

    loadingTask.promise
      .then((doc) => {
        if (!isCancelled) setPdfDoc(doc);
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

  useEffect(() => {
    if (!pdfDoc) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    let isCancelled = false;
    let renderTask: PdfRenderTask | null = null;

    setError('');
    setIsRendering(true);

    pdfDoc
      .getPage(pageNumber)
      .then((page) => {
        if (isCancelled) return;

        const viewport = page.getViewport({ scale });
        const outputScale = window.devicePixelRatio || 1;
        const context = canvas.getContext('2d');

        if (!context) throw new Error('Canvas context unavailable');

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        context.setTransform(outputScale, 0, 0, outputScale, 0, 0);
        context.clearRect(0, 0, viewport.width, viewport.height);

        renderTask = page.render({ canvas, canvasContext: context, viewport });
        return renderTask.promise;
      })
      .catch((err) => {
        if (!isCancelled && err?.name !== 'RenderingCancelledException') {
          setError('Failed to render PDF page.');
        }
      })
      .finally(() => {
        if (!isCancelled) setIsRendering(false);
      });

    return () => {
      isCancelled = true;
      renderTask?.cancel();
    };
  }, [pdfDoc, pageNumber, scale]);

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
          <button
            type="button"
            onClick={() => setPageNumber((current) => Math.max(1, current - 1))}
            disabled={pageNumber <= 1}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {pageNumber} / {pdfDoc.numPages}
          </span>
          <button
            type="button"
            onClick={() => setPageNumber((current) => Math.min(pdfDoc.numPages, current + 1))}
            disabled={pageNumber >= pdfDoc.numPages}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
          >
            <ChevronRight size={16} />
          </button>
          <button
            type="button"
            onClick={() => setScale((current) => Math.max(0.6, current - 0.2))}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 dark:border-slate-700 dark:text-slate-300"
          >
            <ZoomOut size={16} />
          </button>
          <button
            type="button"
            onClick={() => setScale((current) => Math.min(2.4, current + 0.2))}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 dark:border-slate-700 dark:text-slate-300"
          >
            <ZoomIn size={16} />
          </button>
        </div>
      </div>
      <div className="relative flex-1 overflow-auto p-4">
        {isRendering && (
          <div className="absolute right-4 top-4 z-10 rounded-full bg-white/90 px-3 py-2 text-xs font-bold text-slate-500 shadow-sm dark:bg-slate-900/90 dark:text-slate-300">
            Rendering...
          </div>
        )}
        <canvas ref={canvasRef} className="mx-auto bg-white shadow-xl" />
      </div>
    </div>
  );
}
