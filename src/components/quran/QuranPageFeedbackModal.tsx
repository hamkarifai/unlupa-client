import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { QuranPageItem, PageIssue } from '../../types';
import { X, MessageSquare, Check, Plus, History, Sliders, Sparkles, BookOpen } from 'lucide-react';
import { QURAN_PAGES_METADATA } from '../../data/quranPagesMetadata';
import { SURAH_LIST } from '../../data/quranData';
import { AudioRecorderPlayer } from '../shared/AudioRecorderPlayer';
import { AyahSweepSelector } from './AyahSweepSelector';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  page: QuranPageItem | null;
}

export interface PageSurahSection {
  surahNumber: number;
  surahNameEn: string;
  surahNameAr: string;
  startAyah: number;
  endAyah: number;
}

// 28 Hijaiyah Letters with Arabic script and transliteration
const HIJAIYAH_LETTERS = [
  { ar: 'ا', latin: 'Alif' },
  { ar: 'ب', latin: 'Ba' },
  { ar: 'ت', latin: 'Ta' },
  { ar: 'ث', latin: 'Tsa' },
  { ar: 'ج', latin: 'Jim' },
  { ar: 'ح', latin: 'Ha' },
  { ar: 'خ', latin: 'Kha' },
  { ar: 'د', latin: 'Dal' },
  { ar: 'ذ', latin: 'Dzal' },
  { ar: 'ر', latin: 'Ra' },
  { ar: 'ز', latin: 'Zai' },
  { ar: 'س', latin: 'Sin' },
  { ar: 'ش', latin: 'Syin' },
  { ar: 'ص', latin: 'Shad' },
  { ar: 'ض', latin: 'Dhad' },
  { ar: 'ط', latin: 'Tha' },
  { ar: 'ظ', latin: 'Zha' },
  { ar: 'ع', latin: "'Ain" },
  { ar: 'غ', latin: 'Ghain' },
  { ar: 'ف', latin: 'Fa' },
  { ar: 'ق', latin: 'Qaf' },
  { ar: 'ك', latin: 'Kaf' },
  { ar: 'ل', latin: 'Lam' },
  { ar: 'م', latin: 'Mim' },
  { ar: 'ن', latin: 'Nun' },
  { ar: 'و', latin: 'Waw' },
  { ar: 'هـ', latin: 'Ha Besar' },
  { ar: 'ي', latin: 'Ya' },
];

const MAKHRAJ_MODIFIERS = [
  'Makhraj Kurang Pas',
  'Tertukar Huruf Lain',
  'Kurang Tebal (Isti\'la)',
  'Hams / Nafas Kurang',
  'Qalqalah Tertahan',
  'Suara Sengau / Kurang Bersih'
];

const KELANCARAN_PRESETS = [
  { label: 'Lupa Hafalan (Blank Total)', desc: 'Terhenti dan butuh bantuan talqin' },
  { label: 'Tersendat / Terbata-bata', desc: 'Ragu-ragu saat membaca' },
  { label: 'Tertukar Ayat (Mutasyabihat)', desc: 'Masuk ke ayat atau surat lain' },
  { label: 'Mengulang-ulang (Tardid)', desc: 'Mengulang kata lebih dari 2 kali' },
  { label: 'Salah Baris / Lompat Ayat', desc: 'Melewati satu baris atau ayat' },
  { label: 'Ragu-ragu / Kurang Yakin', desc: 'Sering berhenti mengecek ingatan' },
  { label: 'Tempo Terburu-buru', desc: 'Kecepatan membaca terlalu cepat' }
];

