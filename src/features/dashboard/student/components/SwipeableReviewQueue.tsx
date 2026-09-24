import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  CheckCircle2,
  BookOpen,
  Layers,
  RotateCcw,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useQueryClient } from "@tanstack/react-query";
import type { DailyTask } from "@/features/alquran/types/quran.types";

interface SwipeableReviewQueueProps {
  tasks: DailyTask[];
  onReviewCompleted?: () => void;
}

export const SwipeableReviewQueue = ({
  tasks = [],
  onReviewCompleted,
}: SwipeableReviewQueueProps) => {
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("right");

  const activeTask = tasks[currentIndex];
  const isFinished = !activeTask || currentIndex >= tasks.length;
  const remainingCount = Math.max(0, tasks.length - currentIndex);

  const handleRating = async (rating: 1 | 2 | 3) => {
    if (!activeTask || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await api.post(`/api/v1/items/${activeTask.item_id}/review`, { rating });

      const ratingLabels = {
        1: "Diulang (Again)",
        2: "Lancar (Hard)",
        3: "Mutqin (Good)",
      };

      toast.success(`Dinilai: ${ratingLabels[rating]}`, {
        duration: 2000,
      });

      // Invalidate queries so stats and heatmap update live
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["daily-tasks"] });

      setDirection("right");
      setShowAnswer(false);
      setCurrentIndex((prev) => prev + 1);

      if (onReviewCompleted) {
        onReviewCompleted();
      }
    } catch {
      toast.error("Gagal mengirim hasil review. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (tasks.length === 0 || isFinished) {
    return (
      <div className="bg-card border border-border/60 rounded-2xl p-8 text-center relative overflow-hidden shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-serif font-bold text-foreground mb-1">
          Antrean Review Selesai! 🎉
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
          Luar biasa! Seluruh target murajaah hari ini telah tuntas terjaga dengan algoritma FSRS.
        </p>
        <button
          onClick={() => setCurrentIndex(0)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground border border-border rounded-xl hover:bg-surface-1 transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Lihat Ulang
        </button>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-xs relative overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          <h3 className="text-base font-semibold text-foreground tracking-tight">
            Antrean Review Hari Ini
          </h3>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-primary/10 text-primary font-bold">
            {remainingCount} Tersisa
          </span>
        </div>

        <div className="text-xs text-muted-foreground font-mono">
          {currentIndex + 1} / {tasks.length}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-surface-1 rounded-full overflow-hidden mb-6">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={false}
          animate={{
            width: `${((currentIndex + 1) / tasks.length) * 100}%`,
          }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Interactive Card Container */}
      <div className="relative min-h-[220px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTask.item_id}
            initial={{ opacity: 0, x: direction === "right" ? 50 : -50, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: direction === "right" ? -50 : 50, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className="w-full bg-surface-1 border border-border/80 rounded-2xl p-6 relative flex flex-col justify-between"
          >
            {/* Top metadata */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-primary/80 bg-primary/10 px-2 py-0.5 rounded-md">
                  {activeTask.source === "quran" ? "Al-Qur'an" : (activeTask.book_title || "Materi Kitab")}
                </span>
                <h4 className="text-lg font-serif font-bold text-foreground mt-2">
                  {activeTask.content_ref || "Materi Hafalan"}
                </h4>
              </div>

              <button
                onClick={() => setShowAnswer((prev) => !prev)}
                className="flex items-center gap-1.5 px-3 py-1 text-xs text-muted-foreground hover:text-foreground bg-card border border-border/60 rounded-xl transition cursor-pointer"
              >
                {showAnswer ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" /> Sembunyikan
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" /> Buka Kunci
                  </>
                )}
              </button>
            </div>

            {/* Content / Reveal Box */}
            <div className="my-4 min-h-[70px] flex items-center justify-center p-4 rounded-xl bg-card border border-dashed border-border/60">
              {showAnswer ? (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest mb-1">
                    Kunci / Materi Terbuka
                  </p>
                  <p className="text-base font-serif text-foreground">
                    {activeTask.content_ref}
                  </p>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <BookOpen className="w-6 h-6 mx-auto mb-1 opacity-50" />
                  <p className="text-xs font-sans">
                    Ingat hafalan ini secara mandiri, lalu pilih tingkat kelancaran Anda di bawah.
                  </p>
                </div>
              )}
            </div>

            {/* FSRS 1-3 Rating Buttons (Locked Rating 3 for Stability <= 30) */}
            {(() => {
              const isRating3Allowed = ((activeTask as any)?.stability || 0) > 30 || activeTask?.status === "graduate" || activeTask?.status === "mapan";

              return (
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <button
                    disabled={isSubmitting}
                    onClick={() => handleRating(1)}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 text-red-600 dark:text-red-400 transition cursor-pointer disabled:opacity-50"
                  >
                    <span className="text-xs font-bold font-mono">1 • Again</span>
                    <span className="text-[10px] opacity-75">Banyak Lupa</span>
                  </button>

                  <button
                    disabled={isSubmitting}
                    onClick={() => handleRating(2)}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/15 text-blue-600 dark:text-blue-400 transition cursor-pointer disabled:opacity-50"
                  >
                    <span className="text-xs font-bold font-mono">2 • Hard</span>
                    <span className="text-[10px] opacity-75">Lancar</span>
                  </button>

                  {isRating3Allowed ? (
                    <button
                      disabled={isSubmitting}
                      onClick={() => handleRating(3)}
                      className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 transition cursor-pointer disabled:opacity-50"
                    >
                      <span className="text-xs font-bold font-mono">3 • Mutqin</span>
                      <span className="text-[10px] opacity-75">Lancar Mantap</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-border/50 bg-surface-1/50 text-muted-foreground/60 cursor-not-allowed opacity-60 select-none"
                      title="Terkunci: Memerlukan stabilitas > 30 hari"
                    >
                      <Lock className="w-3.5 h-3.5 mb-0.5 opacity-70" />
                      <span className="text-xs font-bold font-mono">Mutqin</span>
                      <span className="text-[9px] opacity-75">&gt;30 Hari</span>
                    </button>
                  )}
                </div>
              );
            })()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
