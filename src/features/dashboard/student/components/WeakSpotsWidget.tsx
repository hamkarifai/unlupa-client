import { AlertTriangle, Sparkles, BookOpen } from "lucide-react";
import type { WeakSpotItem } from "../types";

interface WeakSpotsWidgetProps {
  weakSpots: WeakSpotItem[];
  onReviewItem?: (item: WeakSpotItem) => void;
}

export const WeakSpotsWidget = ({
  weakSpots = [],
  onReviewItem,
}: WeakSpotsWidgetProps) => {
  if (weakSpots.length === 0) {
    return (
      <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <h3 className="text-base font-semibold text-foreground tracking-tight">
            Materi Rawan Lupa
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Semua hafalan dalam kondisi kestabilan tinggi. Belum ada titik rawan yang memerlukan pengulangan intensif.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-xs relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <h3 className="text-base font-semibold text-foreground tracking-tight">
            Materi Rawan Lupa (Weak Spots)
          </h3>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
          {weakSpots.length} Titik Perhatian
        </span>
      </div>

      {/* List */}
      <div className="space-y-3">
        {weakSpots.map((item) => {
          const diffPercent = Math.min(Math.round((item.difficulty / 10) * 100), 100);
          return (
            <div
              key={item.item_id}
              className="p-3.5 rounded-xl bg-surface-1 border border-border/60 hover:border-border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    {item.subtitle}
                  </span>
                  <span className="text-muted-foreground text-[10px]">•</span>
                  <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400">
                    Difficulty {item.difficulty.toFixed(1)}/10
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-foreground truncate">
                  {item.title}
                </h4>
              </div>

              {/* Stats & Action */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-24 bg-card rounded-full h-1.5 overflow-hidden border border-border/40">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${diffPercent}%` }}
                  />
                </div>

                {onReviewItem && (
                  <button
                    onClick={() => onReviewItem(item)}
                    className="px-3 py-1 text-xs font-mono font-medium rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground transition cursor-pointer"
                  >
                    Murajaah
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
