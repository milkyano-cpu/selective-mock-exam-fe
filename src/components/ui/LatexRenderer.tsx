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

const DOLLAR_PLACEHOLDER = '\u00A4';

function normalizeMathDelimiters(value: string) {
  return value.replace(/\\\\([\[\]\(\)])/g, '\\$1');
}

function preprocessEscapedDollars(value: string): string {
  return value.replace(/\\\$/g, DOLLAR_PLACEHOLDER);
}

function parseLatexSegments(value: string, defaultDisplayMode: boolean): LatexSegment[] {
  const preprocessed = preprocessEscapedDollars(value);
  const normalized = normalizeMathDelimiters(preprocessed);
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

function processTextContent(text: string) {
  let content = text.replace(/\u00A4/g, '$').replace(/\\\$/g, '$');

  content = content.replace(/\\begin\{(?:itemize|enumerate)\}(?:\[[^\]]*\])?\s*/g, '');
  content = content.replace(/\\end\{(?:itemize|enumerate)\}\s*/g, '');

  const cmdPattern = /(\\textbf\{([^}]*)\}|\\textit\{([^}]*)\}|\\underline\{([^}]*)\}|\\item\s*)/g;
  const parts: (string | React.ReactElement)[] = [];
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  let i = 0;

  while ((m = cmdPattern.exec(content)) !== null) {
    if (m.index > lastIdx) parts.push(content.slice(lastIdx, m.index));
    const key = `t${i++}`;
    if (m[2] !== undefined) {
      parts.push(<strong key={key}>{m[2]}</strong>);
    } else if (m[3] !== undefined) {
      parts.push(<em key={key}>{m[3]}</em>);
    } else if (m[4] !== undefined) {
      parts.push(<u key={key}>{m[4]}</u>);
    } else {
      parts.push(<span key={key}>{'\n\u2022 '}</span>);
    }
    lastIdx = m.index + m[0].length;
  }

  if (lastIdx < content.length) parts.push(content.slice(lastIdx));
  if (parts.length === 0) return content;
  if (parts.length === 1) return parts[0];
  return <>{parts}</>;
}

/**
 * Convert LaTeX document environments to KaTeX-compatible math blocks.
 * KaTeX supports \begin{array} (tables), \hline, \multicolumn in math mode,
 * but not \begin{tabular} which is a document-mode command.
 */
function preprocessLatexEnvironments(text: string): string {
  let result = text;

  // Strip decorative wrappers: \begin{center}, \begin{table}
  result = result.replace(/\\begin\{center\}\s*([\s\S]*?)\s*\\end\{center\}/g, '$1');
  result = result.replace(/\\begin\{table\}(?:\[[^\]]*\])?\s*([\s\S]*?)\s*\\end\{table\}/g, '$1');

  // Strip unsupported commands
  result = result.replace(/\\renewcommand\{[^}]*\}\{[^}]*\}\s*/g, '');
  result = result.replace(/\\centering\s*/g, '');
  result = result.replace(/\\caption\{[^}]*\}\s*/g, '');
  result = result.replace(/\\label\{[^}]*\}\s*/g, '');

  // Convert \begin{tabular}{cols}...\end{tabular} → $$\begin{array}{cols}...\end{array}$$
  result = result.replace(
    /\\begin\{tabular\}\s*(\{[^}]*\})([\s\S]*?)\\end\{tabular\}/g,
    '\n$$\\begin{array}$1$2\\end{array}$$\n',
  );

  return result;
}

export function LatexRenderer({ latex, displayMode = false, className = '' }: LatexRendererProps) {
  if (!latex?.trim()) return null;

  // Strip TikZ/PGF blocks that KaTeX cannot render (they should be provided as images)
  const stripped = preprocessLatexEnvironments(
    latex
      .replace(/\\begin\{center\}\s*\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}\s*\\end\{center\}/g, '')
      .replace(/\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/g, '')
  ).trim();

  if (!stripped) return null;

  const segments = parseLatexSegments(stripped, displayMode);
  const hasDelimitedMath = segments.some((segment) => segment.type === 'math');

  if (!hasDelimitedMath) {
    return <span className={className} style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}>{processTextContent(stripped)}</span>;
  }

  return (
    <span className={className}>
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          return <span key={index} style={{ whiteSpace: 'pre-wrap' }}>{processTextContent(segment.value)}</span>;
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
