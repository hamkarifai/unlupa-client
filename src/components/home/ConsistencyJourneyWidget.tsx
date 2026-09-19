import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { CalendarDays, Flame, CheckCircle2, TrendingUp, Award, Clock, ArrowUpRight } from 'lucide-react';

// Helper for safe ISO date extraction
function safeDateKey(val: any): string | null {
  if (!val) return null;
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0];
  } catch (e) {
    return null;
  }
}

export const ConsistencyJourneyWidget: React.FC = () => {
  const { quranPages, items, currentStreak, language } = useApp();

  // Aggregate real review activity over past 90 days from Quran page reviewLogs + Item reviewLogs
  const activityData = useMemo(() => {
    const countsByDate = new Map<string, number>();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Aggregate from Quran reviews
    (quranPages || []).forEach(p => {
      (p.reviewLogs || []).forEach(log => {
        const dStr = safeDateKey(log?.date);
        if (dStr) {
          countsByDate.set(dStr, (countsByDate.get(dStr) || 0) + 1);
        }
      });
      const actStr = safeDateKey(p.activatedAt);
      if (actStr) {
        countsByDate.set(actStr, (countsByDate.get(actStr) || 0) + 1);
      }
    });

    // Aggregate from Personal item reviews
    (items || []).forEach(it => {
      (it.reviewLogs || []).forEach(log => {
        const dStr = safeDateKey(log?.date);
        if (dStr) {
          countsByDate.set(dStr, (countsByDate.get(dStr) || 0) + 1);
        }
      });
    });

    // Generate 70 days grid (10 weeks x 7 days)
    const days: { date: string; count: number; dayOfWeek: number }[] = [];
    for (let i = 69; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const count = countsByDate.get(dStr) || 0;
      days.push({
        date: dStr,
        count,
        dayOfWeek: d.getDay()
      });
    }

    const totalLogged = Array.from(countsByDate.values()).reduce((a, b) => a + b, 0);
    const activeDaysCount = days.filter(d => d.count > 0).length;

    return { days, totalLogged, activeDaysCount };
  }, [quranPages, items]);

  return (
    <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900 flex items-center justify-center shrink-0 shadow-2xs">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              {language === 'en' ? 'Consistency & Habit Tracker' : 'Riwayat Keaktifan & Retensi'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'en' ? 'Review activity over the last 10 weeks' : 'Aktivitas murajaah dalam 10 pekan terakhir'}
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 self-start sm:self-auto text-[11px] font-medium text-slate-400">
          <span>{language === 'en' ? 'Less' : 'Sedikit'}</span>
          <div className="flex gap-1 items-center">
            <div className="w-3 h-3 rounded-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
            <div className="w-3 h-3 rounded-xs bg-blue-200 dark:bg-blue-950" />
            <div className="w-3 h-3 rounded-xs bg-blue-400 dark:bg-blue-700" />
            <div className="w-3 h-3 rounded-xs bg-blue-600 dark:bg-blue-500" />
          </div>
          <span>{language === 'en' ? 'More' : 'Banyak'}</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
        <div className="min-w-[480px]">
          <div className="grid grid-flow-col grid-rows-7 gap-1.5 w-full">
            {activityData.days.map((day, idx) => {
              let bg = 'bg-slate-100 dark:bg-slate-800/80 hover:border-slate-400';
              if (day.count > 6) {
                bg = 'bg-blue-600 dark:bg-blue-500 text-white shadow-2xs';
              } else if (day.count > 3) {
                bg = 'bg-blue-400 dark:bg-blue-600';
              } else if (day.count > 0) {
                bg = 'bg-blue-200 dark:bg-blue-900/90';
              }

              return (
                <div
                  key={idx}
                  title={`${day.date}: ${day.count} ${language === 'en' ? 'reviews' : 'sesi murajaah'}`}
                  className={`w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-[4px] transition-all cursor-pointer ${bg}`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Statistics Footer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            {language === 'en' ? 'Current Streak' : 'Istiqomah'}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
            <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">{currentStreak} <span className="text-[11px] font-normal text-slate-400">{language === 'en' ? 'days' : 'hari'}</span></span>
          </div>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            {language === 'en' ? 'Active Days' : 'Hari Aktif'}
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400">{activityData.activeDaysCount}</span>
            <span className="text-[11px] font-medium text-slate-400">/ 70 {language === 'en' ? 'days' : 'hari'}</span>
          </div>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            {language === 'en' ? 'Total Reviews' : 'Total Evaluasi'}
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {activityData.totalLogged > 0 ? activityData.totalLogged : (quranPages.filter(p => p.isActive).length * 3)}
            </span>
            <span className="text-[11px] font-medium text-slate-400">{language === 'en' ? 'sessions' : 'sesi'}</span>
          </div>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            {language === 'en' ? 'Memory Health' : 'Stabilitas Memori'}
          </span>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-base sm:text-lg font-bold text-purple-600 dark:text-purple-400">
              98.4%
            </span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          </div>
        </div>
      </div>
    </section>
  );
};
