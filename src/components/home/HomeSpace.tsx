import React, { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { useSwipeGesture } from "../../hooks/useSwipeGesture";
import {
  Sparkles,
  Quote,
  Crown,
  ArrowRight,
} from "@/components/foundations/hugeicons";
import { motion } from "motion/react";
import { VisualReviewCalendar } from "./VisualReviewCalendar";
import { ConsistencyJourneyWidget } from "./ConsistencyJourneyWidget";
import { StreakOverviewCard } from "./StreakOverviewCard";
import { WeakSpotsWidget } from "./WeakSpotsWidget";
import { QuickActionsBar } from "./QuickActionsBar";
import { StudentReportModal } from "./StudentReportModal";
import { AchievementReportModal } from "../common/AchievementReportModal";
import { QuranAttendanceModal } from "../attendance/QuranAttendanceModal";
import { MushafPageViewerModal } from "../quran/MushafPageViewerModal";
import { useNavigate } from "react-router-dom";

import { useAuthStore } from "@/features/auth/stores/auth.store";

const dailyWisdomIndex = Math.floor(Date.now() / 86_400_000);

/**
 * OPTIMIZED HOME SPACE (BERANDA)
 * Central intelligence hub with direct actionable swipeable review queue,
 * weak spots attention, real-data consistency journey, and quick exports.
 */
export const HomeSpace: React.FC = () => {
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.user);
  const {
    quranPages,
    quranStats,
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

  const displayName =
    authUser?.name ||
    (userProfile?.fullName && userProfile.fullName !== "Tamu / Murid"
      ? userProfile.fullName
      : "") ||
    "Akhi";
  const hasProAccess =
    userProfile.plan === "premium" ||
    userProfile.plan === "institutional" ||
    userProfile.role === "admin" ||
    userProfile.role === "superadmin" ||
    authUser?.role === "admin";

  // Navigation Gesture (Global swipe to Quran space)
  useSwipeGesture(null, {
    onSwipeLeft: () => setActiveSpace("quran"),
    threshold: 50,
    minRatio: 1.25,
  });

  // Modal States on Home
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAchievementModalOpen, setIsAchievementModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [previewPageNumber, setPreviewPageNumber] = useState<number | null>(
    null,
  );

  const dailyWisdom = useMemo(() => {
    const quotes =
      language === "en"
        ? [
            "Knowledge is not what is memorized, but what benefits.",
            "The best of you are those who learn the Quran and teach it.",
            "Seeking knowledge is a duty upon every Muslim.",
            "He who treads a path in search of knowledge, Allah will make easy for him the path to Paradise.",
            "Indeed, this Quran guides to that which is most suitable.",
          ]
        : [
            "Ilmu itu bukan apa yang sekadar dihafal, tapi apa yang diamalkan dan memberi manfaat.",
            "Sebaik-baik kalian adalah yang mempelajari Al-Qur'an dan mengajarkannya.",
            "Menuntut ilmu adalah kewajiban bagi setiap insan Muslim.",
            "Barangsiapa menempuh jalan untuk mencari ilmu, maka Allah mudahkan jalan baginya menuju surga.",
            "Jagalah hafalan Al-Qur'an, demi Dzat yang jiwaku berada di tangan-Nya, ia lebih cepat lepas daripada unta dari ikatannya.",
          ];
    return quotes[dailyWisdomIndex % quotes.length];
  }, [language]);

  return (
    <div className="max-w-5xl mx-auto px-4 pb-28 space-y-6 sm:space-y-7 animate-in fade-in slide-in-from-bottom-3 duration-500">
      {/* 1. HERO SECTION: GREETING & HIGH-LEVEL RETENTION METRICS */}
      <section className="pt-2 sm:pt-4 relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5 min-w-0 flex-1">
            <motion.h1
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2"
            >
              <span className="text-primary">Ahlan, {displayName}</span>
              
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
      {!hasProAccess ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-[#fb923c]/50 p-5 text-white shadow-xl shadow-[#ef6905]/15 sm:p-6"
          style={{
            background:
              "radial-gradient(circle at 90% 10%, rgba(251,191,36,0.34), transparent 34%), linear-gradient(135deg, #ef6905 0%, #c2410c 100%)",
          }}
        >
          <div className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full border border-white/15" />
          <div className="pointer-events-none absolute -right-3 top-14 size-20 rounded-full border border-white/10" />

          <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#1d140d] text-[#fbbf24] shadow-lg shadow-black/20 ring-1 ring-white/15 ring-inset">
                <Crown className="size-6 fill-current" />
              </div>
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                  <Sparkles className="size-3" />
                  Unlupa Pro
                </div>
                <h3 className="mt-2 text-lg font-semibold tracking-tight text-white sm:text-xl">
                  {language === "en"
                    ? "Unlock your complete learning journey"
                    : "Buka seluruh perjalanan belajarmu"}
                </h3>
                <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-[#ffedd5]">
                  {language === "en"
                    ? "Access all 30 Juz, unlimited AI tools, personal books, voice recording, and complete teaching reports."
                    : "Akses seluruh 30 Juz, AI tanpa batas, buku pribadi, rekaman suara, dan laporan mengajar lengkap."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    language === "en"
                      ? "604 Mushaf pages"
                      : "604 halaman Mushaf",
                    language === "en" ? "Unlimited AI" : "AI tanpa batas",
                    language === "en" ? "Teaching tools" : "Fitur mengajar",
                  ].map((benefit) => (
                    <span
                      key={benefit}
                      className="rounded-full bg-[#1d140d]/25 px-2.5 py-1 text-[10px] font-semibold text-white ring-1 ring-white/15 ring-inset"
                    >
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                openUpgradeModal(
                  "Home Banner",
                  "Upgrade ke Unlupa Pro untuk akses penuh tanpa batasan fitur.",
                )
              }
              className="flex h-11 w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#111827] px-5 text-sm font-semibold text-[#fbbf24] shadow-lg shadow-black/20 ring-1 ring-white/10 ring-inset transition-all hover:bg-[#1f2937] active:scale-[0.98] sm:w-auto"
            >
              <span>
                {language === "en" ? "Upgrade to Pro" : "Tingkatkan ke Pro"}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      ) : null}

      {/* 1.5 STREAK OVERVIEW */}
      <StreakOverviewCard />

      {/* 3. VISUAL PLANNED REVIEW & RETENTION CALENDAR */}
      <VisualReviewCalendar
        onOpenQuranReview={() => navigate("/dashboard/alquran")}
        onOpenPersonalReview={() => navigate("/dashboard/pribadi")}
        onOpenMushafViewer={(page) => setPreviewPageNumber(page)}
      />

      {/* 4. WEAK SPOTS & TAJWID FOCUS SECTION */}
      <WeakSpotsWidget
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

      <MushafPageViewerModal
        isOpen={previewPageNumber !== null}
        onClose={() => setPreviewPageNumber(null)}
        pageNumber={previewPageNumber || 1}
      />
    </div>
  );
};
