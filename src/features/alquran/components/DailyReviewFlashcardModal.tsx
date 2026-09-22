import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  CalendarDays,
  Check,
  Loader2,
  RotateCw,
  X,
  BookOpen,
  Lightbulb,
  Frown,
  Meh,
  Smile,
  Flame,
} from "lucide-react";
import type {
  DailyTask,
  ReviewIntervalResponse,
  ReviewFsrsResponse,
} from "@/features/alquran/types/quran.types";
import { parseContentRef } from "@/features/alquran/components/item-detail/ItemDetailView.config";
import { useReviewFsrs } from "@/features/alquran/hooks/useReviewFsrs";
import { useReviewInterval } from "@/features/alquran/hooks/useReviewInterval";

interface DailyReviewFlashcardModalProps {
  isOpen: boolean;
  task: DailyTask | null;
  queuePosition?: number;
  queueTotal?: number;
  onClose: () => void;
  onReviewed: (
    result: ReviewIntervalResponse | ReviewFsrsResponse,
  ) => Promise<void> | void;
}

const REVIEW_BUTTONS = [
  {
    id: 1 as const,
    payloadValue: 1 as const,
    header: "Lemah",
    icon: Frown,
    descriptions: ["Blank", "Banyak Lupa", "Berpikir Lama", "Banyak Salah"],
    accent: "text-destructive",
    accentBg: "bg-destructive/10",
    accentBorder: "border-destructive/20",
    hoverBorder: "hover:border-destructive/40",
    hoverBg: "hover:bg-destructive/5",
    dot: "bg-destructive/60",
  },
  {
    id: 2 as const,
    payloadValue: 2 as const,
    header: "Sedang",
    icon: Meh,
    descriptions: ["Sering Lupa", "Sering Salah", "Tersendat", "Lambat"],
    accent: "text-warning",
    accentBg: "bg-warning/10",
    accentBorder: "border-warning/20",
    hoverBorder: "hover:border-warning/40",
    hoverBg: "hover:bg-warning/5",
    dot: "bg-warning/60",
  },
  {
    id: 3 as const,
    payloadValue: 3 as const,
    header: "Baik",
    icon: Smile,
    descriptions: ["Lancar", "Cepat", "Yakin", "Benar"],
    accent: "text-success",
    accentBg: "bg-success/10",
    accentBorder: "border-success/20",
    hoverBorder: "hover:border-success/40",
    hoverBg: "hover:bg-success/5",
    dot: "bg-success/60",
  },
  {
    id: 4 as const,
    payloadValue: 4 as const,
    header: "Sempurna",
    icon: Flame,
    descriptions: ["Reflek", "Tanpa Salah", "Sangat Lancar", "Sempurna"],
    accent: "text-info",
    accentBg: "bg-info/10",
    accentBorder: "border-info/20",
    hoverBorder: "hover:border-info/40",
    hoverBg: "hover:bg-info/5",
    dot: "bg-info/60",
  },
] as const;

