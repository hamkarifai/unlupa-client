import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  BookOpen, 
  Sparkles, 
  Eye, 
  Play, 
  CalendarCheck,
  FolderTree,
  RotateCcw,
  Clock
} from 'lucide-react';
import { Book, BookItem, Chapter } from '../../types';
import { isDue, getNonQuranIntervalDays } from '../../lib/fsrs';
import { BilingualCardText } from '../common/BilingualCardText';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  book: Book;
  allBooks?: Book[];
  onSelectBook?: (b: Book) => void;
  items: BookItem[];
  chapters?: Chapter[];
  language: string;
  initialChapterFilter?: string | null;
  onStartReview: (chapterId?: string) => void;
  onPreviewItem?: (item: BookItem) => void;
}

// Helper to format Date as local YYYY-MM-DD
function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const BookReviewCalendarModal: React.FC<Props> = ({
  isOpen,
  onClose,
  book,
  allBooks = [],
  onSelectBook,
  items,
  chapters = [],
  language,
  initialChapterFilter = null,
  onStartReview,
  onPreviewItem
}) => {
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => formatLocalDate(today), [today]);

  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth()); // 0 - 11
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);
  const [chapterFilter, setChapterFilter] = useState<string | 'all'>(initialChapterFilter || 'all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'mapan' | 'active'>('all');
  const [includeProjection, setIncludeProjection] = useState<boolean>(false);

  // Map chapter IDs to title
  const chapterMap = useMemo(() => {
    const map = new Map<string, string>();
    chapters.forEach(c => map.set(c.id, c.title));
    return map;
  }, [chapters]);

  // Sync initial chapter filter if passed
  useEffect(() => {
    if (initialChapterFilter) {
      setChapterFilter(initialChapterFilter);
    } else {
      setChapterFilter('all');
    }
  }, [initialChapterFilter, book.id]);

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

  // Aggregate book review schedules (immediate & projected) and completed history
  const scheduleData = useMemo(() => {
    const plannedMap = new Map<string, { item: BookItem; isProjected?: boolean; isOverdue?: boolean; overdueDays?: number }[]>();
    const completedMap = new Map<string, { item: BookItem; rating: number }[]>();

    const monthStartDate = new Date(currentYear, currentMonth, 1);
    const monthEndDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    (items || []).forEach(it => {
      if (it.bookId !== book.id) return;
      if (!it.isActive) return;

      // Filter by Chapter if specified
      if (chapterFilter !== 'all') {
        if (chapterFilter === 'unassigned') {
          if (it.chapterId && chapters.some(c => c.id === it.chapterId)) return;
        } else if (it.chapterId !== chapterFilter) {
          return;
        }
      }

      // Filter by Status if specified
      const intervalDays = getNonQuranIntervalDays(it.fsrsData);
      const isMapan = it.status === 'mastered' || intervalDays >= 30;
      if (statusFilter === 'mapan' && !isMapan) return;
      if (statusFilter === 'active' && isMapan) return;

      // 1. Immediate Planned Review
      const nextReview = it.fsrsData?.nextReview;
      let primaryDueDate: Date;
      let isOverdue = false;
      let overdueDays = 0;

      if (nextReview) {
        const nextDate = new Date(nextReview);
        if (nextDate <= today || isDue(nextReview, it.isActive)) {
          primaryDueDate = new Date(today);
          const diffMs = today.getTime() - nextDate.getTime();
          overdueDays = Math.max(1, Math.floor(diffMs / 86400000));
          isOverdue = formatLocalDate(nextDate) !== todayStr;
        } else {
          primaryDueDate = nextDate;
        }
      } else {
        primaryDueDate = new Date(today);
      }

      const primaryStr = formatLocalDate(primaryDueDate);
      if (!plannedMap.has(primaryStr)) plannedMap.set(primaryStr, []);
      const primaryList = plannedMap.get(primaryStr)!;
      if (!primaryList.some(entry => entry.item.id === it.id)) {
        primaryList.push({ item: it, isProjected: false, isOverdue, overdueDays });
      }

      // 2. Projected Future Reviews into Subsequent Months (Only if includeProjection is enabled)
      // By default disabled so calendar matches exact definitive FSRS schedules (12 items = 12 reviews)
      if (includeProjection && primaryDueDate < monthEndDate) {
        const stepDays = Math.max(1, intervalDays || 1);
        let curProjDate = new Date(primaryDueDate);
        
        // Advance in intervals up to 1 year ahead
        const oneYearAhead = new Date(today);
        oneYearAhead.setFullYear(oneYearAhead.getFullYear() + 1);

        for (let cycle = 0; cycle < 12; cycle++) {
          curProjDate = new Date(curProjDate.getTime() + stepDays * 86400000);
          if (curProjDate > oneYearAhead) break;

          // Check if this date falls within the calendar grid view
          if (curProjDate >= monthStartDate && curProjDate <= monthEndDate) {
            const projStr = formatLocalDate(curProjDate);
            if (!plannedMap.has(projStr)) plannedMap.set(projStr, []);
            const list = plannedMap.get(projStr)!;
            if (!list.some(entry => entry.item.id === it.id)) {
              list.push({ item: it, isProjected: true });
            }
          }
        }
      }

      // 3. Historical Review Logs (Completed)
      (it.reviewLogs || []).forEach(log => {
        if (log.date) {
          const logDateStr = formatLocalDate(new Date(log.date));
          if (!completedMap.has(logDateStr)) completedMap.set(logDateStr, []);
          completedMap.get(logDateStr)!.push({
            item: it,
            rating: log.rating || 3
          });
        }
      });
    });

    return { plannedMap, completedMap };
  }, [items, book.id, chapterFilter, statusFilter, chapters, today, currentYear, currentMonth, includeProjection]);

  // Monthly summary metrics for this specific book
  const metrics = useMemo(() => {
    let scheduledInMonth = 0;
    let definitiveInMonth = 0;
    let projectedInMonth = 0;
    let completedInMonth = 0;
    let peakDefinitiveCount = 0;
    let peakDayCount = 0;

    calendarDays.forEach(day => {
      if (!day.isCurrentMonth) return;
      const planned = scheduleData.plannedMap.get(day.dateStr) || [];
      const completed = scheduleData.completedMap.get(day.dateStr) || [];

      let dayDefCount = 0;
      let dayProjCount = 0;
      planned.forEach(p => {
        if (p.isProjected) dayProjCount++;
        else dayDefCount++;
      });

      definitiveInMonth += dayDefCount;
      projectedInMonth += dayProjCount;
      scheduledInMonth += planned.length;
      completedInMonth += completed.length;

      if (dayDefCount > peakDefinitiveCount) {
        peakDefinitiveCount = dayDefCount;
      }
      if (planned.length > peakDayCount) {
        peakDayCount = planned.length;
      }
    });

    const activeInScope = (items || []).filter(it => {
      if (it.bookId !== book.id) return false;
      if (!it.isActive) return false;
      if (chapterFilter !== 'all') {
        if (chapterFilter === 'unassigned') {
          if (it.chapterId && chapters.some(c => c.id === it.chapterId)) return false;
        } else if (it.chapterId !== chapterFilter) {
          return false;
        }
      }
      return true;
    });

    const mapanInScope = activeInScope.filter(it => {
      const intervalDays = getNonQuranIntervalDays(it.fsrsData);
      return it.status === 'mastered' || intervalDays >= 30;
    });

    const retentionRate = activeInScope.length > 0 
      ? Math.round((mapanInScope.length / activeInScope.length) * 100) 
      : 0;

    return {
      scheduledInMonth,
      definitiveInMonth,
      projectedInMonth,
      peakDefinitiveCount,
      peakDayCount,
      completedInMonth,
      activeCount: activeInScope.length,
      mapanCount: mapanInScope.length,
      retentionRate
    };
  }, [calendarDays, scheduleData, items, book.id, chapterFilter, chapters]);

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
        id="book-review-calendar-modal"
        className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 bg-slate-50/70 dark:bg-slate-900/90">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                  {book.title}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold text-[10px] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  {language === 'en' ? 'Book Calendar' : 'Kalender Buku'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {language === 'en' 
                  ? 'Visual timeline of spaced flashcard reviews & future workload' 
                  : 'Peta sebaran jadwal murajaah kartu kitab berdasarkan interval retensi FSRS cerdas'}
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
          {/* CONTROLS ROW: Book Selector (if multiple), Chapter Selector, Status Filter, Month Switcher */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            {/* Left Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Optional Book Switcher */}
              {allBooks.length > 1 && onSelectBook && (
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="text-slate-500 dark:text-slate-400">{language === 'en' ? 'Book:' : 'Kitab:'}</span>
                  <select
                    value={book.id}
                    onChange={(e) => {
                      const selected = allBooks.find(b => b.id === e.target.value);
                      if (selected) {
                        onSelectBook(selected);
                        setChapterFilter('all');
                      }
                    }}
                    className="bg-transparent font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer max-w-[150px] truncate"
                  >
                    {allBooks.map(b => (
                      <option key={b.id} value={b.id} className="dark:bg-slate-900">
                        {b.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Chapter Filter Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
                <FolderTree className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                <span className="text-slate-500 dark:text-slate-400">{language === 'en' ? 'Chapter:' : 'Bab:'}</span>
                <select
                  value={chapterFilter}
                  onChange={(e) => setChapterFilter(e.target.value)}
                  className="bg-transparent font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer max-w-[170px] truncate"
                >
                  <option value="all" className="dark:bg-slate-900">
                    {language === 'en' ? `All Chapters (${chapters.length})` : `Semua Bab (${chapters.length})`}
                  </option>
                  {chapters.map(c => (
                    <option key={c.id} value={c.id} className="dark:bg-slate-900">
                      {c.title}
                    </option>
                  ))}
                  <option value="unassigned" className="dark:bg-slate-900">
                    {language === 'en' ? 'Unassigned Cards' : 'Tanpa Bab'}
                  </option>
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
                      ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 font-bold shadow-2xs' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {language === 'en' ? 'Mastered' : 'Mapan'}
                </button>
              </div>

              {/* Toggle Simulasi Proyeksi */}
              <button
                type="button"
                onClick={() => setIncludeProjection(!includeProjection)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  includeProjection
                    ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 shadow-2xs ring-2 ring-purple-400/30'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={includeProjection 
                  ? 'Sedang menampilkan jadwal pasti FSRS (Biru) + simulasi siklus masa depan (Ungu)' 
                  : 'Aktifkan untuk melihat simulasi siklus pengulangan masa depan (Ungu)'}
              >
                <Sparkles className={`w-3.5 h-3.5 ${includeProjection ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`} />
                <span>
                  {language === 'en' 
                    ? (includeProjection ? 'Projection Active (Violet)' : 'Simulate Future') 
                    : (includeProjection ? 'Proyeksi Aktif (Warna Ungu)' : 'Simulasi Proyeksi')}
                </span>
              </button>
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
                title={language === 'en' ? 'Jump to Today' : 'Kembali ke Hari Ini'}
                className="px-3 py-1 text-xs font-bold text-slate-800 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer whitespace-nowrap"
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

          {/* BOOK METRICS SUMMARY */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
              <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block mb-1">
                {language === 'en' ? 'Scheduled This Month' : 'Jadwal Bulan Ini'}
              </span>
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {metrics.definitiveInMonth}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {language === 'en' ? 'official (FSRS)' : 'kartu pasti'}
                </span>
                {includeProjection && metrics.projectedInMonth > 0 && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700 border-dashed">
                    <Sparkles className="w-2.5 h-2.5 text-purple-500" />
                    +{metrics.projectedInMonth} {language === 'en' ? 'sim' : 'simulasi'}
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                {language === 'en' ? 'Completed Reviews' : 'Sudah Diulang'}
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {metrics.completedInMonth}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {language === 'en' ? 'reps' : 'kali review'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block mb-1">
                {language === 'en' ? 'Peak Day Load' : 'Beban Harian Maks'}
              </span>
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {metrics.peakDefinitiveCount}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {language === 'en' ? 'pasti / day' : 'pasti / hari'}
                </span>
                {includeProjection && metrics.peakDayCount > metrics.peakDefinitiveCount && (
                  <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                    (maks {metrics.peakDayCount} dgn simulasi)
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40">
              <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider block mb-1">
                {language === 'en' ? 'Mastery Retention' : 'Ketahanan Mapan'}
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

          {/* PROJECTION COLOR LEGEND BANNER */}
          {includeProjection && (
            <div className="flex items-center justify-between gap-3 px-3.5 py-2 rounded-2xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-xs flex-wrap animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <span className="font-bold text-purple-900 dark:text-purple-200 text-xs">
                  {language === 'en' ? 'Visual Color Legend:' : 'Keterangan Warna Kalender:'}
                </span>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-indigo-600 inline-block shadow-2xs"></span>
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    {language === 'en' ? 'Solid Blue = Official FSRS Schedule' : 'Biru Solid = Jadwal Pasti FSRS (Resmi)'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-purple-100 dark:bg-purple-900/60 border border-purple-400 dark:border-purple-500 border-dashed inline-block"></span>
                  <span className="text-[11px] font-semibold text-purple-800 dark:text-purple-300">
                    {language === 'en' ? 'Dashed Violet (~) = Simulated Repeat Cycle' : 'Ungu Bergaris (~) = Simulasi Siklus Lanjutan'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* CALENDAR GRID */}
          <div className="space-y-1.5">
            {/* Day Header */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {weekDayLabels.map((lbl, idx) => (
                <div 
                  key={lbl} 
                  className={`py-1 text-[11px] font-bold uppercase tracking-wider ${
                    idx === 4 
                      ? 'text-indigo-600 dark:text-indigo-400' 
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

                const definitiveList = plannedList.filter(p => !p.isProjected);
                const projectedList = plannedList.filter(p => p.isProjected);

                const defCount = definitiveList.length;
                const projCount = projectedList.length;
                const plannedCount = plannedList.length;
                const completedCount = completedList.length;
                const isSelected = day.dateStr === selectedDateStr;
                const isToday = day.isToday;

                let cellBg = 'bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80';
                if (!day.isCurrentMonth) {
                  cellBg = 'bg-transparent text-slate-300 dark:text-slate-700 opacity-40';
                } else if (defCount > 0) {
                  if (defCount >= 100) {
                    cellBg = 'bg-rose-100/90 dark:bg-rose-950/70 border-rose-300 dark:border-rose-800';
                  } else {
                    cellBg = 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/40';
                  }
                } else if (projCount > 0) {
                  cellBg = 'bg-purple-50/35 dark:bg-purple-950/20 border-purple-200/70 dark:border-purple-900/50 border-dashed hover:bg-purple-50/60 dark:hover:bg-purple-900/30';
                }

                return (
                  <button
                    key={day.dateStr}
                    type="button"
                    onClick={() => setSelectedDateStr(day.dateStr)}
                    className={`min-h-[52px] sm:min-h-[66px] p-1 sm:p-1.5 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer ${cellBg} ${
                      isSelected 
                        ? 'ring-2 ring-indigo-500 dark:ring-indigo-400 border-transparent shadow-xs scale-[1.02] z-10' 
                        : defCount > 0
                        ? 'border-slate-200/70 dark:border-slate-800/80'
                        : projCount > 0
                        ? 'border-purple-300/60 dark:border-purple-800/60'
                        : 'border-slate-200/70 dark:border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-xs font-bold ${
                        isToday
                          ? 'w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black'
                          : isSelected
                          ? 'text-indigo-700 dark:text-indigo-300 font-extrabold'
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
                      <div className="mt-1 flex items-center gap-1 flex-wrap">
                        {/* 1. Definitive FSRS count badge (solid indigo/rose) */}
                        {defCount > 0 && (
                          <span 
                            title={`${defCount} kartu pasti terjadwal FSRS`}
                            className={`inline-flex items-center px-1.5 py-0.2 rounded-md font-black text-[9px] sm:text-[10px] ${
                              defCount >= 100
                                ? 'bg-rose-600 text-white shadow-2xs'
                                : isToday 
                                ? 'bg-indigo-600 text-white shadow-2xs' 
                                : 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-2xs'
                            }`}
                          >
                            {defCount} {projCount === 0 && <span className="hidden sm:inline ml-0.5">kartu</span>}
                          </span>
                        )}

                        {/* 2. Projected/simulated count badge (violet/purple dashed with ~) */}
                        {projCount > 0 && (
                          <span 
                            title={`${projCount} kartu simulasi proyeksi masa depan`}
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md font-black text-[9px] sm:text-[10px] bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700/80 border-dashed"
                          >
                            <Sparkles className="w-2.5 h-2.5 text-purple-500 shrink-0" />
                            <span>~{projCount}</span>
                            {defCount === 0 && <span className="hidden sm:inline ml-0.5">sim</span>}
                          </span>
                        )}
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
                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200 font-extrabold text-[10px]">
                      {language === 'en' ? 'Today' : 'Hari Ini'}
                    </span>
                  )}
                  {selectedDetails.isPast && !selectedDetails.isDateToday && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px]">
                      {language === 'en' ? 'Past Date' : 'Tanggal Lalu'}
                    </span>
                  )}
                  {selectedDetails.isFuture && (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-bold text-[10px]">
                      {language === 'en' ? 'Future Schedule' : 'Jadwal Mendatang'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {selectedDetails.planned.length > 0 ? (
                    <span>
                      <strong className="text-indigo-600 dark:text-indigo-400 font-bold">
                        {selectedDetails.planned.filter(p => !p.isProjected).length} {language === 'en' ? 'official FSRS cards' : 'kartu pasti FSRS'}
                      </strong>
                      {selectedDetails.planned.some(p => p.isProjected) && (
                        <span className="ml-1 text-purple-700 dark:text-purple-300 font-semibold">
                          + {selectedDetails.planned.filter(p => p.isProjected).length} {language === 'en' ? 'simulated' : 'simulasi proyeksi'}
                        </span>
                      )}
                      {' '}{language === 'en' ? 'scheduled for review' : 'terjadwal untuk diulang'}
                    </span>
                  ) : (
                    language === 'en' ? 'No cards scheduled for review on this date' : 'Tidak ada kartu yang perlu diulang pada tanggal ini'
                  )}
                </p>
              </div>

              {selectedDetails.isDateToday && selectedDetails.planned.some(p => !p.isProjected) && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onStartReview(chapterFilter !== 'all' && chapterFilter !== 'unassigned' ? chapterFilter : undefined);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all self-start sm:self-auto"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>{language === 'en' ? 'Start Review' : 'Mulai Review Kitab Ini'}</span>
                </button>
              )}
            </div>

            {/* PLANNED CARDS LIST */}
            {selectedDetails.planned.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                {selectedDetails.planned.map(({ item, isProjected, isOverdue, overdueDays }) => {
                  const intervalDays = getNonQuranIntervalDays(item.fsrsData);
                  const isMapan = item.status === 'mastered' || intervalDays >= 30;
                  const chTitle = item.chapterId ? chapterMap.get(item.chapterId) : null;

                  return (
                    <div
                      key={`${item.id}-${isProjected ? 'proj' : 'def'}`}
                      className={`p-3 rounded-xl border flex flex-col justify-between gap-2 shadow-2xs group transition-all ${
                        isProjected
                          ? 'bg-purple-50/30 dark:bg-purple-950/20 border-purple-200/80 dark:border-purple-800/60 border-dashed'
                          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                      }`}
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 max-w-[180px] truncate">
                            {chTitle || (language === 'en' ? 'General' : 'Umum')}
                          </span>

                          <div className="flex items-center gap-1 flex-wrap">
                            {isOverdue && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300/60 dark:border-rose-800/60">
                                {overdueDays && overdueDays > 1 ? `Terlambat ${overdueDays} hari` : 'Tertunggak'}
                              </span>
                            )}
                            {isProjected ? (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700 border-dashed flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5 text-purple-500" />
                                <span>{language === 'en' ? 'Projected Cycle' : 'Simulasi Siklus'}</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300">
                                Jadwal Pasti FSRS
                              </span>
                            )}
                            {isMapan ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                                Mapan ({intervalDays}h)
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                                Aktif ({intervalDays}h)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Card Question Text */}
                        <div className="text-xs font-semibold text-slate-900 dark:text-white pt-1">
                          <BilingualCardText
                            text={item.question}
                            type="question"
                            variant="compact"
                          />
                        </div>

                        {isProjected && (
                          <p className="text-[10px] text-purple-700 dark:text-purple-300 italic pt-0.5">
                            * {language === 'en' 
                                ? 'Simulated recurrence for next cycle (will be fixed once previous review is evaluated)' 
                                : 'Estimasi siklus putaran berikutnya (jadwal resmi akan dihitung FSRS setelah review sebelumnya selesai)'}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400">
                          {item.fsrsData?.reps || 0} {language === 'en' ? 'reviews' : 'ulangan'}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {onPreviewItem && (
                            <button
                              type="button"
                              onClick={() => onPreviewItem(item)}
                              title={language === 'en' ? 'Preview Card' : 'Pratinjau Kartu'}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {selectedDetails.isDateToday && !isProjected && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onStartReview(item.chapterId || undefined);
                              }}
                              title={language === 'en' ? 'Review this Card' : 'Review Kartu Ini'}
                              className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer transition-colors shadow-2xs"
                            >
                              <Play className="w-3.5 h-3.5 fill-white" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* COMPLETED REVIEWS ON THIS DAY */}
            {selectedDetails.completed.length > 0 && (
              <div className="space-y-1.5 pt-3 border-t border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {language === 'en' ? 'Completed on this day:' : 'Riwayat Evaluasi Selesai pada Hari Ini:'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedDetails.completed.map(({ item, rating }, idx) => (
                    <div
                      key={`${item.id}-${idx}`}
                      className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <BilingualCardText
                          text={item.question}
                          type="question"
                          variant="compact"
                        />
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        rating === 4 
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' 
                          : rating === 3 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                          : rating === 2 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {rating === 4 ? 'Mudah' : rating === 3 ? 'Bagus' : rating === 2 ? 'Sulit' : 'Lagi'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
