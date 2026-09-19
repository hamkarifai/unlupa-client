import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { 
  Flame, 
  Sparkles, 
  Quote, 
  CheckCircle2, 
  Crown,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'motion/react';
import { SwipeableReviewQueue } from './SwipeableReviewQueue';
import { VisualReviewCalendar } from './VisualReviewCalendar';
import { ConsistencyJourneyWidget } from './ConsistencyJourneyWidget';
import { WeeklyStreakWidget } from './WeeklyStreakWidget';
import { WeakSpotsWidget } from './WeakSpotsWidget';
import { QuickActionsBar } from './QuickActionsBar';
import { StudentReportModal } from './StudentReportModal';
import { AchievementReportModal } from '../common/AchievementReportModal';
import { QuranAttendanceModal } from '../attendance/QuranAttendanceModal';
import { QuranReviewModal } from '../quran/QuranReviewModal';
import { MushafPageViewerModal } from '../quran/MushafPageViewerModal';
import { PersonalReviewModal } from '../personal/PersonalReviewModal';

import { useAuthStore } from '@/features/auth/stores/auth.store';

/**
 * OPTIMIZED HOME SPACE (BERANDA)
 * Central intelligence hub with direct actionable swipeable review queue,
 * weak spots attention, real-data consistency journey, and quick exports.
 */
export const HomeSpace: React.FC = () => {
  const authUser = useAuthStore((state) => state.user);
  const {
    quranPages,
    quranStats,
    personalStats,
    items,
    books,
    chapters,
    myClasses,
    teachingClasses,
    userProfile,
    currentStreak,
    language,
    setActiveSpace,
    totalActiveMaterials,
    totalMasteredMaterials,
    openUpgradeModal,
  } = useApp();

  const displayName = authUser?.name || (userProfile?.fullName && userProfile.fullName !== 'Tamu / Murid' ? userProfile.fullName : '') || 'Akhi';

  // Navigation Gesture (Global swipe to Quran space)
  useSwipeGesture(null, {
    onSwipeLeft: () => setActiveSpace('quran'),
    threshold: 50,
    minRatio: 1.25,
  });

  // Modal States on Home
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAchievementModalOpen, setIsAchievementModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  
  // Review Modal States
  const [quranReviewConfig, setQuranReviewConfig] = useState<{ isOpen: boolean; juzFilter: number | null }>({
    isOpen: false,
    juzFilter: null
  });
  const [isPersonalReviewOpen, setIsPersonalReviewOpen] = useState(false);
  const [previewPageNumber, setPreviewPageNumber] = useState<number | null>(null);

  // Computed data
  const totalDueToday = (quranStats?.dueToday || 0) + (personalStats?.dueToday || 0);

  const dailyWisdom = useMemo(() => {
    const quotes = language === 'en' ? [
      "Knowledge is not what is memorized, but what benefits.",
      "The best of you are those who learn the Quran and teach it.",
      "Seeking knowledge is a duty upon every Muslim.",
      "He who treads a path in search of knowledge, Allah will make easy for him the path to Paradise.",
      "Indeed, this Quran guides to that which is most suitable."
    ] : [
      "Ilmu itu bukan apa yang sekadar dihafal, tapi apa yang diamalkan dan memberi manfaat.",
      "Sebaik-baik kalian adalah yang mempelajari Al-Qur'an dan mengajarkannya.",
      "Menuntut ilmu adalah kewajiban bagi setiap insan Muslim.",
      "Barangsiapa menempuh jalan untuk mencari ilmu, maka Allah mudahkan jalan baginya menuju surga.",
      "Jagalah hafalan Al-Qur'an, demi Dzat yang jiwaku berada di tangan-Nya, ia lebih cepat lepas daripada unta dari ikatannya."
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  }, [language]);

  return (
    <div className="max-w-5xl mx-auto px-4 pb-28 space-y-6 sm:space-y-7 animate-in fade-in slide-in-from-bottom-3 duration-500">
      
      {/* 1. HERO SECTION: GREETING & HIGH-LEVEL RETENTION METRICS */}
      <section className="pt-2 sm:pt-4 relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 text-[11px] font-bold">
              <Sparkles className="w-3 h-3 text-blue-500" />
              <span>{language === 'en' ? 'Adaptive Retention Engine' : 'Sistem Retensi Adaptif Aktif'}</span>
            </div>

            <motion.h1 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }}
              className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2"
            >
              <span>Ahlan, {displayName}</span>
              <span className="inline-block animate-wave text-lg sm:text-xl">👋</span>
            </motion.h1>

            <div className="flex items-start gap-2 text-slate-500 dark:text-slate-400 max-w-xl">
              <Quote className="w-3.5 h-3.5 opacity-40 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm font-medium italic leading-relaxed line-clamp-2">
                {dailyWisdom}
              </p>
            </div>
          </div>


        </div>
      </section>

      {/* PRO UPGRADE SPOTLIGHT BANNER */}
      {userProfile.plan === 'free' ? (
        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 p-4 sm:p-5 text-white shadow-lg shadow-amber-500/15"
        >
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[11px] font-black tracking-wide text-amber-100 uppercase">
                <Crown className="w-3.5 h-3.5 text-amber-200" />
                <span>Unlupa Pro Upgrade</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {language === 'en' ? 'Unlock Complete 30 Juz & Unlimited AI' : 'Buka Hafalan 30 Juz & AI Builder Tanpa Batas'}
              </h3>
              <p className="text-xs text-amber-100/90 max-w-xl leading-relaxed">
                {language === 'en' 
                  ? 'Upgrade today to access all 604 Mushaf pages, unlimited personal books, voice recording, and teaching reports.'
                  : 'Tingkatkan akun Anda untuk membuka seluruh 604 halaman mushaf, buat buku tak terbatas, dan kelola kelas santri.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => openUpgradeModal('Home Banner', 'Upgrade ke Unlupa Pro untuk akses penuh tanpa batasan fitur.')}
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-amber-400 hover:bg-slate-800 active:scale-95 font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <span>{language === 'en' ? 'Upgrade to Pro' : 'Tingkatkan ke Pro'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      ) : null}

      {/* 1.5 WEEKLY STREAK WIDGET */}
      <WeeklyStreakWidget />

      {/* 2. SWIPEABLE UNIFIED REVIEW QUEUE CARD (AL-QUR'AN, PRIBADI, KELAS, RUANG GURU) */}
      <SwipeableReviewQueue
        onOpenQuranReview={(juz) => setQuranReviewConfig({ isOpen: true, juzFilter: juz || null })}
        onOpenPersonalReview={() => setIsPersonalReviewOpen(true)}
      />

      {/* 3. VISUAL PLANNED REVIEW & RETENTION CALENDAR */}
      <VisualReviewCalendar
        onOpenQuranReview={(juz) => setQuranReviewConfig({ isOpen: true, juzFilter: juz || null })}
        onOpenPersonalReview={() => setIsPersonalReviewOpen(true)}
        onOpenMushafViewer={(page) => setPreviewPageNumber(page)}
      />

      {/* 4. WEAK SPOTS & TAJWID FOCUS SECTION */}
      <WeakSpotsWidget
        onOpenQuranReview={(juz) => setQuranReviewConfig({ isOpen: true, juzFilter: juz || null })}
        onOpenMushafViewer={(page) => setPreviewPageNumber(page)}
      />

      {/* 4. CONSISTENCY & RETENTION HEATMAP (REAL DATA) */}
      <ConsistencyJourneyWidget />

      {/* 5. QUICK ACTIONS & EXPORT UTILITIES */}
      <QuickActionsBar
        onOpenReport={() => setIsReportModalOpen(true)}
        onOpenAchievementModal={() => setIsAchievementModalOpen(true)}
        onOpenAttendanceModal={() => setIsAttendanceModalOpen(true)}
      />

      {/* Modals Hosted on Beranda */}
      <StudentReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        userProfile={userProfile}
        quranPages={quranPages}
        quranStats={quranStats}
        books={books}
        items={items}
        chapters={chapters}
        myClasses={myClasses}
        teachingClasses={teachingClasses}
        currentStreak={currentStreak}
        totalActiveMaterials={totalActiveMaterials}
        totalMasteredMaterials={totalMasteredMaterials}
        language={language}
      />

      <AchievementReportModal
        isOpen={isAchievementModalOpen}
        onClose={() => setIsAchievementModalOpen(false)}
      />

      <QuranAttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        language={language}
      />

      <QuranReviewModal
        isOpen={quranReviewConfig.isOpen}
        onClose={() => setQuranReviewConfig({ isOpen: false, juzFilter: null })}
        juzFilter={quranReviewConfig.juzFilter}
        onSelectNextJuz={(nextJuz) => setQuranReviewConfig({ isOpen: true, juzFilter: nextJuz })}
      />

      <MushafPageViewerModal
        isOpen={previewPageNumber !== null}
        onClose={() => setPreviewPageNumber(null)}
        pageNumber={previewPageNumber || 1}
      />

      <PersonalReviewModal
        isOpen={isPersonalReviewOpen}
        onClose={() => setIsPersonalReviewOpen(false)}
      />

    </div>
  );
};