export const DailyReviewFlashcardModal = ({
  isOpen,
  task,
  queuePosition = 1,
  queueTotal = 1,
  onClose,
  onReviewed,
}: DailyReviewFlashcardModalProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [submittingButtonId, setSubmittingButtonId] = useState<
    1 | 2 | 3 | 4 | null
  >(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [nextIntervalDays, setNextIntervalDays] = useState(0);
  const [nextReviewDate, setNextReviewDate] = useState("");

  const { reviewFsrs, loading: loadingFsrs } = useReviewFsrs();
  const { reviewInterval, loading: loadingInterval } = useReviewInterval();

  useEffect(() => {
    if (!isOpen || !task) return;
    setIsFlipped(false);
    setSubmittingButtonId(null);
    setShowSuccessModal(false);
  }, [task, isOpen]);

  useEffect(() => {
    if (!showSuccessModal) return;

    const timer = window.setTimeout(() => {
      setShowSuccessModal(false);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [showSuccessModal]);

  if (!isOpen || !task) return null;

  const info = task.content_ref ? parseContentRef(task.content_ref) : null;
  const title =
    info?.title || task.content_ref || `Item ${queuePosition}`;
  const subtitle = info?.subtitle || task.content_ref || "";

  const itemStatus = task.status?.toLowerCase() || "";
  const useFsrsReview =
    itemStatus === "fsrs_active" ||
    itemStatus === "graduated" ||
    itemStatus === "graduate";
  const loading = useFsrsReview ? loadingFsrs : loadingInterval;

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const progressPct = Math.round((queuePosition / queueTotal) * 100);

  const handleRatingClick = async (btn: (typeof REVIEW_BUTTONS)[number]) => {
    if (loading || submittingButtonId !== null) return;
    setSubmittingButtonId(btn.id);

    try {
      let response: ReviewIntervalResponse | ReviewFsrsResponse;

      if (useFsrsReview) {
        response = await reviewFsrs(
          task.item_id,
          btn.payloadValue as 1 | 2 | 3 | 4,
        );
        const fsrsData = (response as ReviewFsrsResponse).data;
        if (
          fsrsData &&
          typeof fsrsData === "object" &&
          "next_review_at" in fsrsData
        ) {
          setNextReviewDate(formatDate(fsrsData.next_review_at as string));
          setNextIntervalDays((fsrsData.next_interval_days as number) || 1);
        }
      } else {
        const intervalRating = Math.min(btn.payloadValue, 3) as 1 | 2 | 3;
        response = await reviewInterval(task.item_id, intervalRating);
        const intervalData = (response as ReviewIntervalResponse).data;
        if (intervalData?.interval_next_review_at) {
          setNextReviewDate(formatDate(intervalData.interval_next_review_at));
          setNextIntervalDays(intervalData.interval_days || 1);
        }
      }

      await onReviewed(response);

      window.dispatchEvent(
        new CustomEvent("alquran:item-reviewed", {
          detail: { itemId: task.item_id, rating: btn.payloadValue },
        }),
      );

      setShowSuccessModal(true);
    } catch {
      // error handled by hooks
    } finally {
      setSubmittingButtonId(null);
    }
  };

  return createPortal(
    <div className="fixed inset-x-0 top-0 z-9999 bg-background flex flex-col h-[100dvh]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {queueTotal > 1 && (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex-1 h-1.5 rounded-full bg-surface-2 overflow-hidden max-w-[200px]">
                <div
                  className="h-full rounded-full bg-linear-to-r from-success to-success/70 transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground font-medium shrink-0">
                {queuePosition}/{queueTotal}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-surface-1 border border-border text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors ml-3 shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Slide panels */}
      <div className="flex-1 overflow-hidden relative">
        <div
          className={`absolute inset-0 flex transition-transform duration-500 ease-in-out ${isFlipped ? "-translate-x-1/2" : "translate-x-0"}`}
          style={{ width: "200%" }}
        >
          {/* FRONT — Question */}
          <div className="w-1/2 h-full flex flex-col bg-background">
            <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-hide min-h-0 px-4 sm:px-8 md:px-16 py-8 max-w-3xl mx-auto w-full [-webkit-overflow-scrolling:touch]">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-9 h-9 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-success" />
                </div>
                <span className="px-3 py-1 rounded-full bg-success/10 text-success border border-success/20 text-xs font-bold tracking-wider uppercase">
                  Pertanyaan
                </span>
              </div>

              <div className="p-6 sm:p-8 rounded-2xl border border-success/20 bg-surface-1 mb-6">
                <div className="flex flex-wrap items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider">
                  <span className="px-3 py-1 rounded-full bg-surface-1 border border-border text-muted-foreground">
                    Juz {task.juz_index}
                  </span>
                  {queueTotal > 1 && (
                    <span className="px-3 py-1 rounded-full bg-success/10 border border-success/20 text-success">
                      Item {queuePosition} dari {queueTotal}
                    </span>
                  )}
                </div>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground leading-snug break-words max-w-full mb-2">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-success/80 text-base sm:text-lg break-words max-w-full">
                    {subtitle}
                  </p>
                )}
                {!info && task.content_ref && (
                  <p className="mt-3 text-xs text-muted-foreground font-mono break-all">
                    {task.content_ref}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <CalendarDays className="w-4 h-4" />
                <span>{task.task_date}</span>
              </div>
            </div>

            <div className="px-4 sm:px-8 md:px-16 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-3 max-w-3xl mx-auto w-full shrink-0 border-t border-border bg-background">
              <button
                onClick={() => setIsFlipped(true)}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-success/10 border border-success/30 text-success font-bold text-base hover:bg-success/15 transition-colors"
              >
                <RotateCw className="w-5 h-5" />
                Lihat Jawaban
              </button>
            </div>
          </div>

          {/* BACK — Answer + Feedback */}
          <div className="w-1/2 h-full flex flex-col bg-background">
            <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-hide min-h-0 flex flex-col px-4 sm:px-8 md:px-16 py-8 max-w-3xl mx-auto w-full [-webkit-overflow-scrolling:touch]">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-info/10 border border-info/20 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-info" />
                </div>
                <span className="px-3 py-1 rounded-full bg-info/10 text-info border border-info/20 text-xs font-bold tracking-wider uppercase">
                  Nilai Hafalan
                </span>
                <button
                  onClick={() => setIsFlipped(false)}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-1 border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  Pertanyaan
                </button>
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-black text-foreground mb-1">
                  Seberapa kuat hafalanmu?
                </h3>
                <p className="text-muted-foreground text-sm">
                  Pilih satu — nilai langsung tersimpan.
                </p>
              </div>

              {(() => {
                const isStabilityOver30 = ((task as any)?.stability || 0) > 30 || task?.status === "graduate" || task?.status === "mapan";
                const availableButtons = REVIEW_BUTTONS.filter((btn) => {
                  if (btn.id === 4) return false; // Al-Qur'an uses rating 1 - 3 only
                  if (btn.id === 3) return isStabilityOver30; // Rating 3 only when stability > 30
                  return true;
                });

                return (
                  <div className={`grid ${availableButtons.length === 3 ? "grid-cols-3" : "grid-cols-2"} gap-3`}>
                    {availableButtons.map((btn) => {
                      const isSubmitting = submittingButtonId === btn.id;
                      return (
                        <button
                          key={btn.id}
                          type="button"
                          onClick={() => void handleRatingClick(btn)}
                          disabled={submittingButtonId !== null}
                          className={`relative group min-w-0 overflow-hidden rounded-xl border bg-card border-border flex flex-col text-left transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:pointer-events-none ${btn.hoverBorder} ${btn.hoverBg}`}
                        >
                          <div className="flex items-center gap-2 p-3 border-b border-border">
                            <span className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 group-active:scale-110 transition-transform ${btn.accentBg}`}>
                              <btn.icon className={`w-3.5 h-3.5 ${btn.accent}`} />
                            </span>
                            <span className={`text-xs font-semibold ${btn.accent}`}>{btn.header}</span>
                            <span className={`ml-auto shrink-0 w-1.5 h-1.5 rounded-full ${btn.dot}`} />
                          </div>
                          <div className="flex-1 p-3">
                            {isSubmitting ? (
                              <div className="flex flex-col items-center justify-center gap-2 py-3">
                                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  Menyimpan...
                                </span>
                              </div>
                            ) : (
                              <ul className="space-y-1">
                                {btn.descriptions.map((d) => (
                                  <li
                                    key={d}
                                    className="flex items-center gap-1.5 text-[11px] font-normal text-muted-foreground"
                                  >
                                    <span
                                      className={`shrink-0 w-1.5 h-1.5 rounded-full ${btn.dot}`}
                                    />
                                    {d}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Success overlay */}
      {showSuccessModal && (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm pointer-events-none">
          <div className="w-full max-w-sm">
            <div className="rounded-2xl border border-border bg-card shadow-xl p-6 md:p-8">
              <div className="flex justify-center mb-5">
                <div className="w-16 h-16 rounded-full bg-success/10 border-2 border-success/40 flex items-center justify-center">
                  <Check className="w-8 h-8 text-success" />
                </div>
              </div>
              <h3 className="text-xl font-black text-foreground text-center mb-1">
                Review Berhasil!
              </h3>
              <p className="text-muted-foreground text-center text-sm mb-5">
                Hafalanmu sudah tercatat.
              </p>

              <div className="p-4 rounded-2xl bg-success/10 border border-success/30 mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarDays className="w-4 h-4 text-success" />
                  <p className="text-success/70 text-xs font-bold uppercase tracking-wider">
                    Review Selanjutnya
                  </p>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-black text-foreground">
                    {nextIntervalDays}
                  </p>
                  <span className="text-muted-foreground text-sm">hari lagi</span>
                </div>
                <p className="text-success/60 text-xs mt-1">
                  {nextReviewDate || "-"}
                </p>
              </div>

              <div className="w-full py-3 rounded-xl bg-success text-success-foreground font-bold text-center">
                {queuePosition < queueTotal ? "Lanjut otomatis..." : "Selesai"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
};
