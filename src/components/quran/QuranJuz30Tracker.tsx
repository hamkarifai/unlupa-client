import React, { useState, useMemo } from 'react';
import { QuranPageItem } from '../../types';
import { getIntervalDays } from '../../lib/fsrs';
import { 
  RotateCw, 
  ShieldCheck, 
  Clock, 
  Flame, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Check,
  X
} from 'lucide-react';

function pageHasMapan(page: QuranPageItem) {
  return page.status === 'mastered_for_now' || (page.isActive && (page.fsrsData.stability >= 74.5 || Math.round(page.fsrsData.stability * 0.4025587) > 30));
}

interface QuranJuz30TrackerProps {
  quranPages: QuranPageItem[];
  language: string;
  targetJuzNumber?: number; // default 30
  onSelectPage?: (pageNumber: number) => void;
}

export const QuranJuz30Tracker: React.FC<QuranJuz30TrackerProps> = ({
  quranPages,
  language,
  targetJuzNumber = 30,
  onSelectPage,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'due' | 'high_freq' | 'mapan'>('all');
  const [scopeFilter, setScopeFilter] = useState<'juz30' | 'all_active'>('juz30');

  const todayStr = useMemo(() => new Date().toDateString(), []);

  // Filter target pages by selected scope
  const targetPages = useMemo(() => {
    if (scopeFilter === 'juz30') {
      return quranPages.filter(p => p.juzNumber === targetJuzNumber);
    }
    return quranPages.filter(p => p.isActive);
  }, [quranPages, scopeFilter, targetJuzNumber]);

  const activePages = useMemo(() => targetPages.filter(p => p.isActive), [targetPages]);
  const totalActive = activePages.length;

  // Process verified metrics
  const {
    totalFrequency,
    onTimeCount,
    overdueCount,
    dueTodayCount,
    completedTodayCount,
    onTimeRate,
    pageRecords,
  } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalFreq = 0;
    let overdue = 0;
    let dueToday = 0;
    let completedToday = 0;

    const records = targetPages.map(page => {
      const reps = page.fsrsData?.reps || 0;
      const lapses = page.fsrsData?.lapses || 0;
      const logCount = page.reviewLogs?.length || 0;
      const freq = Math.max(reps + lapses, logCount);
      
      if (page.isActive) {
        totalFreq += freq;
      }

      const intervalDays = getIntervalDays(page.fsrsData);
      const isMapan = pageHasMapan(page);

      const lastRevDate = page.fsrsData?.lastReview ? new Date(page.fsrsData.lastReview) : null;
      const isReviewedToday = lastRevDate ? lastRevDate.toDateString() === todayStr : false;
      if (page.isActive && isReviewedToday) {
        completedToday++;
      }

      let isPageDue = false;
      let isOverdue = false;
      let overdueDays = 0;
      let diffDays = 0;

      if (page.isActive) {
        if (page.fsrsData?.nextReview) {
          const nextDate = new Date(page.fsrsData.nextReview);
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
              isPageDue = true;
              dueToday++;
            }
          }
        } else {
          if (!isReviewedToday) {
            isPageDue = true;
            dueToday++;
          }
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

      return {
        ...page,
        frequency: freq,
        reps,
        lapses,
        intervalDays,
        isMapan,
        isReviewedToday,
        isPageDue,
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
      pageRecords: records,
    };
  }, [targetPages, todayStr, totalActive]);

  // Filtered records for search and filter pills
  const filteredPages = useMemo(() => {
    let list = [...pageRecords];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p => 
        p.pageNumber.toString().includes(q) || 
        (p.surahNameEn || '').toLowerCase().includes(q) ||
        (p.surahNameAr || '').includes(q) ||
        (p.ayahRange || '').includes(q)
      );
    }

    if (filterMode === 'due') {
      list = list.filter(p => p.isActive && (p.isOverdue || p.isPageDue));
      list.sort((a, b) => b.overdueDays - a.overdueDays);
    } else if (filterMode === 'high_freq') {
      list.sort((a, b) => b.frequency - a.frequency);
    } else if (filterMode === 'mapan') {
      list = list.filter(p => p.isMapan);
      list.sort((a, b) => b.intervalDays - a.intervalDays);
    } else {
      // Default: prioritize overdue, then due, then highest frequency
      list.sort((a, b) => {
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        if (a.isPageDue && !b.isPageDue) return -1;
        if (!a.isPageDue && b.isPageDue) return 1;
        return b.frequency - a.frequency;
      });
    }

    return list;
  }, [pageRecords, searchQuery, filterMode]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
      {/* Top Header Card */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 shadow-2xs">
              <BookOpen className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                {language === 'en' ? 'Muroja\'ah Frequency & Timeliness' : 'Pelacakan Muroja\'ah & Ketepatan Jadwal'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {scopeFilter === 'juz30' 
                  ? `Juz 30 (Hal. 582–604) • ${totalActive} halaman aktif` 
                  : `Seluruh Mushaf • ${totalActive} halaman aktif`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {/* Scope Switcher */}
            <div className="inline-flex p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-xs">
              <button
                type="button"
                onClick={() => setScopeFilter('juz30')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  scopeFilter === 'juz30'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Juz 30
              </button>
              <button
                type="button"
                onClick={() => setScopeFilter('all_active')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  scopeFilter === 'all_active'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Semua Aktif
              </button>
            </div>

            {/* Toggle Expand Details */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <span>{isExpanded ? 'Tutup Rincian' : `Buka Rincian (${pageRecords.length})`}</span>
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
            <div className="text-[11px] text-slate-400 mt-0.5">Akumulasi sesi muroja'ah</div>
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
              <span className="font-semibold text-amber-700 dark:text-amber-300">Perlu Muroja'ah</span>
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-700 dark:text-amber-300 tabular-nums tracking-tight">
              {dueTodayCount}
              <span className="text-xs font-medium text-amber-600/70 dark:text-amber-400/70 ml-1">halaman</span>
            </div>
            <div className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-0.5">
              {overdueCount > 0 ? `${overdueCount} halaman terlambat` : 'Jatuh tempo hari ini'}
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
                placeholder="Cari nomor hal. (582) atau surat..."
                className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-2xs"
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
                Semua ({pageRecords.length})
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
                onClick={() => setFilterMode('mapan')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all shrink-0 flex items-center gap-1.5 ${
                  filterMode === 'mapan'
                    ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                    : 'bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
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
                    <th scope="col" className="py-3 px-4 w-[38%]">Halaman & Surah</th>
                    <th scope="col" className="py-3 px-4 w-[20%] text-center">Interval Hari</th>
                    <th scope="col" className="py-3 px-4 w-[20%] text-center">Frekuensi</th>
                    <th scope="col" className="py-3 px-4 w-[22%] text-right">Status Jadwal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs">
                  {filteredPages.length > 0 ? (
                    filteredPages.map(page => (
                      <tr
                        key={page.pageNumber}
                        onClick={() => onSelectPage?.(page.pageNumber)}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      >
                        {/* Halaman & Surah */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-mono font-bold text-xs shrink-0 shadow-2xs">
                              {page.pageNumber}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                  {page.surahNameEn}
                                </span>
                                {page.surahNameAr && (
                                  <span className="text-[11px] text-slate-400 font-arabic">
                                    ({page.surahNameAr})
                                  </span>
                                )}
                                <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                Juz {page.juzNumber} • Ayah {page.ayahRange || '1 - akhir'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Interval Memori */}
                        <td className="py-3 px-4 text-center">
                          <div className="font-bold text-slate-900 dark:text-white tabular-nums">
                            {page.intervalDays} hari
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {page.lastReviewLabel}
                          </div>
                        </td>

                        {/* Frekuensi Pengulangan */}
                        <td className="py-3 px-4 text-center">
                          <div className="font-bold text-slate-900 dark:text-white tabular-nums">
                            {page.frequency}x diulang
                          </div>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                            {page.reps} lancar {page.lapses > 0 ? `• ${page.lapses} ulang` : ''}
                          </div>
                        </td>

                        {/* Status Jadwal Badge */}
                        <td className="py-3 px-4 text-right">
                          {!page.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 text-[11px] font-medium border border-slate-200/60 dark:border-slate-700">
                              Belum Aktif
                            </span>
                          ) : page.isReviewedToday ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold border border-emerald-200/80 dark:border-emerald-900/60">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Selesai Hari Ini</span>
                            </span>
                          ) : page.isOverdue ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-[11px] font-semibold border border-rose-200/80 dark:border-rose-900/60">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                              <span>Terlambat {page.overdueDays}h</span>
                            </span>
                          ) : page.isPageDue ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-[11px] font-semibold border border-amber-200/80 dark:border-amber-900/60">
                              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              <span>Jatuh Tempo</span>
                            </span>
                          ) : page.isMapan ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-[11px] font-semibold border border-blue-200/80 dark:border-blue-900/60">
                              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              <span>Mapan</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-medium border border-slate-200/60 dark:border-slate-700">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{page.diffDays > 0 ? `${page.diffDays} hari lagi` : 'Terjadwal'}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-xs text-slate-400">
                        Tidak ada halaman yang cocok dengan kriteria pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>Menampilkan {filteredPages.length} dari {pageRecords.length} halaman</span>
              <span className="text-[11px] text-slate-400">Klik baris untuk membuka Mushaf</span>
            </div>
          </div>

          {/* Mobile Card View (< md) */}
          <div className="md:hidden space-y-2.5">
            {filteredPages.length > 0 ? (
              filteredPages.map(page => (
                <div
                  key={page.pageNumber}
                  onClick={() => onSelectPage?.(page.pageNumber)}
                  className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs space-y-3 active:scale-[0.99] transition-transform cursor-pointer"
                >
                  {/* Top Bar: Identity & Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                        {page.pageNumber}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {page.surahNameEn} {page.surahNameAr ? `(${page.surahNameAr})` : ''}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Juz {page.juzNumber} • Ayah {page.ayahRange || '1 - akhir'}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {!page.isActive ? (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 text-[10px] font-medium">
                          Belum Aktif
                        </span>
                      ) : page.isReviewedToday ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Selesai</span>
                        </span>
                      ) : page.isOverdue ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-[10px] font-semibold border border-rose-200">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Terlambat {page.overdueDays}h</span>
                        </span>
                      ) : page.isPageDue ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-[10px] font-semibold border border-amber-200">
                          <Clock className="w-3 h-3" />
                          <span>Jatuh Tempo</span>
                        </span>
                      ) : page.isMapan ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-[10px] font-semibold border border-blue-200">
                          <Sparkles className="w-3 h-3" />
                          <span>Mapan</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-medium">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{page.diffDays > 0 ? `${page.diffDays}h lagi` : 'Terjadwal'}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metrics 2-column Box */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60">
                      <div className="text-[10px] text-slate-400 font-medium">Interval Hari</div>
                      <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                        {page.intervalDays} hari
                      </div>
                      <div className="text-[10px] text-slate-400">{page.lastReviewLabel}</div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60">
                      <div className="text-[10px] text-slate-400 font-medium">Frekuensi</div>
                      <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                        {page.frequency}x diulang
                      </div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        {page.reps} lancar {page.lapses > 0 ? `• ${page.lapses} ulang` : ''}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                Tidak ada halaman yang cocok dengan kriteria pencarian.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
