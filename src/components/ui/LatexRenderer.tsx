'use client';

import katex from 'katex';

interface LatexRendererProps {
  latex: string;
  displayMode?: boolean;
  className?: string;
}

type LatexSegment =
  | { type: 'text'; value: string }
  | { type: 'math'; value: string; displayMode: boolean };

function normalizeMathDelimiters(value: string) {
  return value.replace(/\\\\([\[\]\(\)])/g, '\\$1');
}

function parseLatexSegments(value: string, defaultDisplayMode: boolean): LatexSegment[] {
  const normalized = normalizeMathDelimiters(value);
  const pattern = /(\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)|\$\$([\s\S]*?)\$\$|\$([^$\n]+)\$)/g;
  const segments: LatexSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(normalized)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: normalized.slice(lastIndex, match.index) });
    }

    const fullMatch = match[0];
    const math = match[2] ?? match[3] ?? match[4] ?? match[5] ?? '';
    segments.push({
      type: 'math',
      value: math,
      displayMode: fullMatch.startsWith('\\[') || fullMatch.startsWith('$$') || defaultDisplayMode,
    });
    lastIndex = match.index + fullMatch.length;
  }

  if (lastIndex < normalized.length) {
    segments.push({ type: 'text', value: normalized.slice(lastIndex) });
  }

  return segments;
}

function renderMathSegment(latex: string, displayMode: boolean, className = '') {
  try {
    const html = katex.renderToString(latex, {
      displayMode,
      throwOnError: true,
      output: 'html',
    });

    return (
      <span
        className={className}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } catch {
    return (
      <span className={`text-red-500 text-xs font-mono ${className}`}>
        Invalid LaTeX: {latex}
      </span>
    );
  }
}

export function LatexRenderer({ latex, displayMode = false, className = '' }: LatexRendererProps) {
  if (!latex?.trim()) return null;

  const segments = parseLatexSegments(latex, displayMode);
  const hasDelimitedMath = segments.some((segment) => segment.type === 'math');

  if (!hasDelimitedMath) {
    return renderMathSegment(normalizeMathDelimiters(latex), displayMode, className);
  }

  return (
    <span className={className}>
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          return <span key={index}>{segment.value}</span>;
        }

        return (
          <span key={index}>
            {renderMathSegment(segment.value, segment.displayMode)}
          </span>
        );
      })}
    </span>
  );
}
