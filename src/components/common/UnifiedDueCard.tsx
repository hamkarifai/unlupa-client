import React from 'react';
import { Play, CheckCircle2, Clock, Calendar } from 'lucide-react';
import { Language } from '../../types';

export interface DueFilterPill {
  id: string | number;
  label: string;
  count: number;
  badge?: string;
  onClick: () => void;
  active?: boolean;
}

export interface UnifiedDueCardProps {
  language: Language;
  title?: string;
  subtitle?: string;
  dueCount: number;
  totalActiveCount?: number;
  itemTypeLabel?: string; // e.g. "Halaman", "Kartu", "Tugas"
  onStartAll: () => void;
  onOpenCalendar?: () => void;
  filterPills?: DueFilterPill[];
  pillGridCols?: 3 | 4 | 5 | 6 | 'books' | 'quran' | 'personal' | 'classes';
  allCaughtUpTitle?: string;
  allCaughtUpSubtitle?: string;
  nextUpcomingText?: string;
  primaryActionLabel?: string;
  className?: string;
}

export const UnifiedDueCard: React.FC<UnifiedDueCardProps> = ({
  language,
  title,
  dueCount,
  itemTypeLabel,
  onStartAll,
  onOpenCalendar,
  filterPills = [],
  pillGridCols = 5,
  allCaughtUpTitle,
  primaryActionLabel,
  className = '',
}) => {
  const defaultTitle = title || (language === 'en' ? 'Review Queue' : 'Antrean Murajaah');
  const typeLabel = itemTypeLabel || (language === 'en' ? 'items' : 'item');
  const defaultPrimaryLabel = primaryActionLabel || (language === 'en' ? `Review All (${dueCount})` : `Murajaah Semua (${dueCount})`);
  const noReviewLabel = allCaughtUpTitle || (language === 'en' ? 'All items reviewed for today!' : 'Semua materi telah tuntas dimurajaah hari ini!');

  const colsKey = String(pillGridCols);
  const isBooksMode = colsKey === '3' || colsKey === 'books' || colsKey === 'personal' || colsKey === 'classes' || colsKey === '4';
  
  let gridLayoutClass = 'grid grid-cols-5 gap-1 sm:gap-1.5';
  if (colsKey === '3' || colsKey === 'books' || colsKey === 'personal' || colsKey === 'classes') {
    gridLayoutClass = 'grid grid-cols-3 gap-1.5 sm:gap-2';
  } else if (colsKey === '4') {
    gridLayoutClass = 'grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2';
  } else if (colsKey === '5' || colsKey === 'quran') {
    gridLayoutClass = 'grid grid-cols-5 gap-1 sm:gap-1.5';
  } else if (colsKey === '6') {
    gridLayoutClass = 'grid grid-cols-6 gap-1 sm:gap-1.5';
  }

  if (dueCount === 0) {
    return (
      <div className={`bg-white dark:bg-slate-900 rounded-2xl px-4 py-3 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-3 transition-all ${className}`}>
        <div className="inline-flex items-center gap-2.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
          <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span>{noReviewLabel}</span>
        </div>
        {onOpenCalendar && (
          <button
            type="button"
            onClick={onOpenCalendar}
            title={language === 'en' ? 'View Schedule Calendar' : 'Lihat Kalender Jadwal'}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer shrink-0"
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">{language === 'en' ? 'Schedule' : 'Jadwal'}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border border-amber-300/80 dark:border-amber-700/60 shadow-xs space-y-3 transition-all ${className}`}>
      {/* 1. Header Bar: Title, Calendar trigger, and Primary Action Button */}
      <div className="flex items-center justify-between gap-2.5 pb-2.5 border-b border-amber-200/60 dark:border-amber-900/40">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
            {defaultTitle}
          </span>
          {onOpenCalendar && (
            <button
              type="button"
              onClick={onOpenCalendar}
              title={language === 'en' ? 'View Schedule Calendar' : 'Lihat Kalender Jadwal'}
              className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Primary Action Button (Review All) */}
        <button
          onClick={onStartAll}
          title={language === 'en' ? `Review all due items (${dueCount})` : `Murajaah semua item tempo (${dueCount})`}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs shadow-2xs hover:shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Play className="w-3.5 h-3.5 fill-white text-white shrink-0" />
          <span>{defaultPrimaryLabel}</span>
        </button>
      </div>

      {/* 2. Detailed Filter Pills (Juz / Books / Classes) */}
      {filterPills.length > 0 && (
        <div className={`${gridLayoutClass} pt-0.5`}>
          {filterPills.map((pill) => (
            <button
              key={pill.id}
              onClick={pill.onClick}
              title={`Murajaah ${pill.label} (${pill.count})`}
              className={`flex items-center justify-between gap-1.5 ${
                isBooksMode ? 'px-2.5 py-1.5 sm:py-2 rounded-xl' : 'px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg'
              } bg-slate-50 dark:bg-slate-800/90 hover:bg-amber-50 dark:hover:bg-amber-950/70 border border-slate-200/80 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all cursor-pointer group shadow-2xs active:scale-95 min-w-0`}
            >
              <span className={`group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate text-left min-w-0 flex-1 ${
                isBooksMode ? 'text-[11px] sm:text-xs font-medium' : 'text-[10px] sm:text-xs font-semibold whitespace-nowrap'
              }`}>
                {pill.label}
              </span>
              <span className={`${
                isBooksMode
                  ? 'px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px]'
                  : 'px-1 sm:px-1.5 py-0.2 rounded text-[9px] sm:text-[10px]'
              } bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 group-hover:bg-amber-200 dark:group-hover:bg-amber-800 transition-colors font-black shrink-0 min-w-[16px] text-center whitespace-nowrap ml-1`}>
                {pill.count}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};


