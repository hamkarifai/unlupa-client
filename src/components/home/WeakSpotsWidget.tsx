import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { BookOpen, Sparkles, ChevronRight, AlertCircle, Bookmark, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { QuranPageItem } from '../../types';

interface Props {
  onOpenQuranReview: (juzNumber?: number) => void;
  onOpenMushafViewer: (pageNumber: number) => void;
}

export const WeakSpotsWidget: React.FC<Props> = ({
  onOpenQuranReview,
  onOpenMushafViewer
}) => {
  const { quranPages, language } = useApp();

  // Find pages that either have unresolved issues OR have difficulty >= 7 OR high lapses
  const weakPages = useMemo(() => {
    return (quranPages || [])
      .filter(p => p.isActive)
      .map(p => {
        const unresolvedIssues = (p.issues || []).filter(i => !i.isResolved);
        const difficulty = p.fsrsData?.difficulty || 0;
        const lapses = p.fsrsData?.lapses || 0;
        const stability = p.fsrsData?.stability || 0;

        let riskScore = unresolvedIssues.length * 3;
        if (difficulty >= 7) riskScore += 2;
        if (lapses >= 2) riskScore += 2;
        if (stability < 3) riskScore += 1;

        return {
          page: p,
          riskScore,
          unresolvedIssues,
          difficulty,
          lapses
        };
      })
      .filter(item => item.riskScore > 0 || item.unresolvedIssues.length > 0)
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 4);
  }, [quranPages]);

  if (weakPages.length === 0) {
    return null;
  }

  return (
    <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-rose-200/80 dark:border-rose-950/70 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 flex items-center justify-center shrink-0 shadow-2xs">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              {language === 'en' ? 'Priority Attention / Weak Spots' : 'Fokus Penguatan & Catatan Tajwid'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'en' 
                ? 'Pages with feedback notes or high difficulty' 
                : 'Halaman dengan catatan kekeliruan atau butuh penguatan ekstra'}
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 font-bold text-xs self-start sm:self-auto shrink-0 whitespace-nowrap">
          {weakPages.length} {language === 'en' ? 'Pages identified' : 'Halaman terdeteksi'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {weakPages.map(({ page, unresolvedIssues, lapses }) => (
          <div
            key={page.pageNumber}
            className="p-3.5 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/50 flex flex-col justify-between gap-2.5 group hover:border-rose-300 transition-all shadow-2xs"
          >
            <div className="flex items-start justify-between gap-2">
              <div 
                onClick={() => onOpenMushafViewer(page.pageNumber)}
                className="cursor-pointer group/title min-w-0 flex-1"
              >
                <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover/title:text-blue-600 transition-colors truncate">
                  <span>{language === 'en' ? 'Page' : 'Hal'} {page.pageNumber}</span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span className="truncate">{page.surahNameEn}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  Juz {page.juzNumber} • {page.ayahRange}
                </p>
              </div>

              <button
                onClick={() => onOpenQuranReview(page.juzNumber)}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs active:scale-95"
              >
                <span>{language === 'en' ? 'Review' : 'Murajaah'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Issues Badges */}
            <div className="flex flex-wrap gap-1.5">
              {unresolvedIssues.length > 0 ? (
                unresolvedIssues.map((issue, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 text-[10px] font-semibold flex items-center gap-1"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                    <span className="truncate max-w-[200px]">Ayat {issue.ayah}: {issue.type} {issue.detail ? `(${issue.detail})` : ''}</span>
                  </span>
                ))
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 text-[10px] font-semibold">
                  {language === 'en' ? `Re-learned ${lapses}x` : `Pernah lupa ${lapses}x`}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
