import { useState } from "react";
import confetti from "canvas-confetti";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  RotateCw,
  Sparkles,
  Trophy,
  X,
} from "@/components/foundations/hugeicons";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { useApp } from "../../context/AppContext";
import type { BookItem } from "../../types";
import { predictNonQuranIntervals } from "../../lib/fsrs";
import { AudioRecorderPlayer } from "../shared/AudioRecorderPlayer";
import { useSwipeGesture } from "../../hooks/useSwipeGesture";
import { soundEffects } from "../../lib/soundFeedback";
import { BilingualCardText } from "../common/BilingualCardText";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  specificBookId?: string;
  specificChapterId?: string;
}

export const PersonalReviewModal = ({ isOpen, onClose, specificBookId, specificChapterId }: Props) => {
  const { personalStats, reviewItem, books, chapters, language } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [sessionQueue] = useState<BookItem[]>(() =>
    specificChapterId
      ? personalStats.dueList.filter((item) => item.chapterId === specificChapterId)
      : specificBookId
        ? personalStats.dueList.filter((item) => item.bookId === specificBookId)
        : [...personalStats.dueList],
  );
  const [justRated, setJustRated] = useState<{ rating: 1 | 2 | 3 | 4; label: string; interval: string } | null>(null);

  const currentItem = sessionQueue[currentIndex] || null;
  const currentBook = currentItem ? books.find((book) => book.id === currentItem.bookId) : null;
  const currentChapter = currentItem ? chapters.find((chapter) => chapter.id === currentItem.chapterId) : null;
  const isFinished = !currentItem || currentIndex >= sessionQueue.length;

  const handleRating = async (rating: 1 | 2 | 3) => {
    if (!currentItem || justRated || isSubmittingReview) return;
    const labels = {
      1: language === "en" ? "Review again" : "Perlu diulang",
      2: language === "en" ? "Hard" : "Sulit",
      3: language === "en" ? "Good" : "Baik",
    };

    setIsSubmittingReview(true);
    try {
      const nextIntervalDays = await reviewItem(currentItem.id, rating);
      soundEffects.playRatingFeedback(rating);
      setJustRated({ rating, label: labels[rating], interval: `${nextIntervalDays}d` });
      window.setTimeout(() => {
      setReviewedCount((count) => count + 1);
      setShowAnswer(false);
      setJustRated(null);

      if (currentIndex + 1 < sessionQueue.length) {
        setCurrentIndex((index) => index + 1);
      } else {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        setCurrentIndex(sessionQueue.length);
      }
      }, 280);
    } catch (error) {
      console.error("Book review failed:", error);
      toast.error("Review gagal disimpan. Coba lagi.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  useSwipeGesture(null, {
    disabled: !isOpen,
    onSwipeRight: () => {
      if (isFinished) onClose();
      else if (currentIndex > 0) {
        setCurrentIndex((index) => index - 1);
        setShowAnswer(false);
      } else onClose();
    },
    onSwipeLeft: () => {
      if (isFinished) return;
      if (!showAnswer) setShowAnswer(true);
      else handleRating(3);
    },
    threshold: 45,
  });

  if (!isOpen) return null;

  const progress = sessionQueue.length > 0 ? Math.round((currentIndex / sessionQueue.length) * 100) : 100;
  const predictedIntervals = currentItem ? predictNonQuranIntervals(currentItem.fsrsData) : null;
  const ratings = predictedIntervals
    ? [
        { rating: 1 as const, label: language === "en" ? "Again" : "Lagi", interval: predictedIntervals[1], className: "border-error/30 bg-error-primary text-error-primary hover:bg-error-secondary" },
        { rating: 2 as const, label: language === "en" ? "Hard" : "Sulit", interval: predictedIntervals[2], className: "border-utility-yellow-200 bg-utility-yellow-50 text-utility-yellow-700 hover:bg-utility-yellow-100" },
        { rating: 3 as const, label: language === "en" ? "Good" : "Baik", interval: predictedIntervals[3], className: "border-utility-green-200 bg-utility-green-50 text-utility-green-700 hover:bg-utility-green-100" },
      ]
    : [];

  return (
    <ModalOverlay isOpen isDismissable onOpenChange={(open) => !open && onClose()}>
      <Modal className="max-w-2xl overflow-hidden rounded-t-3xl sm:rounded-3xl">
        <Dialog aria-label={language === "en" ? "Personal card review" : "Review kartu pribadi"} className="!overflow-hidden">
          {({ close }) => (
            <div className="flex max-h-[inherit] flex-col">
              <header className="relative flex shrink-0 items-center justify-between gap-3 overflow-hidden border-b border-brand-200 bg-[linear-gradient(135deg,var(--color-brand-50)_0%,var(--color-bg-primary)_75%)] px-5 py-4 sm:px-6">
                <div className="pointer-events-none absolute -right-12 -top-16 size-40 rounded-full bg-brand-200/40 blur-3xl" />
                <div className="relative flex min-w-0 items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-solid text-white shadow-xs"><BookOpen className="size-4.5" /></div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-primary">{language === "en" ? "Review session" : "Sesi review"}</h2>
                      {!isFinished && <Badge color="brand" size="sm">{currentIndex + 1} / {sessionQueue.length}</Badge>}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-secondary">
                      {[currentBook?.title, currentChapter?.title].filter(Boolean).join(" / ") || (language === "en" ? "Personal cards" : "Kartu pribadi")}
                    </p>
                  </div>
                </div>
                <ButtonUtility icon={X} color="tertiary" tooltip={language === "en" ? "Close review" : "Tutup review"} onPress={close} className="relative bg-primary/80 shadow-xs" />
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto bg-secondary/20 p-4 sm:p-6">
                {isFinished ? (
                  <div className="flex min-h-96 flex-col items-center justify-center text-center">
                    <div className="flex size-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 shadow-xs ring-1 ring-brand-200 ring-inset"><Trophy className="size-8" /></div>
                    <Badge color="success" size="sm" className="mt-4">{language === "en" ? "Session complete" : "Sesi selesai"}</Badge>
                    <h3 className="mt-3 text-xl font-semibold text-primary">{language === "en" ? "Review complete" : "Review selesai"}</h3>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-secondary">
                      {language === "en" ? `${reviewedCount} cards reviewed. Their next schedules have been updated.` : `${reviewedCount} kartu telah direview. Jadwal berikutnya sudah diperbarui.`}
                    </p>
                    <Button className="mt-6" iconTrailing={ArrowRight} onPress={close}>{language === "en" ? "Back to collection" : "Kembali ke koleksi"}</Button>
                  </div>
                ) : currentItem ? (
                  <div className="space-y-4">
                    <div>
                      <div className="mb-2 flex items-center justify-between text-xs text-secondary">
                        <span>{language === "en" ? `${sessionQueue.length - currentIndex} cards remaining` : `${sessionQueue.length - currentIndex} kartu tersisa`}</span>
                        <span className="font-semibold text-brand-secondary">{progress}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-brand-solid transition-[width] duration-500" style={{ width: `${Math.max(4, progress)}%` }} /></div>
                    </div>

                    <AudioRecorderPlayer itemId={currentItem.id} itemType="book" itemLabel={language === "en" ? "Card voice note" : "Catatan suara kartu"} language={language} compact />

                    <button type="button" onClick={() => setShowAnswer((visible) => !visible)} className="block w-full text-left [perspective:1400px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600">
                      <div className={`relative min-h-[300px] w-full transition-transform duration-500 [transform-style:preserve-3d] sm:min-h-[340px] ${showAnswer ? "[transform:rotateY(180deg)]" : ""}`}>
                        <section className="absolute inset-0 flex flex-col overflow-y-auto rounded-3xl border border-secondary bg-primary p-5 shadow-lg [backface-visibility:hidden] sm:p-7">
                          <div className="flex items-center justify-between"><Badge color="brand" size="sm">{language === "en" ? "Question" : "Pertanyaan"}</Badge><RotateCw className="size-4 text-fg-quaternary" /></div>
                          <div className="flex flex-1 flex-col justify-center py-5">
                            <BilingualCardText text={currentItem.question} type="question" variant="review" emptyFallback={language === "en" ? "[Image only]" : "[Hanya gambar]"} />
                            {currentItem.imageQ && <img src={currentItem.imageQ} alt={language === "en" ? "Question" : "Pertanyaan"} className="mt-4 max-h-48 w-full rounded-2xl bg-secondary object-contain ring-1 ring-secondary" />}
                          </div>
                          <p className="border-t border-secondary pt-3 text-center text-xs font-medium text-brand-secondary">{language === "en" ? "Click to reveal the answer" : "Klik untuk membuka jawaban"}</p>
                        </section>

                        <section className="absolute inset-0 flex flex-col overflow-y-auto rounded-3xl border border-brand-200 bg-[linear-gradient(145deg,var(--color-bg-primary)_0%,var(--color-brand-50)_100%)] p-5 shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)] sm:p-7">
                          <div className="flex items-center justify-between"><Badge color="success" size="sm">{language === "en" ? "Answer" : "Jawaban"}</Badge><RotateCw className="size-4 text-brand-500" /></div>
                          <div className="flex flex-1 flex-col justify-center py-5">
                            <BilingualCardText text={currentItem.answer} type="answer" variant="review" emptyFallback={language === "en" ? "[No text answer]" : "[Tidak ada teks jawaban]"} />
                            {currentItem.imageA && <img src={currentItem.imageA} alt={language === "en" ? "Answer" : "Jawaban"} className="mt-4 max-h-44 w-full rounded-2xl bg-primary object-contain ring-1 ring-brand-200" />}
                            {currentItem.explanation && (
                              <div className="mt-4 rounded-2xl border border-brand-200 bg-primary/80 p-3.5">
                                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-brand-700"><Sparkles className="size-3.5" />{language === "en" ? "Explanation" : "Penjelasan"}</p>
                                <BilingualCardText text={currentItem.explanation} type="answer" variant="review" />
                              </div>
                            )}
                          </div>
                          <p className="border-t border-brand-200 pt-3 text-center text-xs font-medium text-brand-secondary">{language === "en" ? "Click to see the question" : "Klik untuk melihat pertanyaan"}</p>
                        </section>
                      </div>
                    </button>

                    {showAnswer && (
                      <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {justRated && (
                          <div className="flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-2 text-white shadow-md"><CheckCircle2 className="size-4 text-utility-green-400" /><span className="text-xs font-semibold">{justRated.label}</span><span className="text-[11px] text-gray-300">({justRated.interval})</span></div>
                        )}
                        <div className="grid grid-cols-3 gap-2">
                          {ratings.map((option) => (
                            <button key={option.rating} type="button" disabled={Boolean(justRated) || isSubmittingReview} onClick={() => void handleRating(option.rating)} className={`flex min-h-16 flex-col items-center justify-center rounded-2xl border px-2 py-2.5 text-center shadow-xs transition hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 ${option.className} ${justRated?.rating === option.rating ? "ring-2 ring-current ring-offset-2" : ""}`}>
                              <span className="text-sm font-semibold">{option.label}</span><span className="mt-0.5 text-xs opacity-75">{option.interval}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
};
