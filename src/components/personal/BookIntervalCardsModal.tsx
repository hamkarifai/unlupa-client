import React, { useState, useEffect, useMemo } from 'react';
import { BookItem, Book, Chapter, ClassGroup, Language } from '../../types';
import { X, Sparkles, Search, BookOpen, Clock, Calendar, CheckCircle2, ArrowRight, GraduationCap, Library } from 'lucide-react';
import { getBookItemClusterKey, BookIntervalClusterKey, getNonQuranIntervalDays } from '../../lib/fsrs';
import { BilingualCardText } from '../common/BilingualCardText';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  clusterKey: BookIntervalClusterKey | null;
  items?: BookItem[];
  books?: Book[];
  chapters?: Chapter[];
  myClasses?: ClassGroup[];
  language: Language;
  onOpenInPersonalSpace?: () => void;
  onOpenInClassesSpace?: () => void;
}

const BOOK_CLUSTERS: Array<{
  key: BookIntervalClusterKey;
  labelEn: string;
  labelId: string;
  subEn: string;
  subId: string;
  color: string;
  activeBg: string;
  badge: string;
}> = [
  {
    key: '<75',
    labelEn: '< 75 Days',
    labelId: '< 75 Hari',
    subEn: 'Foundation & Early Adaptation (< 75 Days)',
    subId: 'Tahap Pondasi & Pengenalan Awal (< 75 Hari)',
    color: 'text-rose-600 dark:text-rose-400',
    activeBg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300',
    badge: 'bg-rose-500 text-white'
  },
  {
    key: '<150',
    labelEn: '75 - 149 Days',
    labelId: '75 - 149 Hari',
    subEn: 'Developing Stability (75 - 149 Days)',
    subId: 'Penguatan Menengah & Terpola (75 - 149 Hari)',
    color: 'text-amber-600 dark:text-amber-400',
    activeBg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300',
    badge: 'bg-amber-500 text-white'
  },
  {
    key: '<225',
    labelEn: '150 - 224 Days',
    labelId: '150 - 224 Hari',
    subEn: 'Deep Knowledge Anchoring (150 - 224 Days)',
    subId: 'Pemahaman Kuat & Tertanam (150 - 224 Hari)',
    color: 'text-purple-600 dark:text-purple-400',
    activeBg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300',
    badge: 'bg-purple-600 text-white'
  },
  {
    key: '<300',
    labelEn: '225 - 299 Days',
    labelId: '225 - 299 Hari',
    subEn: 'Advanced Consolidation (225 - 299 Days)',
    subId: 'Konsolidasi Lanjut & Mantap (225 - 299 Hari)',
    color: 'text-sky-600 dark:text-sky-400',
    activeBg: 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300',
    badge: 'bg-sky-600 text-white'
  },
  {
    key: '<375',
    labelEn: '300 - 374 Days',
    labelId: '300 - 374 Hari',
    subEn: 'Near Mastery Stage (300 - 374 Days)',
    subId: 'Kian Matang Menuju Kelulusan (300 - 374 Hari)',
    color: 'text-indigo-600 dark:text-indigo-400',
    activeBg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300',
    badge: 'bg-indigo-600 text-white'
  },
  {
    key: '>375',
    labelEn: '≥ 375 Days',
    labelId: '≥ 375 Hari',
    subEn: 'Mastered / Book Graduation (≥ 375 Days)',
    subId: 'Mapan & Lulus Kitab (≥ 375 Hari)',
    color: 'text-emerald-600 dark:text-emerald-400',
    activeBg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
    badge: 'bg-emerald-600 text-white'
  }
];

