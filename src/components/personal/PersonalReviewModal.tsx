import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BookItem } from '../../types';
import { predictNonQuranIntervals } from '../../lib/fsrs';
import { X, Trophy, ArrowRight, BookOpen, CheckCircle2, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AudioRecorderPlayer } from '../shared/AudioRecorderPlayer';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { soundEffects } from '../../lib/soundFeedback';
import { BilingualCardText } from '../common/BilingualCardText';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  specificBookId?: string;
  specificChapterId?: string;
}

export const PersonalReviewModal: React.FC<Props> = ({
  isOpen,
  onClose,
  specificBookId,
  specificChapterId,
}) => {
  const { personalStats, reviewItem, books, chapters, language } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [sessionQueue, setSessionQueue] = useState<BookItem[]>([]);
  const [justRated, setJustRated] = useState<{
    rating: 1 | 2 | 3 | 4;
    label: string;
    interval: string;
  } | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      const q = specificChapterId
        ? personalStats.dueList.filter(i => i.chapterId === specificChapterId)
        : specificBookId 
        ? personalStats.dueList.filter(i => i.bookId === specificBookId)
        : personalStats.dueList;
      setSessionQueue(q);
      setCurrentIndex(0);
      setReviewedCount(0);
      setShowAnswer(false);
      setJustRated(null);
    } else {
      setSessionQueue([]);
    }
  }, [isOpen, specificBookId, specificChapterId]);

  const queue = sessionQueue;
  const currentItem = queue[currentIndex] || null;
  const currentBook = currentItem ? books.find(b => b.id === currentItem.bookId) : null;
  const currentChapter = currentItem ? chapters.find(c => c.id === currentItem.chapterId) : null;

  const handleRating = (rating: 1 | 2 | 3 | 4) => {
    if (!currentItem || justRated) return;

    // Subtle audio micro-interaction
    soundEffects.playRatingFeedback(rating);

    const intervals = predictNonQuranIntervals(currentItem.fsrsData);
    const ratingLabels = {
      1: language === 'en' ? 'Review Again' : 'Perlu Diulang',
      2: language === 'en' ? 'Hard' : 'Sukar / Berat',
      3: language === 'en' ? 'Good' : 'Baik / Mantap',
      4: language === 'en' ? 'Easy' : 'Sangat Lancar',
    };

    setJustRated({
      rating,
      label: ratingLabels[rating],
      interval: intervals[rating],
    });

    // Gentle micro confirmation delay for smooth visual transition
    setTimeout(() => {
      reviewItem(currentItem.id, rating);
      setReviewedCount(prev => prev + 1);
      setShowAnswer(false);
      setJustRated(null);

      if (currentIndex + 1 < queue.length) {
        setCurrentIndex(prev => prev + 1);
      } else {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        setCurrentIndex(queue.length);
      }
    }, 280);
  };

  const isFinished = !currentItem || currentIndex >= queue.length;

  // Swipe support during card review session
  useSwipeGesture(null, {
    disabled: !isOpen,
    onSwipeRight: () => {
      if (isFinished) {
        onClose();
      } else if (currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
        setShowAnswer(false);
      } else {
        onClose();
      }
    },
    onSwipeLeft: () => {
      if (isFinished) return;
      if (!showAnswer) {
        setShowAnswer(true);
      } else {
        handleRating(3); // Default to 'Good' on swipe left after answer is shown
      }
    },
    threshold: 45,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl max-h-[92vh] sm:max-h-[88vh] rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col">
        
        {/* Top Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-850 shrink-0">
          <div className="flex flex-col flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {language === 'en' ? 'Review Session' : 'Sesi Review'}
                </h2>
                {currentBook && currentChapter && (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 line-clamp-2 pr-2">
                    {currentBook.title} <span className="mx-1 text-slate-300 dark:text-slate-600">›</span> {currentChapter.title}
                  </p>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-7 overflow-y-auto flex-1 flex flex-col justify-between">
          {isFinished ? (
            <div className="text-center py-6 my-auto">
              <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-4 shadow-sm">
                <Trophy className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                {language === 'en' ? 'Review Session Finished!' : 'Sesi Review Selesai!'}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-sm mx-auto">
                {language === 'en'
                  ? `Great work! You reviewed ${reviewedCount} card${reviewedCount === 1 ? '' : 's'}. Next intervals have been updated.`
                  : `Hebat! Anda telah mereview ${reviewedCount} kartu. Jadwal berikutnya telah dihitung dan diperbarui.`}
              </p>
              <div className="mt-6">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors text-sm shadow-sm inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>{language === 'en' ? 'Back to Library' : 'Kembali ke Koleksi'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6 flex-1 flex flex-col">
              {/* Visual Review Progress */}
              <div className="space-y-1.5 shrink-0">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>{language === 'en' ? 'Card' : 'Kartu'} {currentIndex + 1} / {queue.length}</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {Math.round(((currentIndex) / queue.length) * 100)}% ({queue.length - currentIndex} {language === 'en' ? 'left' : 'tersisa'})
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${Math.min(100, Math.max(4, ((currentIndex) / queue.length) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Voice Note Recorder (Persistent across front/back) */}
              <div className="px-1 shrink-0">
                <AudioRecorderPlayer 
                  itemId={currentItem.id}
                  itemType="book"
                  itemLabel={language === 'en' ? 'Card Voice Note' : 'Setoran Suara Kartu'}
                  language={language}
                  compact={true}
                />
              </div>

              {/* CARD CONTAINER: Front (Question only) vs Back (Answer + 4 ratings only) */}
              {!showAnswer ? (
                /* Front of Card: Only question + Click anywhere to flip hint */
                <div 
                  onClick={() => setShowAnswer(true)}
                  className="bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 rounded-3xl p-5 sm:p-7 min-h-[170px] sm:min-h-[210px] flex flex-col justify-between cursor-pointer transition-all duration-200 shadow-sm active:scale-[0.99] select-none group flex-1"
                >
                  <div className="flex-1 flex flex-col justify-center">
                    <BilingualCardText 
                      text={currentItem.question}
                      type="question"
                      variant="review"
                      emptyFallback={language === 'en' ? '[Image Only]' : '[Hanya Gambar]'}
                    />
                    {currentItem.imageQ && (
                      <div className="mt-3 rounded-2xl overflow-hidden max-h-48 border border-slate-200 dark:border-slate-700">
                        <img 
                          src={currentItem.imageQ} 
                          alt="Question" 
                          className="w-full h-full object-contain bg-black/5 dark:bg-black/20"
                        />
                      </div>
                    )}
                  </div>

                  {/* Minimalist Hint at the bottom */}
                  <div className="pt-4 mt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center text-xs text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    <span>{language === 'en' ? 'Click anywhere to flip card' : 'Klik di manapun untuk membalik kartu'}</span>
                  </div>
                </div>
              ) : (
                /* Back of Card: Only answer + 4 Rating Feedback Buttons */
                <div className="space-y-4 animate-in fade-in duration-200 flex-1 flex flex-col justify-between">
                  <div className="bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-800/60 rounded-3xl p-5 sm:p-7 min-h-[160px] sm:min-h-[190px] flex flex-col justify-center shadow-sm flex-1">
                    <BilingualCardText 
                      text={currentItem.answer}
                      type="answer"
                      variant="review"
                      emptyFallback={language === 'en' ? '[No text answer]' : '[Tidak ada teks jawaban]'}
                    />
                    {currentItem.imageA && (
                      <div className="mt-3 rounded-2xl overflow-hidden max-h-48 border border-indigo-200/60 dark:border-indigo-800/60">
                        <img 
                          src={currentItem.imageA} 
                          alt="Answer" 
                          className="w-full h-full object-contain bg-black/5 dark:bg-black/20"
                        />
                      </div>
                    )}
                  </div>

                  {/* Soft confirmation micro-banner */}
                  {justRated && (
                    <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md animate-in fade-in zoom-in-95 duration-150 shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                      <span className="text-xs font-bold">{justRated.label}</span>
                      <span className="text-[11px] opacity-75 font-normal">({justRated.interval})</span>
                    </div>
                  )}

                  {/* 4 Rating Feedback Buttons */}
                  {(() => {
                    const p = predictNonQuranIntervals(currentItem.fsrsData);
                    return (
                      <div className="grid grid-cols-4 gap-2 sm:gap-3 pt-1 shrink-0">
                        <button
                          onClick={() => handleRating(1)}
                          disabled={!!justRated}
                          className={`flex flex-col items-center justify-center py-2.5 sm:py-3 px-1.5 sm:px-2 rounded-2xl border transition-all active:scale-95 cursor-pointer shadow-2xs min-h-[50px] ${
                            justRated?.rating === 1
                              ? 'bg-rose-600 text-white border-rose-600 ring-2 ring-rose-400 scale-[1.02]'
                              : 'border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-800 dark:text-rose-300'
                          }`}
                        >
                          <span className="font-bold text-xs sm:text-sm leading-tight">{language === 'en' ? 'Again' : 'Lagi'}</span>
                          <span className="text-[10px] sm:text-xs opacity-75 mt-0.5">{p[1]}</span>
                        </button>
                        <button
                          onClick={() => handleRating(2)}
                          disabled={!!justRated}
                          className={`flex flex-col items-center justify-center py-2.5 sm:py-3 px-1.5 sm:px-2 rounded-2xl border transition-all active:scale-95 cursor-pointer shadow-2xs min-h-[50px] ${
                            justRated?.rating === 2
                              ? 'bg-amber-600 text-white border-amber-600 ring-2 ring-amber-400 scale-[1.02]'
                              : 'border-amber-200 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300'
                          }`}
                        >
                          <span className="font-bold text-xs sm:text-sm leading-tight">{language === 'en' ? 'Hard' : 'Sulit'}</span>
                          <span className="text-[10px] sm:text-xs opacity-75 mt-0.5">{p[2]}</span>
                        </button>
                        <button
                          onClick={() => handleRating(3)}
                          disabled={!!justRated}
                          className={`flex flex-col items-center justify-center py-2.5 sm:py-3 px-1.5 sm:px-2 rounded-2xl border transition-all active:scale-95 cursor-pointer shadow-2xs min-h-[50px] ${
                            justRated?.rating === 3
                              ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-400 scale-[1.02]'
                              : 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/80 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                          }`}
                        >
                          <span className="font-bold text-xs sm:text-sm leading-tight">{language === 'en' ? 'Good' : 'Baik'}</span>
                          <span className="text-[10px] sm:text-xs opacity-75 mt-0.5">{p[3]}</span>
                        </button>
                        <button
                          onClick={() => handleRating(4)}
                          disabled={!!justRated}
                          className={`flex flex-col items-center justify-center py-2.5 sm:py-3 px-1.5 sm:px-2 rounded-2xl border transition-all active:scale-95 cursor-pointer shadow-sm min-h-[50px] ${
                            justRated?.rating === 4
                              ? 'bg-indigo-700 text-white border-indigo-700 ring-2 ring-indigo-400 scale-[1.02]'
                              : 'border-indigo-200 dark:border-indigo-800 bg-indigo-600 hover:bg-indigo-700 text-white'
                          }`}
                        >
                          <span className="font-bold text-xs sm:text-sm leading-tight">{language === 'en' ? 'Easy' : 'Mudah'}</span>
                          <span className="text-[10px] sm:text-xs opacity-85 mt-0.5">{p[4]}</span>
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
