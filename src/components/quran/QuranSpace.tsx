import React, { useState, useEffect, useMemo } from 'react';
import { getIntervalDays, isDue, QuranIntervalClusterKey, isReviewedToday, getQuranPageClusterKey } from '../../lib/fsrs';
import { useApp } from '../../context/AppContext';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { JUZ_LIST, getQuranPageImageUrl } from '../../data/quranData';
import { QuranPageItem } from '../../types';
import { QuranReviewModal } from './QuranReviewModal';
import { MushafPageViewerModal } from './MushafPageViewerModal';
import { MapanScheduleModal } from './MapanScheduleModal';
import { QuranPageFeedbackModal } from './QuranPageFeedbackModal';
import { QuranPageCard } from './QuranPageCard';
import { QuranJuz30Tracker } from './QuranJuz30Tracker';
import { IntervalPagesModal } from './IntervalPagesModal';
import { QuranOnboardingModal } from './QuranOnboardingModal';
import { ConnectedClassesModal } from './ConnectedClassesModal';
import { QuranReviewCalendarModal } from './QuranReviewCalendarModal';
import confetti from 'canvas-confetti';
import { MemoryMetricGrid } from '../common/MemoryMetricGrid';
import { UnifiedDueCard, DueFilterPill } from '../common/UnifiedDueCard';
import { getJuzOfflineStatus, cacheJuzOffline } from '../../lib/offlineStorage';
import { useQuranCatalog } from '@/features/alquran/hooks/useQuranCatalog';
import { quranPageService } from '@/features/alquran/services/quranPage.service';
import { 
  Eye, FileText, MessageSquare, 
  Search, 
  ArrowLeft,
  ChevronRight,
  Play,
  RotateCcw,
  CheckCircle2,
  Power,
  Plus,
  Check,
  Calendar,
  CalendarCheck,
  Sparkles,
  LayoutGrid,
  List,
  HardDrive,
  CloudDownload,
  Loader2,
  Flame,
  Brain,
  CalendarClock,
  Copy,
  Link,
  HelpCircle,
  Users
} from 'lucide-react';

const InfoTooltip: React.FC<{ text: string, textEn: string, language: string }> = ({ text, textEn, language }) => (
  <div className="relative group flex items-center">
    <HelpCircle className="w-3 h-3 text-slate-400 hover:text-blue-500 cursor-help transition-colors" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] sm:text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none text-center leading-snug border border-slate-700">
      {language === 'en' ? textEn : text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
    </div>
  </div>
);

