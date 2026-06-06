'use client';

import { LatexRenderer } from './LatexRenderer';

interface QuestionLatexRendererProps {
  text: string;
  latexEnabled?: boolean;
  displayMode?: boolean;
  className?: string;
  fallbackClassName?: string;
}

export function QuestionLatexRenderer({
  text,
  latexEnabled = false,
  displayMode = false,
  className = '',
  fallbackClassName = '',
}: QuestionLatexRendererProps) {
  if (latexEnabled) {
    return <LatexRenderer latex={text} displayMode={displayMode} className={className} />;
  }

  return <span className={fallbackClassName || className}>{text}</span>;
}
