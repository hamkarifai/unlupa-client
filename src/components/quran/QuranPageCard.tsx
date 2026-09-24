import React, { useState, useEffect } from 'react';
import { QuranPageItem, Language } from '../../types';
import { useApp } from '../../context/AppContext';
import { isDue, isReviewedToday, getIntervalDays, predictQuranIntervals } from '../../lib/fsrs';
import { AudioStorageService } from '../../lib/AudioStorageService';
import { AudioRecorderPlayer } from '../shared/AudioRecorderPlayer';
import { 
  Play, 
  Power, 
  Sparkles, 
  MessageSquare, 
  Eye, 
  Flame, 
  Brain, 
  CalendarClock, 
  CheckCircle2, 
  RotateCcw, 
  Plus,
  Mic,
  Check,
  Lock
} from 'lucide-react';

interface Props {
  page: QuranPageItem;
  language: Language;
  onToggleActive: (pageNumber: number) => void;
  onOpenMapanModal: (page: QuranPageItem) => void;
  onOpenFeedbackModal: (page: QuranPageItem) => void;
  onOpenMushafViewer: (pageNumber: number) => void;
  onInlineReview?: (pageNumber: number, rating: 1 | 2 | 3 | 4) => void;
  isJustReviewed?: boolean;
  justReviewedRating?: 1 | 2 | 3 | 4;
  isReadOnly?: boolean;
}

