import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Check, Layers } from 'lucide-react';

interface AyahSweepSelectorProps {
  startAyah: number;
  endAyah: number;
  fromAyah: number;
  toAyah: number;
  onChange: (from: number, to: number) => void;
  surahName?: string;
  language?: string;
}

export const AyahSweepSelector: React.FC<AyahSweepSelectorProps> = ({
  startAyah,
  endAyah,
  fromAyah,
  toAyah,
  onChange,
  surahName,
  language = 'id',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [hoverAyah, setHoverAyah] = useState<number | null>(null);

  const dragStartRef = useRef<number | null>(null);
  dragStartRef.current = dragStart;
  const isDraggingRef = useRef(false);
  isDraggingRef.current = isDragging;

  const totalAyahs = Math.max(1, endAyah - startAyah + 1);

  // Clamp current selection within valid bounds of this section
  const safeFrom = Math.max(startAyah, Math.min(endAyah, fromAyah));
  const safeTo = Math.max(startAyah, Math.min(endAyah, toAyah));
  const min = Math.min(safeFrom, safeTo);
  const max = Math.max(safeFrom, safeTo);
  const selectedCount = max - min + 1;
  const isSingle = min === max;

  const commitRange = useCallback(
    (start: number, end: number) => {
      const cMin = Math.max(startAyah, Math.min(endAyah, Math.min(start, end)));
      const cMax = Math.min(endAyah, Math.max(startAyah, Math.max(start, end)));
      onChange(cMin, cMax);
    },
    [startAyah, endAyah, onChange]
  );

  // Helper to extract ayah number from coordinates
  const getAyahFromCoords = (clientX: number, clientY: number): number | null => {
    const el = document.elementFromPoint(clientX, clientY);
    const item = el?.closest<HTMLElement>('[data-ayah]');
    if (!item) return null;
    const num = Number(item.dataset.ayah);
    return !isNaN(num) && num >= startAyah && num <= endAyah ? num : null;
  };

  // Pointer Down (Desktop Mouse, Touch, Stylus)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, ayah: number) => {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if setPointerCapture is not available
    }
    setIsDragging(true);
    setDragStart(ayah);
    setHoverAyah(ayah);
    commitRange(ayah, ayah);
  };

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || dragStartRef.current === null) return;
    const currentAyah = getAyahFromCoords(e.clientX, e.clientY);
    if (currentAyah !== null) {
      setHoverAyah(currentAyah);
      commitRange(dragStartRef.current, currentAyah);
    }
  };

  // Pointer Up / Cancel
  const handlePointerUp = (e?: React.PointerEvent<HTMLDivElement>) => {
    if (e) {
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {}
    }
    setIsDragging(false);
    setDragStart(null);
    setHoverAyah(null);
  };

  // Touch Move fallback
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || dragStartRef.current === null) return;
    const touch = e.touches[0];
    const currentAyah = getAyahFromCoords(touch.clientX, touch.clientY);
    if (currentAyah !== null) {
      setHoverAyah(currentAyah);
      commitRange(dragStartRef.current, currentAyah);
    }
  };

  // Global listeners guarantee release
  useEffect(() => {
    const handleGlobalEnd = () => {
      if (isDraggingRef.current) {
        setIsDragging(false);
        setDragStart(null);
        setHoverAyah(null);
      }
    };

    window.addEventListener('pointerup', handleGlobalEnd);
    window.addEventListener('pointercancel', handleGlobalEnd);
    window.addEventListener('touchend', handleGlobalEnd);
    window.addEventListener('touchcancel', handleGlobalEnd);

    return () => {
      window.removeEventListener('pointerup', handleGlobalEnd);
      window.removeEventListener('pointercancel', handleGlobalEnd);
      window.removeEventListener('touchend', handleGlobalEnd);
      window.removeEventListener('touchcancel', handleGlobalEnd);
    };
  }, []);

  return (
    <div className="space-y-2 select-none">
      {/* Compact Ayah Summary Banner */}
      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded-lg bg-indigo-600 text-white shrink-0 shadow-2xs">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {surahName && (
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {surahName}:
                </span>
              )}
              <span className="text-xs font-black text-indigo-900 dark:text-indigo-200">
                {isSingle ? `Ayat ${min}` : `Ayat ${min} — ${max}`}
              </span>
              <span className="px-1.5 py-0.2 rounded-md bg-indigo-200/80 dark:bg-indigo-900/70 text-[10px] font-bold text-indigo-800 dark:text-indigo-300">
                {isSingle ? '1 Ayat' : `${selectedCount} Ayat`}
              </span>
              {isDragging && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-amber-100 dark:bg-amber-950 text-[10px] font-bold text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 animate-pulse">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>{language === 'en' ? 'Sweeping...' : 'Menyapu...'}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick presets (Semua di Halaman vs 1 Ayat) */}
        <div className="flex items-center gap-1 shrink-0">
          {!isSingle && (
            <button
              type="button"
              onClick={() => commitRange(min, min)}
              className="px-2 py-0.8 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {language === 'en' ? 'Single' : '1 Ayat'}
            </button>
          )}
          {totalAyahs > 1 && selectedCount !== totalAyahs && (
            <button
              type="button"
              onClick={() => commitRange(startAyah, endAyah)}
              className="px-2 py-0.8 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors cursor-pointer"
            >
              {language === 'en' ? 'All Ayahs' : 'Semua'}
            </button>
          )}
        </div>
      </div>

      {/* Interactive Ayah Sweep Grid */}
      <div
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => handlePointerUp()}
        className={`grid gap-1.5 p-2 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 touch-none select-none ${
          totalAyahs <= 6
            ? 'grid-cols-6'
            : totalAyahs <= 8
            ? 'grid-cols-8'
            : totalAyahs <= 12
            ? 'grid-cols-6 sm:grid-cols-10'
            : 'grid-cols-7 sm:grid-cols-10'
        }`}
      >
        {Array.from({ length: totalAyahs }, (_, i) => startAyah + i).map((ayahNum) => {
          const inRange = ayahNum >= min && ayahNum <= max;
          const isEdge = ayahNum === min || ayahNum === max;
          const isDragHover = isDragging && hoverAyah === ayahNum;

          return (
            <div
              key={ayahNum}
              data-ayah={ayahNum}
              onPointerDown={(e) => handlePointerDown(e, ayahNum)}
              className={`h-9 sm:h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all cursor-pointer touch-none select-none relative ${
                isEdge
                  ? 'bg-indigo-600 text-white shadow-xs z-10 ring-2 ring-indigo-400/80 scale-105 font-black'
                  : inRange
                  ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800/60'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200/80 dark:border-slate-800/80'
              } ${isDragHover ? 'ring-2 ring-amber-400 ring-offset-1' : ''}`}
            >
              <span className="pointer-events-none">{ayahNum}</span>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
        {language === 'en'
          ? 'Tap an ayah or sweep finger/cursor to select a range of verses.'
          : 'Ketuk nomor ayat atau sapukan jari/mouse untuk memilih rentang ayat bermasalah.'}
      </p>
    </div>
  );
};