export const QuranSpace: React.FC = () => {
  const { 
    quranPages, 
    quranStats, 
    activateQuranPage, 
    deactivateQuranPage,
    reviewQuranPage,
    language,
    quranSpaceCode,
    userProfile,
    joinClassByCode,
    myClasses,
    leaveClass,
    setActiveSpace,
    spaceResetCounter,
    isFeatureAllowed,
    openUpgradeModal
  } = useApp();

  // Navigation state between Screen 1 (Dashboard) and Screen 2 (Juz Page List)
  const [selectedJuzNumber, setSelectedJuzNumber] = useState<number | null>(null);
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'due' | 'active' | 'mapan'>('all');
  const [viewDensity, setViewDensity] = useState<'grid' | 'compact'>('grid');

  // Live Database Hook via useQuranCatalog
  const {
    juzList,
    isJuzListLoading,
    refetchJuzList,
    currentJuzData,
    isPagesLoading,
    refetchPages,
    activatePage,
    isActivating
  } = useQuranCatalog(selectedJuzNumber);

  const handleTogglePageActive = async (pageNumber: number) => {
    const target = displayedCatalogPages.find(p => p.pageNumber === pageNumber);
    if (!target) return;
    if (target.isActive) {
      deactivateQuranPage(pageNumber);
    } else {
      const check = isFeatureAllowed('quran_juz', target.juzNumber);
      if (!check.allowed) {
        openUpgradeModal(
          check.reason,
          language === 'en'
            ? `Free plan allows up to ${check.limit} active Juz concurrently. Upgrade to Unlupa Pro to memorize and review all 30 Juz simultaneously.`
            : `Akun Free dibatasi hingga ${check.limit} Juz aktif sekaligus. Upgrade ke Unlupa Pro untuk mengaktifkan seluruh 30 Juz tanpa batas.`
        );
        return;
      }
      try {
        await activatePage(pageNumber);
        activateQuranPage(pageNumber);
      } catch (err) {
        console.warn("Backend activate failed, updating local state:", err);
        activateQuranPage(pageNumber);
      }
    }
  };

  // Reset to root dashboard if user clicks Quran space tab
  useEffect(() => {
    if (spaceResetCounter?.space === 'quran' && spaceResetCounter.count > 0) {
      setSelectedJuzNumber(null);
    }
  }, [spaceResetCounter]);

  const [inputClassCode, setInputClassCode] = useState('');
  const [joinStatus, setJoinStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  // Offline caching status for current Juz
  const [juzOfflineStatus, setJuzOfflineStatus] = useState<{ total: number; cached: number; isFullyCached: boolean } | null>(null);
  const [isDownloadingJuz, setIsDownloadingJuz] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{ current: number; total: number } | null>(null);
  const [isConnectedClassesOpen, setIsConnectedClassesOpen] = useState(false);

  useEffect(() => {
    if (selectedJuzNumber) {
      getJuzOfflineStatus(selectedJuzNumber).then(setJuzOfflineStatus);
    } else {
      setJuzOfflineStatus(null);
    }
  }, [selectedJuzNumber]);

  const handleDownloadJuz = async () => {
    if (!selectedJuzNumber || isDownloadingJuz) return;
    setIsDownloadingJuz(true);
    setDownloadProgress({ current: 0, total: 20 });
    await cacheJuzOffline(selectedJuzNumber, (current, total) => {
      setDownloadProgress({ current, total });
    });
    const updated = await getJuzOfflineStatus(selectedJuzNumber);
    setJuzOfflineStatus(updated);
    setIsDownloadingJuz(false);
    setDownloadProgress(null);
  };

  // Modals state
  const [reviewModalConfig, setReviewModalConfig] = useState<{ isOpen: boolean; juzFilter: number | null }>({
    isOpen: false,
    juzFilter: null
  });
  const [previewPageNumber, setPreviewPageNumber] = useState<number | null>(null);
  const [justReviewedPage, setJustReviewedPage] = useState<{ pageNumber: number; rating: 1 | 2 | 3 | 4 } | null>(null);
  const [selectedMapanPage, setSelectedMapanPage] = useState<QuranPageItem | null>(null);
  const [isMapanModalOpen, setIsMapanModalOpen] = useState(false);
  const [feedbackPage, setFeedbackPage] = useState<QuranPageItem | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isQuranCalendarOpen, setIsQuranCalendarOpen] = useState(false);
  const [intervalModalConfig, setIntervalModalConfig] = useState<{isOpen: boolean, clusterKey: QuranIntervalClusterKey | null, pages: QuranPageItem[]}>({isOpen: false, clusterKey: null, pages: []});
  const [mapanCelebrationNotice, setMapanCelebrationNotice] = useState<{ pageNumber: number; surah: string } | null>(null);

  // Gestur usap (swipe navigation) for Quran Space
  useSwipeGesture(null, {
    disabled: previewPageNumber !== null || reviewModalConfig.isOpen,
    onSwipeRight: () => {
      if (selectedJuzNumber !== null) {
        if (selectedJuzNumber > 1) {
          setSelectedJuzNumber(selectedJuzNumber - 1);
        } else {
          setSelectedJuzNumber(null);
        }
      } else {
        setActiveSpace('dashboard');
      }
    },
    onSwipeLeft: () => {
      if (selectedJuzNumber !== null) {
        if (selectedJuzNumber < 30) {
          setSelectedJuzNumber(selectedJuzNumber + 1);
        } else {
          setActiveSpace('personal');
        }
      } else {
        setActiveSpace('personal');
      }
    },
    threshold: 40,
    minRatio: 1.15,
  });

  
  const t = {
    overallProgress: { en: 'OVERALL MEMORIZATION PROGRESS', id: 'TOTAL PROGRES HAFALAN', ar: 'التقدم العام في الحفظ' },
    pagesMapan: { en: 'Mastered', id: 'Mapan', ar: 'متقن' },
    pagesDueToday: { en: 'Due Today', id: 'Jatuh Tempo', ar: 'مراجعة' },
    activated: { en: 'Active', id: 'Aktif', ar: 'مفعل' },
    notActivated: { en: 'Not yet activated', id: 'Belum diaktivasi', ar: 'غير مفعل' },
    allCaughtUp: { en: 'All caught up', id: 'Semua sudah dimurajaah', ar: 'تمت المراجعة بالكامل' },
    inJuz: { en: 'In Juz', id: 'Pada Juz', ar: 'في الجزء' },
    acrossJuz: { en: 'Across Juz', id: 'Pada Juz', ar: 'في الأجزاء' },
    due: { en: 'due', id: 'jatuh tempo', ar: 'مراجعة' },
    review: { en: 'Review', id: 'Murajaah', ar: 'مراجعة' },
    mapan: { en: 'Mastered', id: 'Mapan', ar: 'متقن' },
    all: { en: 'All', id: 'Semua', ar: 'الكل' },
    active: { en: 'Active', id: 'Aktif', ar: 'نشط' }
  };

  const effectiveJuzList = useMemo(() => {
    if (juzList && juzList.length > 0) {
      return juzList.map(j => ({
        juzNumber: j.juz_number,
        nameAr: j.name_ar,
        nameEn: j.name_en,
        startPage: j.start_page,
        endPage: j.end_page,
        totalPages: j.total_pages,
        surahSpan: j.surah_span || `${j.start_surah} - ${j.end_surah}`,
        ayahSpan: j.ayah_span,
        activeCount: j.active_pages,
        masteredCount: j.mastered_pages,
        dueCount: j.due_today,
      }));
    }
    return JUZ_LIST.map(j => {
      const activeCount = quranPages.filter(p => p.juzNumber === j.juzNumber && p.isActive).length;
      const dueCount = quranPages.filter(p => p.juzNumber === j.juzNumber && isDue(p.fsrsData.nextReview, p.isActive)).length;
      const masteredCount = quranPages.filter(p => p.juzNumber === j.juzNumber && pageHasMapan(p)).length;
      return {
        ...j,
        activeCount,
        masteredCount,
        dueCount,
      };
    });
  }, [juzList, quranPages]);

  const selectedJuz = selectedJuzNumber 
    ? (effectiveJuzList.find(j => j.juzNumber === selectedJuzNumber) || JUZ_LIST.find(j => j.juzNumber === selectedJuzNumber) || null) 
    : null;

  // Transform backend catalog pages to QuranPageItem for QuranPageCard rendering
  const displayedCatalogPages = useMemo<QuranPageItem[]>(() => {
    if (selectedJuzNumber && currentJuzData?.pages && currentJuzData.pages.length > 0) {
      return currentJuzData.pages.map(p => ({
        pageNumber: p.mushaf_page,
        juzNumber: p.juz_number,
        surahNameEn: p.surah_name_en,
        surahNameAr: p.surah_name_ar,
        surahNumber: p.surah_number || 1,
        ayahRange: p.ayah_range,
        isActive: p.is_activated,
        status: p.activation_status === 'mastered' ? 'mastered_for_now' : (p.is_activated ? 'active' : 'inactive'),
        mapanCelebrated: p.activation_status === 'mastered',
        fsrsData: {
          stability: p.stability || 0,
          difficulty: p.difficulty || 5.0,
          reps: p.review_count || 0,
          lapses: 0,
          lastReview: p.last_review_at || null,
          nextReview: p.next_review_at || (p.is_activated ? new Date().toISOString() : null),
          state: p.activation_status === 'mastered' ? 'mastered' : (p.review_count > 0 ? 'review' : 'new'),
        },
        reviewLogs: [],
      }));
    }
    return selectedJuzNumber ? quranPages.filter(p => p.juzNumber === selectedJuzNumber) : [];
  }, [currentJuzData, quranPages, selectedJuzNumber]);

  function pageHasMapan(page: QuranPageItem) {
    return page.status === 'mastered_for_now' || (page.isActive && (page.fsrsData.stability >= 74.5 || Math.round(page.fsrsData.stability * 0.4025587) > 30));
  }

  // Find all Juz numbers that have pages due today
  const dueJuzMap = new Map<number, number>();
  let totalDueToday = 0;
  let totalActive = 0;

  effectiveJuzList.forEach(j => {
    totalActive += j.activeCount;
    if (j.dueCount > 0) {
      totalDueToday += j.dueCount;
      dueJuzMap.set(j.juzNumber, j.dueCount);
    }
  });
  const dueJuzNumbers = Array.from(dueJuzMap.keys()).sort((a, b) => a - b);

  // Subtitle text for "Across Juz 1, 28 & 29"
  const dueJuzDescription = dueJuzNumbers.length === 0
    ? (language === 'en' ? 'All caught up' : 'Semua sudah dimurajaah')
    : dueJuzNumbers.length === 1
    ? (language === 'en' ? `In Juz ${dueJuzNumbers[0]}` : `Pada Juz ${dueJuzNumbers[0]}`)
    : dueJuzNumbers.length === 2
    ? (language === 'en' ? `Across Juz ${dueJuzNumbers[0]} & ${dueJuzNumbers[1]}` : `Pada Juz ${dueJuzNumbers[0]} & ${dueJuzNumbers[1]}`)
    : (language === 'en' 
        ? `Across Juz ${dueJuzNumbers.slice(0, -1).join(', ')} & ${dueJuzNumbers[dueJuzNumbers.length - 1]}`
        : `Pada Juz ${dueJuzNumbers.slice(0, -1).join(', ')} & ${dueJuzNumbers[dueJuzNumbers.length - 1]}`);

  // Handle direct review action on page card with standard FSRS rating 1-4
  const handleInlineReview = async (pageNumber: number, rating: 1 | 2 | 3 | 4) => {
    try {
      await quranPageService.reviewPage({ page_number: pageNumber, rating });
      await refetchPages();
      await refetchJuzList();
    } catch (err) {
      console.warn("Backend review failed or offline:", err);
    }

    setJustReviewedPage({ pageNumber, rating });
    setTimeout(() => {
      setJustReviewedPage(prev => prev?.pageNumber === pageNumber ? null : prev);
    }, 1800);
  };

  // Format accurate due date for CalendarClock icon
  const formatAccurateDueDate = (page: QuranPageItem) => {
    if (!page.fsrsData.nextReview) return language === 'en' ? 'Today' : 'Hari ini';
    const nextDate = new Date(page.fsrsData.nextReview);
    const now = new Date();
    const isDue = nextDate <= now;
    const formatted = nextDate.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
      day: 'numeric',
      month: 'short'
    });
    if (isDue) {
      return language === 'en' ? `Today (${formatted})` : `Hari ini (${formatted})`;
    }
    return formatted;
  };

  const getFullDueDateStr = (page: QuranPageItem) => {
    if (!page.fsrsData.nextReview) return language === 'en' ? 'Today' : 'Hari ini';
    const nextDate = new Date(page.fsrsData.nextReview);
    return nextDate.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const displayedPages = displayedCatalogPages.filter(page => {
    const isDuePage = isDue(page.fsrsData.nextReview, page.isActive);
    const isMapan = pageHasMapan(page);
    
    if (activeFilterTab === 'due') return isDuePage || (page.isActive && isReviewedToday(page.fsrsData.lastReview));
    if (activeFilterTab === 'active') return page.isActive;
    if (activeFilterTab === 'mapan') return isMapan;
    return true; // 'all'
  });

  // Calculate stats for current Juz in Screen 2
  const currentJuzActiveCount = currentJuzData?.active_pages ?? displayedCatalogPages.filter(p => p.isActive).length;
  const currentJuzDueCount = currentJuzData?.due_today ?? displayedCatalogPages.filter(p => isDue(p.fsrsData.nextReview, p.isActive)).length;
  const currentJuzMapanCount = currentJuzData?.mastered_pages ?? displayedCatalogPages.filter(p => pageHasMapan(p)).length;

  return (
    <div className="space-y-3.5 sm:space-y-4 pb-20 md:pb-10 max-w-5xl mx-auto">
      {/* Header Bar: Title, Badge, and Join Class Code Box strictly in 1 horizontal row */}
      {selectedJuzNumber === null && (
        <div className="flex items-center justify-between w-full mb-1 gap-2 flex-nowrap">
          {/* Left: Title, Connected Classes Badge, and Calendar Trigger Button */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 whitespace-nowrap">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {language === 'en' ? 'Quran Room' : language === 'id' ? 'Ruang Alquran' : 'غرفة القرآن'}
            </h1>
            <button
              onClick={() => setIsConnectedClassesOpen(true)}
              className="flex items-center gap-1.5 px-2.5 h-8.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200/60 dark:border-slate-700/60 shadow-2xs cursor-pointer active:scale-95"
              title={language === 'en' ? `${myClasses.length} Connected Classes` : `${myClasses.length} Kelas Terhubung`}
            >
              <Users className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">
                {myClasses.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setIsQuranCalendarOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 h-8.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs cursor-pointer active:scale-95 text-xs font-bold"
              title={language === 'en' ? 'Planned Quran Review Calendar' : 'Kalender Jadwal Murajaah Al-Qur\'an'}
            >
              <CalendarCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">{language === 'en' ? 'Calendar' : 'Kalender'}</span>
            </button>
          </div>
          
          {/* Right: Unified Seamless Join Class Input + Button Container */}
          <div className="relative shrink-0">
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                if (!inputClassCode.trim()) return;
                const res = await joinClassByCode(inputClassCode.trim());
                setJoinStatus({ type: res.success ? 'success' : 'error', message: res.message });
                if (res.success) setInputClassCode('');
                setTimeout(() => setJoinStatus(null), 4000);
              }}
              className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0.5 shadow-2xs focus-within:ring-2 focus-within:ring-blue-500/40 transition-all h-8.5"
            >
              <input
                type="text"
                placeholder={language === 'en' ? 'Class Code...' : language === 'id' ? 'Kode Kelas...' : 'رمز الفصل...'}
                value={inputClassCode}
                onChange={(e) => setInputClassCode(e.target.value.toUpperCase())}
                className="w-20 sm:w-28 pl-2.5 pr-1 text-xs font-mono font-bold tracking-wider placeholder:font-sans placeholder:font-normal bg-transparent focus:outline-none uppercase text-slate-800 dark:text-slate-100"
              />
              <button
                type="submit"
                disabled={!inputClassCode.trim()}
                title={language === 'en' ? 'Join Class' : 'Gabung Kelas'}
                className="h-7.5 px-2.5 rounded-lg bg-blue-600 dark:bg-blue-800 text-white font-bold text-xs hover:bg-blue-700 dark:hover:bg-blue-700 disabled:opacity-40 flex items-center gap-1 shrink-0 transition-all cursor-pointer active:scale-95 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{language === 'en' ? 'Join' : 'Gabung'}</span>
              </button>
            </form>
            {joinStatus && (
              <p className={`text-[10px] mt-1 absolute top-full right-0 whitespace-nowrap z-20 ${joinStatus.type === 'success' ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-rose-600 dark:text-rose-400 font-semibold'}`}>
                {joinStatus.message}
              </p>
            )}
          </div>
        </div>
      )}

      {selectedJuzNumber === null ? (
        <div className="space-y-4">
          {/* Standard Minimalist Due Card (Unified Across All Rooms) */}
          <UnifiedDueCard
            language={language}
            title={language === 'en' ? 'Daily Review' : 'Kartu Jatuh Tempo'}
            dueCount={totalDueToday}
            totalActiveCount={totalActive}
            itemTypeLabel={language === 'en' ? 'pages' : 'halaman'}
            primaryActionLabel={language === 'en' ? `All (${totalDueToday})` : `Semua (${totalDueToday})`}
            pillGridCols={5}
            onStartAll={() => setReviewModalConfig({ isOpen: true, juzFilter: null })}
            onOpenCalendar={() => setIsQuranCalendarOpen(true)}
            filterPills={dueJuzNumbers.map(juzNum => ({
              id: juzNum,
              label: `J${juzNum}`,
              count: dueJuzMap.get(juzNum) || 0,
              onClick: () => setReviewModalConfig({ isOpen: true, juzFilter: juzNum }),
            }))}
            allCaughtUpTitle={language === 'en' ? 'All Quran pages reviewed today!' : 'Semua hafalan Al-Qur\'an sudah dimurajaah!'}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
            {effectiveJuzList.map(juz => {
              return (
                <div
                  key={juz.juzNumber}
                  onClick={() => {
                    setSelectedJuzNumber(juz.juzNumber);
                    setActiveFilterTab('all');
                  }}
                  className="bg-white dark:bg-slate-900 rounded-[8px] border border-[#ece6d9] dark:border-slate-800 px-3 py-1.5 hover:border-blue-600/60 dark:hover:border-blue-500/60 hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-2 group"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="truncate">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">Juz {juz.juzNumber}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{juz.surahSpan}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      {juz.activeCount} / {juz.totalPages}
                    </span>
                    <div className="flex items-center gap-1">
                      {juz.dueCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-[#fdeee9] dark:bg-rose-950/60 text-[#b85d38] dark:text-rose-300 font-bold text-[9px]">
                          {juz.dueCount} {t.due[language]}
                        </span>
                      )}
                      {juz.masteredCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-bold text-[9px]">
                          {juz.masteredCount} {t.mapan[language]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pelacakan Frekuensi Interaksi & Ketepatan Muroja'ah (Tepat di Bawah Juz 30) */}
          <div className="pt-2">
            <QuranJuz30Tracker
              quranPages={quranPages}
              language={language}
              targetJuzNumber={30}
              onSelectPage={(pageNumber) => setPreviewPageNumber(pageNumber)}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button
              onClick={() => {
                setSelectedJuzNumber(null);
                setActiveFilterTab('all');
              }}
              className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-[#13382c] dark:hover:text-blue-400 transition-colors cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>{language === 'en' ? 'Qur\'an Room' : language === 'id' ? 'Ruang Alquran' : 'غرفة القرآن'}</span>
            </button>

            <div className="flex items-center gap-2 shrink-0 ml-auto">
              <button
                type="button"
                onClick={() => setIsQuranCalendarOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                title={language === 'en' ? `Juz ${selectedJuzNumber} Schedule Calendar` : `Kalender Jadwal Murajaah Juz ${selectedJuzNumber}`}
              >
                <CalendarCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">{language === 'en' ? 'Schedule' : 'Jadwal'}</span>
              </button>

              {currentJuzDueCount > 0 && (
                <button
                  onClick={() => setReviewModalConfig({ isOpen: true, juzFilter: selectedJuzNumber })}
                  className="px-4 py-2 rounded-full bg-blue-700 dark:bg-blue-800 hover:bg-[#0e2a21] dark:hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>
                    {language === 'en' ? `Start Review (${currentJuzDueCount})` : language === 'id' ? `Mulai Murajaah (${currentJuzDueCount})` : `بدء المراجعة (${currentJuzDueCount})`}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Divider */}

            {/* 3 Stats: Activated, Due today, Mapan (Now acts as filters) */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
              <button 
                onClick={() => setActiveFilterTab('all')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${activeFilterTab === 'all' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500/20' : 'border-[#ece6d9] dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-200'}`}
              >
                <div className={`text-xl sm:text-2xl font-black leading-none ${activeFilterTab === 'all' ? 'text-blue-700 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>
                  {currentJuzActiveCount}/{selectedJuz?.totalPages}
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mt-1.5 whitespace-nowrap">
                  {t.activated[language]}
                </div>
              </button>

              <button 
                onClick={() => setActiveFilterTab('due')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${activeFilterTab === 'due' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 ring-2 ring-amber-500/20' : 'border-[#ece6d9] dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-200'}`}
              >
                <div className={`text-xl sm:text-2xl font-black leading-none ${currentJuzDueCount > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                  {currentJuzDueCount}
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mt-1.5 whitespace-nowrap">
                  {t.pagesDueToday[language]}
                </div>
              </button>

              <button 
                onClick={() => setActiveFilterTab('mapan')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${activeFilterTab === 'mapan' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500/20' : 'border-[#ece6d9] dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-200'}`}
              >
                <div className={`text-xl sm:text-2xl font-black leading-none ${activeFilterTab === 'mapan' ? 'text-blue-700 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>
                  {currentJuzMapanCount}
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mt-1.5 whitespace-nowrap">
                  {t.mapan[language]}
                </div>
              </button>
            </div>

            {/* Offline Storage Status & One-Click Download */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-end gap-3 text-xs">
              <div>
                {isDownloadingJuz ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 font-medium text-xs">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>
                      {language === 'en'
                        ? `Downloading (${downloadProgress?.current}/${downloadProgress?.total})...`
                        : `Mengunduh (${downloadProgress?.current}/${downloadProgress?.total})...`}
                    </span>
                  </div>
                ) : juzOfflineStatus?.isFullyCached ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 font-semibold text-xs shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>{language === 'en' ? 'Offline Ready' : 'Tersedia Offline'}</span>
                  </div>
                ) : (
                  <button
                    onClick={handleDownloadJuz}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950/60 text-slate-700 hover:text-blue-800 dark:text-slate-300 dark:hover:text-blue-300 border border-slate-200 dark:border-slate-700 font-semibold text-xs transition-all cursor-pointer shadow-2xs active:scale-95"
                    title="Unduh seluruh halaman Juz ini ke browser agar bisa dibaca kapan saja tanpa koneksi internet"
                  >
                    <CloudDownload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>{language === 'en' ? 'Download Juz (Offline)' : 'Unduh Juz Ini (Offline)'}</span>
                  </button>
                )}
              </div>
            </div>

          {/* Section Header: PAGES */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {language === 'en' ? 'PAGES IN JUZ' : 'DAFTAR HALAMAN JUZ'} ({displayedPages.length})
              </h4>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                
              </span>
            </div>

            {/* Streamlined, Compact Page Cards in 2-Column Grid on Tablet/Desktop */}
            <div className={viewDensity === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-2.5' : 'space-y-2'}>
              {displayedPages.map(page => (
                <QuranPageCard
                  key={page.pageNumber}
                  page={page}
                  language={language}
                  onToggleActive={(pageNumber) => {
                    handleTogglePageActive(pageNumber);
                  }}
                  onOpenMapanModal={(p) => {
                    setSelectedMapanPage(p);
                    setIsMapanModalOpen(true);
                  }}
                  onOpenFeedbackModal={(p) => {
                    setFeedbackPage(p);
                    setIsFeedbackModalOpen(true);
                  }}
                  onOpenMushafViewer={(pageNumber) => {
                    setPreviewPageNumber(pageNumber);
                  }}
                  onInlineReview={(pageNumber, rating) => {
                    handleInlineReview(pageNumber, rating);
                  }}
                  isJustReviewed={justReviewedPage?.pageNumber === page.pageNumber}
                  justReviewedRating={justReviewedPage?.pageNumber === page.pageNumber ? justReviewedPage.rating : undefined}
                />
              ))}
            </div>

            {/* Jika sedang membuka Juz 30, tampilkan pelacakan frekuensi di bagian bawah */}
            {selectedJuzNumber === 30 && (
              <div className="pt-3">
                <QuranJuz30Tracker
                  quranPages={quranPages}
                  language={language}
                  targetJuzNumber={30}
                  onSelectPage={(pageNumber) => setPreviewPageNumber(pageNumber)}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review Modal (supports filtering by specific Juz) */}
      <QuranReviewModal
        isOpen={reviewModalConfig.isOpen}
        juzFilter={reviewModalConfig.juzFilter}
        onClose={() => setReviewModalConfig({ isOpen: false, juzFilter: null })}
        onSelectNextJuz={(nextJuz) => setReviewModalConfig({ isOpen: true, juzFilter: nextJuz })}
      />

      {/* Fullscreen Mushaf Page Viewer Modal */}
      {previewPageNumber !== null && (
        <MushafPageViewerModal
          pageNumber={previewPageNumber}
          isOpen={true}
          onClose={() => setPreviewPageNumber(null)}
          onNavigatePage={(p) => setPreviewPageNumber(p)}
          onOpenFeedback={(p) => {
            const pageItem = quranPages.find(item => item.pageNumber === p);
            if (pageItem) {
              setFeedbackPage(pageItem);
              setIsFeedbackModalOpen(true);
            }
          }}
        />
      )}

      {/* Mastered / Mapan Custom Rhythm Schedule Modal */}
      <MapanScheduleModal
        isOpen={isMapanModalOpen}
        onClose={() => {
          setIsMapanModalOpen(false);
          setSelectedMapanPage(null);
        }}
        page={selectedMapanPage}
      />

      {/* Stability Interval Clusters Modal */}
      <IntervalPagesModal
        isOpen={intervalModalConfig.isOpen}
        onClose={() => setIntervalModalConfig(prev => ({ ...prev, isOpen: false }))}
        clusterKey={intervalModalConfig.clusterKey}
        quranPages={quranPages}
        language={language}
        onToggleActive={(pageNumber) => {
          const target = quranPages.find(p => p.pageNumber === pageNumber);
          if (target?.isActive) {
            deactivateQuranPage(pageNumber);
          } else {
            activateQuranPage(pageNumber);
          }
        }}
        onOpenMapanModal={(page) => {
          setSelectedMapanPage(page);
          setIsMapanModalOpen(true);
        }}
        onOpenFeedbackModal={(page) => {
          setFeedbackPage(page);
          setIsFeedbackModalOpen(true);
        }}
        onOpenMushafViewer={(pageNumber) => {
          setPreviewPageNumber(pageNumber);
        }}
        onInlineReview={(pageNumber, rating) => {
          handleInlineReview(pageNumber, rating);
        }}
        justReviewedPage={justReviewedPage}
      />

      {/* Quran Page Issue & Feedback Modal */}
      <QuranPageFeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => {
          setIsFeedbackModalOpen(false);
          setFeedbackPage(null);
        }}
        page={feedbackPage}
      />

      {/* Floating Mapan Celebration Banner/Toast */}
      {mapanCelebrationNotice && (
        <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-[80] bg-slate-900 dark:bg-slate-850 text-white px-5 py-3.5 rounded-2xl shadow-xl border border-amber-400/40 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-md w-[92%]">
          <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-amber-300">
              {language === 'en' ? 'Mabruk! Page Mastered (Mapan)!' : 'Mabruk! Halaman Resmi Mapan!'}
            </p>
            <p className="text-[11px] text-slate-300 truncate">
              {language === 'en'
                ? `Page ${mapanCelebrationNotice.pageNumber} (${mapanCelebrationNotice.surah}) rotation reached >30 days.`
                : `Hal ${mapanCelebrationNotice.pageNumber} (${mapanCelebrationNotice.surah}) telah mencapai rotasi >30 hari.`}
            </p>
          </div>
          <button
            onClick={() => {
              const target = quranPages.find(p => p.pageNumber === mapanCelebrationNotice.pageNumber);
              if (target) {
                setSelectedMapanPage(target);
                setIsMapanModalOpen(true);
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shrink-0 cursor-pointer shadow-xs transition-transform active:scale-95"
          >
            {language === 'en' ? 'Set Rhythm' : 'Atur Ritme'}
          </button>
        </div>
      )}

      {/* Connected Classes Modal */}
      <ConnectedClassesModal
        isOpen={isConnectedClassesOpen}
        onClose={() => setIsConnectedClassesOpen(false)}
        language={language}
        connectedClasses={myClasses}
        onLeaveClass={leaveClass}
      />

      {/* Planned Quran Review Calendar Modal */}
      <QuranReviewCalendarModal
        isOpen={isQuranCalendarOpen}
        onClose={() => setIsQuranCalendarOpen(false)}
        quranPages={quranPages}
        language={language}
        initialJuzFilter={selectedJuzNumber}
        onStartReview={(juz) => setReviewModalConfig({ isOpen: true, juzFilter: juz || null })}
        onOpenMushafViewer={(pageNumber) => setPreviewPageNumber(pageNumber)}
      />
    </div>
  );
};
