import { Sparkles, Trophy, BookMarked, CheckCircle2 } from "lucide-react";
import { useJuz30Progress } from "../hooks/useQuranPages";
import type { QuranPageSummary } from "../types/quran-pages.types";

interface Juz30TrackerWidgetProps {
  onSelectPage?: (page: QuranPageSummary) => void;
}

export const Juz30TrackerWidget = ({ onSelectPage }: Juz30TrackerWidgetProps) => {
  const { data: juz30, isLoading } = useJuz30Progress();

  if (isLoading) {
    return (
      <div className="bg-card border border-border/60 rounded-2xl p-6 animate-pulse">
        <div className="h-6 w-48 bg-surface-1 rounded-md mb-4" />
        <div className="h-20 bg-surface-1 rounded-xl" />
      </div>
    );
  }

  if (!juz30) return null;

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-xs relative overflow-hidden">
      {/* Glow background */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none -mr-16 -mt-16" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <BookMarked className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground tracking-tight">
              Tracker Juz 30 (Juz 'Amma)
            </h3>
            <p className="text-xs text-muted-foreground">
              Surat ke-78 (An-Naba') s/d Surat ke-114 (An-Nas) • Hal 582-604
            </p>
          </div>
        </div>

        {/* Mapan summary */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Trophy className="w-4 h-4 text-emerald-500" />
            <div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {juz30.mapan_pages} / {juz30.total_pages} Hal Mapan
              </span>
              <span className="text-[10px] text-muted-foreground block -mt-0.5 font-mono">
                {juz30.mapan_percent}% Tuntas
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2.5 bg-surface-1 rounded-full overflow-hidden mb-6 border border-border/40">
        <div
          className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
          style={{ width: `${juz30.mapan_percent}%` }}
        />
      </div>

      {/* 23 Pages Quick Bar */}
      <div className="mb-6">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">
          Peta Halaman Juz 30
        </span>
        <div className="grid grid-cols-8 sm:grid-cols-12 md:grid-cols-23 gap-1.5">
          {juz30.pages.map((p) => {
            const isMapan = p.status === "mapan";
            const isLearning = p.status === "learning" || p.status === "review";

            return (
              <button
                key={p.page_number}
                onClick={() => onSelectPage && onSelectPage(p)}
                title={`Halaman ${p.page_number} - Status: ${p.status}`}
                className={`h-8 rounded-lg text-xs font-mono font-bold flex items-center justify-center border transition-all cursor-pointer ${
                  isMapan
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30"
                    : isLearning
                    ? "bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/40 hover:bg-sky-500/30"
                    : "bg-surface-1 text-muted-foreground border-border/40 hover:border-border"
                }`}
              >
                {p.page_number}
              </button>
            );
          })}
        </div>
      </div>

      {/* Surahs Compact List */}
      <div>
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest block mb-3">
          Daftar Surat (37 Surat)
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1 scrollbar-none">
          {juz30.surahs.map((surah) => {
            const isMapan = surah.status === "mapan";
            const isLearning = surah.status === "learning";

            return (
              <div
                key={surah.number}
                className="p-2.5 rounded-xl bg-surface-1 border border-border/50 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {surah.number}.
                    </span>
                    <span className="text-xs font-semibold text-foreground truncate">
                      {surah.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Hal {surah.start_page} ({surah.ayah_count} ayat)
                  </span>
                </div>

                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isMapan
                      ? "bg-emerald-500 shadow-xs shadow-emerald-500/50"
                      : isLearning
                      ? "bg-sky-500"
                      : "bg-border"
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
