'use client';

import { LatexRenderer } from './LatexRenderer';

interface QuestionLatexRendererProps {
  text: string;
  latex?: string | null;
  isLatexFormat?: boolean;
  displayMode?: boolean;
  className?: string;
  fallbackClassName?: string;
}

export function QuestionLatexRenderer({
  text,
  latex,
  isLatexFormat = false,
  displayMode = false,
  className = '',
  fallbackClassName = '',
}: QuestionLatexRendererProps) {
  if (isLatexFormat) {
    return <LatexRenderer latex={latex ?? text} displayMode={displayMode} className={className} />;
  }

  return <span className={fallbackClassName || className}>{text}</span>;
}