export const BookIntervalCardsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  clusterKey,
  items = [],
  books = [],
  chapters = [],
  myClasses = [],
  language,
  onOpenInPersonalSpace,
  onOpenInClassesSpace,
}) => {
  const [activeCluster, setActiveCluster] = useState<BookIntervalClusterKey>(clusterKey || '<75');
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'personal' | 'classes'>('all');

  useEffect(() => {
    if (clusterKey) {
      setActiveCluster(clusterKey);
    }
  }, [clusterKey]);

  // Compute live counts for all 6 clusters
  const clusterCounts = useMemo(() => {
    const counts: Record<BookIntervalClusterKey, number> = {
      '<75': 0,
      '<150': 0,
      '<225': 0,
      '<300': 0,
      '<375': 0,
      '>375': 0,
    };
    (items || []).forEach(item => {
      if (item && item.isActive) {
        const k = getBookItemClusterKey(item);
        counts[k] = (counts[k] || 0) + 1;
      }
    });
    return counts;
  }, [items]);

  const activeClusterConfig = useMemo(() => {
    return BOOK_CLUSTERS.find(c => c.key === activeCluster) || BOOK_CLUSTERS[0];
  }, [activeCluster]);

  const filteredCards = useMemo(() => {
    const activeItems = (items || []).filter(item => {
      if (!item || !item.isActive) return false;
      if (getBookItemClusterKey(item) !== activeCluster) return false;

      const book = (books || []).find(b => b.id === item.bookId);
      const isClassBook = !!book?.classId;
      if (sourceFilter === 'personal' && isClassBook) return false;
      if (sourceFilter === 'classes' && !isClassBook) return false;

      return true;
    });

    if (!searchQuery.trim()) return activeItems;
    const q = searchQuery.toLowerCase().trim();
    return activeItems.filter(item => {
      const question = item.question?.toLowerCase() || '';
      const answer = item.answer?.toLowerCase() || '';
      const book = (books || []).find(b => b.id === item.bookId);
      const chapter = (chapters || []).find(c => c.id === item.chapterId);
      const bookTitle = book?.title?.toLowerCase() || '';
      const chapterTitle = chapter?.title?.toLowerCase() || '';
      return question.includes(q) || answer.includes(q) || bookTitle.includes(q) || chapterTitle.includes(q);
    });
  }, [items, activeCluster, searchQuery, books, chapters, sourceFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${activeClusterConfig.activeBg} border`}>
              <Library className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {language === 'en' 
                    ? 'Other Books (Personal & Classes)' 
                    : 'Kitab & Buku Lainnya (Ruang Pribadi & Kelas Saya)'}
                </h2>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${activeClusterConfig.badge}`}>
                  {filteredCards.length} {language === 'en' ? 'Cards' : 'Kartu'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'en' ? activeClusterConfig.subEn : activeClusterConfig.subId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cluster Tabs */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {BOOK_CLUSTERS.map(c => {
              const count = clusterCounts[c.key];
              const isSelected = activeCluster === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setActiveCluster(c.key)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? `${c.activeBg} border shadow-xs font-bold`
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{language === 'en' ? c.labelEn : c.labelId}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isSelected ? c.badge : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Source Filter, Search Bar & Direct Navigation Links */}
        <div className="p-3 sm:px-6 border-b border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/20">
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Source Segmented Filter */}
            <div className="inline-flex p-0.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setSourceFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  sourceFilter === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {language === 'en' ? 'All Sources' : 'Semua Sumber'}
              </button>
              <button
                type="button"
                onClick={() => setSourceFilter('personal')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  sourceFilter === 'personal'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Library className="w-3 h-3" />
                <span>Ruang Pribadi</span>
              </button>
              <button
                type="button"
                onClick={() => setSourceFilter('classes')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  sourceFilter === 'classes'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <GraduationCap className="w-3 h-3" />
                <span>Kelas Saya</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={language === 'en' ? 'Search question, answer, book title...' : 'Cari pertanyaan, jawaban, atau nama kitab...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Quick Space Actions */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            {onOpenInPersonalSpace && (
              <button
                onClick={() => {
                  onClose();
                  onOpenInPersonalSpace();
                }}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold transition-all cursor-pointer"
              >
                <Library className="w-3 h-3" />
                <span>{language === 'en' ? 'Open Personal' : 'Buka Ruang Pribadi'}</span>
              </button>
            )}

            {onOpenInClassesSpace && (
              <button
                onClick={() => {
                  onClose();
                  onOpenInClassesSpace();
                }}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold transition-all cursor-pointer"
              >
                <GraduationCap className="w-3 h-3" />
                <span>{language === 'en' ? 'Open Classes' : 'Buka Kelas Saya'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Cards Grid / List Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 max-h-[55vh]">
          {filteredCards.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                {language === 'en' ? 'No cards found in this filter' : 'Tidak ada kartu pada filter interval ini'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {language === 'en' 
                  ? 'Review your cards consistently in Personal Space or Classes to advance them through intervals.' 
                  : 'Murajaah kartu secara teratur di Ruang Pribadi atau Kelas Saya agar kekuatan memori terus bertumbuh.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredCards.map(item => {
                const book = (books || []).find(b => b.id === item.bookId);
                const chapter = (chapters || []).find(c => c.id === item.chapterId);
                const classGroup = book?.classId ? (myClasses || []).find(c => c.id === book.classId) : null;
                const intervalDays = getNonQuranIntervalDays(item.fsrsData);
                const isDue = !item.fsrsData?.nextReview || new Date(item.fsrsData.nextReview) <= new Date();

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-2.5 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
                  >
                    <div>
                      {/* Top metadata tags: Origin (Personal vs Class) + Book */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap truncate">
                          {classGroup ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center gap-1">
                              <GraduationCap className="w-2.5 h-2.5" />
                              <span>Kelas: {classGroup.name}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center gap-1">
                              <Library className="w-2.5 h-2.5" />
                              <span>Ruang Pribadi</span>
                            </span>
                          )}

                          <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md truncate max-w-[130px]">
                            {book?.title || 'Kitab / Buku'}
                          </span>

                          {chapter && (
                            <span className="text-[10px] text-slate-400 truncate max-w-[100px]">
                              • {chapter.title}
                            </span>
                          )}
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          isDue 
                            ? 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/50 dark:border-rose-900' 
                            : 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-900'
                        }`}>
                          {isDue ? (language === 'en' ? 'Due Today' : 'Perlu Ulang') : (language === 'en' ? 'Scheduled' : 'Terjadwal')}
                        </span>
                      </div>

                      {/* Question / Front */}
                      <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        <BilingualCardText 
                          text={item.question} 
                          type="question" 
                          variant="compact" 
                        />
                      </div>

                      {/* Answer / Back */}
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
                        <BilingualCardText 
                          text={item.answer} 
                          type="answer" 
                          variant="compact" 
                        />
                      </div>
                    </div>

                    {/* Footer stats: stability & reps */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Interval: <strong className="text-slate-800 dark:text-slate-200">{intervalDays} Hari</strong></span>
                      </div>

                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{item.fsrsData?.reps || 0}× Review</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

