import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Loader2,
  CheckCircle2,
  Download,
  MessageSquare
} from 'lucide-react';
import { getSurahForPage, getJuzForPage, getQuranPageImageUrl, MUSHAF_SAMPLE_SNIPPETS } from '../../data/quranData';
import { getOfflinePageUrl, cachePageOffline, isPageCachedOffline } from '../../lib/offlineStorage';
import { AudioRecorderPlayer } from '../shared/AudioRecorderPlayer';
import { MurottalPlayer } from '../shared/MurottalPlayer';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';

interface Props {
  pageNumber: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigatePage?: (newPage: number) => void;
  onOpenFeedback?: (pageNumber: number) => void;
}

export const MushafPageViewerModal: React.FC<Props> = ({
  pageNumber,
  isOpen,
  onClose,
  onNavigatePage,
  onOpenFeedback,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [imageLoading, setImageLoading] = useState<boolean>(true);
  const [imageError, setImageError] = useState<boolean>(false);
  const [localImageUrl, setLocalImageUrl] = useState<string | null>(null);
  const [isCached, setIsCached] = useState<boolean>(false);
  const [isCaching, setIsCaching] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setImageError(false);

    // Check local offline storage first for 0ms instant loading
    (async () => {
      const cachedUrl = await getOfflinePageUrl(pageNumber);
      if (isMounted) {
        if (cachedUrl) {
          setLocalImageUrl(cachedUrl);
          setIsCached(true);
          setImageLoading(false);
        } else {
          setLocalImageUrl(null);
          setIsCached(false);
          setImageLoading(true);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [pageNumber]);

  const handleManualCache = async () => {
    setIsCaching(true);
    const ok = await cachePageOffline(pageNumber);
    if (ok) {
      setIsCached(true);
      const url = await getOfflinePageUrl(pageNumber);
      if (url) setLocalImageUrl(url);
    }
    setIsCaching(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      // Don't trigger if user is typing
      const target = e.target as HTMLElement;
      if (target && ['input', 'textarea', 'select'].includes(target.tagName.toLowerCase())) {
        return;
      }

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && e.altKey && onNavigatePage && pageNumber < 604) {
        // Alt + ArrowLeft: Next page
        onNavigatePage(pageNumber + 1);
      } else if (e.key === 'ArrowRight' && e.altKey && onNavigatePage && pageNumber > 1) {
        // Alt + ArrowRight: Prev page
        onNavigatePage(pageNumber - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pageNumber, onNavigatePage, onClose]);

  // Swipe support for Mushaf page flipping
  useSwipeGesture(null, {
    disabled: !isOpen || zoomLevel > 1,
    onSwipeLeft: () => {
      // Swipe left -> advance to next page
      if (onNavigatePage && pageNumber < 604) {
        onNavigatePage(pageNumber + 1);
      }
    },
    onSwipeRight: () => {
      // Swipe right -> return to previous page or close on page 1
      if (onNavigatePage && pageNumber > 1) {
        onNavigatePage(pageNumber - 1);
      } else if (pageNumber === 1) {
        onClose();
      }
    },
    threshold: 40,
  });

  if (!isOpen) return null;

  const juzNum = getJuzForPage(pageNumber);
  const surahInfo = getSurahForPage(pageNumber);
  const imageUrl = getQuranPageImageUrl(pageNumber, 1260);

  const snippet = MUSHAF_SAMPLE_SNIPPETS[pageNumber] || {
    bismillah: pageNumber > 1 && pageNumber !== 187,
    header: `سُورَةُ ${surahInfo.nameAr}`,
    lines: [
      `بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ`,
      `آيَاتُ الْقُرْآنِ الْكَرِيمِ — الصَّفْحَةُ ${pageNumber}`,
      `تِلَاوَةٌ مُبَارَكَةٌ مِنْ ${surahInfo.nameAr} (الآيات ${surahInfo.ayahRange})`,
      `حِفْظُ وَمُرَاجَعَةُ كِتَابِ اللَّهِ بِإِتْقَانٍ وَثَبَاتٍ`,
      `وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ`,
      `اقْرَأْ وَارْتَقِ وَرَتِّلْ كَمَا كُنْتَ تُرَتِّلُ فِي الدُّنْيَا`,
      `إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ`
    ]
  };

  const zoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 2.5));
  const zoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.75));
  const resetZoom = () => setZoomLevel(1);

  return (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center p-1 sm:p-3 md:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-[#0f172a] text-slate-100 w-full max-w-5xl h-[96vh] rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar with Page Information & Evaluation Trigger */}
        <div className="bg-slate-900/95 px-3 sm:px-5 py-2.5 flex items-center justify-between border-b border-slate-800 shrink-0 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-white whitespace-nowrap">
                  Halaman {pageNumber} • Juz {juzNum}
                </span>
                <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium truncate">
                  {surahInfo.nameEn} ({surahInfo.ayahRange})
                </span>
              </div>
              <p className="text-[11px] text-amber-300/90 font-serif leading-none mt-0.5" dir="rtl">
                سُورَةُ {surahInfo.nameAr}
              </p>
            </div>
          </div>

          {/* Controls: Murottal Player, Evaluation Note Button, Cache, Zoom, Navigation, Close */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Murottal Player */}
            <div className="hidden sm:block">
              <MurottalPlayer pageNumber={pageNumber} />
            </div>
            {/* Direct Feedback / Issue evaluation modal button */}
            {onOpenFeedback && (
              <button
                type="button"
                onClick={() => onOpenFeedback(pageNumber)}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold transition-colors cursor-pointer active:scale-95"
                title="Buka atau catat koreksi tajwid/hafalan halaman ini"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Catatan Evaluasi</span>
              </button>
            )}

            {/* Offline Cache Status Badge / Trigger */}
            {isCached ? (
              <span className="hidden lg:flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-blue-950/80 text-blue-300 border border-blue-800 font-medium shadow-2xs">
                <CheckCircle2 className="w-3 h-3 text-blue-400 shrink-0" />
                <span>Offline OK</span>
              </span>
            ) : (
              <button
                onClick={handleManualCache}
                disabled={isCaching}
                className="hidden lg:flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:border-amber-500/50 font-medium cursor-pointer transition-colors shadow-2xs"
                title="Simpan halaman ini ke memori lokal browser agar bisa dibuka tanpa internet"
              >
                <Download className="w-3 h-3 text-amber-400 shrink-0" />
                <span>{isCaching ? 'Menyimpan...' : 'Simpan'}</span>
              </button>
            )}

            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              <button
                onClick={zoomOut}
                disabled={zoomLevel <= 0.75}
                className="p-1.5 rounded hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={resetZoom}
                className="px-2 py-1 text-[11px] font-mono text-slate-300 hover:text-white"
                title="Reset Zoom (100%)"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                onClick={zoomIn}
                disabled={zoomLevel >= 2.5}
                className="p-1.5 rounded hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Navigation Controls */}
            {onNavigatePage && (
              <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                <button
                  disabled={pageNumber <= 1}
                  onClick={() => onNavigatePage(pageNumber - 1)}
                  className="p-1.5 rounded hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition-colors"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-1.5 sm:px-2 text-xs font-semibold text-slate-200 whitespace-nowrap">
                  {pageNumber} / 604
                </span>
                <button
                  disabled={pageNumber >= 604}
                  onClick={() => onNavigatePage(pageNumber + 1)}
                  className="p-1.5 rounded hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition-colors"
                  title="Halaman Selanjutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1.5 ml-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mushaf Page Display Area - Top is NEVER cut off (flex-col justify-start) */}
        <div className="flex-1 bg-[#141a29] overflow-y-auto overflow-x-hidden flex flex-col items-center justify-start p-1.5 sm:p-3 min-h-0 relative">
          {imageLoading && !imageError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#141a29] z-10">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin mb-3" />
              <p className="text-xs text-slate-300 font-medium">Memuat Halaman Mushaf {pageNumber}...</p>
            </div>
          )}

          {!imageError ? (
            <div 
              className="transition-transform duration-150 origin-top flex flex-col items-center justify-start my-auto w-full max-w-full"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <div className="bg-[#FFFDF7] p-1.5 sm:p-2 rounded-xl shadow-2xl border-2 border-amber-900/40 flex items-center justify-center max-w-full">
                <img
                  src={localImageUrl || imageUrl}
                  alt={`Halaman Mushaf Al-Quran ${pageNumber}`}
                  onLoad={() => {
                    setImageLoading(false);
                    if (!isCached) {
                      cachePageOffline(pageNumber).then((ok) => {
                        if (ok) setIsCached(true);
                      });
                    }
                  }}
                  onError={() => {
                    setImageLoading(false);
                    setImageError(true);
                  }}
                  className="max-h-[calc(96vh-120px)] w-auto max-w-full object-contain select-none rounded shadow-xs"
                  loading="eager"
                />
              </div>
            </div>
          ) : (
            /* Fallback formatted view if image loading fails */
            <div className="w-full max-w-xl bg-[#FFFDF5] text-slate-900 border-2 border-amber-800/40 p-6 rounded-2xl shadow-xl my-auto">
              <div className="flex items-center justify-between border-b border-amber-800/30 pb-2 mb-4 text-xs text-amber-900 font-semibold px-2">
                <span className="font-serif">الجُزْءُ {juzNum}</span>
                <span className="px-3 py-0.5 rounded-full bg-amber-100 border border-amber-800/30 font-bold">
                  {surahInfo.nameEn} ({surahInfo.ayahRange})
                </span>
                <span className="font-serif text-sm">سُورَةُ {surahInfo.nameAr}</span>
              </div>

              <div className="my-3 py-2 px-4 rounded-lg bg-amber-100/70 border border-amber-800/40 text-amber-950 text-center shadow-sm">
                <p className="font-serif text-lg font-bold">{snippet.header}</p>
              </div>

              {snippet.bismillah && (
                <div className="my-3 py-1 text-center">
                  <p className="font-serif text-xl sm:text-2xl text-amber-950 leading-loose">
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </p>
                </div>
              )}

              <div className="space-y-4 my-4 px-2">
                {snippet.lines.map((line, idx) => (
                  <p key={idx} className="font-serif text-xl sm:text-2xl text-slate-900 leading-[2.2] text-center" dir="rtl">
                    {line}
                  </p>
                ))}
              </div>

              <div className="pt-4 mt-6 border-t border-amber-800/30 flex items-center justify-center">
                <div className="w-9 h-9 rounded-full border border-amber-800/50 flex items-center justify-center font-serif text-sm font-bold text-amber-950 bg-amber-100/50">
                  {pageNumber}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Ultra-Compact Unified Audio Dock Bar (Only ~44px high) - Sticky & Never Sinks */}
        <div className="bg-[#0b1120] px-3 sm:px-5 py-1.5 border-t border-slate-800/80 shrink-0 shadow-lg sticky bottom-0 z-20">
          <AudioRecorderPlayer 
            itemId={pageNumber}
            itemType="quran"
            itemLabel={`Hal ${pageNumber}`}
            language="id" 
            variant="mushaf-dock" 
            onOpenFeedback={onOpenFeedback ? () => onOpenFeedback(pageNumber) : undefined}
          />
        </div>
      </div>
    </div>
  );
};
