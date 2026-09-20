import React, { useMemo } from 'react';
import { splitBilingualSegments, BilingualSegment } from '../../utils/bilingualHelper';

export interface BilingualCardTextProps {
  text: string;
  type?: 'question' | 'answer' | 'general';
  variant?: 'card-list' | 'detail-modal' | 'review' | 'compact';
  className?: string;
  emptyFallback?: string;
}

export const BilingualCardText: React.FC<BilingualCardTextProps> = ({
  text,
  type = 'general',
  variant = 'card-list',
  className = '',
  emptyFallback
}) => {
  const segments = useMemo(() => splitBilingualSegments(text), [text]);

  if (!text || segments.length === 0) {
    if (emptyFallback) {
      return (
        <span className={`text-slate-400 dark:text-slate-500 italic text-xs ${className}`}>
          {emptyFallback}
        </span>
      );
    }
    return null;
  }

  // Check if we have both Arabic and Latin segments
  const hasArabic = segments.some(s => s.isArabic);
  const hasLatin = segments.some(s => !s.isArabic && s.script === 'latin');
  const isBilingual = hasArabic && hasLatin;

  // DETAIL MODAL (Screenshot 1: Flashcard Detail)
  if (variant === 'detail-modal') {
    const isAnswer = type === 'answer';

    return (
      <div className={`w-full space-y-3.5 select-text ${className}`}>
        {segments.map((seg, idx) => {
          if (seg.isArabic) {
            return (
              <div 
                key={seg.id || idx}
                dir="rtl"
                className={`text-right font-arabic leading-loose tracking-wide ${
                  isAnswer
                    ? 'text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100'
                    : 'text-lg sm:text-xl font-bold text-slate-900 dark:text-white'
                }`}
              >
                {seg.text}
              </div>
            );
          }

          // Latin / Indonesian translation or explanation
          return (
            <div 
              key={seg.id || idx}
              className={`pt-2.5 ${
                idx > 0 
                  ? isAnswer
                    ? 'border-t border-indigo-100 dark:border-indigo-900/40' 
                    : 'border-t border-slate-200/80 dark:border-slate-700/80'
                  : ''
              }`}
            >
              {isBilingual && idx > 0 && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    isAnswer
                      ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300'
                      : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {isAnswer ? 'Terjemahan & Penjelasan' : 'Terjemahan / Arti'}
                  </span>
                </div>
              )}
              <div 
                dir="ltr"
                className={`text-left leading-relaxed ${
                  isAnswer
                    ? 'text-sm sm:text-base font-normal text-slate-800 dark:text-slate-200'
                    : 'text-sm sm:text-base font-normal text-slate-700 dark:text-slate-300'
                }`}
              >
                {seg.text}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // REVIEW MODAL (Flashcard Active Study & Flipping)
  if (variant === 'review') {
    const isAnswer = type === 'answer';

    return (
      <div className={`w-full space-y-4 select-text ${className}`}>
        {segments.map((seg, idx) => {
          if (seg.isArabic) {
            return (
              <div 
                key={seg.id || idx}
                dir="rtl"
                className={`text-right font-arabic leading-loose tracking-wide ${
                  isAnswer
                    ? 'text-lg sm:text-2xl font-bold text-slate-900 dark:text-white'
                    : 'text-xl sm:text-2xl font-bold text-slate-900 dark:text-white'
                }`}
              >
                {seg.text}
              </div>
            );
          }

          return (
            <div 
              key={seg.id || idx}
              className={`pt-3 ${
                idx > 0 
                  ? 'border-t border-slate-200 dark:border-slate-700/80'
                  : ''
              }`}
            >
              {isBilingual && idx > 0 && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    {isAnswer ? 'Terjemahan & Penjelasan' : 'Arti / Terjemahan'}
                  </span>
                </div>
              )}
              <div 
                dir="ltr"
                className="text-left text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed font-normal"
              >
                {seg.text}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // COMPACT VARIANT (tables, mini rows)
  if (variant === 'compact') {
    return (
      <div className={`space-y-1 w-full text-xs ${className}`}>
        {segments.map((seg, idx) => (
          <div
            key={seg.id || idx}
            dir={seg.isArabic ? 'rtl' : 'ltr'}
            className={`${
              seg.isArabic 
                ? 'text-right font-arabic font-semibold text-slate-900 dark:text-white text-[13px] leading-relaxed' 
                : 'text-left font-normal text-slate-600 dark:text-slate-300 text-xs leading-normal'
            }`}
          >
            {seg.text}
          </div>
        ))}
      </div>
    );
  }

  // DEFAULT / CARD-LIST VARIANT (Screenshot 2: Card List Items)
  return (
    <div className={`space-y-1.5 w-full select-text ${className}`}>
      {segments.map((seg, idx) => {
        if (seg.isArabic) {
          return (
            <div
              key={seg.id || idx}
              dir="rtl"
              className="text-right font-arabic text-[15px] sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed tracking-wide"
            >
              {seg.text}
            </div>
          );
        }

        return (
          <div
            key={seg.id || idx}
            dir="ltr"
            className="text-left text-xs sm:text-[13px] font-medium text-slate-600 dark:text-slate-300 leading-snug flex items-start gap-1.5"
          >
            {isBilingual && (
              <span className="text-[9px] font-bold tracking-wider px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 shrink-0 select-none mt-0.5">
                ID
              </span>
            )}
            <span className="flex-1 min-w-0">{seg.text}</span>
          </div>
        );
      })}
    </div>
  );
};
