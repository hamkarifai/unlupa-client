import React from 'react';
import { Chapter, BookItem, Language } from '../../types';
import { Folder, FolderOpen, MoveRight, X, Layers, Check } from 'lucide-react';

interface FolderMoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  targetMoveChapterId: string;
  setTargetMoveChapterId: (id: string) => void;
  chapters: Chapter[];
  items?: BookItem[];
  movingItem: BookItem | null;
  movingChapter: Chapter | null;
  selectedCount: number;
  language: Language;
}

export const FolderMoveModal: React.FC<FolderMoveModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  targetMoveChapterId,
  setTargetMoveChapterId,
  chapters,
  items = [],
  movingItem,
  movingChapter,
  selectedCount,
  language
}) => {
  if (!isOpen) return null;

  // Build hierarchical chapter list
  const getChapterDepth = (chap: Chapter): number => {
    let depth = 0;
    let curr: Chapter | undefined = chap;
    const visited = new Set<string>();
    while (curr && curr.parentId && !visited.has(curr.id)) {
      visited.add(curr.id);
      depth++;
      curr = chapters.find(c => c.id === curr!.parentId);
    }
    return depth;
  };

  const sortedChapters: Chapter[] = [];
  const buildTree = (parentId: string | null = null) => {
    const list = chapters.filter(c => (c.parentId || null) === parentId);
    for (const c of list) {
      sortedChapters.push(c);
      buildTree(c.id);
    }
  };
  buildTree(null);

  // Helper to check if a chapter is a descendant of movingChapter (to avoid cyclical loops)
  const isDescendant = (candidateId: string, ancestorId: string): boolean => {
    let curr = chapters.find(c => c.id === candidateId);
    const visited = new Set<string>();
    while (curr && curr.parentId && !visited.has(curr.id)) {
      if (curr.parentId === ancestorId) return true;
      visited.add(curr.id);
      curr = chapters.find(c => c.id === curr!.parentId);
    }
    return false;
  };

  const getTitle = () => {
    if (movingChapter) {
      return language === 'en' 
        ? `Reorganize Chapter: "${movingChapter.title}"` 
        : `Pindah Posisi Bab: "${movingChapter.title}"`;
    }
    if (movingItem) {
      return language === 'en' ? 'Move Card to Chapter' : 'Pindahkan Kartu ke Bab Lain';
    }
    return language === 'en' 
      ? `Move ${selectedCount} Selected Cards` 
      : `Pindahkan ${selectedCount} Kartu Terpilih`;
  };

  const getSubtitle = () => {
    if (movingChapter) {
      return language === 'en'
        ? 'Select a parent chapter to make it a subchapter, or set to Root Level.'
        : 'Pilih bab induk untuk menjadikannya sub-bab, atau letakkan di Tingkat Utama (Root).';
    }
    return language === 'en'
      ? 'Choose destination chapter or folder for the selected cards.'
      : 'Pilih bab atau folder tujuan untuk kartu yang dipindahkan.';
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                {getTitle()}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {getSubtitle()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chapter Selection Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            {language === 'en' ? 'Select Destination' : 'Pilih Lokasi Tujuan'}
          </label>

          {/* Option: Root / Unassigned */}
          <div
            onClick={() => setTargetMoveChapterId(movingChapter ? '__root__' : '__unassigned__')}
            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
              (targetMoveChapterId === '__root__' || targetMoveChapterId === '__unassigned__' || (!targetMoveChapterId && !movingChapter))
                ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-indigo-500 shrink-0" />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  {movingChapter 
                    ? (language === 'en' ? 'Root Level (Main Chapter)' : 'Tingkat Utama (Bab Utama)') 
                    : (language === 'en' ? 'General Cards (No Chapter)' : 'Kartu Umum (Tanpa Bab)')}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {movingChapter 
                    ? (language === 'en' ? 'Chapter will become top-level' : 'Bab tidak berada di dalam subbab manapun') 
                    : (language === 'en' ? 'Cards will be placed outside any chapter' : 'Kartu akan berada di luar bab')}
                </span>
              </div>
            </div>

            {(targetMoveChapterId === '__root__' || targetMoveChapterId === '__unassigned__' || (!targetMoveChapterId && !movingChapter)) && (
              <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
            )}
          </div>

          {/* Chapter Options */}
          {sortedChapters.map(chap => {
            const depth = getChapterDepth(chap);
            const isSelf = movingChapter?.id === chap.id;
            const isInvalidChild = movingChapter ? isDescendant(chap.id, movingChapter.id) : false;
            const isDisabled = isSelf || isInvalidChild;
            const isSelected = targetMoveChapterId === chap.id;
            const cardCount = items.filter(i => i.chapterId === chap.id).length;

            return (
              <div
                key={chap.id}
                onClick={() => {
                  if (!isDisabled) {
                    setTargetMoveChapterId(chap.id);
                  }
                }}
                style={{ marginLeft: `${Math.min(depth * 14, 42)}px` }}
                className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                  isDisabled
                    ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/20'
                    : isSelected
                    ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 cursor-pointer'
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 bg-white dark:bg-slate-900 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Folder className={`w-4 h-4 shrink-0 ${
                    isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
                  }`} />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white truncate block">
                      {chap.title}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {depth === 0 
                        ? (language === 'en' ? 'Chapter' : 'Bab') 
                        : (language === 'en' ? `Subchapter L${depth}` : `Sub-bab Tk.${depth}`)}
                      {' • '}{cardCount} {language === 'en' ? 'cards' : 'kartu'}
                    </span>
                  </div>
                </div>

                {isSelected ? (
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                ) : isSelf ? (
                  <span className="text-[10px] font-semibold text-slate-400">
                    {language === 'en' ? 'Current' : 'Saat Ini'}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors"
          >
            {language === 'en' ? 'Cancel' : 'Batal'}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <MoveRight className="w-4 h-4" />
            <span>{language === 'en' ? 'Move Now' : 'Pindahkan Sekarang'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
