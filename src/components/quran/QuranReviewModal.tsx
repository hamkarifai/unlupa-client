import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { QuranPageItem, MapanScheduleConfig } from '../../types';
import { predictQuranIntervals, isDue } from '../../lib/fsrs';
import { getQuranPageImageUrl } from '../../data/quranData';
import { getOfflinePageUrl, cachePageOffline, logOfflineReview } from '../../lib/offlineStorage';
import { MushafPageViewerModal } from './MushafPageViewerModal';
import { AudioRecorderPlayer } from '../shared/AudioRecorderPlayer';
import { MurottalPlayer } from '../shared/MurottalPlayer';
import { 
  X, 
  Eye, 
  EyeOff,
  CheckCircle2, 
  RotateCcw, 
  BookOpen, 
  Sparkles,
  Trophy,
  ArrowRight,
  Maximize2,
  Loader2,
  Zap,
  CalendarDays,
  CalendarCheck2,
  Check,
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEffects } from '../../lib/soundFeedback';
import { quranPageService } from '@/features/alquran/services/quranPage.service';

const WEEK_DAYS = [
  { id: 0, labelId: 'Ahad', labelEn: 'Sun' },
  { id: 1, labelId: 'Senin', labelEn: 'Mon' },
  { id: 2, labelId: 'Selasa', labelEn: 'Tue' },
  { id: 3, labelId: 'Rabu', labelEn: 'Wed' },
  { id: 4, labelId: 'Kamis', labelEn: 'Thu' },
  { id: 5, labelId: "Jum'at", labelEn: 'Fri' },
  { id: 6, labelId: 'Sabtu', labelEn: 'Sat' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialPageNumber?: number;
  juzFilter?: number | null;
  onSelectNextJuz?: (nextJuzNumber: number) => void;
}

export const QuranReviewModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialPageNumber,
  juzFilter,
  onSelectNextJuz,
}) => {
  const { quranPages, quranStats, reviewQuranPage, updateQuranMapanSchedule, language, isTeacherMode, activeSpace } = useApp();
  const isTeacher = isTeacherMode || activeSpace === 'teaching';
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullViewerOpen, setIsFullViewerOpen] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [isPageRevealed, setIsPageRevealed] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [feedbackIssues, setFeedbackIssues] = useState<('kelancaran' | 'tajwid' | 'makharijul' | 'konsentrasi')[]>([]);

  const [masteredCelebration, setMasteredCelebration] = useState<{
    pageNumber: number;
    surahName: string;
    juzNumber: number;
  } | null>(null);

  const [celebrationMode, setCelebrationMode] = useState<'fsrs' | 'weekly' | 'monthly'>('fsrs');
  const [celebrationWeeklyDay, setCelebrationWeeklyDay] = useState<number>(5);
  const [celebrationMonthlyDate, setCelebrationMonthlyDate] = useState<number>(1);
  const [sessionQueue, setSessionQueue] = useState<QuranPageItem[]>([]);
  const [justRated, setJustRated] = useState<{ rating: 1 | 2 | 3; label: string } | null>(null);

  // Snapshot the exact list of pages when modal opens so queue does not shift or skip pages during session
  useEffect(() => {
    if (isOpen) {
      const filtered = (juzFilter 
        ? quranStats.dueList.filter(p => p.juzNumber === juzFilter)
        : quranStats.dueList
      ).slice().sort((a, b) => a.pageNumber - b.pageNumber);

      if (initialPageNumber && !filtered.some(p => p.pageNumber === initialPageNumber)) {
        const targetPage = quranPages.find(p => p.pageNumber === initialPageNumber);
        if (targetPage) filtered.unshift(targetPage);
      }

      setSessionQueue(filtered);
      setCurrentIndex(0);
      setReviewedCount(0);
      setIsPageRevealed(false);
      setMasteredCelebration(null);
      setJustRated(null);
    } else {
      setSessionQueue([]);
    }
  }, [isOpen, juzFilter, initialPageNumber]);

  const queue: QuranPageItem[] = sessionQueue;

  // Retrieve latest state of the current item from quranPages to ensure accurate updates
  const currentItem = queue[currentIndex] 
    ? (quranPages.find(p => p.pageNumber === queue[currentIndex].pageNumber) || queue[currentIndex])
    : null;

  const [localImageUrl, setLocalImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (currentItem) {
      setImageLoading(true);
      (async () => {
        const cached = await getOfflinePageUrl(currentItem.pageNumber);
        if (active) {
          if (cached) {
            setLocalImageUrl(cached);
            setImageLoading(false);
          } else {
            setLocalImageUrl(null);
          }
        }
      })();
    }
    return () => {
      active = false;
    };
  }, [currentItem?.pageNumber]);

  const advanceQueue = () => {
    if (masteredCelebration) {
      const config: MapanScheduleConfig = {
        mode: celebrationMode,
        weeklyDay: celebrationMode === 'weekly' ? celebrationWeeklyDay : undefined,
        monthlyDate: celebrationMode === 'monthly' ? celebrationMonthlyDate : undefined,
      };
      updateQuranMapanSchedule(masteredCelebration.pageNumber, config);
    }
    setMasteredCelebration(null);
    if (currentIndex + 1 < queue.length) {
      setCurrentIndex(prev => prev + 1);
      setIsPageRevealed(false);
    } else {
      // Completed queue! Trigger celebration
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 }
      });
      setCurrentIndex(queue.length); // triggers finished state
    }
  };

  const handleRating = (rating: 1 | 2 | 3) => {
    if (!currentItem || justRated) return;

    // Subtle audio micro-interaction
    soundEffects.playRatingFeedback(rating === 1 ? 1 : rating === 2 ? 2 : 4);

    const confirmationLabel = rating === 1 
      ? (language === 'en' ? 'Review Soon (Scheduled for repeat)' : 'Dicatat: Belum Lancar (Akan diulang besok)')
      : rating === 2
      ? (language === 'en' ? 'Fluent! (Interval increased)' : 'Dicatat: Lancar! (Interval bertambah)')
      : (language === 'en' ? 'Mastered Mutqin! (Optimal interval)' : 'Dicatat: Lancar Mutqin! (Interval optimal)');

    setJustRated({ rating, label: confirmationLabel });

    setTimeout(async () => {
      try {
        const apiRating = rating === 3 ? 4 : rating === 2 ? 3 : 1;
        await quranPageService.reviewPage({ page_number: currentItem.pageNumber, rating: apiRating });
      } catch (err) {
        console.warn("Backend review failed or offline:", err);
      }

      const res = reviewQuranPage(currentItem.pageNumber, rating);
      logOfflineReview('quran', currentItem.pageNumber, rating);
      setReviewedCount(prev => prev + 1);
      setImageLoading(true);
      setJustRated(null);

      if (res?.justBecameMastered) {
        // Trigger Mapan success animation ONLY the first time it reaches Mapan
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.5 },
          colors: ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6']
        });
        setMasteredCelebration({
          pageNumber: currentItem.pageNumber,
          surahName: currentItem.surahNameEn,
          juzNumber: currentItem.juzNumber,
        });
        return;
      }

      advanceQueue();
    }, 280);
  };

  const isFinished = !currentItem || currentIndex >= queue.length;
  const currentImageUrl = currentItem ? getQuranPageImageUrl(currentItem.pageNumber, 1260) : '';

  // Check which other Juz have due items remaining
  const otherDueJuzMap = new Map<number, number>();
  (quranStats?.dueList || []).forEach(p => {
    if (!juzFilter || p.juzNumber !== juzFilter) {
      otherDueJuzMap.set(p.juzNumber, (otherDueJuzMap.get(p.juzNumber) || 0) + 1);
    }
  });
  const otherDueJuzNumbers = Array.from(otherDueJuzMap.keys()).sort((a, b) => a - b);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl h-[94vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {juzFilter
                  ? (language === 'en' ? `Murajaah Juz ${juzFilter}` : `Murajaah Juz ${juzFilter}`)
                  : (language === 'en' ? 'Quran Daily Murajaah' : 'Murajaah Harian Al-Qur\'an')}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {queue.length > 0
                  ? (language === 'en' ? `${queue.length} pages due in this session` : `${queue.length} halaman due untuk sesi ini`)
                  : (language === 'en' ? 'Mushaf Madinah Page Review' : 'Review Halaman Mushaf Madinah')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isFinished && currentItem && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {currentIndex + 1} / {queue.length}
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Visual Review Progress Bar */}
        {!isFinished && queue.length > 0 && !masteredCelebration && (
          <div className="bg-slate-50/70 dark:bg-slate-900/60 px-5 py-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5">
              <span>{language === 'en' ? 'Progress' : 'Progres Sesi'}: {currentIndex + 1} / {queue.length} ({Math.round(((currentIndex) / queue.length) * 100)}%)</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">{queue.length - currentIndex} {language === 'en' ? 'remaining' : 'halaman tersisa'}</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.min(100, Math.max(4, ((currentIndex) / queue.length) * 100))}%` }}
              />
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col">
          {masteredCelebration ? (
            /* Celebration Screen for Mapan Achievement with Custom Schedule Options */
            <div className="py-4 my-auto max-w-lg mx-auto animate-in zoom-in-95 duration-300 w-full text-left">
              <div className="text-center mb-5">
                <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-950/80 border-2 border-amber-300 dark:border-amber-600 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-3 shadow-lg shadow-amber-500/20">
                  <Sparkles className="w-8 h-8 animate-pulse" />
                </div>
                <span className="inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 mb-2 border border-emerald-300 dark:border-emerald-800">
                  {language === 'en' ? 'Mastered / Mutqin Status Achieved' : 'Hafalan Lulus & Mapan (Mutqin)'}
                </span>
                <h4 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {language === 'en' ? 'Mabruk! Page Successfully Mastered!' : 'Mabruk! Selamat, Halaman Ini Sudah Mapan!'}
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  {language === 'en'
                    ? `Page ${masteredCelebration.pageNumber} (${masteredCelebration.surahName}, Juz ${masteredCelebration.juzNumber}) is officially Mastered! You can continue with the app's default adaptive scheduling, or choose a custom weekly/monthly rhythm below:`
                    : `Halaman ${masteredCelebration.pageNumber} (${masteredCelebration.surahName}, Juz ${masteredCelebration.juzNumber}) telah resmi Mapan! Anda bisa tetap melanjutkan ritme murajaah sesuai dengan penjadwalan yang ditentukan oleh aplikasi, atau Anda bisa memilih ritme mingguan maupun bulanan:`}
                </p>
              </div>

              {/* Selection cards for schedule */}
              <div className="space-y-2.5 mb-6">
                {/* 1. App Adaptive Schedule */}
                <div
                  onClick={() => setCelebrationMode('fsrs')}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-1.5 ${
                    celebrationMode === 'fsrs'
                      ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 dark:border-indigo-500'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${celebrationMode === 'fsrs' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                        <Zap className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {language === 'en' ? 'App Adaptive Schedule (Recommended)' : 'Penjadwalan Otomatis Aplikasi (Rekomendasi)'}
                      </span>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${celebrationMode === 'fsrs' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'}`}>
                      {celebrationMode === 'fsrs' && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-7 leading-relaxed">
                    {language === 'en'
                      ? 'Intervals adapt automatically based on your recall. If recitation ever falters, the app automatically schedules it for an earlier review.'
                      : 'Jadwal pengulangan diatur secara adaptif oleh aplikasi. Jika hafalan kelak terasa goyah saat diulang, sistem otomatis menjadwalkan murajaah lebih awal.'}
                  </p>
                </div>

                {/* 2. Weekly Fixed Day */}
                <div
                  onClick={() => setCelebrationMode('weekly')}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-1.5 ${
                    celebrationMode === 'weekly'
                      ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 dark:border-emerald-500'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${celebrationMode === 'weekly' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                        <CalendarDays className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {language === 'en' ? 'Weekly Fixed Day' : 'Jadwal Mingguan (Pilih Hari)'}
                      </span>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${celebrationMode === 'weekly' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'}`}>
                      {celebrationMode === 'weekly' && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                  {celebrationMode === 'weekly' && (
                    <div className="pt-2 pl-7 space-y-1.5">
                      <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold block">
                        {language === 'en' ? 'Murajaah every:' : 'Murajaah setiap hari:'}
                      </span>
                      <div className="grid grid-cols-7 gap-1">
                        {WEEK_DAYS.map(day => (
                          <button
                            key={day.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCelebrationWeeklyDay(day.id);
                            }}
                            className={`py-1 px-1 rounded-lg text-[11px] font-bold text-center cursor-pointer transition-all ${
                              celebrationWeeklyDay === day.id
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                            }`}
                          >
                            {language === 'en' ? day.labelEn : day.labelId}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Monthly Fixed Date */}
                <div
                  onClick={() => setCelebrationMode('monthly')}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-1.5 ${
                    celebrationMode === 'monthly'
                      ? 'border-amber-600 bg-amber-50/70 dark:bg-amber-950/40 dark:border-amber-500'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${celebrationMode === 'monthly' ? 'bg-amber-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                        <CalendarCheck2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {language === 'en' ? 'Monthly Fixed Date' : 'Jadwal Bulanan (Pilih Tanggal 1–31)'}
                      </span>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${celebrationMode === 'monthly' ? 'border-amber-600 bg-amber-600 text-white' : 'border-slate-300'}`}>
                      {celebrationMode === 'monthly' && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                  {celebrationMode === 'monthly' && (
                    <div className="pt-2 pl-7 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-600 dark:text-slate-400 font-semibold">
                          {language === 'en' ? 'Review date (1 - 31):' : 'Tanggal murajaah tiap bulan (1 - 31):'}
                        </span>
                        <span className="font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                          {language === 'en' ? `Day ${celebrationMonthlyDate}` : `Tanggal ${celebrationMonthlyDate}`}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="31"
                        value={celebrationMonthlyDate}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setCelebrationMonthlyDate(parseInt(e.target.value))}
                        className="w-full accent-amber-600 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Tgl 1</span>
                        <span>Tgl 10</span>
                        <span>Tgl 20</span>
                        <span>Tgl 31</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={advanceQueue}
                  className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  <span>{language === 'en' ? 'Save & Continue' : 'Simpan & Lanjut ke Halaman Berikutnya'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : isFinished ? (
            <div className="text-center py-8 my-auto">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300 mx-auto flex items-center justify-center mb-4 shadow-sm">
                <Trophy className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-bold text-slate-900 dark:text-white">
                {juzFilter 
                  ? (language === 'en' ? `Juz ${juzFilter} Murajaah Complete!` : `Murajaah Juz ${juzFilter} Selesai!`)
                  : (language === 'en' ? 'Murajaah Complete!' : 'Murajaah Hari Ini Selesai!')}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-sm mx-auto">
                {language === 'en'
                  ? `Alhamdulillah! You reviewed ${reviewedCount} page${reviewedCount === 1 ? '' : 's'}. Next intervals have been updated.`
                  : `Alhamdulillah! Anda telah mereview ${reviewedCount} halaman. Jadwal murajaah telah dihitung dan diperbarui.`}
              </p>

              {/* Next Due Juz Suggestions if any remain */}
              {otherDueJuzNumbers.length > 0 && (
                <div className="mt-6 p-4 rounded-2xl bg-[#f7f4ed] dark:bg-slate-800/80 border border-[#ece6d9] dark:border-slate-700 max-w-md mx-auto text-left">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                    {language === 'en' ? 'Other Juz due today:' : 'Juz lain yang masih due hari ini:'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {otherDueJuzNumbers.map(nextJuz => (
                      <button
                        key={nextJuz}
                        onClick={() => {
                          if (onSelectNextJuz) {
                            onSelectNextJuz(nextJuz);
                            setCurrentIndex(0);
                            setReviewedCount(0);
                            setIsPageRevealed(true);
                          }
                        }}
                        className="px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/60 border border-slate-300 dark:border-slate-700 hover:border-blue-500 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-800 dark:hover:text-blue-300 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <span>Juz {nextJuz}</span>
                        <span className="px-1.5 py-0.5 rounded-full bg-[#fdeee9] dark:bg-rose-950 text-[#b85d38] dark:text-rose-300 text-[10px] font-bold">
                          {otherDueJuzMap.get(nextJuz)} due
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-[#13382c] dark:bg-blue-800 text-white font-semibold hover:bg-[#0e2a21] dark:hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm shadow-sm cursor-pointer"
                >
                  <span>{language === 'en' ? 'Return to Quran Room' : 'Kembali ke Ruang Alquran'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col flex-1">
              {/* Page Information Header Bar */}
              <div className="bg-amber-50/60 dark:bg-slate-800/80 border border-amber-200/80 dark:border-slate-700 rounded-2xl p-3.5 sm:p-4 mb-3.5 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 flex flex-col items-center justify-center font-bold border border-amber-200 dark:border-amber-800">
                    <span className="text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-400">Hal</span>
                    <span className="text-sm leading-none">{currentItem.pageNumber}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {currentItem.surahNameEn}
                      </h4>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100/80 dark:bg-amber-950 text-amber-900 dark:text-amber-200 font-semibold">
                        Juz {currentItem.juzNumber}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Ayat {currentItem.ayahRange}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-serif text-lg font-bold text-amber-950 dark:text-amber-200 hidden sm:inline" dir="rtl">
                    سُورَةُ {currentItem.surahNameAr}
                  </span>
                  <button
                    onClick={() => setIsFullViewerOpen(true)}
                    className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-amber-300 dark:border-slate-700 text-amber-900 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-slate-700 transition-colors shadow-xs"
                    title={language === 'en' ? 'Fullscreen Mushaf' : 'Buka Layar Penuh'}
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Voice Note Recorder */}
              <div className="mb-3 px-1">
                <AudioRecorderPlayer 
                  itemId={currentItem.pageNumber}
                  itemType="quran"
                  itemLabel={`Hal ${currentItem.pageNumber}`}
                  language={language}
                  compact={false}
                />
              </div>

              {/* Mode Toggle: Reveal / Recall Mode */}
              <div className="flex justify-center mb-3 px-1">
                <button
                  onClick={() => setIsPageRevealed(prev => !prev)}
                  className="inline-flex items-center justify-center gap-2 text-sm font-bold px-6 py-2.5 rounded-xl bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-slate-200 hover:bg-blue-100 dark:hover:bg-slate-700 transition-colors cursor-pointer w-full sm:w-auto shadow-sm"
                >
                  {isPageRevealed ? (
                    <>
                      <EyeOff className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>{language === 'en' ? 'Hide Page' : 'Tutup'}</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>{language === 'en' ? 'Reveal Page' : 'Lihat Halaman Quran'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quran Printed Page Image Container */}
              <div className="flex-1 w-full bg-slate-900/5 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden relative flex items-center justify-center p-1 mb-2 min-h-0">
                {isPageRevealed ? (
                  <>
                    {imageLoading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 z-10">
                        <Loader2 className="w-7 h-7 text-blue-600 animate-spin mb-2" />
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Memuat Halaman Mushaf...</span>
                      </div>
                    )}
                    <img
                      src={localImageUrl || currentImageUrl}
                      alt={`Halaman ${currentItem.pageNumber}`}
                      onLoad={() => {
                        setImageLoading(false);
                        cachePageOffline(currentItem.pageNumber);
                      }}
                      className="w-full h-full object-contain rounded-lg bg-white dark:bg-[#FFFDF7]"
                    />
                  </>
                ) : (
                  <div className="text-center p-6 my-auto">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mx-auto flex items-center justify-center mb-4">
                      <BookOpen className="w-8 h-8 opacity-50" />
                    </div>
                  </div>
                )}
              </div>

              {/* Rating Buttons (Minimalist, No Estimations) */}
              <div className="mt-auto shrink-0 pt-1">
                    {/* Optional Feedback Block */}
                    {isFeedbackOpen ? (
                      <div className="mb-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3 animate-in slide-in-from-bottom-2 duration-200">
                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Kendala / Masalah Utama:</label>
                          <div className="flex flex-wrap gap-1.5">
                            {(['kelancaran', 'tajwid', 'makharijul', 'konsentrasi'] as const).map(issue => (
                              <button
                                key={issue}
                                onClick={() => setFeedbackIssues(prev => prev.includes(issue) ? prev.filter(i => i !== issue) : [...prev, issue])}
                                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-colors ${
                                  feedbackIssues.includes(issue)
                                    ? 'bg-rose-100 border-rose-300 text-rose-700 dark:bg-rose-900/40 dark:border-rose-700 dark:text-rose-300'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
                                }`}
                              >
                                {issue.charAt(0).toUpperCase() + issue.slice(1)}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Catatan Spesifik (Opsional):</label>
                          <input 
                            type="text" 
                            placeholder="Misal: Sering tertukar di ayat 255..." 
                            value={feedbackNotes}
                            onChange={e => setFeedbackNotes(e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="mb-2 text-right">
                        <button 
                          onClick={() => setIsFeedbackOpen(true)}
                          className="text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        >
                          + Tambah Catatan Evaluasi
                        </button>
                      </div>
                    )}

                    {/* Soft Confirmation Feedback Pill */}
                    {justRated && (
                      <div className="flex items-center justify-center gap-2 py-2 px-4 mb-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md animate-in fade-in zoom-in-95 duration-150">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                        <span className="text-xs font-bold">{justRated.label}</span>
                      </div>
                    )}

                    {/* 3 Feedback Rating Buttons (Rating 3 activated dynamically when Mapan status reached or by Teacher) */}
                    {(() => {
                      const isItemDue = isDue(currentItem.fsrsData.nextReview, currentItem.isActive);
                      const isMapanEver = currentItem.status === 'mastered_for_now' || !!currentItem.mapanCelebrated || (currentItem.fsrsData.stability || 0) * 0.4025587 >= 30;
                      const isRating3Allowed = isMapanEver || isTeacher;
                      const qIntervals = predictQuranIntervals(currentItem.fsrsData, currentItem.mapanSchedule);

                      return (
                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                          {/* Rating 1: Belum (Review) */}
                          <button
                            type="button"
                            onClick={() => {
                              if (isItemDue) handleRating(1);
                            }}
                            disabled={!isItemDue || !!justRated}
                            className={`flex flex-col items-center justify-center py-2.5 sm:py-3 px-2 rounded-2xl border transition-all shadow-xs ${
                              justRated?.rating === 1
                                ? 'bg-rose-600 text-white border-rose-600 ring-2 ring-rose-400 scale-[1.02]'
                                : isItemDue
                                ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-800 dark:text-rose-300 active:scale-[0.98] cursor-pointer'
                                : 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                            }`}
                            title={language === 'en' ? 'Needs Review (Scheduled for tomorrow)' : 'Belum lancar (Dijadwalkan ulang besok)'}
                          >
                            <span className={`text-[10px] sm:text-xs font-semibold leading-none ${
                              justRated?.rating === 1 ? 'text-rose-100' : 'text-rose-600/80 dark:text-rose-400/80'
                            }`}>
                              {qIntervals.needReviewDays}{language === 'en' ? 'd' : ' hr'}
                            </span>
                            <span className="font-bold text-xs sm:text-sm mt-1">
                              {language === 'en' ? 'Review' : language === 'id' ? 'Belum' : 'مراجعة'}
                            </span>
                          </button>

                          {/* Rating 2: Lancar (Fluent) - The standard best rating before Mapan */}
                          <button
                            type="button"
                            onClick={() => {
                              if (isItemDue) handleRating(2);
                            }}
                            disabled={!isItemDue || !!justRated}
                            className={`flex flex-col items-center justify-center py-2.5 sm:py-3 px-2 rounded-2xl border transition-all shadow-xs ${
                              justRated?.rating === 2
                                ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-400 scale-[1.02]'
                                : isItemDue
                                ? 'border-blue-200 dark:border-blue-900/60 bg-blue-50/80 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-800 dark:text-blue-300 active:scale-[0.98] cursor-pointer'
                                : 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                            }`}
                            title={language === 'en' ? 'Fluent (Extends interval)' : 'Lancar (Meningkatkan interval murajaah)'}
                          >
                            <span className={`text-[10px] sm:text-xs font-semibold leading-none ${
                              justRated?.rating === 2 ? 'text-blue-100' : 'text-blue-600/80 dark:text-blue-400/80'
                            }`}>
                              +{qIntervals.hardDays}{language === 'en' ? 'd' : ' hr'}
                            </span>
                            <span className="font-bold text-xs sm:text-sm mt-1">
                              {language === 'en' ? 'Fluent' : language === 'id' ? 'Lancar' : 'حاضر'}
                            </span>
                          </button>

                          {/* Rating 3: Mutqin (Mastered) - Dynamic based on Mapan status or Teacher mode */}
                          <button
                            type="button"
                            onClick={() => {
                              if (isItemDue && isRating3Allowed) handleRating(3);
                            }}
                            disabled={!isItemDue || !isRating3Allowed || !!justRated}
                            className={`flex flex-col items-center justify-center py-2.5 sm:py-3 px-2 rounded-2xl border transition-all shadow-xs relative overflow-hidden ${
                              justRated?.rating === 3
                                ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-400 scale-[1.02]'
                                : isItemDue && isRating3Allowed
                                ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-600 hover:bg-emerald-700 text-white active:scale-[0.98] cursor-pointer shadow-emerald-600/20'
                                : 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-850 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60'
                            }`}
                            title={
                              !isRating3Allowed
                                ? (language === 'en' ? 'Locked: Available once item reaches Mastered (>30d interval) or via Teacher in Class' : 'Terkunci: Aktif otomatis setelah hafalan mencapai status Mapan (>30 hari) atau dinilai oleh Guru di Ruang Mengajar')
                                : isTeacher && !isMapanEver
                                ? (language === 'en' ? 'Mutqin (Teacher Assessment / Direct Boost)' : 'Lancar Mutqin (Penilaian Guru Halaqah)')
                                : (language === 'en' ? 'Fluent Mutqin (Optimal interval boost)' : 'Lancar Mutqin (Kenaikan cepat optimal)')
                            }
                          >
                            <span className={`text-[10px] sm:text-xs font-semibold leading-none ${
                              justRated?.rating === 3 || (isItemDue && isRating3Allowed) ? 'text-emerald-100' : 'text-slate-400 dark:text-slate-500'
                            }`}>
                              {isRating3Allowed ? `+${qIntervals.goodDays}${language === 'en' ? 'd' : ' hr'}` : '🔒 Mapan'}
                            </span>
                            <span className="font-bold text-xs sm:text-sm mt-1">
                              {language === 'en' ? 'Mutqin' : 'Mutqin'}
                            </span>
                          </button>
                        </div>
                      );
                    })()}
                  </div>
      
            </div>
          )}
        </div>

        {/* Fullscreen Mushaf Page Viewer Sub-Modal */}
        {currentItem && (
          <MushafPageViewerModal
            pageNumber={currentItem.pageNumber}
            isOpen={isFullViewerOpen}
            onClose={() => setIsFullViewerOpen(false)}
          />
        )}
      </div>
    </div>
  );
};
