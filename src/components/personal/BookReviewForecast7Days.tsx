import React, { useMemo } from 'react';
import { Calendar, TrendingUp, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import { Book, BookItem } from '../../types';
import { getNonQuranIntervalDays, isDue } from '../../lib/fsrs';

interface Props {
  book: Book;
  items: BookItem[];
  language: string;
  onOpenCalendarOnDate?: (dateStr: string) => void;
}

function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const BookReviewForecast7Days: React.FC<Props> = ({
  book,
  items,
  language,
  onOpenCalendarOnDate
}) => {
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => formatLocalDate(today), [today]);

  // Generate 7 consecutive days starting today
  const next7Days = useMemo(() => {
    const days: {
      date: Date;
      dateStr: string;
      dayName: string;
      dateDisplay: string;
      isToday: boolean;
    }[] = [];

    const dayNamesId = ['Ahd', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNamesId = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dStr = formatLocalDate(d);
      const dayIndex = d.getDay();
      const monthIndex = d.getMonth();
      const dayName = i === 0 
        ? (language === 'en' ? 'Today' : 'Hari Ini')
        : (language === 'en' ? dayNamesEn[dayIndex] : dayNamesId[dayIndex]);
      const dateDisplay = `${d.getDate()} ${language === 'en' ? monthNamesEn[monthIndex] : monthNamesId[monthIndex]}`;

      days.push({
        date: d,
        dateStr: dStr,
        dayName,
        dateDisplay,
        isToday: i === 0
      });
    }
    return days;
  }, [today, language]);

  // Map review load for each of the 7 days
  const forecastData = useMemo(() => {
    const countMap = new Map<string, { regularCount: number; overdueCount: number }>();
    next7Days.forEach(d => countMap.set(d.dateStr, { regularCount: 0, overdueCount: 0 }));

    const activeBookItems = (items || []).filter(it => it.bookId === book.id && it.isActive);

    activeBookItems.forEach(it => {
      const nextReview = it.fsrsData?.nextReview;
      const intervalDays = getNonQuranIntervalDays(it.fsrsData);

      let primaryDueDate: Date;
      let isOverdue = false;

      if (nextReview) {
        const nextDate = new Date(nextReview);
        if (nextDate < today || isDue(nextReview, it.isActive)) {
          primaryDueDate = new Date(today);
          isOverdue = formatLocalDate(nextDate) !== todayStr;
        } else {
          primaryDueDate = nextDate;
        }
      } else {
        primaryDueDate = new Date(today);
      }

      const primaryStr = formatLocalDate(primaryDueDate);
      if (countMap.has(primaryStr)) {
        const entry = countMap.get(primaryStr)!;
        if (isOverdue) {
          entry.overdueCount += 1;
        } else {
          entry.regularCount += 1;
        }
      }
    });

    let maxLoad = 1;
    let totalScheduled7Days = 0;
    let peakDay = next7Days[0];
    let peakCount = 0;

    next7Days.forEach(d => {
      const counts = countMap.get(d.dateStr) || { regularCount: 0, overdueCount: 0 };
      const totalDay = counts.regularCount + counts.overdueCount;
      if (totalDay > maxLoad) maxLoad = totalDay;
      totalScheduled7Days += totalDay;
      if (totalDay > peakCount) {
        peakCount = totalDay;
        peakDay = d;
      }
    });

    return {
      countMap,
      maxLoad,
      totalScheduled7Days,
      averagePerDay: Math.round(totalScheduled7Days / 7),
      peakDay,
      peakCount
    };
  }, [items, book.id, next7Days, today, todayStr]);

  const hasHighLoad = forecastData.peakCount >= 100;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              {language === 'en' ? '7-Day Review Horizon' : 'Prakiraan Beban 7 Hari ke Depan'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'en'
                ? `Total ${forecastData.totalScheduled7Days} reviews scheduled (avg. ${forecastData.averagePerDay}/day)`
                : `Total ${forecastData.totalScheduled7Days} kartu terjadwal (rata-rata ${forecastData.averagePerDay} kartu/hari)`}
            </p>
          </div>
        </div>

        {/* Peak load badge */}
        <div className="flex items-center gap-2">
          {hasHighLoad ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-[11px] font-bold border border-rose-200 dark:border-rose-900/50">
              <AlertTriangle className="w-3 h-3 text-rose-500" />
              <span>{language === 'en' ? 'Dense Peak: 100+ cards' : 'Puncak Padat: 100+ kartu'}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800/40">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>{language === 'en' ? 'Balanced Flow (<100/day)' : 'Beban Terkendali (<100/hari)'}</span>
            </span>
          )}
        </div>
      </div>

      {/* 7-Day Interactive Columns Grid */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 pt-1">
        {next7Days.map((day) => {
          const counts = forecastData.countMap.get(day.dateStr) || { regularCount: 0, overdueCount: 0 };
          const totalCards = counts.regularCount + counts.overdueCount;
          const isHeavy = totalCards >= 100;
          const isModerate = totalCards >= 40 && totalCards < 100;

          // Compute relative height percentage (min 15%, max 100%)
          const heightPct = forecastData.maxLoad > 0 
            ? Math.max(18, Math.round((totalCards / forecastData.maxLoad) * 100))
            : 18;

          return (
            <button
              key={day.dateStr}
              type="button"
              onClick={() => onOpenCalendarOnDate && onOpenCalendarOnDate(day.dateStr)}
              className={`flex flex-col items-center justify-between p-2 rounded-xl border transition-all cursor-pointer group text-center select-none ${
                day.isToday
                  ? 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/70 shadow-2xs hover:border-indigo-400'
                  : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={
                language === 'en'
                  ? `${day.dayName}, ${day.dateDisplay}: ${totalCards} cards (${counts.overdueCount} overdue)`
                  : `${day.dayName}, ${day.dateDisplay}: ${totalCards} kartu (${counts.overdueCount} tunggakan)`
              }
            >
              {/* Day Name */}
              <span className={`text-[11px] font-bold block ${
                day.isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'
              }`}>
                {day.dayName}
              </span>

              {/* Date */}
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                {day.dateDisplay}
              </span>

              {/* Visual Bar Indicator */}
              <div className="w-full h-12 flex items-end justify-center my-1.5 px-1">
                <div
                  style={{ height: `${heightPct}%` }}
                  className={`w-full max-w-[28px] rounded-md transition-all duration-300 ${
                    totalCards === 0
                      ? 'bg-slate-200/80 dark:bg-slate-700/60'
                      : isHeavy
                      ? 'bg-rose-500 hover:bg-rose-600 shadow-xs shadow-rose-500/20'
                      : isModerate
                      ? 'bg-amber-500 hover:bg-amber-600 shadow-xs shadow-amber-500/20'
                      : day.isToday
                      ? 'bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700'
                      : 'bg-emerald-500 dark:bg-emerald-600 hover:bg-emerald-400'
                  }`}
                />
              </div>

              {/* Card Count Pill */}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                totalCards === 0
                  ? 'text-slate-400 dark:text-slate-500'
                  : isHeavy
                  ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
                  : isModerate
                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                  : day.isToday
                  ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300'
                  : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
              }`}>
                {totalCards}
              </span>
            </button>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1 pt-1">
        <span>
          {language === 'en'
            ? '💡 Click any day to inspect cards in the Review Calendar.'
            : '💡 Klik hari mana saja untuk melihat rincian kartu di Kalender Jadwal.'}
        </span>
        {onOpenCalendarOnDate && (
          <button
            type="button"
            onClick={() => onOpenCalendarOnDate(todayStr)}
            className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            <span>{language === 'en' ? 'Full Calendar' : 'Buka Kalender Penuh'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