const TAJWID_CATEGORIES = [
  {
    id: 'mad',
    title: 'Mad (Panjang-Pendek)',
    badge: 'Panjang-Pendek',
    options: [
      'Mad Thobi\'i Kurang Panjang (2 Harakat)',
      'Mad Thobi\'i Terlalu Panjang (>2 Harakat)',
      'Mad Wajib / Jaiz Kurang Panjang (4-5 Harakat)',
      'Mad Lazim Kurang Panjang (6 Harakat)',
      'Mad \'Aridh Lissukun Tidak Konsisten',
      'Mad Shilah / Badal Kurang Tepat'
    ]
  },
  {
    id: 'nun_tanwin',
    title: 'Nun Mati & Tanwin',
    badge: 'Ikhfa/Idgham/Idzhar',
    options: [
      'Ikhfa Haqiqi (Kurang Samar / Kurang Dengung)',
      'Idgham Bighunnah (Kurang Dengung)',
      'Idgham Bilaghunnah (Malah Berdengung)',
      'Iqlab (Kurang Rapat Bibir / Dengung)',
      'Idzhar Halqi (Malah Dengung)'
    ]
  },
  {
    id: 'mim_ghunnah',
    title: 'Mim Mati & Ghunnah',
    badge: 'Dengung & Tasydid',
    options: [
      'Nun/Mim Bertasydid (Ghunnah Kurang 2 Harakat)',
      'Ghunnah Terburu-buru',
      'Ikhfa Syafawi (Mim Mati bertemu Ba)',
      'Idgham Mimi (Mim Mati bertemu Mim)',
      'Idzhar Syafawi (Mim Mati tidak boleh dengung)'
    ]
  },
  {
    id: 'qalqalah',
    title: 'Qalqalah (Pantulan)',
    badge: 'Pantulan Huruf',
    options: [
      'Qalqalah Sughra Kurang Memantul',
      'Qalqalah Kubra Kurang Memantul saat Waqaf',
      'Qalqalah Terlalu Berlebihan / Kasar',
      'Memantulkan Huruf Non-Qalqalah'
    ]
  },
  {
    id: 'tafkhim',
    title: 'Tebal & Tipis (Tafkhim/Tarqiq)',
    badge: 'Isti\'la & Istifal',
    options: [
      'Huruf Isti\'la Kurang Tebal (Kha, Shad, Dhad, Ghain, Tha, Qaf, Zha)',
      'Huruf Istifal Malah Dibaca Tebal',
      'Ra Tebal Dibaca Tipis',
      'Ra Tipis Dibaca Tebal',
      'Lam Jalalah (Lafazh Allah) Kurang Tebal/Tipis'
    ]
  },
  {
    id: 'waqaf_harakat',
    title: 'Waqaf, Ibtida & Harakat',
    badge: 'Tanda Berhenti & Vokal',
    options: [
      'Waqaf di Tempat Kurang Tepat / Terputus',
      'Salah Memulai Kembali Bacaan (Ibtida)',
      'Nafas Tidak Sampai',
      'Harakat Tertukar (Fathah/Kasrah/Dhommah)',
      'Sukun Tertukar Tasydid'
    ]
  }
];

const QUICK_NOTES = [
  'Perlu dilatih lagi',
  'Ulangi 3x',
  'Hati-hati sambungan ayat',
  'Perhatikan tanda waqaf',
  'Perhatikan dengung & mad',
  'Fokus makhraj huruf'
];

