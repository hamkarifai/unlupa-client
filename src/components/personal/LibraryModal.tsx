import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { LibraryEntry } from '../../data/sampleBooks';
import { Chapter, BookItem, createInitialFSRSState } from '../../types';
import { personalService } from '@/features/personal/services/personal.services';
import { BilingualCardText } from '../common/BilingualCardText';
import { 
  X, 
  Search, 
  Download, 
  Star, 
  CheckCircle2, 
  BookOpen, 
  Layers, 
  ShieldCheck,
  Tag,
  Eye,
  ArrowRight,
  Folder,
  Sparkles,
  HelpCircle,
  FileText,
  SlidersHorizontal,
  Check,
  ExternalLink,
  ChevronRight,
  Loader2
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const LibraryModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { 
    library, 
    books, 
    importFromLibrary, 
    duplicateBookAsEditable, 
    language, 
    setActiveSpace,
    isBookPurchased,
    openCheckoutModal
  } = useApp();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'cards' | 'newest'>('popular');
  const [previewEntry, setPreviewEntry] = useState<LibraryEntry | null>(null);
  const [previewSelectedChapterId, setPreviewSelectedChapterId] = useState<string | null>(null);
  const [justImportedId, setJustImportedId] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Load preview book details and tree dynamically from backend API if empty
  useEffect(() => {
    if (previewEntry && (!previewEntry.items || previewEntry.items.length === 0) && previewEntry.book?.id) {
      setIsLoadingPreview(true);
      personalService.getBookTree(previewEntry.book.id)
        .then(res => {
          if (res?.data) {
            const tree = res.data;
            const chaptersList: Chapter[] = [];
            const itemsList: BookItem[] = [];

            if (Array.isArray(tree.items)) {
              tree.items.forEach((item: any) => {
                itemsList.push({
                  id: item.id,
                  bookId: tree.book_id || previewEntry.book.id,
                  chapterId: '',
                  question: item.question || '',
                  answer: item.answer || '',
                  isActive: false,
                  status: 'inactive',
                  fsrsData: createInitialFSRSState(),
                  createdAt: new Date().toISOString(),
                });
              });
            }

            const flattenModules = (mods: any[], parentId: string | null = null) => {
              mods.forEach(mod => {
                chaptersList.push({
                  id: mod.id,
                  bookId: tree.book_id || previewEntry.book.id,
                  parentId,
                  title: mod.title,
                  description: mod.description,
                  order: mod.order || 1,
                });
                if (Array.isArray(mod.items)) {
                  mod.items.forEach((item: any) => {
                    itemsList.push({
                      id: item.id,
                      bookId: tree.book_id || previewEntry.book.id,
                      chapterId: mod.id,
                      question: item.question || '',
                      answer: item.answer || '',
                      isActive: false,
                      status: 'inactive',
                      fsrsData: createInitialFSRSState(),
                      createdAt: new Date().toISOString(),
                    });
                  });
                }
                if (Array.isArray(mod.children) && mod.children.length > 0) {
                  flattenModules(mod.children, mod.id);
                }
              });
            };

            if (Array.isArray(tree.modules)) {
              flattenModules(tree.modules);
            }

            setPreviewEntry(prev => prev ? { ...prev, chapters: chaptersList, items: itemsList } : null);
          }
        })
        .catch(err => {
          console.warn('Failed to load preview tree:', err);
        })
        .finally(() => {
          setIsLoadingPreview(false);
        });
    }
  }, [previewEntry?.id]);

  if (!isOpen) return null;

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const categories = [
    { id: 'All', label: language === 'en' ? 'All Books' : 'Semua Kitab' },
    { id: 'Bahasa Arab', label: language === 'en' ? 'Arabic Language' : 'Bahasa Arab' },
    { id: 'Tajwid & Al-Qur\'an', label: language === 'en' ? 'Tajweed & Quran' : 'Tajwid & Al-Qur\'an' },
    { id: 'Hadits & Sunnah', label: language === 'en' ? 'Hadith Studies' : 'Hadits & Sunnah' },
    { id: 'Dzikir & Doa', label: language === 'en' ? 'Dhikr & Du\'a' : 'Dzikir & Doa' },
    { id: 'Umum & Akademik', label: language === 'en' ? 'General & Academic' : 'Umum & Akademik' },
  ];

  // Filtering & Sorting
  const filteredEntries = library
    .filter(entry => {
      const matchCategory = selectedCategory === 'All' || entry.book.category === selectedCategory;
      const matchSearch = 
        (entry.book?.title || '').toLowerCase().includes(search.toLowerCase()) ||
        (entry.book?.description || '').toLowerCase().includes(search.toLowerCase()) ||
        (entry.curator || '').toLowerCase().includes(search.toLowerCase()) ||
        (entry.book?.authorName || '').toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'popular') return (b.downloads || 0) - (a.downloads || 0);
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'cards') return (b.items?.length || 0) - (a.items?.length || 0);
      if (sortBy === 'newest') return new Date(b.book.createdAt || 0).getTime() - new Date(a.book.createdAt || 0).getTime();
      return 0;
    });

  const handleImport = async (entry: LibraryEntry) => {
    await importFromLibrary(entry.id);
    setJustImportedId(entry.id);
    setTimeout(() => {
      setJustImportedId(null);
    }, 2500);
  };

  const selectedPreviewChapterCards = previewEntry
    ? (previewSelectedChapterId
        ? previewEntry.items.filter(i => i.chapterId === previewSelectedChapterId)
        : previewEntry.items)
    : [];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                  {language === 'en' ? 'Public Knowledge Library' : 'Pustaka Kitab & Kurasi Publik'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {library.length} {language === 'en' ? 'Curated Books' : 'Kitab Tersedia'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'en'
                  ? 'High-retention, peer-reviewed structured books ready for 1-click import into your adaptive spaced review.'
                  : 'Kitab-kitab terstruktur terkurasi dengan sistem Spaced Repetition, siap diimpor ke akun Anda dalam 1 detik.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Controls Bar */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={language === 'en' ? 'Search kitab title, author, or topic...' : 'Cari judul kitab, pengarang, materi...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {language === 'en' ? 'Sort:' : 'Urutkan:'}
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
            >
              <option value="popular">{language === 'en' ? 'Most Popular (Downloads)' : 'Terpopuler (Unduhan)'}</option>
              <option value="rating">{language === 'en' ? 'Highest Rated' : 'Rating Tertinggi'}</option>
              <option value="cards">{language === 'en' ? 'Most Cards' : 'Jumlah Kartu Terbanyak'}</option>
              <option value="newest">{language === 'en' ? 'Recently Added' : 'Terbaru'}</option>
            </select>
          </div>
        </div>

        {/* Categories Horizontal Scroll */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-50/50 dark:bg-slate-900/40 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-amber-600 text-white shadow-xs font-bold'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200/80 dark:border-slate-700/80'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Main Content: Catalog Grid or Empty */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-16 px-4">
              <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-base">
                {language === 'en' ? 'No books found' : 'Tidak ada kitab yang cocok'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {language === 'en' 
                  ? 'Try searching with different keywords or switch the category filter.' 
                  : 'Coba gunakan kata kunci lain atau pilih kategori kitab yang berbeda.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEntries.map(entry => {
                const isAlreadyImported = books.some(b => b.title === entry.book.title);
                const isJustImported = justImportedId === entry.id;
                const isPurchased = isBookPurchased(entry.id, entry.book);
                const isPaid = (entry.book.price || 0) > 0;

                return (
                  <div
                    key={entry.id}
                    className="group bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/70 p-4 transition-all hover:shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      {/* Cover & Header Info */}
                      <div className="flex items-start gap-3">
                        <div className="relative w-20 h-28 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs">
                          {entry.book.coverUrl ? (
                            <img
                              src={entry.book.coverUrl}
                              alt={entry.book.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <BookOpen className="w-6 h-6" />
                            </div>
                          )}
                          <div className="absolute top-1 left-1">
                            <span className="px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold">
                              {entry.chapters?.length || 1} Bab
                            </span>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-[10px] font-bold border border-amber-200/60 dark:border-amber-800/60">
                              {entry.book.category}
                            </span>
                            
                            {/* Price / Free Badge */}
                            {isPaid ? (
                              <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold border border-indigo-200/60 dark:border-indigo-800/60">
                                {formatIDR(entry.book.price || 0)}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200/60 dark:border-emerald-800/60">
                                Gratis
                              </span>
                            )}

                            {entry.verified && (
                              <span className="flex items-center gap-0.5 text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold" title="Kurasi Resmi Terverifikasi">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>Kurasi Resmi</span>
                              </span>
                            )}
                          </div>

                          <h4 
                            title={entry.book.title}
                            className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors"
                          >
                            {entry.book.title}
                          </h4>

                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                            {entry.book.authorName}
                          </p>

                          {/* Stats Badge */}
                          <div className="flex items-center gap-2.5 mt-2.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                            <span className="flex items-center gap-1 text-amber-500 font-bold">
                              <Star className="w-3.5 h-3.5 fill-amber-500" />
                              {entry.rating}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1" title="Jumlah unduhan">
                              <Download className="w-3.5 h-3.5 text-slate-400" />
                              {(entry.downloads || 0).toLocaleString()}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1" title="Jumlah kartu hafalan">
                              <Layers className="w-3.5 h-3.5 text-slate-400" />
                              {entry.items?.length || 0} kartu
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 line-clamp-2 leading-relaxed">
                        {entry.book.description}
                      </p>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewEntry(entry);
                          setPreviewSelectedChapterId(null);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>{language === 'en' ? 'Preview' : 'Intip Isi'}</span>
                      </button>

                      {isJustImported ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold animate-in fade-in">
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>{language === 'en' ? 'Installed!' : 'Berhasil Dipasang!'}</span>
                        </span>
                      ) : isAlreadyImported ? (
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            {language === 'en' ? 'Installed' : 'Sudah Ada'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleImport(entry)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 cursor-pointer"
                            title={language === 'en' ? 'Import again as fresh duplicate' : 'Pasang ulang sebagai salinan baru'}
                          >
                            + Salin
                          </button>
                        </div>
                      ) : !isPurchased && isPaid ? (
                        <button
                          type="button"
                          onClick={() => openCheckoutModal(entry)}
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <span>Beli ({formatIDR(entry.book.price || 0)})</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleImport(entry)}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{language === 'en' ? '1-Click Import' : 'Pasang Kitab'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detailed Book Preview Modal (Deep Inspection & Sample Cards) */}
        {previewEntry && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[88vh]">
              
              {/* Preview Header */}
              <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/70 dark:bg-slate-850">
                <div className="flex items-start gap-4">
                  <img
                    src={previewEntry.book.coverUrl}
                    alt={previewEntry.book.title}
                    className="w-18 h-24 sm:w-20 sm:h-28 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-md shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="px-2.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-bold">
                        {previewEntry.book.category}
                      </span>
                      {previewEntry.verified && (
                        <span className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>Kurasi Resmi Unlupa</span>
                        </span>
                      )}
                    </div>
                    <h3 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white leading-tight">
                      {previewEntry.book.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {language === 'en' ? 'Author' : 'Pengarang'}: <strong>{previewEntry.book.authorName}</strong> • {language === 'en' ? 'Curated by' : 'Dikurasi oleh'} {previewEntry.curator}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                      {previewEntry.book.description}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewEntry(null)}
                  className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Preview Body: Chapters Filter & Sample Cards List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {/* Chapter Selector Pills */}
                <div>
                  <h5 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5 text-amber-500" />
                    <span>{language === 'en' ? 'Table of Contents' : 'Daftar Bab & Materi'} ({previewEntry.chapters?.length || 0})</span>
                  </h5>
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                    <button
                      onClick={() => setPreviewSelectedChapterId(null)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        previewSelectedChapterId === null
                          ? 'bg-amber-600 text-white font-bold shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {language === 'en' ? 'All Chapters' : 'Semua Bab'} ({previewEntry.items.length})
                    </button>
                    {(previewEntry.chapters || []).map(ch => {
                      const chCardCount = previewEntry.items.filter(i => i.chapterId === ch.id).length;
                      return (
                        <button
                          key={ch.id}
                          onClick={() => setPreviewSelectedChapterId(ch.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                            previewSelectedChapterId === ch.id
                              ? 'bg-amber-600 text-white font-bold shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {ch.title} ({chCardCount})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Cards Preview */}
                <div className="space-y-3 pt-2">
                  <h5 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{language === 'en' ? 'Sample Flashcards' : 'Sampel Kartu Q&A'} ({selectedPreviewChapterCards.length})</span>
                  </h5>

                  {isLoadingPreview ? (
                    <div className="flex items-center justify-center py-10 gap-2 text-slate-400 text-xs">
                      <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                      <span>{language === 'en' ? 'Loading book content...' : 'Memuat isi materi kitab...'}</span>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedPreviewChapterCards.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                          {language === 'en' ? 'No cards available in this chapter yet.' : 'Belum ada kartu hafalan di bab ini.'}
                        </div>
                      ) : (
                        selectedPreviewChapterCards.map((card, idx) => (
                          <div
                            key={card.id || idx}
                            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 space-y-2"
                          >
                            <div className="flex items-start gap-2">
                              <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                Q
                              </span>
                              <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white leading-relaxed flex-1">
                                <BilingualCardText text={card.question} />
                              </div>
                            </div>

                            <div className="flex items-start gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                              <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                A
                              </span>
                              <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed flex-1">
                                <BilingualCardText text={card.answer} />
                              </div>
                            </div>

                            {card.tags && card.tags.length > 0 && (
                              <div className="flex items-center gap-1.5 pt-1">
                                {card.tags.map((tag, tIdx) => (
                                  <span key={tIdx} className="px-2 py-0.5 rounded bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-400 text-[10px] font-medium">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Preview Footer Action */}
              <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setPreviewEntry(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {language === 'en' ? 'Close Preview' : 'Tutup Pratinjau'}
                </button>

                {!isBookPurchased(previewEntry.id, previewEntry.book) && (previewEntry.book.price || 0) > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      const entryToBuy = previewEntry;
                      setPreviewEntry(null);
                      openCheckoutModal(entryToBuy);
                    }}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <span>Beli Kitab Ini ({formatIDR(previewEntry.book.price || 0)})</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      handleImport(previewEntry);
                      setPreviewEntry(null);
                    }}
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>{language === 'en' ? 'Import Full Kitab (1-Click)' : 'Pasang Seluruh Kitab (1-Klik)'}</span>
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
