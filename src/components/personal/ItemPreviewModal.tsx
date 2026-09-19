import React from 'react';
import { BookItem, Language } from '../../types';
import { X, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { AudioRecorderPlayer } from '../shared/AudioRecorderPlayer';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { BilingualCardText } from '../common/BilingualCardText';

interface Props {
  item: BookItem | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateNext?: () => void;
  onNavigatePrev?: () => void;
  onActivate?: () => void;
  onDeactivate?: () => void;
  language: Language;
}

export const ItemPreviewModal: React.FC<Props> = ({
  item,
  isOpen,
  onClose,
  onNavigateNext,
  onNavigatePrev,
  onActivate,
  onDeactivate,
  language,
}) => {
  // Swipe to navigate between flashcards inside modal preview
  useSwipeGesture(null, {
    disabled: !isOpen,
    onSwipeLeft: () => {
      if (onNavigateNext) onNavigateNext();
    },
    onSwipeRight: () => {
      if (onNavigatePrev) {
        onNavigatePrev();
      } else {
        onClose();
      }
    },
    threshold: 40,
  });

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header: Clean & Focused with Previous / Next Stepper */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              item.isActive 
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
            }`}>
              {item.isActive ? (language === 'en' ? 'Active' : 'Aktif') : (language === 'en' ? 'Inactive' : 'Nonaktif')}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {language === 'en' ? 'Flashcard Detail' : 'Detail Kartu'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {(onNavigatePrev || onNavigateNext) && (
              <div className="flex items-center gap-0.5 bg-slate-200/70 dark:bg-slate-700/60 p-0.5 rounded-lg mr-1">
                <button
                  disabled={!onNavigatePrev}
                  onClick={onNavigatePrev}
                  className="p-1 rounded-md text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-600 disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
                  title={language === 'en' ? 'Previous Card (Swipe Right)' : 'Kartu Sebelumnya (Usap Kanan)'}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={!onNavigateNext}
                  onClick={onNavigateNext}
                  className="p-1 rounded-md text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-600 disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
                  title={language === 'en' ? 'Next Card (Swipe Left)' : 'Kartu Berikutnya (Usap Kiri)'}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title={language === 'en' ? 'Close' : 'Tutup'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content: Only Question (+ image) and Answer (+ image) */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Question */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
              {language === 'en' ? 'Question' : 'Pertanyaan'}
            </span>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 sm:p-5 rounded-2xl border border-slate-200/70 dark:border-slate-700 select-text">
              <BilingualCardText 
                text={item.question} 
                type="question" 
                variant="detail-modal"
                emptyFallback={language === 'en' ? '[Image Question]' : '[Pertanyaan Berupa Gambar]'}
              />
            </div>
            {item.imageQ && (
              <img 
                src={item.imageQ} 
                alt="Question visual" 
                className="mt-2.5 rounded-xl max-h-56 w-full object-contain bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            )}
          </div>

          {/* Answer */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
              {language === 'en' ? 'Answer' : 'Jawaban'}
            </span>
            <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-4 sm:p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 select-text">
              <BilingualCardText 
                text={item.answer} 
                type="answer" 
                variant="detail-modal"
                emptyFallback={language === 'en' ? '[No Text Answer]' : '[Tidak Ada Teks Jawaban]'}
              />
            </div>
            {item.imageA && (
              <img 
                src={item.imageA} 
                alt="Answer visual" 
                className="mt-2.5 rounded-xl max-h-56 w-full object-contain bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            )}
          </div>

          {/* Voice Note Recorder */}
          <div className="pt-2">
            <AudioRecorderPlayer 
              itemId={item.id}
              itemType="book"
              itemLabel={language === 'en' ? 'Voice Note' : 'Setoran Suara'}
              language={language}
              compact={false}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {!item.isActive && onActivate ? (
              <button
                onClick={() => {
                  onActivate();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Activate Card' : 'Aktifkan Kartu'}</span>
              </button>
            ) : item.isActive && onDeactivate ? (
              <button
                onClick={() => {
                  onDeactivate();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                <span>{language === 'en' ? 'Deactivate Card' : 'Nonaktifkan Kartu'}</span>
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {language === 'en' ? 'Close' : 'Tutup'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
