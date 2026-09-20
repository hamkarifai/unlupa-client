import React from 'react';
import { Flame, Brain, Clock, CalendarClock } from 'lucide-react';

export interface MemoryMetricGridProps {
  reps: number;
  stability?: number;
  estDays?: number;
  nextReviewDate?: string | Date | null;
  isDue?: boolean;
  isMapan?: boolean;
  variant?: 'grid-2x2' | 'row' | 'auto';
  className?: string;
  language?: 'id' | 'en';
}

/**
 * Premium 4-Metric Display Component directly aligned with user specification:
 * 1. REVIEW (Flame icon, amber) - e.g. "0x", "12x"
 * 2. STABILITY (Brain icon, purple) - e.g. "-", "28d", "30d"
 * 3. EST. (Clock icon, cyan) - e.g. "15d", "30d"
 * 4. NEXT (CalendarClock icon, blue) - e.g. "-", "Hari Ini", "14 Sep"
 */
export const MemoryMetricGrid: React.FC<MemoryMetricGridProps> = ({
  reps,
  stability = 0,
  estDays,
  nextReviewDate,
  isDue = false,
  isMapan = false,
  variant = 'auto',
  className = '',
  language = 'id',
}) => {
  // Format Review Reps
  const reviewText = `${reps}x`;

  // Format Stability
  let stabilityText = '—';
  if (stability > 0) {
    stabilityText = `${Math.round(stability)}d`;
  }

  // Format Estimated Interval
  let estText = '—';
  if (estDays !== undefined && estDays > 0) {
    estText = `${Math.round(estDays)}d`;
  } else if (stability > 0) {
    estText = isMapan ? '30d' : `${Math.round(stability)}d`;
  }

  // Format Next Review
  let nextText = '—';
  if (nextReviewDate) {
    const next = new Date(nextReviewDate);
    const now = new Date();
    const diffHours = (next.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (isDue || diffHours <= 0) {
      nextText = language === 'en' ? 'Today' : 'Hari Ini';
    } else if (diffHours <= 24) {
      nextText = language === 'en' ? 'Tomorrow' : 'Besok';
    } else {
      const diffDays = Math.ceil(diffHours / 24);
      if (diffDays <= 7) {
        nextText = `${diffDays}d`;
      } else {
        nextText = next.toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', {
          day: 'numeric',
          month: 'short',
        });
      }
    }
  }

  return (
    <div className={`flex flex-wrap items-center gap-1.5 sm:gap-2 ${className}`}>
      {/* 1. REVIEW - Amber Flame */}
      <div 
        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 text-slate-700 dark:text-slate-300 text-xs shadow-2xs"
        title={language === 'en' ? `Review count: ${reviewText}` : `Jumlah murajaah: ${reviewText}`}
      >
        <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Rev</span>
        <span className="font-bold text-slate-800 dark:text-slate-200">{reviewText}</span>
      </div>

      {/* 2. STABILITY - Purple Brain */}
      <div 
        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 text-slate-700 dark:text-slate-300 text-xs shadow-2xs"
        title={language === 'en' ? `Memory Stability: ${stabilityText}` : `Stabilitas ingatan: ${stabilityText}`}
      >
        <Brain className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Stab</span>
        <span className="font-bold text-slate-800 dark:text-slate-200">{stabilityText}</span>
      </div>

      {/* 3. EST. - Cyan Clock */}
      <div 
        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 text-slate-700 dark:text-slate-300 text-xs shadow-2xs"
        title={language === 'en' ? `Estimated interval: ${estText}` : `Estimasi interval: ${estText}`}
      >
        <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Est</span>
        <span className="font-bold text-slate-800 dark:text-slate-200">{estText}</span>
      </div>

      {/* 4. NEXT - Sky CalendarClock */}
      <div 
        className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs shadow-2xs ${
          isDue 
            ? 'bg-[#fdeee9] dark:bg-rose-950/40 border-[#fbd2c6] dark:border-rose-900/60 text-[#b85d38] dark:text-rose-300' 
            : 'bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 text-slate-700 dark:text-slate-300'
        }`}
        title={language === 'en' ? `Next review: ${nextText}` : `Jadwal murajaah: ${nextText}`}
      >
        <CalendarClock className={`w-3.5 h-3.5 shrink-0 ${isDue ? 'text-[#b85d38] dark:text-rose-400' : 'text-sky-600 dark:text-sky-400'}`} />
        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Next</span>
        <span className={`font-bold ${isDue ? 'text-[#b85d38] dark:text-rose-300' : 'text-slate-800 dark:text-slate-200'}`}>
          {nextText}
        </span>
      </div>
    </div>
  );
};