export const QuranPageFeedbackModal: React.FC<Props> = ({ isOpen, onClose, page }) => {
  const { quranPages, addQuranPageIssue, resolveQuranPageIssue, language } = useApp();

  // Retrieve reactive, live page from context so newly added or resolved issues reflect immediately without stale state
  const livePage = useMemo(() => {
    if (!page) return null;
    return quranPages.find(p => p.pageNumber === page.pageNumber) || page;
  }, [quranPages, page]);
  
  const [activeTab, setActiveTab] = useState<'unresolved' | 'add' | 'history'>('unresolved');
  
  // Ayah Sweep State
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(0);
  const [ayahFrom, setAyahFrom] = useState(1);
  const [ayahTo, setAyahTo] = useState(1);

  // Issue Type & Details (Zero Typing)
  const [issueType, setIssueType] = useState<PageIssue['type']>('kelancaran');
  const [selectedDetail, setSelectedDetail] = useState('');
  const [selectedTajwidCat, setSelectedTajwidCat] = useState('mad');
  
  // Makhraj Specific
  const [selectedLetter, setSelectedLetter] = useState<{ ar: string; latin: string } | null>(null);
  const [selectedModifier, setSelectedModifier] = useState('');

  // Optional Note State
  const [issueNote, setIssueNote] = useState('');
  const [showCustomNoteInput, setShowCustomNoteInput] = useState(false);

  // Compute surah sections for this page
  const surahSections: PageSurahSection[] = useMemo(() => {
    if (!livePage) return [];
    const meta = QURAN_PAGES_METADATA[livePage.pageNumber - 1];
    if (!meta) {
      return [{
        surahNumber: livePage.surahNumber || 1,
        surahNameEn: livePage.surahNameEn || 'Al-Fatihah',
        surahNameAr: livePage.surahNameAr || 'الفاتحة',
        startAyah: 1,
        endAyah: 7
      }];
    }

    const [s1Str, a1Str] = meta.startVerseKey.split(':');
    const [s2Str, a2Str] = meta.endVerseKey.split(':');
    const startSurah = parseInt(s1Str, 10);
    const startAyah = parseInt(a1Str, 10);
    const endSurah = parseInt(s2Str, 10);
    const endAyah = parseInt(a2Str, 10);

    const sections: PageSurahSection[] = [];

    for (let s = startSurah; s <= endSurah; s++) {
      const surahInfo = SURAH_LIST[s - 1];
      const sAyah = (s === startSurah) ? startAyah : 1;
      const eAyah = (s === endSurah) ? endAyah : (surahInfo ? surahInfo.ayahsCount : 50);

      sections.push({
        surahNumber: s,
        surahNameEn: surahInfo ? surahInfo.nameEn : `Surah ${s}`,
        surahNameAr: surahInfo ? surahInfo.nameAr : '',
        startAyah: sAyah,
        endAyah: Math.max(sAyah, eAyah)
      });
    }

    return sections;
  }, [livePage]);

  const currentSection = surahSections[selectedSectionIndex] || surahSections[0];

  // Initialize or reset state when modal opens or page changes
  useEffect(() => {
    if (isOpen && currentSection) {
      setSelectedSectionIndex(0);
      setAyahFrom(currentSection.startAyah);
      setAyahTo(currentSection.startAyah);
      setIssueType('kelancaran');
      setSelectedDetail(KELANCARAN_PRESETS[0].label);
      setSelectedTajwidCat('mad');
      setSelectedLetter(null);
      setSelectedModifier('');
      setIssueNote('');
      setShowCustomNoteInput(false);
    }
  }, [isOpen, page]);

  // Sync when currentSection changes
  useEffect(() => {
    if (currentSection) {
      setAyahFrom(currentSection.startAyah);
      setAyahTo(currentSection.startAyah);
    }
  }, [currentSection]);

  const issues = livePage?.issues || [];
  const unresolvedIssues = issues.filter(i => !i.isResolved);
  const resolvedIssues = issues.filter(i => i.isResolved);

  // Auto switch tab if no unresolved issues
  useEffect(() => {
    if (isOpen && activeTab === 'unresolved' && unresolvedIssues.length === 0) {
      setActiveTab('add');
    }
  }, [isOpen, unresolvedIssues.length, activeTab]);

  // Format Ayah Result String
  const resolvedAyahText = useMemo(() => {
    if (!currentSection) return '1';
    const isSingle = ayahFrom === ayahTo;
    const ayahSpan = isSingle ? `${ayahFrom}` : `${ayahFrom} - ${ayahTo}`;
    if (surahSections.length > 1) {
      return `${currentSection.surahNameEn} ${ayahSpan}`;
    }
    return ayahSpan;
  }, [currentSection, ayahFrom, ayahTo, surahSections]);

  // Format Issue Detail
  const resolvedDetailText = useMemo(() => {
    if (issueType === 'kelancaran') {
      return selectedDetail || 'Lupa Hafalan';
    }
    if (issueType === 'tajwid') {
      return selectedDetail || 'Kesalahan Tajwid';
    }
    if (issueType === 'makharijul') {
      if (!selectedLetter) return 'Makharijul Huruf';
      if (selectedModifier) {
        return `Huruf ${selectedLetter.ar} (${selectedLetter.latin}) • ${selectedModifier}`;
      }
      return `Huruf ${selectedLetter.ar} (${selectedLetter.latin})`;
    }
    return selectedDetail;
  }, [issueType, selectedDetail, selectedLetter, selectedModifier]);

  if (!isOpen || !livePage) return null;

  const handleAddIssue = () => {
    if (!resolvedAyahText) {
      alert(language === 'en' ? 'Please select an ayah range.' : 'Silakan pilih ayat terlebih dahulu.');
      return;
    }

    addQuranPageIssue(livePage.pageNumber, {
      ayah: resolvedAyahText,
      type: issueType,
      detail: resolvedDetailText || undefined,
      note: issueNote.trim() || undefined,
    });

    setIssueNote('');
    setShowCustomNoteInput(false);

    // Reset & switch to unresolved list immediately
    setActiveTab('unresolved');
  };

  const getIssueLabel = (type: string) => {
    switch (type) {
      case 'kelancaran': return language === 'en' ? 'Fluency' : 'Kelancaran';
      case 'lupa': return language === 'en' ? 'Forgot' : 'Lupa Hafalan';
      case 'tajwid': return 'Tajwid';
      case 'makharijul': return 'Makharijul Huruf';
      default: return type;
    }
  };

  const getIssueColor = (type: string) => {
    switch (type) {
      case 'kelancaran': return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:border-amber-800 dark:text-amber-300';
      case 'lupa': return 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:border-rose-800 dark:text-rose-300';
      case 'tajwid': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:border-blue-800 dark:text-blue-300';
      case 'makharijul': return 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/40 dark:border-indigo-800 dark:text-indigo-300';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-slate-850/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-blue-800/50">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
                {language === 'en' ? 'Page Evaluation & Issues' : 'Pelacakan Masalah Hafalan'}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {language === 'en' 
                  ? `Page ${livePage.pageNumber} • ${livePage.surahNameEn} (Ayah ${livePage.ayahRange})` 
                  : `Halaman ${livePage.pageNumber} • ${livePage.surahNameEn} (Ayat ${livePage.ayahRange})`}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            aria-label={language === 'en' ? 'Close' : 'Tutup'}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audio Recording for Self-Correction */}
        <div className="px-5 pt-3 shrink-0">
          <AudioRecorderPlayer 
            itemId={livePage.pageNumber}
            itemType="quran"
            itemLabel={`Hal ${livePage.pageNumber}`}
            language={language} 
            compact={false} 
          />
        </div>

        {/* Tabs */}
        <div className="flex px-5 pt-2.5 gap-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
          <button 
            type="button"
            onClick={() => setActiveTab('unresolved')}
            className={`pb-2.5 text-xs font-bold transition-all relative cursor-pointer ${activeTab === 'unresolved' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            {language === 'en' ? 'Active Issues' : 'Masalah Aktif'} ({unresolvedIssues.length})
            {activeTab === 'unresolved' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />}
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('add')}
            className={`pb-2.5 text-xs font-bold transition-all relative flex items-center gap-1 cursor-pointer ${activeTab === 'add' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <Plus className="w-3.5 h-3.5" />
            {language === 'en' ? 'Add Issue' : 'Catat Masalah Baru'}
            {activeTab === 'add' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />}
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 text-xs font-bold transition-all relative flex items-center gap-1 cursor-pointer ${activeTab === 'history' ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <History className="w-3.5 h-3.5" />
            {language === 'en' ? 'History' : 'Riwayat'} ({resolvedIssues.length})
            {activeTab === 'history' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 dark:bg-white rounded-t-full" />}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: MASALAH AKTIF */}
          {activeTab === 'unresolved' && (
            <div className="space-y-3">
              {unresolvedIssues.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-200 dark:border-emerald-800/60">
                    <Check className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {language === 'en' ? 'No active issues recorded!' : 'Alhamdulillah, tidak ada masalah aktif!'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    {language === 'en' 
                      ? 'Hafalan pada halaman ini terpantau lancar tanpa catatan khusus.' 
                      : 'Hafalan pada halaman ini terpantau lancar dan tertib.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('add')}
                    className="mt-4 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold text-xs inline-flex items-center gap-1.5 transition-colors border border-blue-200 dark:border-blue-800/50 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Record an Issue' : 'Catat Masalah / Kendala'}</span>
                  </button>
                </div>
              ) : (
                unresolvedIssues.map(issue => (
                  <div key={issue.id} className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 shadow-xs">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${getIssueColor(issue.type)}`}>
                          {getIssueLabel(issue.type)}
                        </span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {language === 'en' ? 'Ayah' : 'Ayat'} {issue.ayah}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(issue.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {(issue.detail || issue.note) && (
                      <div className="mb-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                        {issue.detail && <div className="font-semibold text-slate-800 dark:text-slate-200">{issue.detail}</div>}
                        {issue.note && <div className="text-slate-500 dark:text-slate-400 text-xs mt-1 italic font-normal">"{issue.note}"</div>}
                      </div>
                    )}

                    <button 
                      type="button"
                      onClick={() => resolveQuranPageIssue(livePage.pageNumber, issue.id)}
                      className="w-full py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-emerald-200 dark:border-emerald-800/50 cursor-pointer active:scale-[0.99]"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {language === 'en' ? 'Mark as Resolved (Solved)' : 'Tandai Sudah Lancar (Selesai)'}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: TAMBAH MASALAH BARU (ZERO-TYPING & SISTEM SAPU AYAT UX) */}
          {activeTab === 'add' && currentSection && (
            <div className="space-y-4">
              
              {/* 1. SELEKTOR AYAT MENGGUNAKAN SISTEM SAPU (COMPACT, CEPAT & INTUITIF) */}
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      {language === 'en' ? 'Select Issue Ayah' : 'Pilih Ayat Bermasalah'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200/60 dark:border-indigo-800/40">
                    {language === 'en' ? 'Swipe / Tap' : 'Sistem Sapu Jari'}
                  </span>
                </div>

                {/* Multi-Surah Switcher on this Page (if >1 surah exists) */}
                {surahSections.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    <span className="text-[10px] font-bold text-slate-400 shrink-0">Surat:</span>
                    {surahSections.map((sec, idx) => (
                      <button
                        key={sec.surahNumber}
                        type="button"
                        onClick={() => {
                          setSelectedSectionIndex(idx);
                          setAyahFrom(sec.startAyah);
                          setAyahTo(sec.startAyah);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                          selectedSectionIndex === idx
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {sec.surahNameEn} ({sec.startAyah} - {sec.endAyah})
                      </button>
                    ))}
                  </div>
                )}

                {/* Ayah Sweep Selector */}
                <AyahSweepSelector
                  startAyah={currentSection.startAyah}
                  endAyah={currentSection.endAyah}
                  fromAyah={ayahFrom}
                  toAyah={ayahTo}
                  onChange={(from, to) => {
                    setAyahFrom(from);
                    setAyahTo(to);
                  }}
                  surahName={surahSections.length > 1 ? currentSection.surahNameEn : undefined}
                  language={language}
                />
              </div>

              {/* 2. PILIHAN JENIS MASALAH (3 KATEGORI UTAMA) */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 block">
                  {language === 'en' ? 'Issue Category' : 'Jenis Masalah (Klik Langsung):'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIssueType('kelancaran');
                      setSelectedDetail(KELANCARAN_PRESETS[0].label);
                    }}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all text-center cursor-pointer ${
                      issueType === 'kelancaran'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                        : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    Kelancaran / Lupa
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIssueType('tajwid');
                      setSelectedDetail(TAJWID_CATEGORIES[0].options[0]);
                    }}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all text-center cursor-pointer ${
                      issueType === 'tajwid'
                        ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                        : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    Hukum Tajwid
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIssueType('makharijul');
                      setSelectedLetter(HIJAIYAH_LETTERS[14]); // Default Dhad
                      setSelectedModifier(MAKHRAJ_MODIFIERS[0]);
                    }}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all text-center cursor-pointer ${
                      issueType === 'makharijul'
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                        : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    Makharijul Huruf
                  </button>
                </div>
              </div>

              {/* 3. DETAIL MASALAH TANPA MENGETIK (ZERO-TYPING UX) */}

              {/* CASE A: KELANCARAN & LUPA HAFALAN */}
              {issueType === 'kelancaran' && (
                <div className="p-3 rounded-2xl border border-amber-200/70 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 space-y-2 animate-in fade-in">
                  <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider block">
                    Pilih Gejala Kelancaran:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {KELANCARAN_PRESETS.map((preset) => {
                      const isSelected = selectedDetail === preset.label;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setSelectedDetail(preset.label)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-center ${
                            isSelected
                              ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                              : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-amber-200/60 dark:border-amber-900/40 hover:bg-amber-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span className="text-xs font-bold leading-tight">{preset.label}</span>
                          <span className={`text-[10px] mt-0.5 leading-tight ${isSelected ? 'text-amber-100' : 'text-slate-400'}`}>
                            {preset.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CASE B: TAJWID (KLIK LANGSUNG KATEGORI DAN MASALAHNYA) */}
              {issueType === 'tajwid' && (
                <div className="p-3 rounded-2xl border border-blue-200/70 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider">
                      Pilih Bagian Tajwid:
                    </span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                      Klik salah satu di bawah
                    </span>
                  </div>

                  {/* Sub-Category Pills */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                    {TAJWID_CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedTajwidCat(cat.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                          selectedTajwidCat === cat.id
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-blue-200/60 dark:border-slate-700 hover:bg-blue-50'
                        }`}
                      >
                        {cat.title.split(' ')[0]}
                      </button>
                    ))}
                  </div>

                  {/* Active Tajwid Options Grid */}
                  <div className="space-y-1.5 pt-1">
                    {TAJWID_CATEGORIES.find(c => c.id === selectedTajwidCat)?.options.map(opt => {
                      const isSelected = selectedDetail === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setSelectedDetail(opt)}
                          className={`w-full text-left p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-blue-200/50 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span>{opt}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0 ml-2" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CASE C: MAKHARIJUL HURUF (KLIK HURUF DARI ALIF SAMPAI YA) */}
              {issueType === 'makharijul' && (
                <div className="p-3 rounded-2xl border border-indigo-200/70 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">
                      Klik Huruf Hijaiyah:
                    </span>
                    {selectedLetter && (
                      <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
                        Terpilih: {selectedLetter.ar} ({selectedLetter.latin})
                      </span>
                    )}
                  </div>

                  {/* 28 Hijaiyah Grid (Touch Friendly) */}
                  <div className="grid grid-cols-7 gap-1.5 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
                    {HIJAIYAH_LETTERS.map(letter => {
                      const isSelected = selectedLetter?.latin === letter.latin;
                      return (
                        <button
                          key={letter.latin}
                          type="button"
                          onClick={() => setSelectedLetter(letter)}
                          className={`flex flex-col items-center justify-center p-1 rounded-xl transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-700 shadow-md scale-105'
                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/70 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-700'
                          }`}
                          title={`Huruf ${letter.latin}`}
                        >
                          <span className="text-lg sm:text-xl font-bold font-serif leading-none mt-0.5">{letter.ar}</span>
                          <span className={`text-[8px] sm:text-[9px] font-bold truncate max-w-[40px] mt-0.5 ${isSelected ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                            {letter.latin}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Quick Modifier Chips */}
                  <div className="pt-1">
                    <span className="text-[10px] font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-tight block mb-1">
                      Keterangan Masalah Huruf (Klik salah satu):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {MAKHRAJ_MODIFIERS.map(mod => {
                        const isSelected = selectedModifier === mod;
                        return (
                          <button
                            key={mod}
                            type="button"
                            onClick={() => setSelectedModifier(mod)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-indigo-200/60 dark:border-slate-700 hover:bg-indigo-50'
                            }`}
                          >
                            {mod}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 4. CATATAN CEPAT (1-KLIK) & OPSIONAL MANUAL */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Catatan Tambahan (Klik Cepat):
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCustomNoteInput(!showCustomNoteInput)}
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                  >
                    {showCustomNoteInput ? 'Sembunyikan Ketik Manual' : '+ Tulis Catatan Khusus'}
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {QUICK_NOTES.map(tag => {
                    const isSelected = issueNote.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setIssueNote(prev => prev.replace(tag, '').replace(/,\s*,/g, ',').trim());
                          } else {
                            setIssueNote(prev => prev ? `${prev}, ${tag}` : tag);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-slate-800 text-white border-slate-900 dark:bg-slate-200 dark:text-slate-900'
                            : 'bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>

                {showCustomNoteInput && (
                  <textarea 
                    value={issueNote}
                    onChange={e => setIssueNote(e.target.value)}
                    placeholder="Opsional: catatan tambahan penguji..."
                    className="w-full h-16 text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none mt-2"
                  />
                )}
              </div>

            </div>
          )}

          {/* TAB 3: RIWAYAT EVALUASI SELESAI */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {resolvedIssues.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">{language === 'en' ? 'No resolved issues recorded yet.' : 'Belum ada riwayat masalah yang diselesaikan.'}</p>
                </div>
              ) : (
                resolvedIssues.map(issue => (
                  <div key={issue.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{getIssueLabel(issue.type)} • Ayat {issue.ayah}</span>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        <Check className="w-3 h-3" />
                        Selesai
                      </span>
                    </div>
                    {issue.detail && <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">{issue.detail}</div>}
                    {issue.note && <div className="text-xs text-slate-500 italic mt-0.5">"{issue.note}"</div>}
                    <div className="text-[9px] text-slate-400 mt-1.5 border-t border-slate-200 dark:border-slate-700 pt-1">
                      Terselesaikan: {issue.resolvedAt ? new Date(issue.resolvedAt).toLocaleDateString() : 'Tercatat'}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {activeTab === 'add' ? (language === 'en' ? 'Cancel' : 'Batal') : (language === 'en' ? 'Close' : 'Tutup')}
          </button>
          
          {activeTab === 'add' && (
            <button
              type="button"
              onClick={handleAddIssue}
              className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-md shadow-indigo-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{language === 'en' ? 'Save Issue' : 'Simpan Masalah'}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
