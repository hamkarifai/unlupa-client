import React, { useState, useMemo } from 'react';
import { Book, BookItem, Chapter } from '../../types';
import { getNonQuranIntervalDays } from '../../lib/fsrs';
import { BilingualCardText } from '../common/BilingualCardText';
import { 
  RotateCw, 
  ShieldCheck, 
  Clock, 
  Flame, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Sparkles,
  ArrowUpRight,
  BookOpen,
  X
} from 'lucide-react';

interface BookInteractionTrackerProps {
  book: Book;
  items: BookItem[];
  chapters?: Chapter[];
  language: string;
  onSelectCard?: (item: BookItem) => void;
  onOpenCalendar?: () => void;
}

export const BookInteractionTracker: React.FC<BookInteractionTrackerProps> = ({
  book,
  items,
  chapters = [],
  language,
  onSelectCard,
  onOpenCalendar,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'due' | 'high_freq' | 'mastered'>('all');

  // Chapter lookup map
  const chapterMap = useMemo(() => {
    const map = new Map<string, string>();
    chapters.forEach(c => map.set(c.id, c.title));
    return map;
  }, [chapters]);

  // Real-time calculation based on actual memory state and review logs
  const activeItems = useMemo(() => items.filter(i => i.isActive), [items]);
  const totalActive = activeItems.length;

  const todayStr = useMemo(() => new Date().toDateString(), []);

  // Process item statistics
  const {
    totalFrequency,
    onTimeCount,
    overdueCount,
    dueTodayCount,
    completedTodayCount,
    onTimeRate,
    itemRecords,
  } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalFreq = 0;
    let overdue = 0;
    let dueToday = 0;
    let completedToday = 0;

    const records = activeItems.map((item, index) => {
      const reps = item.fsrsData?.reps || 0;
      const lapses = item.fsrsData?.lapses || 0;
      const logCount = item.reviewLogs?.length || 0;
      const freq = Math.max(reps + lapses, logCount);
      totalFreq += freq;

      const intervalDays = getNonQuranIntervalDays(item.fsrsData);
      const isMastered = intervalDays >= 375 || item.status === 'mastered';

      const lastRevDate = item.fsrsData?.lastReview ? new Date(item.fsrsData.lastReview) : null;
      const isReviewedToday = lastRevDate ? lastRevDate.toDateString() === todayStr : false;
      if (isReviewedToday) {
        completedToday++;
      }

      let isDue = false;
      let isOverdue = false;
      let overdueDays = 0;
      let diffDays = 0;

      if (item.fsrsData?.nextReview) {
        const nextDate = new Date(item.fsrsData.nextReview);
        nextDate.setHours(0, 0, 0, 0);
        const diffTime = nextDate.getTime() - today.getTime();
        diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (!isReviewedToday) {
          if (diffDays < 0) {
            isOverdue = true;
            overdueDays = Math.abs(diffDays);
            overdue++;
            dueToday++;
          } else if (diffDays === 0) {
            isDue = true;
            dueToday++;
          }
        }
      } else {
        if (!isReviewedToday) {
          isDue = true;
          dueToday++;
        }
      }

      // Relative last review string
      let lastReviewLabel = 'Belum pernah';
      if (lastRevDate) {
        const lastDays = Math.round((today.getTime() - lastRevDate.getTime()) / (1000 * 60 * 60 * 24));
        if (lastDays <= 0) lastReviewLabel = 'Hari ini';
        else if (lastDays === 1) lastReviewLabel = 'Kemarin';
        else lastReviewLabel = `${lastDays} hari lalu`;
      }

      const chapterTitle = item.chapterId ? (chapterMap.get(item.chapterId) || '') : '';

      return {
        rawItem: item,
        itemIndex: index + 1,
        id: item.id,
        title: item.question || item.answer || 'Kartu Tanpa Judul',
        chapterTitle,
        frequency: freq,
        reps,
        lapses,
        intervalDays,
        isMastered,
        isReviewedToday,
        isDue,
        isOverdue,
        overdueDays,
        diffDays,
        lastReviewLabel,
      };
    });

    const onTime = totalActive > 0 ? (totalActive - overdue) : totalActive;
    const rate = totalActive > 0 ? Math.round((onTime / totalActive) * 100) : 100;

    return {
      totalFrequency: totalFreq,
      onTimeCount: onTime,
      overdueCount: overdue,
      dueTodayCount: dueToday,
      completedTodayCount: completedToday,
      onTimeRate: rate,
      itemRecords: records,
    };
  }, [activeItems, todayStr, totalActive, chapterMap]);

  // Filtered records
  const filteredItems = useMemo(() => {
    let list = [...itemRecords];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(i => 
        (i.title || '').toLowerCase().includes(q) ||
        (i.chapterTitle || '').toLowerCase().includes(q)
      );
    }

    if (filterMode === 'due') {
      list = list.filter(i => i.isOverdue || i.isDue);
      list.sort((a, b) => b.overdueDays - a.overdueDays);
    } else if (filterMode === 'high_freq') {
      list.sort((a, b) => b.frequency - a.frequency);
    } else if (filterMode === 'mastered') {
      list = list.filter(i => i.isMastered);
      list.sort((a, b) => b.intervalDays - a.intervalDays);
    } else {
      // Default: prioritize overdue, then due, then highest frequency
      list.sort((a, b) => {
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        if (a.isDue && !b.isDue) return -1;
        if (!a.isDue && b.isDue) return 1;
        return b.frequency - a.frequency;
      });
    }

    return list;
  }, [itemRecords, searchQuery, filterMode]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
      {/* Top Header Card */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/70 dark:border-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 shadow-2xs">
              <BookOpen className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                {language === 'en' ? 'Study Frequency & Schedule Adherence' : 'Pelacakan Belajar & Ketepatan Jadwal'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {book.title} • {totalActive} {language === 'en' ? 'active flashcards' : 'kartu materi aktif'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {onOpenCalendar && (
              <button
                type="button"
                onClick={onOpenCalendar}
                className="px-3.5 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                title={language === 'en' ? 'Open Book Calendar' : 'Buka Kalender Jadwal Kitab'}
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>{language === 'en' ? 'Calendar' : 'Kalender Jadwal'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <span>{isExpanded ? 'Tutup Rincian' : `Buka Rincian (${itemRecords.length})`}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* 4 Clean Metric Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 mt-4">
          {/* Total Pengulangan */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Total Pengulangan</span>
              <RotateCw className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
              {totalFrequency}
              <span className="text-xs font-medium text-slate-400 ml-1">kali</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Akumulasi pengulangan kartu</div>
          </div>

          {/* Bebas Tunggakan */}
          <div className="p-3.5 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-emerald-700 dark:text-emerald-300">Bebas Tunggakan</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 tabular-nums tracking-tight">
              {onTimeCount}
              <span className="text-xs font-medium text-emerald-600/70 dark:text-emerald-400/70 ml-1">/ {totalActive}</span>
            </div>
            <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">Jadwal tepat waktu</div>
          </div>

          {/* Kepatuhan Jadwal */}
          <div className="p-3.5 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-blue-700 dark:text-blue-300">Tingkat Disiplin</span>
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-black text-blue-700 dark:text-blue-300 tabular-nums tracking-tight">
              {onTimeRate}%
            </div>
            <div className="text-[11px] text-blue-600/80 dark:text-blue-400/80 mt-0.5">Kepatuhan Jadwal</div>
          </div>

          {/* Antrean Hari Ini */}
          <div className="p-3.5 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-amber-700 dark:text-amber-300">Perlu Diulang</span>
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-700 dark:text-amber-300 tabular-nums tracking-tight">
              {dueTodayCount}
              <span className="text-xs font-medium text-amber-600/70 dark:text-amber-400/70 ml-1">kartu</span>
            </div>
            <div className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-0.5">
              {overdueCount > 0 ? `${overdueCount} kartu terlambat` : 'Jatuh tempo hari ini'}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Rincian Data Section */}
      {isExpanded && (
        <div className="p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
          {/* Controls Bar: Search & Cohesive Filter Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari pertanyaan kartu atau bab..."
                className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Tabs (Cohesive, neutral design) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all shrink-0 ${
                  filterMode === 'all'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                    : 'bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Semua ({itemRecords.length})
              </button>

              <button
                type="button"
                onClick={() => setFilterMode('due')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all shrink-0 flex items-center gap-1.5 ${
                  filterMode === 'due'
                    ? 'bg-amber-500 text-slate-950 shadow-2xs font-bold'
                    : 'bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Jatuh Tempo ({dueTodayCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterMode('high_freq')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all shrink-0 flex items-center gap-1.5 ${
                  filterMode === 'high_freq'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                    : 'bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-blue-500" />
                <span>Paling Sering</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterMode('mastered')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all shrink-0 flex items-center gap-1.5 ${
                  filterMode === 'mastered'
                    ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                    : 'bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Mapan</span>
              </button>
            </div>
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="max-h-[440px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/95 backdrop-blur-xs border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider z-10">
                  <tr>
                    <th scope="col" className="py-3 px-4 w-[40%]">Kartu Materi & Bab</th>
                    <th scope="col" className="py-3 px-4 w-[18%] text-center">Interval Hari</th>
                    <th scope="col" className="py-3 px-4 w-[20%] text-center">Frekuensi</th>
                    <th scope="col" className="py-3 px-4 w-[22%] text-right">Status Jadwal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs">
                  {filteredItems.length > 0 ? (
                    filteredItems.map(item => (
                      <tr
                        key={item.id}
                        onClick={() => onSelectCard?.(item.rawItem)}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      >
                        {/* Kartu Materi & Bab */}
                        <td className="py-3 px-4">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5 shadow-2xs">
                              {item.itemIndex}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <div className="font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                  <BilingualCardText
                                    text={item.title}
                                    type="question"
                                    variant="compact"
                                  />
                                </div>
                                <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                              </div>
                              {item.chapterTitle && (
                                <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                                  {item.chapterTitle}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Interval Retensi */}
                        <td className="py-3 px-4 text-center">
                          <div className="font-bold text-slate-900 dark:text-white tabular-nums">
                            {item.intervalDays} hari
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {item.lastReviewLabel}
                          </div>
                        </td>

                        {/* Frekuensi Pengulangan */}
                        <td className="py-3 px-4 text-center">
                          <div className="font-bold text-slate-900 dark:text-white tabular-nums">
                            {item.frequency}x diulang
                          </div>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                            {item.reps} lancar {item.lapses > 0 ? `• ${item.lapses} ulang` : ''}
                          </div>
                        </td>

                        {/* Status Jadwal Badge */}
                        <td className="py-3 px-4 text-right">
                          {item.isReviewedToday ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold border border-emerald-200/80 dark:border-emerald-900/60">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Selesai Hari Ini</span>
                            </span>
                          ) : item.isOverdue ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-[11px] font-semibold border border-rose-200/80 dark:border-rose-900/60">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                              <span>Terlambat {item.overdueDays}h</span>
                            </span>
                          ) : item.isDue ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-[11px] font-semibold border border-amber-200/80 dark:border-amber-900/60">
                              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              <span>Jatuh Tempo</span>
                            </span>
                          ) : item.isMastered ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold border border-indigo-200/80 dark:border-indigo-900/60">
                              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                              <span>Mapan</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-medium border border-slate-200/60 dark:border-slate-700">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{item.diffDays > 0 ? `${item.diffDays} hari lagi` : 'Terjadwal'}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-xs text-slate-400">
                        Tidak ada kartu yang cocok dengan kriteria pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>Menampilkan {filteredItems.length} dari {itemRecords.length} kartu materi</span>
              <span className="text-[11px] text-slate-400">Klik baris untuk melihat kartu materi</span>
            </div>
          </div>

          {/* Mobile Card View (< md) */}
          <div className="md:hidden space-y-2.5">
            {filteredItems.length > 0 ? (
              filteredItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => onSelectCard?.(item.rawItem)}
                  className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs space-y-3 active:scale-[0.99] transition-transform cursor-pointer"
                >
                  {/* Top Bar: Identity & Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                        {item.itemIndex}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-900 dark:text-white line-clamp-2">
                          {item.title}
                        </div>
                        {item.chapterTitle && (
                          <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                            {item.chapterTitle}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {item.isReviewedToday ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Selesai</span>
                        </span>
                      ) : item.isOverdue ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-[10px] font-semibold border border-rose-200">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Terlambat {item.overdueDays}h</span>
                        </span>
                      ) : item.isDue ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-[10px] font-semibold border border-amber-200">
                          <Clock className="w-3 h-3" />
                          <span>Jatuh Tempo</span>
                        </span>
                      ) : item.isMastered ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold border border-indigo-200">
                          <Sparkles className="w-3 h-3" />
                          <span>Mapan</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-medium">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{item.diffDays > 0 ? `${item.diffDays}h lagi` : 'Terjadwal'}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metrics 2-column Box */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60">
                      <div className="text-[10px] text-slate-400 font-medium">Interval Hari</div>
                      <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                        {item.intervalDays} hari
                      </div>
                      <div className="text-[10px] text-slate-400">{item.lastReviewLabel}</div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60">
                      <div className="text-[10px] text-slate-400 font-medium">Frekuensi</div>
                      <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                        {item.frequency}x diulang
                      </div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        {item.reps} lancar {item.lapses > 0 ? `• ${item.lapses} ulang` : ''}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                Tidak ada kartu yang cocok dengan kriteria pencarian.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
