import { useState } from "react";
import { X, BookOpen, Clock, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import type { QuranPageSummary } from "../types/quran-pages.types";
import { useReviewQuranPage } from "../hooks/useQuranPages";

interface PageReviewModalProps {
  page: QuranPageSummary | null;
  onClose: () => void;
}

export const PageReviewModal = ({ page, onClose }: PageReviewModalProps) => {
  const reviewMutation = useReviewQuranPage();
  const [selectedRating, setSelectedRating] = useState<1 | 2 | 3 | 4 | null>(null);

  if (!page) return null;

  const handleReview = async (rating: 1 | 2 | 3 | 4) => {
    setSelectedRating(rating);
    try {
      await reviewMutation.mutateAsync({
        page_number: page.page_number,
        rating,
      });
      onClose();
    } catch {
      // Handled in mutation onError
    } finally {
      setSelectedRating(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "mapan":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Mapan (Stabil)
          </span>
        );
      case "review":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Masa Ujian / Review
          </span>
        );
      case "learning":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" /> Sedang Dihafal
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-mono text-muted-foreground bg-surface-1 border border-border/60">
            Belum Dimulai
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs transition-opacity duration-300">
      <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 relative shadow-xl animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                Juz {page.juz_number}
              </span>
              <span className="text-muted-foreground text-xs">•</span>
              {getStatusBadge(page.status)}
            </div>
            <h3 className="text-xl font-serif font-bold text-foreground">
              Halaman {page.page_number} Mushaf Madani
            </h3>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-surface-1 border border-border/60 mb-6 text-center font-mono">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase block">Stability</span>
            <span className="text-sm font-bold text-foreground">
              {page.stability ? `${page.stability.toFixed(1)}h` : "0h"}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase block">Difficulty</span>
            <span className="text-sm font-bold text-foreground">
              {page.difficulty ? `${page.difficulty.toFixed(1)}/10` : "5.0/10"}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase block">Total Review</span>
            <span className="text-sm font-bold text-foreground">
              {page.review_count || 0}x
            </span>
          </div>
        </div>

        {/* FSRS Rating Options */}
        <div className="space-y-2">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3 text-center">
            Bagaimana kelancaran tilawah / hafalan halaman ini?
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              disabled={reviewMutation.isPending}
              onClick={() => handleReview(1)}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-red-500/25 bg-red-500/5 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition cursor-pointer disabled:opacity-50"
            >
              {reviewMutation.isPending && selectedRating === 1 ? (
                <Loader2 className="w-4 h-4 animate-spin my-1" />
              ) : (
                <>
                  <span className="text-xs font-bold font-mono">1 • Again</span>
                  <span className="text-[10px] opacity-75">Banyak Lupa</span>
                </>
              )}
            </button>

            <button
              disabled={reviewMutation.isPending}
              onClick={() => handleReview(2)}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-amber-500/25 bg-amber-500/5 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 transition cursor-pointer disabled:opacity-50"
            >
              {reviewMutation.isPending && selectedRating === 2 ? (
                <Loader2 className="w-4 h-4 animate-spin my-1" />
              ) : (
                <>
                  <span className="text-xs font-bold font-mono">2 • Hard</span>
                  <span className="text-[10px] opacity-75">Kurang Lancar</span>
                </>
              )}
            </button>

            <button
              disabled={reviewMutation.isPending}
              onClick={() => handleReview(3)}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition cursor-pointer disabled:opacity-50"
            >
              {reviewMutation.isPending && selectedRating === 3 ? (
                <Loader2 className="w-4 h-4 animate-spin my-1" />
              ) : (
                <>
                  <span className="text-xs font-bold font-mono">3 • Good</span>
                  <span className="text-[10px] opacity-75">Lancar</span>
                </>
              )}
            </button>

            <button
              disabled={reviewMutation.isPending}
              onClick={() => handleReview(4)}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-sky-500/25 bg-sky-500/5 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 transition cursor-pointer disabled:opacity-50"
            >
              {reviewMutation.isPending && selectedRating === 4 ? (
                <Loader2 className="w-4 h-4 animate-spin my-1" />
              ) : (
                <>
                  <span className="text-xs font-bold font-mono">4 • Easy</span>
                  <span className="text-[10px] opacity-75">Sangat Fasih</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
