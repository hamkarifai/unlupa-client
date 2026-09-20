import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Play, 
  CheckCircle2, 
  BookOpen, 
  Library, 
  GraduationCap, 
  ChevronRight, 
  ChevronLeft,
  BookMarked,
  Users,
  Clock,
  AlertCircle,
  Plus,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { JUZ_LIST } from '../../data/quranData';
import { isDue } from '../../lib/fsrs';
import { ClassGroup, ClassStudent } from '../../types';

interface Props {
  onOpenQuranReview: (juzNumber?: number) => void;
  onOpenPersonalReview: () => void;
}

export const SwipeableReviewQueue: React.FC<Props> = ({
  onOpenQuranReview,
  onOpenPersonalReview
}) => {
  const { 
    quranStats, 
    personalStats, 
    books, 
    myClasses, 
    teachingClasses, 
    language, 
    setActiveSpace,
    userProfile,
    quranSpaceCode,
    items
  } = useApp();

  const [activeTab, setActiveTab] = useState<number>(0);
  const [direction, setDirection] = useState<number>(0);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Helper to determine if a student in a class has pending reviews
  const getStudentDueStatus = (student: ClassStudent, cls: ClassGroup) => {
    if (cls.type === 'quran') {
      const isCurrentUser = student.email === userProfile.email || student.id === `std-user-${userProfile.id}` || student.quranSpaceCode === quranSpaceCode;
      if (isCurrentUser) {
        const duePages = (quranStats?.dueList || []);
        if (duePages.length > 0) return { isDue: true, count: duePages.length };
        return { isDue: false, count: 0 };
      }
      if (student.quranData && student.quranData.length > 0) {
        const duePages = student.quranData.filter(p => p.isActive && isDue(p.fsrsData?.nextReview, p.isActive));
        if (duePages.length > 0) return { isDue: true, count: duePages.length };
      }
      if ((student.dueTodayCount || 0) > 0) {
        return { isDue: true, count: student.dueTodayCount };
      }
      if (student.frequentStruggles && student.frequentStruggles.length > 0) {
        return { isDue: true, count: student.frequentStruggles.length };
      }
      return { isDue: false, count: 0 };
    } else {
      const isCurrentUser = student.email === userProfile.email || student.id === `std-user-${userProfile.id}`;
      if (isCurrentUser) {
        const assignedId = cls.assignedBookIds?.[0];
        const classItems = items.filter(i => i.bookId === assignedId);
        const dueItems = classItems.filter(i => i.isActive && isDue(i.fsrsData?.nextReview, i.isActive));
        if (dueItems.length > 0) return { isDue: true, count: dueItems.length };
        return { isDue: false, count: 0 };
      }
      if (student.bookItemsData && student.bookItemsData.length > 0) {
        const dueItems = student.bookItemsData.filter(it => it.isActive && isDue(it.fsrsData?.nextReview, it.isActive));
        if (dueItems.length > 0) return { isDue: true, count: dueItems.length };
      }
      if ((student.dueTodayCount || 0) > 0) {
        return { isDue: true, count: student.dueTodayCount };
      }
      if (student.frequentStruggles && student.frequentStruggles.length > 0) {
        return { isDue: true, count: student.frequentStruggles.length };
      }
      return { isDue: false, count: 0 };
    }
  };

  // Cluster due Quran pages by Juz
  const dueQuranByJuz = useMemo(() => {
    const juzMap = new Map<number, number>();
    (quranStats?.dueList || []).forEach(p => {
      juzMap.set(p.juzNumber, (juzMap.get(p.juzNumber) || 0) + 1);
    });
    return Array.from(juzMap.entries())
      .map(([juz, count]) => ({ juz, count }))
      .sort((a, b) => a.juz - b.juz);
  }, [quranStats?.dueList]);

  // Cluster due Personal items by Book
  const duePersonalByBook = useMemo(() => {
    const bookMap = new Map<string, { title: string; count: number }>();
    (personalStats?.dueList || []).forEach(item => {
      const book = books.find(b => b.id === item.bookId);
      const title = book?.title || (language === 'en' ? 'General' : 'Umum');
      const cur = bookMap.get(item.bookId) || { title, count: 0 };
      bookMap.set(item.bookId, { title, count: cur.count + 1 });
    });
    return Array.from(bookMap.entries()).map(([bookId, data]) => ({
      bookId,
      title: data.title,
      count: data.count
    }));
  }, [personalStats?.dueList, books, language]);

  // Teaching stats with detailed student review verification
  const teachingSummary = useMemo(() => {
    let totalPendingStudents = 0;
    const classStats = (teachingClasses || []).map(cls => {
      const students = cls.students || [];
      const pendingStudents = students.filter(s => getStudentDueStatus(s, cls).isDue);
      totalPendingStudents += pendingStudents.length;
      return {
        class: cls,
        totalStudents: students.length,
        pendingCount: pendingStudents.length,
        isAllClear: students.length > 0 && pendingStudents.length === 0
      };
    });
    return {
      totalClasses: (teachingClasses || []).length,
      totalPendingStudents,
      classStats
    };
  }, [teachingClasses]);

  const tabs = [
    {
      id: 0,
      name: language === 'en' ? 'Al-Quran' : "Al-Qur'an",
      shortName: language === 'en' ? 'Quran' : "Al-Qur'an",
      icon: <BookOpen className="w-3.5 h-3.5" />,
      badge: quranStats?.dueToday || 0,
      space: 'quran' as const
    },
    {
      id: 1,
      name: language === 'en' ? 'Personal' : 'Pribadi',
      shortName: language === 'en' ? 'Personal' : 'Pribadi',
      icon: <Library className="w-3.5 h-3.5" />,
      badge: personalStats?.dueToday || 0,
      space: 'personal' as const
    },
    {
      id: 2,
      name: language === 'en' ? 'My Classes' : 'Meja Kelas',
      shortName: language === 'en' ? 'Classes' : 'Kelas',
      icon: <BookMarked className="w-3.5 h-3.5" />,
      badge: myClasses?.length || 0,
      space: 'teaching' as const
    },
    {
      id: 3,
      name: language === 'en' ? 'Teaching' : 'Ruang Guru',
      shortName: language === 'en' ? 'Teaching' : 'Guru',
      icon: <GraduationCap className="w-3.5 h-3.5" />,
      badge: teachingSummary.totalPendingStudents > 0 ? teachingSummary.totalPendingStudents : (teachingClasses?.length || 0),
      isAlertBadge: teachingSummary.totalPendingStudents > 0,
      space: 'teaching' as const
    }
  ];

  const totalTabs = tabs.length;

  const goToTab = (index: number) => {
    const nextIndex = (index + totalTabs) % totalTabs;
    setDirection(nextIndex > activeTab ? 1 : -1);
    setActiveTab(nextIndex);
  };

  // Robust isolated touch handling: prevents global space swipe from stealing touches
  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (e.touches.length !== 1) return;
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now()
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (!touchStartRef.current || e.changedTouches.length !== 1) {
      touchStartRef.current = null;
      return;
    }

    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const elapsed = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    // Only switch slides if horizontal swipe was intentional and dominant
    if (elapsed < 800 && Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy) * 1.15) {
      if (dx < 0) {
        // Swiped left -> Next tab
        goToTab(activeTab + 1);
      } else {
        // Swiped right -> Prev tab
        goToTab(activeTab - 1);
      }
    }
  };

  return (
    <div 
      data-no-swipe="true"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="bg-[#0B101D] rounded-3xl border border-slate-800/80 shadow-xl overflow-hidden relative touch-pan-y"
    >
      {/* 1. TOP SEGMENTED NAVIGATION TABS */}
      <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-b border-slate-800/80 bg-[#0E1322]">
        <div className="flex items-center justify-between gap-2">
          {/* Segmented Pills for 4 Spaces */}
          <div className="grid grid-cols-4 gap-1 sm:gap-1.5 flex-1 min-w-0 bg-[#141A29] p-1 rounded-2xl border border-slate-800/60">
            {tabs.map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => goToTab(tab.id)}
                  className={`flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 px-1 sm:px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-w-0 ${
                    isSelected
                      ? 'bg-[#1D2740] text-white border border-blue-500/40 shadow-xs font-extrabold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <span className="shrink-0">{tab.icon}</span>
                  <span className="hidden min-[480px]:inline truncate">{tab.name}</span>
                  <span className="inline min-[480px]:hidden truncate">{tab.shortName}</span>
                  {tab.badge > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-black shrink-0 ${
                      isSelected 
                        ? 'bg-amber-500 text-slate-950' 
                        : (tab as any).isAlertBadge
                        ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                        : 'bg-amber-950/80 text-amber-300 border border-amber-700/60'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Previous / Next Arrow Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => goToTab(activeTab - 1)}
              aria-label="Previous Slide"
              className="w-7 h-7 rounded-xl bg-[#141A29] border border-slate-700/60 hover:bg-slate-800 flex items-center justify-center text-slate-300 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => goToTab(activeTab + 1)}
              aria-label="Next Slide"
              className="w-7 h-7 rounded-xl bg-[#141A29] border border-slate-700/60 hover:bg-slate-800 flex items-center justify-center text-slate-300 transition-all cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN SWIPEABLE CARD CONTENT */}
      <div className="p-4 sm:p-6 min-h-[240px] flex flex-col justify-between">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: direction * 35 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -direction * 35 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="space-y-4"
          >
            {/* SLIDE 0: AL-QUR'AN SPACE QUEUE */}
            {activeTab === 0 && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-blue-950/80 text-blue-400 border border-blue-800/60 flex items-center justify-center shrink-0 shadow-2xs">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-white text-sm sm:text-base tracking-tight truncate">
                          {language === 'en' ? 'Quran Memorization' : "Murajaah Al-Qur'an"}
                        </h4>
                        {quranStats.dueToday > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-[#2a1d0f] border border-amber-500/50 text-amber-300 font-extrabold text-[10px] sm:text-[11px] flex items-center gap-1 shrink-0 whitespace-nowrap">
                            <Clock className="w-3 h-3 text-amber-400" />
                            {quranStats.dueToday} {language === 'en' ? 'due' : 'tempo'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 font-bold text-[10px] sm:text-[11px] flex items-center gap-1 shrink-0 whitespace-nowrap">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            {language === 'en' ? 'All Clear' : 'Lancar'}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 truncate">
                        {quranStats.active} {language === 'en' ? 'active pages' : 'halaman aktif'} • {quranStats.mastered} {language === 'en' ? 'mastered' : 'mapan terjaga'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                    {quranStats.dueToday > 0 && (
                      <button
                        onClick={() => onOpenQuranReview()}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs shadow-md shadow-orange-500/20 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>{language === 'en' ? 'Start Review' : 'Mulai Murajaah'}</span>
                      </button>
                    )}
                    <button
                      onClick={() => setActiveSpace('quran')}
                      className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-[#161c2c] hover:bg-[#1f273d] text-slate-200 border border-slate-700/80 font-bold text-xs transition-all cursor-pointer whitespace-nowrap"
                    >
                      <span>{language === 'en' ? 'Open Quran Space' : 'Buka Ruang Quran'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Due Breakdown by Juz or Clean Zero State */}
                {dueQuranByJuz.length > 0 ? (
                  <div className="space-y-2">
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      {language === 'en' ? 'Due by Juz:' : 'Rincian Tempo per Juz:'}
                    </span>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 sm:gap-2">
                      {dueQuranByJuz.map(({ juz, count }) => (
                        <button
                          key={juz}
                          onClick={() => onOpenQuranReview(juz)}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-[#131926] border border-slate-800 hover:border-amber-500/50 hover:bg-[#1c2438] transition-all text-left group cursor-pointer shadow-2xs min-w-0"
                        >
                          <div className="min-w-0 pr-1">
                            <p className="text-xs font-bold text-slate-200 group-hover:text-amber-300 truncate whitespace-nowrap">
                              Juz {juz}
                            </p>
                            <p className="hidden sm:block text-[10px] text-slate-400 font-arabic truncate">
                              {JUZ_LIST[juz - 1]?.nameAr || ''}
                            </p>
                          </div>
                          <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-xs shrink-0">
                            {count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/60 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                          {language === 'en' ? 'Quran memorization is up to date' : "Semua hafalan Al-Qur'an tuntas terjaga"}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {language === 'en' ? 'No pages currently due for review.' : 'Belum ada halaman yang jatuh tempo murajaah saat ini.'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveSpace('quran')}
                      className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold text-xs hover:bg-emerald-50 shrink-0 cursor-pointer"
                    >
                      {language === 'en' ? 'Browse Quran' : 'Kelola Halaman'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* SLIDE 1: PERSONAL LIBRARY QUEUE */}
            {activeTab === 1 && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900 flex items-center justify-center shrink-0 shadow-2xs">
                      <Library className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base tracking-tight truncate">
                          {language === 'en' ? 'Personal Library' : 'Perpustakaan & Kitab Pribadi'}
                        </h4>
                        {personalStats.dueToday > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-extrabold text-[10px] sm:text-[11px] flex items-center gap-1 shrink-0 whitespace-nowrap">
                            <Clock className="w-3 h-3" />
                            {personalStats.dueToday} {language === 'en' ? 'due' : 'tempo'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] sm:text-[11px] flex items-center gap-1 shrink-0 whitespace-nowrap">
                            <CheckCircle2 className="w-3 h-3" />
                            {language === 'en' ? 'All Clear' : 'Lancar'}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {personalStats.totalBooks} {language === 'en' ? 'books' : 'kitab'} • {personalStats.activeItems} {language === 'en' ? 'active flashcards' : 'kartu aktif'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                    {personalStats.dueToday > 0 && (
                      <button
                        onClick={onOpenPersonalReview}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>{language === 'en' ? 'Start Review' : 'Mulai Murajaah'}</span>
                      </button>
                    )}
                    <button
                      onClick={() => setActiveSpace('personal')}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer whitespace-nowrap"
                    >
                      <span>{language === 'en' ? 'Open Library' : 'Buka Perpustakaan'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Due Breakdown by Book or Clean Zero State */}
                {duePersonalByBook.length > 0 ? (
                  <div className="space-y-2">
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      {language === 'en' ? 'Due by Book:' : 'Tempo per Kitab:'}
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {duePersonalByBook.map(({ bookId, title, count }) => (
                        <button
                          key={bookId}
                          onClick={onOpenPersonalReview}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all text-left group cursor-pointer shadow-2xs min-w-0"
                        >
                          <div className="min-w-0 pr-1 flex-1">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-300 truncate">
                              {title}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                              {count} {language === 'en' ? 'cards' : 'kartu'}
                            </p>
                          </div>
                          <span className="px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-extrabold text-xs shrink-0 ml-1">
                            {count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/60 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                          {books.length === 0 ? 'Belum Ada Kitab di Perpustakaan' : 'Seluruh kartu materi tuntas dimurajaah'}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {books.length === 0 ? 'Unduh kitab dari katalog kurikulum atau buat materi sendiri.' : 'Sistem retensi adaptif akan menjadwalkan kartu kembali saat mendekati batas retensi.'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveSpace('personal')}
                      className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300 font-bold text-xs hover:bg-indigo-50 shrink-0 cursor-pointer"
                    >
                      {books.length === 0 ? 'Tambah Kitab' : 'Buka Ruang'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* SLIDE 2: MY CLASSES (SANTRI) */}
            {activeTab === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 flex items-center justify-center shrink-0 shadow-2xs">
                      <BookMarked className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base tracking-tight truncate">
                          {language === 'en' ? 'My Classes & Curriculums' : 'Meja Kelas & Kurikulum'}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] sm:text-[11px] shrink-0 whitespace-nowrap">
                          {myClasses?.length || 0} {language === 'en' ? 'enrolled' : 'kelas'}
                        </span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {language === 'en' ? 'Classes you are participating in' : 'Daftar kelas bimbingan pengajar & target materi Anda'}
                      </p>
                    </div>
                  </div>

                  {myClasses && myClasses.length > 0 && (
                    <button
                      onClick={() => setActiveSpace('teaching')}
                      className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all active:scale-95 cursor-pointer shrink-0 shadow-2xs whitespace-nowrap"
                    >
                      <span>{language === 'en' ? 'Open Classes' : 'Buka Meja Kelas'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {myClasses && myClasses.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {myClasses.slice(0, 4).map((c) => {
                      const isQuran = c.type === 'quran';
                      const assignedBook = !isQuran && c.assignedBookIds?.[0] ? books.find(b => b.id === c.assignedBookIds?.[0]) : null;
                      
                      return (
                        <div
                          key={c.id}
                          onClick={() => setActiveSpace('teaching')}
                          className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 hover:border-emerald-400 transition-all flex items-center justify-between gap-3 cursor-pointer group shadow-2xs"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                              {c.name}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 flex items-center gap-1.5">
                              <span>Ust. {c.teacherName || 'Pengajar'}</span>
                              <span className="text-slate-300 dark:text-slate-600">•</span>
                              <span className="font-mono text-[10px] bg-slate-200/70 dark:bg-slate-700/70 px-1.5 py-0.2 rounded text-slate-700 dark:text-slate-300 font-semibold">
                                {c.code}
                              </span>
                            </p>
                            <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium mt-1 truncate">
                              {isQuran 
                                ? (c.requiredJuzList && c.requiredJuzList.length > 0 ? `Target: ${c.requiredJuzList.length === 30 ? '30 Juz' : `Juz ${Math.min(...c.requiredJuzList)}-${Math.max(...c.requiredJuzList)}`}` : 'Kurikulum Tahfizh')
                                : (assignedBook ? `Kitab: ${assignedBook.title}` : 'Kurikulum Kitab')}
                            </p>
                          </div>
                          
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                              {isQuran ? "Tahfizh" : 'Kitab'}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Clean, Single Empty State Card without duplicate button stacking */
                  <div className="py-7 px-5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col items-center text-center max-w-lg mx-auto">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2.5 shadow-2xs">
                      <BookMarked className="w-5 h-5" />
                    </div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white">
                      {language === 'en' ? 'You have not joined any classes yet' : 'Belum bergabung ke kelas mana pun'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm leading-relaxed">
                      {language === 'en' 
                        ? 'Enter the class code from your teacher to track assignments and memorization.' 
                        : 'Masukkan kode kelas dari pengajar Anda untuk memantau tugas hafalan dan jadwal kurikulum.'}
                    </p>
                    <button
                      onClick={() => setActiveSpace('teaching')}
                      className="mt-4 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 cursor-pointer shadow-xs active:scale-95 transition-all inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? 'Join Class' : 'Gabung Kelas Sekarang'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* SLIDE 3: TEACHING SPACE (USTADZ / GURU) */}
            {activeTab === 3 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 flex items-center justify-center shrink-0 shadow-2xs">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base tracking-tight truncate">
                          {language === 'en' ? 'Teaching Space & Evaluations' : 'Ruang Guru & Evaluasi'}
                        </h4>
                        {teachingSummary.totalPendingStudents > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-extrabold text-[10px] sm:text-[11px] flex items-center gap-1 shrink-0 whitespace-nowrap">
                            <AlertCircle className="w-3 h-3" />
                            {teachingSummary.totalPendingStudents} {language === 'en' ? 'pending review' : 'santri belum review'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] sm:text-[11px] flex items-center gap-1 shrink-0 whitespace-nowrap">
                            <CheckCircle2 className="w-3 h-3" />
                            {language === 'en' ? 'All Up to Date' : 'Semua Tuntas'}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {teachingSummary.totalClasses} {language === 'en' ? 'classes taught' : 'kelas diampu'} • {teachingSummary.totalPendingStudents > 0 ? `${teachingSummary.totalPendingStudents} santri perlu evaluasi` : 'Seluruh santri tuntas murajaah'}
                      </p>
                    </div>
                  </div>

                  {teachingSummary.classStats && teachingSummary.classStats.length > 0 && (
                    <button
                      onClick={() => setActiveSpace('teaching')}
                      className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all active:scale-95 cursor-pointer shrink-0 shadow-2xs whitespace-nowrap"
                    >
                      <span>{language === 'en' ? 'Open Teaching Space' : 'Buka Ruang Guru'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {teachingSummary.classStats && teachingSummary.classStats.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {teachingSummary.classStats.slice(0, 4).map(({ class: c, totalStudents, pendingCount }) => (
                      <div
                        key={c.id}
                        onClick={() => setActiveSpace('teaching')}
                        className={`p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border transition-all flex items-center justify-between gap-3 cursor-pointer group shadow-2xs ${
                          pendingCount > 0 
                            ? 'border-amber-300 dark:border-amber-800/80 hover:border-rose-400 bg-amber-50/20 dark:bg-amber-950/10' 
                            : 'border-slate-200/80 dark:border-slate-700 hover:border-rose-400'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 truncate">
                            {c.name}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 flex items-center gap-1.5">
                            <span>{totalStudents} santri</span>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span className="font-mono text-[10px] bg-slate-200/70 dark:bg-slate-700/70 px-1.5 py-0.2 rounded text-slate-700 dark:text-slate-300 font-semibold">
                              {c.code}
                            </span>
                          </p>

                          {/* Student Review Attention Status */}
                          <div className="mt-1.5">
                            {totalStudents === 0 ? (
                              <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                                <Users className="w-3 h-3 text-slate-400" />
                                Belum ada santri bergabung
                              </span>
                            ) : pendingCount > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 text-[10px] font-extrabold border border-amber-300/80 dark:border-amber-800/80">
                                <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                                <span>{pendingCount} santri belum review</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span>Semua santri tuntas review</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className="px-2 py-1 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-bold text-[10px]">
                            {c.type === 'quran' ? "Tahfizh" : 'Kitab'}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Clean Empty State Card without dual buttons */
                  <div className="py-7 px-5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col items-center text-center max-w-lg mx-auto">
                    <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-2.5 shadow-2xs">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white">
                      {language === 'en' ? 'No teaching classes created yet' : 'Belum membuat kelas pengajaran'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm leading-relaxed">
                      {language === 'en' 
                        ? 'Create a teaching class to monitor your students and assign curriculums.' 
                        : 'Buat kelas tahfizh / madrasah bimbingan Anda untuk memantau hafalan dan retensi santri.'}
                    </p>
                    <button
                      onClick={() => setActiveSpace('teaching')}
                      className="mt-4 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shrink-0 cursor-pointer shadow-xs active:scale-95 transition-all inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? 'Create Class' : 'Buat Kelas Bimbingan'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* 3. BOTTOM SLIDE INDICATORS & SWIPE HINT */}
        <div className="flex items-center justify-between pt-3.5 mt-2 border-t border-slate-100 dark:border-slate-800/80">
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline-block">
            {language === 'en' ? '← Swipe card left / right to switch queue' : '← Geser kartu untuk berganti antrean'}
          </span>
          <div className="flex items-center gap-1.5 mx-auto sm:mx-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => goToTab(tab.id)}
                aria-label={`Go to slide ${tab.name}`}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'w-6 bg-slate-900 dark:bg-white'
                    : 'w-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300'
                }`}
              />
            ))}
          </div>
          <span className="text-[11px] text-slate-400 font-semibold tabular-nums">
            {activeTab + 1} / {totalTabs}
          </span>
        </div>
      </div>
    </div>
  );
};
