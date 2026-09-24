import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Share2, 
  BookOpen, 
  Check, 
  ShieldCheck, 
  Pencil, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  Loader2
} from 'lucide-react';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedBookId?: string | null;
}

export const PublishModal: React.FC<PublishModalProps> = ({ isOpen, onClose, preselectedBookId }) => {
  const { books, items, library, publishBookToLibrary, language } = useApp();
  const [selectedBookId, setSelectedBookId] = useState<string>(preselectedBookId || '');
  
  // Authenticity & Edit Permission: Default to FALSE (Hanya Baca / Otentik) for protection
  const [allowEdit, setAllowEdit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Filter ONLY personal original works (never someone else's imported read-only book)
  const myBooks = books.filter(b => !b.isReadonly);

  useEffect(() => {
    if (isOpen) {
      if (preselectedBookId && myBooks.some(b => b.id === preselectedBookId)) {
        setSelectedBookId(preselectedBookId);
      } else if (myBooks.length > 0 && !selectedBookId) {
        // Find first unpublished book if possible
        const firstUnpublished = myBooks.find(b => !library.some(l => l.book.id === b.id));
        setSelectedBookId(firstUnpublished?.id || myBooks[0].id);
      }
      setStatus(null);
      setIsSubmitting(false);
    }
  }, [isOpen, preselectedBookId]);

  if (!isOpen) return null;

  const selectedBook = myBooks.find(b => b.id === selectedBookId);
  const selectedBookItems = selectedBook ? items.filter(i => i.bookId === selectedBook.id) : [];
  const isSelectedAlreadyPublished = selectedBook ? library.some(l => l.book.id === selectedBook.id) : false;

  const handlePublish = async () => {
    if (!selectedBookId || isSelectedAlreadyPublished || isSubmitting) return;
    
    setIsSubmitting(true);
    setStatus(null);

    try {
      const result = await publishBookToLibrary(selectedBookId, allowEdit);
      setStatus({ type: result.success ? 'success' : 'error', msg: result.message });
      if (result.success) {
        setTimeout(() => {
          onClose();
          setStatus(null);
        }, 1600);
      }
    } catch (err: any) {
      setStatus({
        type: 'error',
        msg: err?.message || (language === 'en' ? 'Failed to publish book' : 'Gagal mempublikasikan kitab')
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {language === 'en' ? 'Publish Kitab to Library' : 'Publikasikan Kitab ke Pustaka'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'en'
                  ? 'Share your curated work with students and the global community'
                  : 'Bagikan karya kurasi Anda kepada santri dan komunitas penuntut ilmu'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {status && (
            <div className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
              status.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60' 
                : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60'
            }`}>
              {status.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              )}
              <span>{status.msg}</span>
            </div>
          )}

          {/* 1. Pemilihan Karya Pribadi */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                {language === 'en' ? 'Select Personal Work' : 'Pilih Karya Pribadi untuk Dipublikasikan'}
              </label>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {myBooks.length} {language === 'en' ? 'works available' : 'karya tersedia'}
              </span>
            </div>

            {myBooks.length === 0 ? (
              <div className="p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-slate-500 text-xs">
                {language === 'en' 
                  ? 'No personal works available. Create a book in Personal Space first.' 
                  : 'Belum ada karya pribadi. Buat kitab karya Anda sendiri terlebih dahulu di Ruang Pribadi.'}
              </div>
            ) : (
              <div className="max-h-52 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {myBooks.map(b => {
                  const bItemsCount = items.filter(i => i.bookId === b.id).length;
                  const isAlreadyPub = library.some(l => l.book.id === b.id);
                  const isSelected = selectedBookId === b.id;

                  return (
                    <div
                      key={b.id}
                      onClick={() => !isAlreadyPub && setSelectedBookId(b.id)}
                      className={`p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all ${
                        isAlreadyPub
                          ? 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30 opacity-60 cursor-not-allowed'
                          : isSelected
                          ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-xs ring-1 ring-indigo-500/20 cursor-pointer'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-950/40 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {b.coverUrl ? (
                          <img
                            src={b.coverUrl}
                            alt={b.title}
                            className="w-11 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-2xs"
                          />
                        ) : (
                          <div className="w-11 h-14 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-400 shrink-0">
                            <BookOpen className="w-5 h-5" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {b.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {b.authorName || (language === 'en' ? 'Personal Work' : 'Karya Pribadi Anda')}
                          </p>

                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                              <Layers className="w-3 h-3 text-slate-400" />
                              <span>{bItemsCount} kartu</span>
                            </span>

                            {isAlreadyPub ? (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                {language === 'en' ? 'Already in Library' : 'Sudah Dipublikasikan'}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300">
                                {language === 'en' ? 'Ready to Publish' : 'Siap Dipublikasi'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Radio Selector Indicator */}
                      <div className="shrink-0 pr-1">
                        {isAlreadyPub ? (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                            {language === 'en' ? 'Active' : 'Aktif'}
                          </span>
                        ) : (
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-600 text-white'
                              : 'border-slate-300 dark:border-slate-700'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {selectedBook && !isSelectedAlreadyPublished && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
                <span>
                  <strong>{language === 'en' ? 'Selected:' : 'Terpilih:'}</strong> {selectedBook.title}
                </span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {selectedBookItems.length} {language === 'en' ? 'cards ready' : 'kartu hafalan'}
                </span>
              </div>
            )}
          </div>

          {/* 2. Hak Akses & Keotentikan (Authenticity Policy) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              {language === 'en' ? 'Authenticity & Edit Permission' : 'Keotentikan & Izin Pengeditan'}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Option A: Hanya Baca / Otentik (Recommended) */}
              <div
                onClick={() => setAllowEdit(false)}
                className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                  !allowEdit
                    ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 ring-1 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`p-1.5 rounded-lg ${!allowEdit ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      {language === 'en' ? 'Read-Only (Authentic)' : 'Hanya Baca (Otentik)'}
                    </h5>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                      {language === 'en' ? 'Recommended' : 'Sangat Direkomendasikan'}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                  {language === 'en'
                    ? 'Protects original content. Readers study & review cards without altering your authentic scholarship.'
                    : 'Menjaga keaslian isi. Pembaca hanya dapat mempelajari & me-review materi tanpa mengubah keotentikan karya Anda.'}
                </p>
              </div>

              {/* Option B: Bisa Diedit (Open Collaboration) */}
              <div
                onClick={() => setAllowEdit(true)}
                className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                  allowEdit
                    ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20 ring-1 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`p-1.5 rounded-lg ${allowEdit ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    <Pencil className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      {language === 'en' ? 'Allow Editing' : 'Bisa Diedit (Terbuka)'}
                    </h5>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      {language === 'en' ? 'Open License' : 'Lisensi Terbuka'}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                  {language === 'en'
                    ? 'Allows importers to edit, add chapters, and adjust flashcards for their personal requirements.'
                    : 'Pengimpor diizinkan memodifikasi atau menambah bab dan kartu sesuai kebutuhan belajar mereka.'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              {language === 'en' ? 'Cancel' : 'Batal'}
            </button>

            <button
              type="button"
              onClick={handlePublish}
              disabled={!selectedBookId || isSelectedAlreadyPublished || isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{language === 'en' ? 'Publishing...' : 'Mempublikasikan...'}</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>
                    {isSelectedAlreadyPublished
                      ? (language === 'en' ? 'Already in Library' : 'Sudah Ada di Pustaka')
                      : (language === 'en' ? 'Publish to Library' : 'Publikasikan ke Pustaka')}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
