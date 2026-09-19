import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  BookOpen, 
  Sparkles, 
  Flame, 
  Eye, 
  Play, 
  ShieldCheck, 
  Filter,
  CalendarCheck,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QuranPageItem } from '../../types';
import { JUZ_LIST } from '../../data/quranData';
import { isDue } from '../../lib/fsrs';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  quranPages: QuranPageItem[];
  language: string;
  initialJuzFilter?: number | null;
  onStartReview: (juzNumber?: number) => void;
  onOpenMushafViewer: (pageNumber: number) => void;
}

// Helper to format Date as local YYYY-MM-DD
function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const QuranReviewCalendarModal: React.FC<Props> = ({
  isOpen,
  onClose,
  quranPages,
  language,
  initialJuzFilter = null,
  onStartReview,
  onOpenMushafViewer
}) => {
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => formatLocalDate(today), [today]);

  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth()); // 0 - 11
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);
  const [juzFilter, setJuzFilter] = useState<number | 'all'>(initialJuzFilter || 'all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'mapan' | 'active'>('all');

  // Sync initial Juz filter if passed
  useEffect(() => {
    if (initialJuzFilter) {
      setJuzFilter(initialJuzFilter);
    }
  }, [initialJuzFilter]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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

    // Next month padding to complete 7-column rows
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

  // Aggregate Quran review schedules and completed logs
  const scheduleData = useMemo(() => {
    const plannedMap = new Map<string, QuranPageItem[]>();
    const completedMap = new Map<string, { page: QuranPageItem; rating: number }[]>();

    (quranPages || []).forEach(p => {
      if (!p.isActive) return;

      // Filter by Juz if specified
      if (juzFilter !== 'all' && p.juzNumber !== juzFilter) return;

      // Filter by Status if specified
      const stabilityDays = Math.round((p.fsrsData?.stability || 0) * 0.4025587);
      const isMapan = p.status === 'mastered_for_now' || stabilityDays >= 30;
      if (statusFilter === 'mapan' && !isMapan) return;
      if (statusFilter === 'active' && isMapan) return;

      // Check planned next review
      const nextReview = p.fsrsData?.nextReview;
      if (nextReview) {
        const nextDate = new Date(nextReview);
        const nextStr = formatLocalDate(nextDate);

        if (nextDate <= today || isDue(nextReview, p.isActive)) {
          if (!plannedMap.has(todayStr)) plannedMap.set(todayStr, []);
          plannedMap.get(todayStr)!.push(p);
        } else {
          if (!plannedMap.has(nextStr)) plannedMap.set(nextStr, []);
          plannedMap.get(nextStr)!.push(p);
        }
      } else {
        if (!plannedMap.has(todayStr)) plannedMap.set(todayStr, []);
        plannedMap.get(todayStr)!.push(p);
      }

      // Check Mapan custom rhythms (weekly/monthly)
      if (p.mapanSchedule && p.mapanSchedule.mode !== 'fsrs') {
        if (p.mapanSchedule.mode === 'weekly' && typeof p.mapanSchedule.weeklyDay === 'number') {
          const targetDay = p.mapanSchedule.weeklyDay;
          calendarDays.forEach(calDay => {
            if (calDay.isCurrentMonth && calDay.dateObj > today && calDay.dateObj.getDay() === targetDay) {
              if (!plannedMap.has(calDay.dateStr)) plannedMap.set(calDay.dateStr, []);
              const list = plannedMap.get(calDay.dateStr)!;
              if (!list.some(x => x.pageNumber === p.pageNumber)) {
                list.push(p);
              }
            }
          });
        } else if (p.mapanSchedule.mode === 'monthly' && typeof p.mapanSchedule.monthlyDate === 'number') {
          const targetDateNum = p.mapanSchedule.monthlyDate;
          calendarDays.forEach(calDay => {
            if (calDay.isCurrentMonth && calDay.dayNumber === targetDateNum && calDay.dateObj > today) {
              if (!plannedMap.has(calDay.dateStr)) plannedMap.set(calDay.dateStr, []);
              const list = plannedMap.get(calDay.dateStr)!;
              if (!list.some(x => x.pageNumber === p.pageNumber)) {
                list.push(p);
              }
            }
          });
        }
      }

      // Check historical review logs
      (p.reviewLogs || []).forEach(log => {
        if (log.date) {
          const logDateStr = formatLocalDate(new Date(log.date));
          if (!completedMap.has(logDateStr)) completedMap.set(logDateStr, []);
          completedMap.get(logDateStr)!.push({
            page: p,
            rating: log.rating || 3
          });
        }
      });
    });

    return { plannedMap, completedMap };
  }, [quranPages, juzFilter, statusFilter, today, todayStr, calendarDays]);

  // Monthly summary metrics for Quran
  const metrics = useMemo(() => {
    let scheduledInMonth = 0;
    let completedInMonth = 0;
    let peakDayCount = 0;

    calendarDays.forEach(day => {
      if (!day.isCurrentMonth) return;
      const planned = scheduleData.plannedMap.get(day.dateStr) || [];
      const completed = scheduleData.completedMap.get(day.dateStr) || [];

      scheduledInMonth += planned.length;
      completedInMonth += completed.length;

      if (planned.length > peakDayCount) {
        peakDayCount = planned.length;
      }
    });

    const activeInScope = (quranPages || []).filter(p => {
      if (!p.isActive) return false;
      if (juzFilter !== 'all' && p.juzNumber !== juzFilter) return false;
      return true;
    });

    const mapanInScope = activeInScope.filter(p => {
      const stabilityDays = Math.round((p.fsrsData?.stability || 0) * 0.4025587);
      return p.status === 'mastered_for_now' || stabilityDays >= 30;
    });

    const retentionRate = activeInScope.length > 0 
      ? Math.round((mapanInScope.length / activeInScope.length) * 100) 
      : 0;

    return {
      scheduledInMonth,
      completedInMonth,
      peakDayCount,
      activeCount: activeInScope.length,
      mapanCount: mapanInScope.length,
      retentionRate
    };
  }, [calendarDays, scheduleData, quranPages, juzFilter]);

  // Selected date details
  const selectedDetails = useMemo(() => {
    const planned = scheduleData.plannedMap.get(selectedDateStr) || [];
    const completed = scheduleData.completedMap.get(selectedDateStr) || [];

    const isDateToday = selectedDateStr === todayStr;
    const selectedObj = new Date(selectedDateStr + 'T00:00:00');
    const isPast = selectedObj < new Date(todayStr + 'T00:00:00');
    const isFuture = selectedObj > new Date(todayStr + 'T00:00:00');

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
      planned,
      completed
    };
  }, [selectedDateStr, scheduleData, todayStr, language]);

  if (!isOpen) return null;

  return (
    <div 
      data-no-swipe="true"
      className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        id="quran-review-calendar-modal"
        className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 bg-slate-50/70 dark:bg-slate-900/90">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                  {language === 'en' ? 'Quran Review Schedule' : 'Kalender Jadwal Murajaah Al-Qur\'an'}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-500" />
                  {language === 'en' ? 'Adaptive Retention' : 'Retensi Adaptif'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {language === 'en' 
                  ? 'Visual timeline of spaced Quran reviews & long-term retention' 
                  : 'Peta sebaran jadwal murajaah hafalan Al-Qur\'an berdasarkan interval retensi cerdas'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SCROLLABLE MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* CONTROLS ROW: Juz Selector, Status Filter, Month Switcher */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            {/* Left Filter: Juz Filter & Status */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Juz Filter Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
                <BookOpen className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span className="text-slate-500 dark:text-slate-400">Juz:</span>
                <select
                  value={juzFilter}
                  onChange={(e) => {
                    const val = e.target.value;
                    setJuzFilter(val === 'all' ? 'all' : parseInt(val, 10));
                  }}
                  className="bg-transparent font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value="all" className="dark:bg-slate-900">
                    {language === 'en' ? 'All Juz (1-30)' : 'Semua Juz (1-30)'}
                  </option>
                  {JUZ_LIST.map(j => (
                    <option key={j.juzNumber} value={j.juzNumber} className="dark:bg-slate-900">
                      Juz {j.juzNumber} ({j.surahSpan})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Segmented Buttons */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    statusFilter === 'all' 
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-2xs' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {language === 'en' ? 'All' : 'Semua'}
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('active')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    statusFilter === 'active' 
                      ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 font-bold shadow-2xs' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {language === 'en' ? 'Active' : 'Aktif'}
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('mapan')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    statusFilter === 'mapan' 
                      ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 font-bold shadow-2xs' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {language === 'en' ? 'Mapan' : 'Mapan'}
                </button>
              </div>
            </div>

            {/* Right: Month Switcher */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 rounded-xl shadow-2xs self-start md:self-auto">
              <button
                type="button"
                onClick={handlePrevMonth}
                title={language === 'en' ? 'Previous Month' : 'Bulan Sebelumnya'}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleGoToToday}
                className="px-3 py-1 text-xs font-bold text-slate-800 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer whitespace-nowrap"
              >
                {currentMonthName} {currentYear}
              </button>

              <button
                type="button"
                onClick={handleNextMonth}
                title={language === 'en' ? 'Next Month' : 'Bulan Berikutnya'}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* QURAN METRICS SUMMARY */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                {language === 'en' ? 'Scheduled This Month' : 'Jadwal Bulan Ini'}
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {metrics.scheduledInMonth}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {language === 'en' ? 'pages' : 'halaman'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider block mb-1">
                {language === 'en' ? 'Completed Murajaah' : 'Sudah Dimurajaah'}
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {metrics.completedInMonth}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {language === 'en' ? 'evaluations' : 'evaluasi'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block mb-1">
                {language === 'en' ? 'Peak Day Load' : 'Beban Harian Maks'}
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {metrics.peakDayCount}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {language === 'en' ? 'pages / day' : 'hal / hari'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
              <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block mb-1">
                {language === 'en' ? 'Mapan Retention' : 'Ketahanan Mapan'}
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {metrics.retentionRate}%
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  ({metrics.mapanCount}/{metrics.activeCount})
                </span>
              </div>
            </div>
          </div>

          {/* CALENDAR GRID */}
          <div className="space-y-1.5">
            {/* Day Header */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {weekDayLabels.map((lbl, idx) => (
                <div 
                  key={lbl} 
                  className={`py-1 text-[11px] font-bold uppercase tracking-wider ${
                    idx === 4 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : idx === 6 
                      ? 'text-rose-500 dark:text-rose-400' 
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {lbl}
                </div>
              ))}
            </div>

            {/* Days Cells */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {calendarDays.map((day) => {
                const plannedList = scheduleData.plannedMap.get(day.dateStr) || [];
                const completedList = scheduleData.completedMap.get(day.dateStr) || [];

                const plannedCount = plannedList.length;
                const completedCount = completedList.length;
                const isSelected = day.dateStr === selectedDateStr;
                const isToday = day.isToday;

                let cellBg = 'bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80';
                if (!day.isCurrentMonth) {
                  cellBg = 'bg-transparent text-slate-300 dark:text-slate-700 opacity-40';
                } else if (plannedCount > 0) {
                  if (plannedCount >= 8) {
                    cellBg = 'bg-emerald-100/90 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800';
                  } else if (plannedCount >= 4) {
                    cellBg = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60';
                  } else {
                    cellBg = 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40';
                  }
                }

                return (
                  <button
                    key={day.dateStr}
                    type="button"
                    onClick={() => setSelectedDateStr(day.dateStr)}
                    className={`min-h-[50px] sm:min-h-[64px] p-1 sm:p-1.5 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer ${cellBg} ${
                      isSelected 
                        ? 'ring-2 ring-emerald-500 dark:ring-emerald-400 border-transparent shadow-xs scale-[1.02] z-10' 
                        : 'border-slate-200/70 dark:border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-xs font-bold ${
                        isToday
                          ? 'w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black'
                          : isSelected
                          ? 'text-emerald-700 dark:text-emerald-300 font-extrabold'
                          : day.isCurrentMonth
                          ? 'text-slate-800 dark:text-slate-200'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}>
                        {day.dayNumber}
                      </span>

                      {completedCount > 0 && day.isCurrentMonth && (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      )}
                    </div>

                    {day.isCurrentMonth && plannedCount > 0 && (
                      <div className="mt-1 flex items-center gap-1">
                        <span className={`inline-flex items-center px-1.5 py-0.2 rounded-md font-black text-[9px] sm:text-[10px] ${
                          isToday 
                            ? 'bg-amber-500 text-white shadow-2xs' 
                            : 'bg-emerald-600 dark:bg-emerald-500 text-white'
                        }`}>
                          {plannedCount} <span className="hidden sm:inline ml-0.5">hal</span>
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* DETAIL DRAWER FOR SELECTED DATE */}
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white capitalize">
                    {selectedDetails.formattedTitle}
                  </h3>
                  {selectedDetails.isDateToday && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 font-extrabold text-[10px]">
                      {language === 'en' ? 'Today' : 'Hari Ini'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {selectedDetails.planned.length > 0 
                    ? `${selectedDetails.planned.length} ${language === 'en' ? 'Quran pages scheduled' : 'halaman Al-Qur\'an terjadwal murajaah'}`
                    : (language === 'en' ? 'No Quran reviews scheduled' : 'Tidak ada jadwal murajaah Al-Qur\'an')}
                </p>
              </div>

              {selectedDetails.isDateToday && selectedDetails.planned.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onStartReview(juzFilter !== 'all' ? juzFilter : undefined);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all self-start sm:self-auto"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>{language === 'en' ? 'Start Quran Review' : 'Mulai Murajaah'}</span>
                </button>
              )}
            </div>

            {/* PLANNED PAGES LIST */}
            {selectedDetails.planned.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {selectedDetails.planned.map(p => {
                  const stabilityDays = Math.round((p.fsrsData?.stability || 0) * 0.4025587);
                  const isMapan = p.status === 'mastered_for_now' || stabilityDays >= 30;

                  return (
                    <div
                      key={p.pageNumber}
                      className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
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

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => onOpenMushafViewer(p.pageNumber)}
                          title={language === 'en' ? 'View Page' : 'Lihat Halaman'}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {selectedDetails.isDateToday && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onStartReview(p.juzNumber);
                            }}
                            title={language === 'en' ? 'Review this Juz' : 'Murajaah Juz ini'}
                            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5 fill-white" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* COMPLETED PAGES LIST ON THIS DAY */}
            {selectedDetails.completed.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {language === 'en' ? 'Evaluated on this day:' : 'Riwayat Evaluasi Selesai:'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedDetails.completed.map(({ page: p, rating }, idx) => (
                    <div
                      key={`${p.pageNumber}-${idx}`}
                      className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2"
                    >
                      <p className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                        Hal {p.pageNumber} • {p.surahNameEn} (Juz {p.juzNumber})
                      </p>
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
                </div>
              </div>
            )}

            {/* EMPTY STATE */}
            {selectedDetails.planned.length === 0 && selectedDetails.completed.length === 0 && (
              <div className="py-4 text-center text-xs text-slate-500 dark:text-slate-400">
                {language === 'en' 
                  ? 'No review sessions recorded or scheduled for this date.' 
                  : 'Tidak ada sesi murajaah yang tercatat atau dijadwalkan pada tanggal ini.'}
              </div>
            )}
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900 shrink-0">
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            {language === 'en' 
              ? 'Click on any date to inspect Quran pages and long-term retention rhythm.' 
              : 'Klik pada tanggal untuk melihat rincian halaman dan ritme retensi jangka panjang.'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold text-xs cursor-pointer ml-auto transition-colors"
          >
            {language === 'en' ? 'Close' : 'Tutup'}
          </button>
        </div>
      </div>
    </div>
  );
};