export const QuranPageCard: React.FC<Props> = ({
  page,
  language,
  onToggleActive,
  onOpenMapanModal,
  onOpenFeedbackModal,
  onOpenMushafViewer,
  onInlineReview,
  isJustReviewed,
  justReviewedRating,
  isReadOnly = false
}) => {
  const { isTeacherMode, isReadOnlyMode, activeSpace } = useApp();
  const effectiveReadOnly = isReadOnly || isReadOnlyMode;
  const isTeacher = isTeacherMode || activeSpace === 'teaching';
  const [showAudio, setShowAudio] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);

  useEffect(() => {
    let mounted = true;
    AudioStorageService.hasAudio(page.pageNumber).then(exists => {
      if (mounted) setHasAudio(exists);
    });

    const handleAudioChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ itemId: string | number }>;
      if (String(customEvent.detail?.itemId) === String(page.pageNumber)) {
        AudioStorageService.hasAudio(page.pageNumber).then(exists => {
          if (mounted) setHasAudio(exists);
        });
      }
    };

    window.addEventListener('audio-updated', handleAudioChange);
    return () => {
      mounted = false;
      window.removeEventListener('audio-updated', handleAudioChange);
    };
  }, [page.pageNumber]);

  const isDueToday = isDue(page.fsrsData.nextReview, page.isActive);
  const reviewedToday = isReviewedToday(page.fsrsData.lastReview);
  const showDimmed = reviewedToday && !isDueToday;
  const isMapan = page.status === 'mastered_for_now' || !!page.mapanCelebrated || (page.fsrsData.stability || 0) * 0.4025587 >= 30;

  const formatAccurateDueDate = () => {
    if (!page.fsrsData.nextReview) return language === 'en' ? 'Today' : 'Hari ini';
    const nextDate = new Date(page.fsrsData.nextReview);
    const now = new Date();
    const isOverdue = nextDate <= now;
    const formatted = nextDate.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
      day: 'numeric',
      month: 'short'
    });
    if (isOverdue) {
      return language === 'en' ? `Today (${formatted})` : `Hari ini (${formatted})`;
    }
    return formatted;
  };

  const getFullDueDateStr = () => {
    if (!page.fsrsData.nextReview) return language === 'en' ? 'Today' : 'Hari ini';
    const nextDate = new Date(page.fsrsData.nextReview);
    return nextDate.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const pageInterval = getIntervalDays(page.fsrsData) || Math.max(1, Math.round((page.fsrsData.stability || 0) * 0.4025587));
  const unresolvedIssuesCount = page.issues ? page.issues.filter(i => !i.isResolved).length : 0;

  return (
    <div
      className={`rounded-2xl p-3.5 transition-all bg-white dark:bg-slate-900 shadow-2xs flex flex-col justify-between border ${
        isDueToday 
          ? 'border-amber-300/80 dark:border-amber-700/80 bg-amber-50/20 dark:bg-amber-950/20 shadow-amber-500/5' 
          : showDimmed
          ? 'border-emerald-200/50 bg-emerald-50/10 dark:bg-emerald-950/10 dark:border-emerald-800/30 opacity-75 grayscale-[20%]'
          : page.isActive 
          ? 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700' 
          : 'border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 opacity-80'
      }`}
    >
      {/* Top Identity Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Play / Active Power Button */}
          <button
            type="button"
            onClick={() => !effectiveReadOnly && onToggleActive(page.pageNumber)}
            disabled={effectiveReadOnly}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-2xs shrink-0 ${
              effectiveReadOnly 
                ? 'cursor-default' 
                : 'cursor-pointer hover:scale-105 active:scale-95'
            } ${
              page.isActive
                ? 'bg-blue-700 dark:bg-blue-800 text-white'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
            title={page.isActive ? (language === 'en' ? 'Active Page' : 'Halaman Aktif') : (language === 'en' ? 'Inactive Page' : 'Halaman Belum Aktif')}
          >
            {page.isActive ? (
              <Play className="w-3 h-3 fill-white ml-0.5" />
            ) : (
              <Power className="w-3 h-3" />
            )}
          </button>

          {/* Clickable Page Identity: Opens Mushaf directly! */}
          <div 
            onClick={() => onOpenMushafViewer(page.pageNumber)}
            className="min-w-0 cursor-pointer group/title select-none"
            title={language === 'en' ? 'Click to open Mushaf' : 'Klik untuk buka Mushaf'}
          >
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover/title:text-blue-600 dark:group-hover/title:text-blue-400 transition-colors">
                {language === 'en' ? 'Page' : language === 'id' ? 'Hal' : 'صفحة'} {page.pageNumber}
              </span>
              <span className="text-slate-400 dark:text-slate-600 text-xs">•</span>
              <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate group-hover/title:text-blue-600 dark:group-hover/title:text-blue-400 transition-colors">
                {page.surahNameEn}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {language === 'en' ? 'Verse' : language === 'id' ? 'Ayat' : 'آية'} {page.ayahRange} 
              <span className="ml-1.5 text-slate-400 font-medium">Juz {page.juzNumber}</span>
            </p>
          </div>
        </div>

        {/* Right Icons: Status Pill & Mushaf Viewer Eye */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isDueToday && (
            <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-[10px] border border-amber-200 dark:border-amber-800">
              {language === 'en' ? 'Due' : 'Jatuh Tempo'}
            </span>
          )}
          {isMapan && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenMapanModal(page);
              }}
              className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold text-[10px] border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 flex items-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95"
              title={language === 'en' ? 'Customize Mastered Murajaah Rhythm' : 'Atur Ritme Murajaah Mapan'}
            >
              <Sparkles className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
              <span>{language === 'en' ? 'Mastered' : 'Mapan'}</span>
              {page.mapanSchedule?.mode === 'weekly' && (
                <span className="text-[9px] font-medium opacity-80">• Mingguan</span>
              )}
              {page.mapanSchedule?.mode === 'monthly' && (
                <span className="text-[9px] font-medium opacity-80">• Bulanan</span>
              )}
            </button>
          )}

          {/* Evaluation Notes button with badge */}
          <button
            type="button"
            onClick={() => onOpenFeedbackModal(page)}
            className="relative w-7 h-7 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 flex items-center justify-center transition-all shadow-2xs cursor-pointer hover:scale-105 active:scale-95"
            title={language === 'en' ? 'Evaluation Notes' : 'Catatan Evaluasi'}
          >
            <MessageSquare className="w-3 h-3" />
            {unresolvedIssuesCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[8px] font-bold shadow-sm">
                {unresolvedIssuesCount}
              </span>
            )}
          </button>

          {/* Audio Recording & Playback button with 24h active indicator */}
          <button
            type="button"
            onClick={() => setShowAudio(!showAudio)}
            className={`relative w-7 h-7 rounded-full border flex items-center justify-center transition-all shadow-2xs cursor-pointer hover:scale-105 active:scale-95 ${
              hasAudio 
                ? 'bg-indigo-50 border-indigo-300 text-indigo-600 dark:bg-indigo-950/60 dark:border-indigo-700 dark:text-indigo-300 shadow-indigo-500/10' 
                : showAudio
                ? 'bg-slate-200 border-slate-300 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-white'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700'
            }`}
            title={language === 'en' ? 'Voice Recording (Self Tasmi\')' : 'Rekaman Suara Tasmi\' Mandiri (24 Jam)'}
          >
            <Mic className="w-3 h-3" />
            {hasAudio && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {/* Mushaf Page Viewer Eye button */}
          <button
            type="button"
            onClick={() => onOpenMushafViewer(page.pageNumber)}
            className="w-7 h-7 rounded-full bg-[#fbf8f2] dark:bg-slate-800 border border-[#ebe2d3] dark:border-slate-700 text-[#7d6f5c] dark:text-slate-300 hover:bg-[#f3ede1] dark:hover:bg-slate-700 flex items-center justify-center transition-all shadow-2xs cursor-pointer hover:scale-105 active:scale-95"
            title={language === 'en' ? 'View Printed Mushaf' : 'Lihat Mushaf Cetak'}
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Single-Line Bottom Row with Compact Metrics & 4 Standard FSRS Rating Buttons */}
      {page.isActive ? (
        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1">
          {/* Metrics - Compacted to the left */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs min-w-0">
            {/* 1. Review Reps (Flame) */}
            <div 
              className="flex items-center gap-0.5 text-slate-700 dark:text-slate-300 shrink-0" 
              title={language === 'en' ? `Reviewed: ${page.fsrsData.reps} times` : `Sudah direview: ${page.fsrsData.reps} kali`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="font-bold text-[11px]">{page.fsrsData.reps}×</span>
            </div>

            {/* 2. Stability calculated into days (Brain) */}
            <div 
              className="flex items-center gap-0.5 text-slate-700 dark:text-slate-300 shrink-0" 
              title={language === 'en' ? `Stability: ${(page.fsrsData.stability || 0).toFixed(1)} days` : `Stabilitas memori: ${(page.fsrsData.stability || 0).toFixed(1)} hari`}
            >
              <Brain className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
              <span className="font-bold text-[11px]">
                {page.fsrsData.stability ? (page.fsrsData.stability >= 1 ? `${page.fsrsData.stability.toFixed(1)}h` : `${(page.fsrsData.stability * 24).toFixed(0)}j`) : '0h'}
              </span>
            </div>

            {/* 3. Accurate Due Date (CalendarClock) */}
            <div 
              className="flex items-center gap-0.5 text-slate-700 dark:text-slate-300 truncate max-w-[62px] sm:max-w-[85px]" 
              title={language === 'en' ? `Due Date: ${getFullDueDateStr()}` : `Jatuh tempo: ${getFullDueDateStr()}`}
            >
              <CalendarClock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
              <span className={`font-semibold text-[10.5px] truncate ${isDueToday ? 'text-amber-600 dark:text-amber-400 font-bold' : ''}`}>
                {formatAccurateDueDate()}
              </span>
            </div>
          </div>

          {/* Quick 1-Click Action Buttons or Read-Only Status Indicator */}
          {effectiveReadOnly ? (
            <div className="flex items-center gap-1 shrink-0">
              {isMapan ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 font-semibold text-[10.5px] shadow-2xs">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  <span>{language === 'en' ? 'Mastered' : 'Mapan'}</span>
                </span>
              ) : isDueToday ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/80 text-amber-700 dark:text-amber-300 font-semibold text-[10.5px] shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>{language === 'en' ? 'Due Today' : 'Jatuh Tempo'}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 font-semibold text-[10.5px] shadow-2xs">
                  <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>{language === 'en' ? 'Reviewed' : 'Sudah Direview'}</span>
                </span>
              )}
            </div>
          ) : isDueToday ? (() => {
            const intervals = predictQuranIntervals(page.fsrsData, page.mapanSchedule);
            const isRating3Unlocked = (page.fsrsData.stability || 0) > 30 || page.status === 'mastered_for_now' || !!page.mapanCelebrated;

            return (
              <div className="flex items-center gap-1 shrink-0">
                {/* Rating 1: Again (Banyak Lupa) */}
                <button
                  type="button"
                  onClick={() => onInlineReview && onInlineReview(page.pageNumber, 1)}
                  disabled={!onInlineReview}
                  className={`flex flex-col items-center justify-center py-0.5 px-1.5 sm:px-2 rounded-lg border text-center transition-all min-w-[34px] sm:min-w-[38px] shadow-2xs ${
                    isJustReviewed && justReviewedRating === 1
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm scale-105 cursor-default'
                      : 'border-rose-300 dark:border-rose-800 bg-rose-50/90 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 hover:bg-rose-100 hover:border-rose-400 font-bold cursor-pointer active:scale-95'
                  }`}
                  title={`1 • Again (${intervals.needReviewDays}${language === 'en' ? 'd' : 'h'})`}
                >
                  <span className="text-[8.5px] font-semibold text-rose-600 dark:text-rose-400 leading-none">
                    {intervals.needReviewDays}{language === 'en' ? 'd' : 'h'}
                  </span>
                  <span className="text-[10px] sm:text-[10.5px] font-bold leading-tight mt-0.5">Again</span>
                </button>

                {/* Rating 2: Hard (Lancar) */}
                <button
                  type="button"
                  onClick={() => onInlineReview && onInlineReview(page.pageNumber, 2)}
                  disabled={!onInlineReview}
                  className={`flex flex-col items-center justify-center py-0.5 px-1.5 sm:px-2 rounded-lg border text-center transition-all min-w-[34px] sm:min-w-[38px] shadow-2xs ${
                    isJustReviewed && justReviewedRating === 2
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm scale-105 cursor-default'
                      : 'border-blue-300 dark:border-blue-800 bg-blue-50/90 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 hover:bg-blue-100 hover:border-blue-400 font-bold cursor-pointer active:scale-95'
                  }`}
                  title={`2 • Hard (${intervals.hardDays}${language === 'en' ? 'd' : 'h'})`}
                >
                  <span className="text-[8.5px] font-semibold text-blue-600 dark:text-blue-400 leading-none">
                    {intervals.hardDays}{language === 'en' ? 'd' : 'h'}
                  </span>
                  <span className="text-[10px] sm:text-[10.5px] font-bold leading-tight mt-0.5">Hard</span>
                </button>

                {/* Rating 3: Mutqin (Good) - Unlocked once stability > 30 days is ever reached */}
                {isRating3Unlocked ? (
                  <button
                    type="button"
                    onClick={() => onInlineReview && onInlineReview(page.pageNumber, 3)}
                    disabled={!onInlineReview}
                    className={`flex flex-col items-center justify-center py-0.5 px-1.5 sm:px-2 rounded-lg border text-center transition-all min-w-[34px] sm:min-w-[38px] shadow-2xs animate-in fade-in ${
                      isJustReviewed && justReviewedRating === 3
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm scale-105 cursor-default'
                        : 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 hover:border-emerald-400 font-bold cursor-pointer active:scale-95'
                    }`}
                    title={`3 • Mutqin (${intervals.goodDays}${language === 'en' ? 'd' : 'h'})`}
                  >
                    <span className="text-[8.5px] font-semibold text-emerald-600 dark:text-emerald-400 leading-none">
                      {intervals.goodDays}{language === 'en' ? 'd' : 'h'}
                    </span>
                    <span className="text-[10px] sm:text-[10.5px] font-bold leading-tight mt-0.5">Good</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="flex flex-col items-center justify-center py-0.5 px-1.5 sm:px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 cursor-not-allowed min-w-[34px] sm:min-w-[38px] shadow-2xs opacity-65 select-none"
                    title={language === 'en' ? 'Locked: Requires memory stability > 30 days' : 'Terkunci: Memerlukan stabilitas memori > 30 hari'}
                  >
                    <Lock className="w-2.5 h-2.5 text-slate-400 dark:text-slate-500 mb-0.5" />
                    <span className="text-[9.5px] font-medium leading-none">Mutqin</span>
                  </button>
                )}
              </div>
            );
          })() : (
            <div className="flex items-center gap-1 shrink-0">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 font-semibold text-[10.5px] shadow-2xs">
                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>{language === 'en' ? 'Reviewed' : 'Sudah Direview'}</span>
              </span>
            </div>
          )}
        </div>
      ) : (
        /* Inactive page helper: simple activate button */
        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            {language === 'en' ? 'Not activated' : 'Belum diaktivasi'}
          </span>
          {!effectiveReadOnly && (
            <button
              type="button"
              onClick={() => onToggleActive(page.pageNumber)}
              className="px-2.5 py-1 rounded-lg bg-blue-700 dark:bg-blue-800 hover:bg-blue-850 text-white text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95"
            >
              <Plus className="w-3 h-3" />
              <span>{language === 'en' ? 'Activate' : 'Aktivasi'}</span>
            </button>
          )}
        </div>
      )}

      {/* Collapsible Audio Recorder Player Drawer */}
      {showAudio && (
        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <AudioRecorderPlayer 
            itemId={page.pageNumber}
            itemType="quran"
            itemLabel={`Hal ${page.pageNumber}`}
            language={language} 
            compact={true} 
            onHasRecordingChange={setHasAudio}
          />
        </div>
      )}
    </div>
  );
};
