import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  Library, 
  Sparkles, 
  Flame, 
  Eye, 
  Play, 
  TrendingUp,
  CalendarCheck,
  RotateCcw,
  ShieldCheck,
  ChevronDown,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QuranPageItem, BookItem } from '../../types';
import { JUZ_LIST } from '../../data/quranData';
import { isDue } from '../../lib/fsrs';

interface Props {
  onOpenQuranReview?: (juzNumber?: number) => void;
  onOpenPersonalReview?: () => void;
  onOpenMushafViewer: (pageNumber: number) => void;
}

type MaterialFilter = 'all' | 'quran' | 'personal';

// Helper to format Date as local YYYY-MM-DD
function formatLocalDate(d: Date | string | number | null | undefined): string {
  if (!d) return '';
  try {
    const dateObj = d instanceof Date ? d : new Date(d);
    if (isNaN(dateObj.getTime())) return '';
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    return '';
  }
}

export const VisualReviewCalendar: React.FC<Props> = ({
  onOpenMushafViewer,
}) => {
  const { 
    quranPages, 
    items, 
    books, 
    language, 
    quranStats, 
    personalStats,
    setActiveSpace 
  } = useApp();

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => formatLocalDate(today), [today]);

  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth()); // 0 - 11
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);
  const [filterType, setFilterType] = useState<MaterialFilter>('all');
  const [isDetailsExpanded, setIsDetailsExpanded] = useState<boolean>(true);

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const handleGoToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDateStr(todayStr);
  };

  // Month and Day labels
  const monthNamesId = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentMonthName = language === 'en' 
    ? monthNamesEn[currentMonth] 
    : monthNamesId[currentMonth];

  const weekDayLabels = language === 'en'
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Ahd'];

  // Calculate days in the displayed month and grid structure
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const totalDays = lastDayOfMonth.getDate();

    // In JS: 0 is Sunday, 1 is Monday, ..., 6 is Saturday
    // We want Monday = 0, Tuesday = 1, ..., Sunday = 6
    let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startingDayOfWeek === -1) startingDayOfWeek = 6; // Sunday becomes 6

    const days: { 
      dateStr: string; 
      dayNumber: number; 
      isCurrentMonth: boolean; 
      isToday: boolean;
      dateObj: Date;
    }[] = [];

    // Previous month padding
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dNum = prevMonthLastDay - i;
      const dObj = new Date(currentYear, currentMonth - 1, dNum);
      days.push({
        dateStr: formatLocalDate(dObj),
        dayNumber: dNum,
        isCurrentMonth: false,
        isToday: formatLocalDate(dObj) === todayStr,
        dateObj: dObj
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const dObj = new Date(currentYear, currentMonth, i);
      const dStr = formatLocalDate(dObj);
      days.push({
        dateStr: dStr,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: dStr === todayStr,
        dateObj: dObj
      });
    }

    // Next month padding to fill complete weeks (multiples of 7)
    const remainingSlots = 7 - (days.length % 7);
    if (remainingSlots < 7) {
      for (let i = 1; i <= remainingSlots; i++) {
        const dObj = new Date(currentYear, currentMonth + 1, i);
        days.push({
          dateStr: formatLocalDate(dObj),
          dayNumber: i,
          isCurrentMonth: false,
          isToday: formatLocalDate(dObj) === todayStr,
          dateObj: dObj
        });
      }
    }

    return days;
  }, [currentYear, currentMonth, todayStr]);

  // Aggregate planned and completed review sessions by date
  const scheduleData = useMemo(() => {
    const plannedMap = new Map<string, {
      quran: QuranPageItem[];
      personal: { item: BookItem; bookTitle: string }[];
    }>();

    const completedMap = new Map<string, {
      quran: { page: QuranPageItem; rating: number }[];
      personal: { item: BookItem; rating: number; bookTitle: string }[];
    }>();

    const booksMap = new Map<string, string>();
    (books || []).forEach(b => booksMap.set(b.id, b.title));

    // 1. Process Active Quran Pages
    (quranPages || []).forEach(p => {
      if (!p.isActive) return;

      // Check planned next review
      const nextReview = p.fsrsData?.nextReview;
      if (nextReview) {
        const nextDate = new Date(nextReview);
        const nextStr = formatLocalDate(nextDate);

        // If nextReview is today or in the past (overdue), it counts towards TODAY's pending load
        if (nextDate <= today || isDue(nextReview, p.isActive)) {
          if (!plannedMap.has(todayStr)) {
            plannedMap.set(todayStr, { quran: [], personal: [] });
          }
          plannedMap.get(todayStr)!.quran.push(p);
        } else {
          // Future scheduled date
          if (!plannedMap.has(nextStr)) {
            plannedMap.set(nextStr, { quran: [], personal: [] });
          }
          plannedMap.get(nextStr)!.quran.push(p);
        }
      } else {
        // Activated but no review date yet -> due today
        if (!plannedMap.has(todayStr)) {
          plannedMap.set(todayStr, { quran: [], personal: [] });
        }
        plannedMap.get(todayStr)!.quran.push(p);
      }

      // Check recurrent weekly or monthly Mapan schedule
      if (p.mapanSchedule && p.mapanSchedule.mode !== 'fsrs') {
        if (p.mapanSchedule.mode === 'weekly' && typeof p.mapanSchedule.weeklyDay === 'number') {
          // Weekly schedule on a specific day of week
          const targetDay = p.mapanSchedule.weeklyDay; // 0 = Ahad, 1 = Senin, etc.
          calendarDays.forEach(calDay => {
            if (calDay.isCurrentMonth && calDay.dateObj > today) {
              if (calDay.dateObj.getDay() === targetDay) {
                if (!plannedMap.has(calDay.dateStr)) {
                  plannedMap.set(calDay.dateStr, { quran: [], personal: [] });
                }
                const entry = plannedMap.get(calDay.dateStr)!;
                if (!entry.quran.some(qp => qp.pageNumber === p.pageNumber)) {
                  entry.quran.push(p);
                }
              }
            }
          });
        } else if (p.mapanSchedule.mode === 'monthly' && typeof p.mapanSchedule.monthlyDate === 'number') {
          // Monthly schedule on a specific date
          const targetDateNum = p.mapanSchedule.monthlyDate;
          calendarDays.forEach(calDay => {
            if (calDay.isCurrentMonth && calDay.dayNumber === targetDateNum && calDay.dateObj > today) {
              if (!plannedMap.has(calDay.dateStr)) {
                plannedMap.set(calDay.dateStr, { quran: [], personal: [] });
              }
              const entry = plannedMap.get(calDay.dateStr)!;
              if (!entry.quran.some(qp => qp.pageNumber === p.pageNumber)) {
                entry.quran.push(p);
              }
            }
          });
        }
      }

      // Check review history (completed)
      (p.reviewLogs || []).forEach(log => {
        if (log.date) {
          const logDateStr = formatLocalDate(new Date(log.date));
          if (!completedMap.has(logDateStr)) {
            completedMap.set(logDateStr, { quran: [], personal: [] });
          }
          completedMap.get(logDateStr)!.quran.push({
            page: p,
            rating: log.rating || 3
          });
        }
      });
    });

    // 2. Process Personal Items
    (items || []).forEach(it => {
      if (!it.isActive) return;
      const bTitle = booksMap.get(it.bookId) || (language === 'en' ? 'Book Card' : 'Kartu Kitab');

      const nextReview = it.fsrsData?.nextReview;
      if (nextReview) {
        const nextDate = new Date(nextReview);
        const nextStr = formatLocalDate(nextDate);

        if (nextDate <= today || isDue(nextReview, it.isActive)) {
          if (!plannedMap.has(todayStr)) {
            plannedMap.set(todayStr, { quran: [], personal: [] });
          }
          plannedMap.get(todayStr)!.personal.push({ item: it, bookTitle: bTitle });
        } else {
          if (!plannedMap.has(nextStr)) {
            plannedMap.set(nextStr, { quran: [], personal: [] });
          }
          plannedMap.get(nextStr)!.personal.push({ item: it, bookTitle: bTitle });
        }
      } else {
        if (!plannedMap.has(todayStr)) {
          plannedMap.set(todayStr, { quran: [], personal: [] });
        }
        plannedMap.get(todayStr)!.personal.push({ item: it, bookTitle: bTitle });
      }

      // Check review history (completed)
      (it.reviewLogs || []).forEach(log => {
        if (log.date) {
          const logDateStr = formatLocalDate(new Date(log.date));
          if (!completedMap.has(logDateStr)) {
            completedMap.set(logDateStr, { quran: [], personal: [] });
          }
          completedMap.get(logDateStr)!.personal.push({
            item: it,
            rating: log.rating || 3,
            bookTitle: bTitle
          });
        }
      });
    });

    return { plannedMap, completedMap };
  }, [quranPages, items, books, language, today, todayStr, calendarDays]);

  // Monthly retention statistics
  const monthlyMetrics = useMemo(() => {
    let totalScheduledInMonth = 0;
    let totalCompletedInMonth = 0;
    let maxDayCount = 0;
    let peakDate = '';
    let daysWithReviews = 0;

    const currentMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

    calendarDays.forEach(day => {
      if (!day.isCurrentMonth) return;

      const planned = scheduleData.plannedMap.get(day.dateStr);
      const completed = scheduleData.completedMap.get(day.dateStr);

      let qCount = 0;
      let pCount = 0;

      if (filterType === 'all' || filterType === 'quran') {
        qCount = (planned?.quran.length || 0);
      }
      if (filterType === 'all' || filterType === 'personal') {
        pCount = (planned?.personal.length || 0);
      }

      const totalPlanned = qCount + pCount;
      totalScheduledInMonth += totalPlanned;

      let cCount = 0;
      if (filterType === 'all' || filterType === 'quran') {
        cCount += (completed?.quran.length || 0);
      }
      if (filterType === 'all' || filterType === 'personal') {
        cCount += (completed?.personal.length || 0);
      }
      totalCompletedInMonth += cCount;

      if (totalPlanned > 0) {
        daysWithReviews++;
        if (totalPlanned > maxDayCount) {
          maxDayCount = totalPlanned;
          peakDate = day.dateStr;
        }
      }
    });

    // Mapan / Long-term Retention ratio (Stability > 30 days)
    const activeQuran = (quranPages || []).filter(p => p.isActive);
    const masteredQuran = activeQuran.filter(p => {
      const stability = p.fsrsData?.stability || 0;
      const interval = Math.round(stability * 0.4025587);
      return p.status === 'mastered_for_now' || interval >= 30;
    }).length;

    const activeItems = (items || []).filter(it => it.isActive);
    const masteredItems = activeItems.filter(it => {
      const stability = it.fsrsData?.stability || 0;
      const interval = Math.round(stability * 0.4025587);
      return it.status === 'mastered' || interval >= 30;
    }).length;

    const totalActive = filterType === 'all' 
      ? activeQuran.length + activeItems.length 
      : filterType === 'quran' ? activeQuran.length : activeItems.length;

    const totalMastered = filterType === 'all'
      ? masteredQuran + masteredItems
      : filterType === 'quran' ? masteredQuran : masteredItems;

    const retentionHealthPercent = totalActive > 0 
      ? Math.round((totalMastered / totalActive) * 100) 
      : 0;

    return {
      totalScheduledInMonth,
      totalCompletedInMonth,
      maxDayCount,
      peakDate,
      daysWithReviews,
      totalActive,
      totalMastered,
      retentionHealthPercent,
      dailyAverage: daysWithReviews > 0 ? (totalScheduledInMonth / daysWithReviews).toFixed(1) : '0'
    };
  }, [calendarDays, scheduleData, filterType, currentYear, currentMonth, quranPages, items]);

  // Selected date details
  const selectedDateDetails = useMemo(() => {
    const planned = scheduleData.plannedMap.get(selectedDateStr) || { quran: [], personal: [] };
    const completed = scheduleData.completedMap.get(selectedDateStr) || { quran: [], personal: [] };

    const filteredPlannedQuran = (filterType === 'all' || filterType === 'quran') ? planned.quran : [];
    const filteredPlannedPersonal = (filterType === 'all' || filterType === 'personal') ? planned.personal : [];

    const filteredCompletedQuran = (filterType === 'all' || filterType === 'quran') ? completed.quran : [];
    const filteredCompletedPersonal = (filterType === 'all' || filterType === 'personal') ? completed.personal : [];

    const totalPlanned = filteredPlannedQuran.length + filteredPlannedPersonal.length;
    const totalCompleted = filteredCompletedQuran.length + filteredCompletedPersonal.length;

    const isDateToday = selectedDateStr === todayStr;
    const selectedObj = new Date(selectedDateStr + 'T00:00:00');
    const isPast = selectedObj < new Date(todayStr + 'T00:00:00');
    const isFuture = selectedObj > new Date(todayStr + 'T00:00:00');

    // Format human-readable date title
    let formattedTitle = selectedDateStr;
    try {
      formattedTitle = selectedObj.toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      // fallback
    }

    return {
      formattedTitle,
      isDateToday,
      isPast,
      isFuture,
      totalPlanned,
      totalCompleted,
      plannedQuran: filteredPlannedQuran,
      plannedPersonal: filteredPlannedPersonal,
      completedQuran: filteredCompletedQuran,
      completedPersonal: filteredCompletedPersonal,
    };
  }, [selectedDateStr, scheduleData, filterType, todayStr, language]);

  return (
    <section 
      data-no-swipe="true"
      className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6"
    >
      {/* 1. HEADER: TITLE & CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-900/60 flex items-center justify-center shrink-0 shadow-2xs">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {language === 'en' ? 'Planned Review & Retention Calendar' : 'Kalender Jadwal Murajaah & Retensi'}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold text-[10px] sm:text-[11px] flex items-center gap-1 shrink-0">
                <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                {language === 'en' ? 'Adaptive' : 'Adaptif'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {language === 'en' 
                ? 'Visual schedule of upcoming spaced reviews & memory stability' 
                : 'Peta sebaran jadwal murajaah hafalan berdasarkan interval retensi memori'}
            </p>
          </div>
        </div>

        {/* Right Controls: Filters and Month Nav */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 self-start md:self-auto">
          {/* Material Filters */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/70 dark:border-slate-700/70 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {language === 'en' ? 'All' : 'Semua'}
            </button>
            <button
              type="button"
              onClick={() => setFilterType('quran')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                filterType === 'quran'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-3 h-3" />
              <span>{language === 'en' ? 'Quran' : "Al-Qur'an"}</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType('personal')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                filterType === 'personal'
                  ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Library className="w-3 h-3" />
              <span>{language === 'en' ? 'Books' : 'Kitab'}</span>
            </button>
          </div>

          {/* Month Switcher */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 p-1 rounded-xl shadow-2xs">
            <button
              type="button"
              onClick={handlePrevMonth}
              title={language === 'en' ? 'Previous Month' : 'Bulan Sebelumnya'}
              className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleGoToToday}
              className="px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer whitespace-nowrap"
            >
              {currentMonthName} {currentYear}
            </button>

            <button
              type="button"
              onClick={handleNextMonth}
              title={language === 'en' ? 'Next Month' : 'Bulan Berikutnya'}
              className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. LONG-TERM RETENTION & LOAD METRICS STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Metric 1: Scheduled this month */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/80 dark:border-emerald-900/40">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 mb-1">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
              {language === 'en' ? 'Scheduled This Month' : 'Jadwal Bulan Ini'}
            </span>
            <CalendarIcon className="w-3.5 h-3.5 opacity-70" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
              {monthlyMetrics.totalScheduledInMonth}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {language === 'en' ? 'sessions' : 'sesi'}
            </span>
          </div>
        </div>

        {/* Metric 2: Completed reviews */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/80 dark:border-blue-900/40">
          <div className="flex items-center justify-between text-blue-700 dark:text-blue-400 mb-1">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
              {language === 'en' ? 'Completed So Far' : 'Sudah Dimurajaah'}
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 opacity-70" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
              {monthlyMetrics.totalCompletedInMonth}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {language === 'en' ? 'reviews' : 'evaluasi'}
            </span>
          </div>
        </div>

        {/* Metric 3: Peak Day Load */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/80 dark:border-amber-900/40">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 mb-1">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
              {language === 'en' ? 'Peak Day Load' : 'Beban Puncak'}
            </span>
            <Flame className="w-3.5 h-3.5 opacity-70" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
              {monthlyMetrics.maxDayCount}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {language === 'en' ? 'max / day' : 'maks / hari'}
            </span>
          </div>
        </div>

        {/* Metric 4: Long-Term Retention (Mapan Ratio) */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/80 dark:border-indigo-900/40">
          <div className="flex items-center justify-between text-indigo-700 dark:text-indigo-400 mb-1">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
              {language === 'en' ? 'Mapan Retention' : 'Ketahanan Mapan'}
            </span>
            <ShieldCheck className="w-3.5 h-3.5 opacity-70" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
              {monthlyMetrics.retentionHealthPercent}%
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              ({monthlyMetrics.totalMastered}/{monthlyMetrics.totalActive})
            </span>
          </div>
        </div>
      </div>

      {/* 3. CALENDAR MONTH GRID */}
      <div className="space-y-2">
        {/* Day of week headers */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center">
          {weekDayLabels.map((lbl, idx) => (
            <div 
              key={lbl} 
              className={`py-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider ${
                idx === 4 
                  ? 'text-emerald-600 dark:text-emerald-400' // Jumat
                  : idx === 6 
                  ? 'text-rose-500 dark:text-rose-400' // Ahad
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {lbl}
            </div>
          ))}
        </div>

        {/* Day cells grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {calendarDays.map((day) => {
            const planned = scheduleData.plannedMap.get(day.dateStr);
            const completed = scheduleData.completedMap.get(day.dateStr);

            const qPlannedCount = (filterType === 'all' || filterType === 'quran') ? (planned?.quran.length || 0) : 0;
            const pPlannedCount = (filterType === 'all' || filterType === 'personal') ? (planned?.personal.length || 0) : 0;
            const totalPlanned = qPlannedCount + pPlannedCount;

            const qCompletedCount = (filterType === 'all' || filterType === 'quran') ? (completed?.quran.length || 0) : 0;
            const pCompletedCount = (filterType === 'all' || filterType === 'personal') ? (completed?.personal.length || 0) : 0;
            const totalCompleted = qCompletedCount + pCompletedCount;

            const isSelected = day.dateStr === selectedDateStr;
            const isToday = day.isToday;

            // Determine heat styling based on planned review count
            let heatBg = 'bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/80';
            if (!day.isCurrentMonth) {
              heatBg = 'bg-transparent text-slate-300 dark:text-slate-700 opacity-40';
            } else if (totalPlanned > 0) {
              if (totalPlanned >= 8) {
                heatBg = 'bg-emerald-100/90 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800';
              } else if (totalPlanned >= 4) {
                heatBg = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60';
              } else {
                heatBg = 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40';
              }
            }

            return (
              <button
                key={day.dateStr}
                type="button"
                onClick={() => {
                  setSelectedDateStr(day.dateStr);
                  setIsDetailsExpanded(true);
                }}
                className={`min-h-[56px] sm:min-h-[72px] p-1.5 sm:p-2 rounded-2xl border transition-all text-left flex flex-col justify-between relative cursor-pointer group ${heatBg} ${
                  isSelected 
                    ? 'ring-2 ring-emerald-500 dark:ring-emerald-400 border-transparent shadow-sm scale-[1.02] z-10' 
                    : 'border-slate-200/70 dark:border-slate-800/80'
                }`}
              >
                {/* Day number & Today marker */}
                <div className="flex items-center justify-between w-full">
                  <span className={`text-xs sm:text-sm font-bold ${
                    isToday
                      ? 'w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] sm:text-xs font-black shadow-2xs'
                      : isSelected
                      ? 'text-emerald-700 dark:text-emerald-300 font-extrabold'
                      : day.isCurrentMonth
                      ? 'text-slate-800 dark:text-slate-200'
                      : 'text-slate-300 dark:text-slate-600'
                  }`}>
                    {day.dayNumber}
                  </span>

                  {/* Completed icon if review occurred on this day */}
                  {totalCompleted > 0 && day.isCurrentMonth && (
                    <span 
                      title={`${totalCompleted} ${language === 'en' ? 'reviews completed' : 'sesi selesai'}`}
                      className="text-emerald-600 dark:text-emerald-400 shrink-0"
                    >
                      <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-emerald-100 dark:fill-emerald-950" />
                    </span>
                  )}
                </div>

                {/* Badges / dots for planned load */}
                {day.isCurrentMonth && totalPlanned > 0 && (
                  <div className="mt-1 flex items-center gap-1 flex-wrap">
                    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md font-black text-[9px] sm:text-[10px] shrink-0 ${
                      isToday
                        ? 'bg-amber-500 text-white shadow-2xs'
                        : 'bg-emerald-600 dark:bg-emerald-500 text-white'
                    }`}>
                      {totalPlanned}
                    </span>

                    {/* Differentiated tiny indicators for Quran vs Personal */}
                    <div className="hidden sm:flex items-center gap-0.5">
                      {qPlannedCount > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title={`${qPlannedCount} Quran`} />
                      )}
                      {pPlannedCount > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title={`${pPlannedCount} Kitab`} />
                      )}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. SELECTED DATE DETAILS PANEL */}
      <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        {/* Header of Detail Box */}
        <div 
          onClick={() => setIsDetailsExpanded(v => !v)}
          className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800/80 transition-colors"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white capitalize truncate">
                  {selectedDateDetails.formattedTitle}
                </h4>
                {selectedDateDetails.isDateToday && (
                  <span className="px-2 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 font-extrabold text-[10px]">
                    {language === 'en' ? 'Today' : 'Hari Ini'}
                  </span>
                )}
                {selectedDateDetails.isFuture && (
                  <span className="px-2 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-200 font-bold text-[10px]">
                    {language === 'en' ? 'Upcoming' : 'Terjadwal'}
                  </span>
                )}
                {selectedDateDetails.isPast && (
                  <span className="px-2 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-[10px]">
                    {language === 'en' ? 'Past Day' : 'Riwayat'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {selectedDateDetails.totalPlanned > 0
                  ? `${selectedDateDetails.totalPlanned} ${language === 'en' ? 'items planned for review' : 'hafalan terjadwal murajaah'}`
                  : selectedDateDetails.totalCompleted > 0
                  ? `${selectedDateDetails.totalCompleted} ${language === 'en' ? 'reviews completed' : 'sesi murajaah telah tuntas'}`
                  : (language === 'en' ? 'No reviews scheduled on this date' : 'Tidak ada jadwal murajaah pada tanggal ini')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {selectedDateDetails.isDateToday && selectedDateDetails.totalPlanned > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (selectedDateDetails.plannedQuran.length > 0) {
                    setActiveSpace('quran');
                  } else {
                    setActiveSpace('personal');
                  }
                }}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <span>{language === 'en' ? 'Open Space' : 'Buka Ruang'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              className="w-7 h-7 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 cursor-pointer"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${isDetailsExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Expandable Items Content */}
        <AnimatePresence>
          {isDetailsExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-slate-200/80 dark:border-slate-800 p-3.5 sm:p-4 space-y-3"
            >
              {/* PLANNED REVIEWS */}
              {selectedDateDetails.totalPlanned > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {language === 'en' ? 'Planned Material:' : 'Materi Terjadwal:'}
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Quran Pages */}
                    {selectedDateDetails.plannedQuran.map((p) => {
                      const stabilityDays = Math.round((p.fsrsData?.stability || 0) * 0.4025587);
                      const isMapan = p.status === 'mastered_for_now' || stabilityDays >= 30;

                      return (
                        <div 
                          key={p.pageNumber}
                          className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 shadow-2xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                Hal {p.pageNumber} • Juz {p.juzNumber}
                              </span>
                              {isMapan ? (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                                  Mapan ({stabilityDays}d)
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                                  Aktif ({stabilityDays}d)
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              QS. {p.surahNameEn} ({p.ayahRange || 'Ayat'})
                            </p>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => onOpenMushafViewer(p.pageNumber)}
                              title={language === 'en' ? 'View Page' : 'Lihat Halaman'}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {selectedDateDetails.isDateToday && (
                              <button
                                type="button"
                                onClick={() => setActiveSpace('quran')}
                                title={language === 'en' ? 'Open Quran Space' : 'Buka Ruang Quran'}
                                className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Personal Cards */}
                    {selectedDateDetails.plannedPersonal.map(({ item: it, bookTitle }) => {
                      const stabilityDays = Math.round((it.fsrsData?.stability || 0) * 0.4025587);

                      return (
                        <div 
                          key={it.id}
                          className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 shadow-2xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                {bookTitle}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                                {stabilityDays}d
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                              {it.question || (language === 'en' ? 'Card Item' : 'Kartu Materi')}
                            </p>
                          </div>

                          {selectedDateDetails.isDateToday && (
                            <button
                              type="button"
                              onClick={() => setActiveSpace('personal')}
                              title={language === 'en' ? 'Open Personal Space' : 'Buka Ruang Pribadi'}
                              className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shrink-0"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* COMPLETED REVIEWS ON THIS DAY */}
              {selectedDateDetails.totalCompleted > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {language === 'en' ? 'Evaluations Completed on this day:' : 'Riwayat Evaluasi Selesai:'}
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedDateDetails.completedQuran.map(({ page: p, rating }, idx) => (
                      <div 
                        key={`${p.pageNumber}-${idx}`}
                        className="p-2 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                            Hal {p.pageNumber} • {p.surahNameEn}
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                          rating === 3 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                            : rating === 2 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {rating === 3 ? 'Mutqin' : rating === 2 ? 'Cukup' : 'Ulang'}
                        </span>
                      </div>
                    ))}

                    {selectedDateDetails.completedPersonal.map(({ item: it, rating, bookTitle }, idx) => (
                      <div 
                        key={`${it.id}-${idx}`}
                        className="p-2 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                            {bookTitle}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">{it.question}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 shrink-0">
                          Selesai
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ZERO STATE FOR SELECTED DATE */}
              {selectedDateDetails.totalPlanned === 0 && selectedDateDetails.totalCompleted === 0 && (
                <div className="py-4 text-center space-y-1.5">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {language === 'en' 
                      ? 'No review sessions scheduled on this date.' 
                      : 'Tidak ada jadwal murajaah pada tanggal ini.'}
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    {language === 'en'
                      ? 'Enjoy your free time, or use it for adding new memorization (Ziyadah) in Quran space.'
                      : 'Waktu luang optimal untuk menambah hafalan baru (Ziyadah) atau memperkuat bagian yang masih ragu.'}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
