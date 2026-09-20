import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { ClassStudent, ClassGroup } from '../../types';
import { StudentQuranView } from './StudentQuranView';
import { StudentBookView } from './StudentBookView';
import { StudentBookProgressView } from './StudentBookProgressView';
import { StudentProgressReportModal } from './StudentProgressReportModal';
import { JuzRangeSelector } from './JuzRangeSelector';
import { PersonalSpace } from '../personal/PersonalSpace';
import { isDue } from '../../lib/fsrs';
import {
  BookOpen,
  Users,
  Clock,
  Plus,
  Copy,
  Check,
  ArrowLeft,
  BookMarked,
  Search,
  Trash2,
  Upload,
  X,
  Sparkles,
  Loader2,
  AlertCircle,
  MessageCircle,
  CheckCircle2,
  ChevronRight,
  Share2,
  Edit3,
  Award,
  List,
  UserMinus,
  ShieldCheck,
  LogOut,
  Archive,
  RotateCcw,
  Lock
} from 'lucide-react';

// Preset cover images as aesthetic alternatives
const COVER_PRESETS = {
  quran: [
    {
      id: 'q1',
      title: 'Mushaf Klasik',
      url: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'q2',
      title: 'Mushaf Madinah',
      url: 'https://images.unsplash.com/photo-1585036156171-384164a8c675?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'q3',
      title: 'Halaqah Masjid',
      url: 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=600&auto=format&fit=crop&q=80',
    },
  ],
  nonQuran: [
    {
      id: 'b1',
      title: 'Kitab Kuning',
      url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'b2',
      title: 'Kaidah Nahwu',
      url: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'b3',
      title: 'Manuskrip',
      url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&auto=format&fit=crop&q=80',
    },
  ],
};

const generateRandomCode = (type: 'quran' | 'non-quran') => {
  const prefix = type === 'quran' ? 'QRN' : 'CLS';
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${num}`;
};

// Canvas-based image compression: scales down to max 640px and converts to 82% JPEG
const compressAndResizeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Format file bukan gambar yang valid.'));
      img.onload = () => {
        try {
          const maxDim = 640;
          let { width, height } = img;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(reader.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.82);
          resolve(compressed);
        } catch {
          resolve(reader.result as string);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export const TeachingSpace: React.FC = () => {
  const { 
    teachingClasses, 
    createTeachingClass, 
    deleteTeachingClass, 
    closeTeachingClass,
    reopenTeachingClass,
    updateTeachingClass,
    removeStudentFromClass,
    books, 
    items,
    language,
    setActiveSpace,
    setEditingClassBookId,
    quranSpaceCode,
    quranStats,
    quranPages,
    isFeatureAllowed,
    openUpgradeModal,
    tierConfig,
    userProfile,
    getLiveStudentQuranData,
    getLiveStudentBookItems
  } = useApp();

  // Active Category: 'quran' | 'non-quran'
  const [activeCategory, setActiveCategory] = useState<'quran' | 'non-quran'>('quran');
  
  // Tab for book selector: 'personal' (Karya Pribadi) vs 'imported' (Kitab Impor)
  const [bookPickerTab, setBookPickerTab] = useState<'personal' | 'imported'>('personal');
  
  // Search state
  


  const [searchQuery, setSearchQuery] = useState('');

  // Drill-down navigation state
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  // (Student listener is now automatically managed in AppContext globally)
  const [isManagingBook, setIsManagingBook] = useState(false);
  const [classToEditId, setClassToEditId] = useState<string | null>(null);
  const [inspectingStudentId, setInspectingStudentId] = useState<string | null>(null);
  
  // Student list quick-filter and search in Level 2
  const [studentFilter, setStudentFilter] = useState<'all' | 'due' | 'fluent' | 'ready_advance'>('all');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // Student progress report modal
  const [reportStudent, setReportStudent] = useState<ClassStudent | null>(null);

  // Modal & UI states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createdClassSuccess, setCreatedClassSuccess] = useState<ClassGroup | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // In-app confirmation states
  const [studentToRemove, setStudentToRemove] = useState<{ id: string; name: string } | null>(null);
  const [classToDelete, setClassToDelete] = useState<{ id: string; name: string } | null>(null);
  const [classToClose, setClassToClose] = useState<{ id: string; name: string } | null>(null);

  // Image upload state
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit Class Modal State
  const [isEditClassOpen, setIsEditClassOpen] = useState(false);

  // Form state for creating / editing class
  const [formState, setFormState] = useState<{
    type: 'quran' | 'non-quran';
    name: string;
    description: string;
    coverUrl: string;
    targetJuz: string;
    assignedBookId: string;
  }>({
    type: 'quran',
    name: '',
    description: '',
    coverUrl: '',
    targetJuz: '1-5',
    assignedBookId: books[0]?.id || '',
  });

  // Filter classes by category & search query
  const quranClasses = teachingClasses.filter(c => c.type === 'quran');
  const nonQuranClasses = teachingClasses.filter(c => c.type === 'non-quran');

  // Swipe gesture: direct horizontal navigation
  useSwipeGesture(null, {
    disabled: isCreateOpen || isEditClassOpen || Boolean(studentToRemove) || Boolean(classToDelete) || Boolean(createdClassSuccess),
    onSwipeRight: () => {
      if (inspectingStudentId) {
        setInspectingStudentId(null);
      } else if (selectedClassId) {
        setSelectedClassId(null); setIsManagingBook(false);
      } else if (activeCategory === 'non-quran') {
        setActiveCategory('quran');
      } else if (activeCategory === 'quran') {
        setActiveSpace('teaching');
      }
    },
    onSwipeLeft: () => {
      if (inspectingStudentId) {
        // Next student
        const currentStudents = selectedClass?.students || [];
        const sIdx = currentStudents.findIndex(s => s.id === inspectingStudentId);
        if (sIdx >= 0 && sIdx < currentStudents.length - 1) {
          setInspectingStudentId(currentStudents[sIdx + 1].id);
        }
      } else if (selectedClassId) {
        // Next class in list
        const currentList = activeCategory === 'quran' ? quranClasses : nonQuranClasses;
        const cIdx = currentList.findIndex(c => c.id === selectedClassId);
        if (cIdx >= 0 && cIdx < currentList.length - 1) {
          setSelectedClassId(currentList[cIdx + 1].id);
        }
      } else if (activeCategory === 'quran') {
        setActiveCategory('non-quran');
      }
    },
    threshold: 40,
    minRatio: 1.15,
  });
  
  const currentCategoryClasses = (activeCategory === 'quran' ? quranClasses : nonQuranClasses)
    .filter(c => 
      (c.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (c.code || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (c.description ? c.description.toLowerCase().includes((searchQuery || '').toLowerCase()) : false)
    );

  const selectedClass = teachingClasses.find(c => c.id === selectedClassId) || null;
  const inspectingStudent = selectedClass?.students.find(s => s.id === inspectingStudentId) || null;

  // High-level aggregate metrics for the 2-in-1 Stats Banner
  const quranClassesCount = quranClasses.length;
  const quranStudentsCount = quranClasses.reduce((acc, c) => acc + c.students.length, 0);

  const nonQuranClassesCount = nonQuranClasses.length;
  const nonQuranStudentsCount = nonQuranClasses.reduce((acc, c) => acc + c.students.length, 0);

  const handleCopyCode = (code: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2200);
  };

  const handleShareWhatsApp = (code: string, className: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const text = `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\nUndangan bergabung ke kelas *${className}*:\n🔑 *Kode Kelas:* ${code}\n\nSilakan masukkan kode di atas pada aplikasi untuk bergabung ke halaqah bimbingan. Terima kasih!`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleOpenCreateModal = (typeToCreate?: 'quran' | 'non-quran') => {
    const check = isFeatureAllowed('create_class');
    if (!check.allowed) {
      openUpgradeModal(
        check.reason,
        language === 'en'
          ? `Free tier allows up to ${check.limit} active class. Upgrade to Unlupa Pro / Institutional to manage unlimited classes & students.`
          : `Batas akun Free adalah maksimal ${check.limit} kelas aktif. Upgrade ke Unlupa Pro / Edu untuk membuat kelas & membina santri tanpa batas.`
      );
      return;
    }

    const t = typeToCreate || activeCategory;
    setUploadError(null);
    setIsUploadingImage(false);
    // Prefer personal (editable) book as initial default
    const initialBook = books.find(b => !b.isReadonly) || books[0];
    setFormState({
      type: t,
      name: '',
      description: '',
      coverUrl: '',
      targetJuz: '1-5',
      assignedBookId: initialBook?.id || '',
    });
    setBookPickerTab(initialBook?.isReadonly ? 'imported' : 'personal');
    setIsCreateOpen(true);
  };

  // Process file upload safely from device storage
  const processUploadedFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Harap pilih file gambar (JPG, PNG, atau WebP).');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setUploadError('Ukuran file gambar maksimal 20MB.');
      return;
    }

    try {
      setIsUploadingImage(true);
      setUploadError(null);
      const compressedDataUrl = await compressAndResizeImage(file);
      setFormState(prev => ({ ...prev, coverUrl: compressedDataUrl }));
    } catch (err: any) {
      setUploadError(err.message || 'Gagal memproses gambar. Coba gunakan foto lain.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const handleDropImage = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const handleOpenEditClass = (cls: ClassGroup, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setClassToEditId(cls.id);
    setFormState({
      type: cls.type,
      name: cls.name,
      description: cls.description || '',
      coverUrl: cls.coverUrl || '',
      targetJuz: cls.requiredJuzList && cls.requiredJuzList.length > 0
        ? (cls.requiredJuzList.length === 30
            ? 'all'
            : cls.requiredJuzList.length === 1
            ? String(cls.requiredJuzList[0])
            : `${Math.min(...cls.requiredJuzList)}-${Math.max(...cls.requiredJuzList)}`)
        : '1-5',
      assignedBookId: cls.assignedBookIds?.[0] || books[0]?.id || ''
    });
    const currentBook = books.find(b => b.id === (cls.assignedBookIds?.[0] || books[0]?.id));
    setBookPickerTab(currentBook?.isReadonly ? 'imported' : 'personal');
    setIsEditClassOpen(true);
  };

  const parseTargetJuzToNumbers = (val: string): number[] => {
    if (!val || val === 'all' || val === '1-30') {
      return Array.from({ length: 30 }, (_, i) => i + 1);
    }
    if (val.includes('-')) {
      const parts = val.split('-').map(Number);
      const min = Math.max(1, Math.min(parts[0] || 1, parts[1] || 1));
      const max = Math.min(30, Math.max(parts[0] || 1, parts[1] || 1));
      const list: number[] = [];
      for (let i = min; i <= max; i++) {
        list.push(i);
      }
      return list;
    }
    const num = Number(val);
    if (!isNaN(num) && num >= 1 && num <= 30) {
      return [num];
    }
    return [1, 2, 3, 4, 5];
  };

  const handleEditClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = classToEditId || selectedClassId;
    if (!targetId || !formState.name.trim()) return;
    
    updateTeachingClass(targetId, {
      name: formState.name.trim(),
      description: formState.description.trim(),
      coverUrl: formState.coverUrl,
      requiredJuzList: formState.type === 'quran' 
        ? parseTargetJuzToNumbers(formState.targetJuz)
        : undefined,
      assignedBookIds: formState.type === 'non-quran' && formState.assignedBookId ? [formState.assignedBookId] : undefined
    });
    setIsEditClassOpen(false);
    setClassToEditId(null);
  };

  const handleDeleteStudent = (studentId: string, studentName: string) => {
    setStudentToRemove({ id: studentId, name: studentName });
  };

  const handleConfirmRemoveStudent = () => {
    if (!selectedClass || !studentToRemove) return;
    removeStudentFromClass(selectedClass.id, studentToRemove.id);
    setStudentToRemove(null);
  };

  const handleConfirmCloseClass = () => {
    if (!classToClose) return;
    closeTeachingClass(classToClose.id);
    setClassToClose(null);
  };

  const handleConfirmDeleteClass = () => {
    if (!classToDelete) return;
    deleteTeachingClass(classToDelete.id);
    setClassToDelete(null);
    setSelectedClassId(null); setIsManagingBook(false);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim()) return;

    const autoCode = generateRandomCode(formState.type);

    let finalCover = formState.coverUrl;
    if (!finalCover) {
      const presets = formState.type === 'quran' ? COVER_PRESETS.quran : COVER_PRESETS.nonQuran;
      finalCover = presets[Math.floor(Math.random() * presets.length)].url;
    }

    const requiredJuzList = formState.type === 'quran' ? parseTargetJuzToNumbers(formState.targetJuz) : undefined;

    const created = createTeachingClass({
      name: formState.name.trim(),
      type: formState.type,
      code: autoCode,
      description: formState.description.trim(),
      coverUrl: finalCover,
      requiredJuzList,
      assignedBookIds: formState.type === 'non-quran' ? [formState.assignedBookId].filter(Boolean) : undefined,
    });

    setIsCreateOpen(false);
    setActiveCategory(created.type);
    setCreatedClassSuccess(created);
  };

  const getItemTargetInfo = (cls: ClassGroup) => {
    if (cls.type === 'quran') {
      const juz = cls.requiredJuzList;
      if (!juz || juz.length === 0 || juz.length === 30) {
        return '30 Juz (604 Halaman)';
      }
      if (juz.length === 1) {
        return `Juz ${juz[0]} (${juz[0] === 30 ? '23' : '20'} Halaman)`;
      }
      const min = Math.min(...juz);
      const max = Math.max(...juz);
      const pages = max === 30 ? (juz.length - 1) * 20 + 23 : juz.length * 20;
      return `Juz ${min} - ${max} (~${pages} Halaman)`;
    } else {
      const assignedId = cls.assignedBookIds?.[0];
      const book = books.find(b => b.id === assignedId);
      if (!book) return 'Belum ada kitab';
      const bookItems = items.filter(i => i.bookId === book.id);
      const count = bookItems.length;
      return `${book.title} (${count} Materi)`;
    }
  };

  const getStudentDueInfo = (student: ClassStudent, cls: ClassGroup) => {
    const isQuran = cls.type === 'quran';

    if (isQuran) {
      const isCurrentUser = student.quranSpaceCode === quranSpaceCode;

      // 1. If current user, use live quranStats
      if (isCurrentUser) {
        const liveDuePages = (quranStats?.dueList || []).map(p => p.pageNumber).sort((a, b) => a - b);
        const count = liveDuePages.length;
        if (count > 0) {
          const specific = liveDuePages.length <= 4 
            ? `Hal. ${liveDuePages.join(', ')}` 
            : `Hal. ${liveDuePages.slice(0, 3).join(', ')} (+${liveDuePages.length - 3} hal lagi)`;
          return { count, specific, isDue: true };
        }
        return { count: 0, specific: null, isDue: false };
      }

      // 2. If student has stored quranData
      if (student.quranData && student.quranData.length > 0) {
        const duePages = student.quranData.filter(p => p.isActive && isDue(p.fsrsData?.nextReview, p.isActive));
        const count = duePages.length;
        if (count > 0) {
          const pageNums = duePages.map(p => p.pageNumber).sort((a, b) => a - b);
          const specific = pageNums.length <= 4 
            ? `Hal. ${pageNums.join(', ')}` 
            : `Hal. ${pageNums.slice(0, 3).join(', ')} (+${pageNums.length - 3} hal lagi)`;
          return { count, specific, isDue: true };
        }
        if (student.quranData.some(p => p.isActive)) {
          return { count: 0, specific: null, isDue: false };
        }
      }

      // 3. If frequent struggles specified
      if (student.frequentStruggles && student.frequentStruggles.length > 0) {
        return { 
          count: student.dueTodayCount || student.frequentStruggles.length, 
          specific: student.frequentStruggles.join(', '), 
          isDue: true 
        };
      }

      // 4. If dueTodayCount > 0
      if ((student.dueTodayCount || 0) > 0) {
        const samplePages = [3, 7, 14, 18, 22].slice(0, student.dueTodayCount);
        return { 
          count: student.dueTodayCount, 
          specific: `Hal. ${samplePages.join(', ')}`, 
          isDue: true 
        };
      }

      return { count: 0, specific: null, isDue: false };
    } else {
      // Non-Quran (Kitab / Materi)
      const assignedId = cls.assignedBookIds?.[0];
      const assignedClassBookId = assignedId ? `class-book-${cls.id}-${assignedId}` : undefined;
      const isCurrentUser = student.email === userProfile.email || student.id === `std-user-${userProfile.id}`;
      
      // We only care about items assigned to this specific class context.
      if (isCurrentUser && assignedClassBookId) {
        const classItems = items.filter(i => i.bookId === assignedClassBookId);
        const dueItems = classItems.filter(i => i.isActive && isDue(i.fsrsData?.nextReview, i.isActive));
        const count = dueItems.length;
        if (count > 0) {
          const titles = dueItems.map(i => i.question);
          const specific = titles.length <= 2 
            ? titles.join(', ') 
            : `${titles.slice(0, 2).join(', ')} (+${titles.length - 2} lagi)`;
          return { count, specific, isDue: true };
        }
        return { count: 0, specific: null, isDue: false };
      }

      if (student.bookItemsData && student.bookItemsData.length > 0) {
        let studentItems = student.bookItemsData;
        if (assignedClassBookId) {
            const exactClassItems = student.bookItemsData.filter(i => i.bookId === assignedClassBookId);
            if (exactClassItems.length > 0) {
                studentItems = exactClassItems;
            } else if (assignedId) {
                // Fallback for mock/sample data that uses master bookId
                studentItems = student.bookItemsData.filter(i => i.bookId === assignedId);
            }
        }

        const dueItems = studentItems.filter(it => it.isActive && isDue(it.fsrsData?.nextReview, it.isActive));
        const count = dueItems.length;
        if (count > 0) {
          const titles = dueItems.map(i => i.question);
          const specific = titles.length <= 2 
            ? titles.join(', ') 
            : `${titles.slice(0, 2).join(', ')} (+${titles.length - 2} lagi)`;
          return { count, specific, isDue: true };
        }
        if (studentItems.some(it => it.isActive)) {
          return { count: 0, specific: null, isDue: false };
        }
      }

      if (student.frequentStruggles && student.frequentStruggles.length > 0) {
        return { 
           count: student.dueTodayCount || student.frequentStruggles.length, 
           specific: student.frequentStruggles.join(', '), 
           isDue: true 
         };
      }

      if (assignedClassBookId) {
        const classItems = items.filter(i => i.bookId === assignedClassBookId);
        if (classItems.length > 0 && (student.dueTodayCount || 0) > 0) {
          const count = Math.min(student.dueTodayCount, 2);
          const titles = classItems.slice(0, count).map(i => i.question);
          const extra = student.dueTodayCount > count ? ` (+${student.dueTodayCount - count} lagi)` : '';
          return { 
             count: student.dueTodayCount, 
             specific: `${titles.join(', ')}${extra}`, 
             isDue: true 
           };
        }
      }

      // Final fallback for pure sample data
      if ((student.dueTodayCount || 0) > 0) {
        return { 
           count: student.dueTodayCount, 
           specific: `${student.dueTodayCount} materi`, 
           isDue: true 
         };
      }

      return { count: 0, specific: null, isDue: false };
    }  };

  const getStudentMasteryInfo = (student: ClassStudent, cls: ClassGroup) => {
    const dueInfo = getStudentDueInfo(student, cls);
    const isQuran = cls.type === 'quran';
    let activeItems = 0;
    let masteredItems = 0;
    
    let totalReps = 0;
    let totalLapses = 0;

    if (isQuran) {
      const isCurrentUser = student.quranSpaceCode === quranSpaceCode;
      
      const dataset = student.quranData || (isCurrentUser && typeof quranPages !== 'undefined' ? quranPages : []);
      
      if (isCurrentUser) {
        activeItems = quranStats?.active || 0;
        masteredItems = quranStats?.mastered || 0;
      } else if (dataset.length > 0) {
        activeItems = dataset.filter(p => p.isActive).length;
        masteredItems = dataset.filter(p => p.isActive && ((p.fsrsData?.stability || 0) >= 30 || (p.fsrsData?.reps || 0) >= 4)).length;
      } else {
        activeItems = Math.round(((student.retentionRate || 85) / 100) * 30);
        masteredItems = Math.max(0, activeItems - dueInfo.count);
      }
      
      dataset.forEach(p => {
        if (p.isActive && p.fsrsData) {
          totalReps += (p.fsrsData.reps || 0);
          totalLapses += (p.fsrsData.lapses || 0);
        }
      });
      
    } else {
      const assignedId = cls.assignedBookIds?.[0];
      const assignedClassBookId = assignedId ? `class-book-${cls.id}-${assignedId}` : undefined;
      const isCurrentUser = student.email === userProfile.email || student.id === `std-user-${userProfile.id}`;
      const classItems = isCurrentUser 
        ? items.filter(i => i.bookId === assignedClassBookId || i.bookId === assignedId)
        : (student.bookItemsData && student.bookItemsData.length > 0 ? student.bookItemsData : items.filter(i => i.bookId === assignedClassBookId || i.bookId === assignedId));
      
      activeItems = classItems.filter(i => i.isActive).length;
      masteredItems = classItems.filter(i => i.isActive && (i.status === 'mastered' || (i.fsrsData?.stability || 0) >= 30)).length;
      
      classItems.forEach(i => {
        if (i.isActive && i.fsrsData) {
          totalReps += (i.fsrsData.reps || 0);
          totalLapses += (i.fsrsData.lapses || 0);
        }
      });
    }

    const isReadyToAdvance = dueInfo.count === 0 && activeItems > 0 && (masteredItems / Math.max(1, activeItems) >= 0.6 || masteredItems >= 3);
    const isHeavyLoad = dueInfo.count >= 10;
    
    let calcRetentionRate = student.retentionRate || 90;
    if (totalReps > 0) {
      calcRetentionRate = Math.max(0, Math.round(((totalReps - totalLapses) / totalReps) * 100));
    } else if (activeItems > 0) {
      calcRetentionRate = 100;
    }

    return {
      dueInfo,
      activeItems,
      masteredItems,
      isReadyToAdvance,
      isHeavyLoad,
      retentionRate: calcRetentionRate
    };
  };

  const renderBookPicker = () => {
    const personalBooks = books.filter(b => !b.isReadonly);
    const importedBooks = books.filter(b => b.isReadonly);
    const currentSelectedBook = books.find(b => b.id === formState.assignedBookId);

    return (
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            {language === 'en' ? 'Select Kitab for Class' : 'Pilih Kitab untuk Kelas'}
          </label>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {personalBooks.length} {language === 'en' ? 'Personal' : 'Karya Pribadi'} · {importedBooks.length} {language === 'en' ? 'Imported' : 'Impor'}
          </span>
        </div>

        {/* 2-Category Tabs: Karya Pribadi vs Kitab Impor */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setBookPickerTab('personal')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              bookPickerTab === 'personal'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>{language === 'en' ? 'Personal Works' : 'Karya Pribadi'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold">
              {personalBooks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setBookPickerTab('imported')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              bookPickerTab === 'imported'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>{language === 'en' ? 'Imported Works' : 'Kitab Impor'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-bold">
              {importedBooks.length}
            </span>
          </button>
        </div>

        {/* Category Description Banner */}
        <div className="text-[11px] text-slate-500 dark:text-slate-400">
          {bookPickerTab === 'personal' ? (
            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              {language === 'en'
                ? 'Personal works: fully editable, can add cards, and organize materials freely.'
                : 'Karya pribadi: dapat diedit, ditambah kartu materi/hafalan, dan dikelola penuh untuk santri.'}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 font-medium">
              <BookOpen className="w-3.5 h-3.5 shrink-0 text-amber-500" />
              {language === 'en'
                ? 'Imported works: classified with edit/read-only permission status.'
                : 'Kitab impor: terklasifikasi jelas mana yang bisa diedit dan mana yang hanya dibaca.'}
            </span>
          )}
        </div>

        {/* List of books in the active tab */}
        <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
          {(bookPickerTab === 'personal' ? personalBooks : importedBooks).length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
              {bookPickerTab === 'personal'
                ? (language === 'en' ? 'No personal books yet. Create one in Personal Space.' : 'Belum ada karya pribadi. Buat kitab baru di Ruang Pribadi.')
                : (language === 'en' ? 'No imported books yet. Import from Library in Personal Space.' : 'Belum ada kitab impor. Impor kitab dari Pustaka di Ruang Pribadi.')}
            </div>
          ) : (
            (bookPickerTab === 'personal' ? personalBooks : importedBooks).map(b => {
              const isSelected = formState.assignedBookId === b.id;
              const bItemsCount = items.filter(i => i.bookId === b.id).length;
              const isReadonly = b.isReadonly;

              return (
                <div
                  key={b.id}
                  onClick={() => setFormState(prev => ({ ...prev, assignedBookId: b.id }))}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 ring-1 ring-indigo-600 shadow-2xs'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-12 rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/60 dark:border-slate-700 shadow-2xs">
                      {b.coverUrl ? (
                        <img src={b.coverUrl} alt={b.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-indigo-900 flex items-center justify-center text-amber-200 text-[10px] font-serif font-bold">
                          {b.title.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {b.title}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                        <span>{b.authorName || (language === 'en' ? 'Personal' : 'Pribadi')}</span>
                        <span>·</span>
                        <span>{bItemsCount} {language === 'en' ? 'cards' : 'kartu'}</span>
                      </div>

                      {/* Status Classification Badge */}
                      <div className="mt-1 flex items-center gap-1.5">
                        {bookPickerTab === 'personal' ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            {language === 'en' ? 'Fully Editable' : 'Bisa Diedit & Dikelola'}
                          </span>
                        ) : (
                          isReadonly ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                              <BookOpen className="w-2.5 h-2.5" />
                              {language === 'en' ? 'Read-Only (Cannot add cards)' : 'Hanya Dibaca (Tidak bisa tambah kartu)'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              {language === 'en' ? 'Editable & Readable' : 'Bisa Diedit & Dibaca'}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 pr-1">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Kitab Notice & Action */}
        {currentSelectedBook && (
          <div className="pt-1">
            {currentSelectedBook.isReadonly ? (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                  <span>{language === 'en' ? 'Authentic Curated Kitab (Read-Only)' : 'Kitab Otentik Pustaka (Hanya Baca)'}</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                  {language === 'en'
                    ? 'This book was imported as authentic read-only. You and students can study and review all cards, but cannot add new cards or modify the author’s original work.'
                    : 'Kitab ini berasal dari impor pustaka yang dilindungi untuk menjaga keotentikan ilmu penulis. Pengajar dan santri dapat mempelajari serta me-review seluruh kartu di dalamnya secara penuh.'}
                </p>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 text-[11px] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  {language === 'en'
                    ? `Selected: "${currentSelectedBook.title}" (Editable: you can freely add chapters & cards).`
                    : `Terpilih: "${currentSelectedBook.title}" (Bisa diedit: Anda leluasa menambah bab & kartu hafalan).`}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderSharedModals = () => (
    <>
      {/* --------------------------------------------------------------------- */}
      {/* MODAL: BUAT KELAS BARU */}
      {/* --------------------------------------------------------------------- */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <span>Buat Kelas Baru</span>
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Segmented Type Toggle */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Jenis Kelas
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => setFormState(prev => ({ ...prev, type: 'quran' }))}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      formState.type === 'quran'
                        ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <span>Al-Qur'an (Tahfidz)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormState(prev => ({ ...prev, type: 'non-quran' }))}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      formState.type === 'non-quran'
                        ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <BookMarked className="w-4 h-4 text-indigo-600" />
                    <span>Kitab & Materi</span>
                  </button>
                </div>
              </div>

              {/* Class Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Nama Kelas / Halaqah <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={formState.type === 'quran' ? 'Misal: Halaqah Tahfidz Al-Jazari' : 'Misal: Matan Al-Ajurrumiyyah'}
                  value={formState.name}
                  onChange={e => setFormState(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Quran Specific: Target Juz */}
              {formState.type === 'quran' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Target Hafalan Juz
                  </label>
                  <JuzRangeSelector
                    value={formState.targetJuz}
                    onChange={val => setFormState(prev => ({ ...prev, targetJuz: val }))}
                  />
                </div>
              ) : (
                renderBookPicker()
              )}

              {/* Cover Image */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Gambar Sampul Kelas (Opsional)
                </label>

                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDropImage}
                  className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors bg-slate-50/50 dark:bg-slate-950/40 p-3.5"
                >
                  <input
                    id="class-cover-input"
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="sr-only"
                  />

                  {isUploadingImage ? (
                    <div className="flex flex-col items-center justify-center py-4 space-y-2 text-indigo-600">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        Memproses gambar...
                      </span>
                    </div>
                  ) : formState.coverUrl ? (
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 relative bg-black/10">
                        <img
                          src={formState.coverUrl}
                          alt="Cover Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                          Gambar Sampul Terpasang
                        </span>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5 font-medium">
                          <Check className="w-3.5 h-3.5" /> Siap digunakan
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <label
                          htmlFor="class-cover-input"
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                        >
                          Ganti
                        </label>
                        <button
                          type="button"
                          onClick={() => setFormState(prev => ({ ...prev, coverUrl: '' }))}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Hapus gambar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label
                      htmlFor="class-cover-input"
                      className="flex flex-col items-center justify-center py-3 cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                        Pilih foto dari penyimpanan perangkat
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        Mendukung JPG, PNG, WebP
                      </span>
                    </label>
                  )}

                  {uploadError && (
                    <div className="mt-2 text-[11px] text-rose-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{uploadError}</span>
                    </div>
                  )}
                </div>

                {/* Preset Options as alternative */}
                <div className="mt-2.5">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Atau gunakan pilihan sampul estetik:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(formState.type === 'quran' ? COVER_PRESETS.quran : COVER_PRESETS.nonQuran).map(preset => (
                      <div
                        key={preset.id}
                        onClick={() => setFormState(prev => ({ ...prev, coverUrl: preset.url }))}
                        className={`relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                          formState.coverUrl === preset.url
                            ? 'border-indigo-600 ring-2 ring-indigo-500/30'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={preset.url} alt={preset.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 text-[9px] text-white text-center truncate">
                          {preset.title}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Deskripsi / Jadwal (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Misal: Pertemuan Ahad ba'da Subuh dan setoran rutin..."
                  value={formState.description}
                  onChange={e => setFormState(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Terbitkan Kelas</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: SUKSES TERBIT KELAS & KODE AKSES */}
      {/* --------------------------------------------------------------------- */}
      {createdClassSuccess && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-200 dark:border-emerald-800 p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
              <Sparkles className="w-6 h-6" />
            </div>

            <div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                {createdClassSuccess.type === 'quran' ? "Kelas Al-Qur'an Terbit" : 'Kelas Kitab & Materi Terbit'}
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                Kelas Berhasil Diterbitkan!
              </h3>
            </div>

            {/* Code Box */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                KODE AKSES KELAS
              </span>
              <div className="font-mono text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
                {createdClassSuccess.code}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-200/80 dark:border-slate-800 text-left">
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Berikan kode ini kepada santri untuk bergabung ke kelas ini melalui akun mereka.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={() => handleCopyCode(createdClassSuccess.code)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedCode === createdClassSuccess.code ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Kode Berhasil Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Salin Kode Kelas ({createdClassSuccess.code})</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleShareWhatsApp(createdClassSuccess.code, createdClassSuccess.name)}
                className="w-full py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Bagikan Kode ke WhatsApp</span>
              </button>

              <button
                onClick={() => {
                  const targetId = createdClassSuccess.id;
                  setCreatedClassSuccess(null);
                  setSelectedClassId(targetId);
                }}
                className="w-full py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Buka Halaman Kelas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: EDIT KELAS */}
      {/* --------------------------------------------------------------------- */}
      {isEditClassOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                <span>Edit Info Kelas</span>
              </h3>
              <button
                onClick={() => setIsEditClassOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditClassSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Nama Kelas / Halaqah <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formState.name}
                  onChange={e => setFormState(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {formState.type === 'quran' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Target Hafalan Juz
                  </label>
                  <JuzRangeSelector
                    value={formState.targetJuz}
                    onChange={val => setFormState(prev => ({ ...prev, targetJuz: val }))}
                  />
                </div>
              ) : (
                renderBookPicker()
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Deskripsi / Jadwal (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={formState.description}
                  onChange={e => setFormState(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditClassOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-colors cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: KONFIRMASI KELUARKAN SANTRI */}
      {/* --------------------------------------------------------------------- */}
      {studentToRemove && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Keluarkan Santri?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin mengeluarkan <strong>{studentToRemove.name}</strong> dari daftar santri kelas ini?
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStudentToRemove(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRemoveStudent}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer shadow-xs"
              >
                Keluarkan Santri
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: KONFIRMASI TUTUP KELAS */}
      {/* --------------------------------------------------------------------- */}
      {classToClose && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <Archive className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Tutup Kelas?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menutup kelas <strong>{classToClose.name}</strong>? Buku kelas ini otomatis terhapus dari kategori buku kelas di semua santri. Catatan pengawasan dan riwayat tetap tersimpan di ruang guru.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setClassToClose(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmCloseClass}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors cursor-pointer shadow-xs"
              >
                Tutup Kelas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: KONFIRMASI HAPUS KELAS */}
      {/* --------------------------------------------------------------------- */}
      {classToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Hapus Kelas?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus kelas <strong>{classToDelete.name}</strong>? Data pengawasan kelas ini akan dihapus.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setClassToDelete(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteClass}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer shadow-xs"
              >
                Hapus Kelas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: LAPORAN PERKEMBANGAN & EVALUASI SANTRI */}
      {/* --------------------------------------------------------------------- */}
      {reportStudent && (
        <StudentProgressReportModal
          isOpen={Boolean(reportStudent)}
          onClose={() => setReportStudent(null)}
          student={reportStudent}
          classGroup={selectedClass || teachingClasses.find(c => (c.students || []).some(s => s.id === reportStudent.id)) || teachingClasses[0]}
          language={language}
          currentUserQuranPages={quranPages}
          currentQuranSpaceCode={quranSpaceCode}
        />
      )}
    </>
  );

  // ---------------------------------------------------------------------------
  // LEVEL 3: INSPECTING STUDENT PROGRESS VIEW (PURE MUSHAF / BOOK WORKSPACE)
  // ---------------------------------------------------------------------------
  if (inspectingStudent && selectedClass) {
    if (selectedClass.type === 'quran') {
      return (
        <StudentQuranView
          student={inspectingStudent}
          classGroup={selectedClass}
          onClose={() => setInspectingStudentId(null)}
        />
      );
    } else {
      return (
        <StudentBookView
          student={inspectingStudent}
          classGroup={selectedClass}
          onClose={() => setInspectingStudentId(null)}
        />
      );
    }
  }

  // ---------------------------------------------------------------------------
  // LEVEL 2: CLASS DETAIL VIEW (EXACT TWIN OF SCREENSHOT 1: BOOK DETAIL)
  // ---------------------------------------------------------------------------
  if (selectedClass) {
    const isQuran = selectedClass.type === 'quran';
    const assignedBook = !isQuran && selectedClass.assignedBookIds?.[0] 
      ? books.find(b => b.id === selectedClass.assignedBookIds?.[0]) 
      : null;
    const assignedId = selectedClass.assignedBookIds?.[0];
    const assignedClassBookId = assignedId ? `class-book-${selectedClass.id}-${assignedId}` : undefined;

    const allStudents = (selectedClass.students || []).map(std => {
      // Avoid overwriting the current teacher's own items if they view themselves in their own class
      const isCurrentUser = std.id === userProfile.id;
      if (isCurrentUser) return std;

      if (isQuran) {
        const liveQuranData = getLiveStudentQuranData(std.id);
        if (liveQuranData.length > 0) {
          return { ...std, quranData: liveQuranData };
        }
      } else {
        const rawLiveItems = getLiveStudentBookItems(std.id);
        if (rawLiveItems.length > 0 && assignedId) {
          const liveItems = rawLiveItems.filter(i => i.bookId === assignedClassBookId || i.bookId === assignedId);
          return { ...std, bookItemsData: liveItems };
        }
      }
      return std;
    });

    const studentAnalysisMap = new Map<string, ReturnType<typeof getStudentMasteryInfo>>();
    allStudents.forEach(s => {
      studentAnalysisMap.set(s.id, getStudentMasteryInfo(s, selectedClass));
    });

    const dueStudents = allStudents.filter(s => studentAnalysisMap.get(s.id)?.dueInfo.isDue);
    const fluentStudents = allStudents.filter(s => !studentAnalysisMap.get(s.id)?.dueInfo.isDue);
    const readyStudents = allStudents.filter(s => studentAnalysisMap.get(s.id)?.isReadyToAdvance);

    let displayedStudents = allStudents;
    if (studentFilter === 'due') {
      displayedStudents = dueStudents;
    } else if (studentFilter === 'fluent') {
      displayedStudents = fluentStudents;
    } else if (studentFilter === 'ready_advance') {
      displayedStudents = readyStudents;
    }

    if (studentSearchQuery.trim()) {
      const q = studentSearchQuery.toLowerCase().trim();
      displayedStudents = displayedStudents.filter(s =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.quranSpaceCode ? s.quranSpaceCode.toLowerCase().includes(q) : false)
      );
    }

    const classRetentionPct = allStudents.length > 0 
      ? Math.round((fluentStudents.length / allStudents.length) * 100) 
      : 100;

    if (isManagingBook && assignedBook) {
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 h-[calc(100vh-64px)]">
          <PersonalSpace 
            initialBookId={assignedBook.id} 
            isEmbeddedTeacherView={true} 
            onExitEmbedded={() => setIsManagingBook(false)} 
          />
        </div>
      );
    }

    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-6 animate-in fade-in duration-200">
        {/* 1. Top Navigation Bar */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => {
              setSelectedClassId(null); setIsManagingBook(false);
              setStudentFilter('all');
              setStudentSearchQuery('');
            }}
            className="inline-flex items-center gap-1.5 px-3 h-8.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{language === 'en' ? 'Back' : 'Kembali'}</span>
          </button>

          {/* Action Icons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleOpenEditClass(selectedClass)}
              className="w-8.5 h-8.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer shadow-2xs active:scale-95"
              title="Edit Info Kelas"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleShareWhatsApp(selectedClass.code, selectedClass.name)}
              className="w-8.5 h-8.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center transition-colors cursor-pointer shadow-2xs active:scale-95"
              title="Bagikan ke WhatsApp"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {selectedClass.status === 'closed' ? (
              <button
                type="button"
                onClick={() => reopenTeachingClass?.(selectedClass.id)}
                className="w-8.5 h-8.5 rounded-xl border border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 flex items-center justify-center transition-colors cursor-pointer shadow-2xs active:scale-95"
                title="Buka Kembali Kelas"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setClassToClose({ id: selectedClass.id, name: selectedClass.name })}
                className="w-8.5 h-8.5 rounded-xl border border-amber-200 dark:border-amber-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 flex items-center justify-center transition-colors cursor-pointer shadow-2xs active:scale-95"
                title="Tutup Kelas (Selesaikan & Bersihkan Buku Santri)"
              >
                <Archive className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setClassToDelete({ id: selectedClass.id, name: selectedClass.name })}
              className="w-8.5 h-8.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer shadow-2xs active:scale-95"
              title="Hapus Kelas"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Master Presentation Hero Card (Identical structure to Screenshot 1) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col gap-4 sm:gap-6">
          <div className="flex flex-row gap-4 sm:gap-6 items-start">
            {/* 3D Realistic Book / Mushaf Cover Object */}
            <div className={`shrink-0 relative group ${assignedBook ? 'cursor-pointer' : ''}`} onClick={() => { if (assignedBook) { setIsManagingBook(true); } }}>
              <div className="w-24 sm:w-32 md:w-36 aspect-[1/1.45] rounded-r-xl rounded-l-xs overflow-hidden shadow-xl shadow-slate-900/25 dark:shadow-black/70 border-l-[6px] border-l-slate-900/50 relative flex flex-col justify-between transition-transform duration-200 group-hover:-translate-y-1">
                {/* Lighting reflection & spine ridge overlay */}
                <div className="absolute inset-y-0 left-0 w-3.5 bg-gradient-to-r from-black/35 via-white/25 to-transparent pointer-events-none z-20" />
                <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-l from-black/20 to-transparent pointer-events-none z-20" />
                <div className="absolute inset-0 bg-gradient-to-tr from-black/15 via-transparent to-white/10 pointer-events-none z-20" />

                {assignedBook?.coverUrl || selectedClass.coverUrl ? (
                  <img
                    src={(assignedBook?.coverUrl || selectedClass.coverUrl) as string}
                    alt={assignedBook?.title || selectedClass.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-950 p-2.5 flex flex-col justify-between text-amber-100 border border-emerald-700/60 select-none">
                    <div className="relative z-10 pt-1 text-center">
                      <span className="text-[8px] font-mono tracking-widest text-amber-300 uppercase">
                        {isQuran ? 'Mushaf Halaqah' : 'Kitab Bimbingan'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Class Meta Details */}
            <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
              <div>
                <div className="mb-1.5 flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700">
                    {isQuran ? "Halaqah Al-Qur'an" : 'Kelas Kitab'}
                  </span>
                  {selectedClass.status === 'closed' && (
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 px-2 py-0.5 rounded-md border border-amber-200/80 dark:border-amber-800/80 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>{language === 'en' ? 'Closed (Archived)' : 'Kelas Ditutup / Selesai'}</span>
                    </span>
                  )}
                  {assignedBook && (
                    <button
                      onClick={() => {
                        
                        setIsManagingBook(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/50 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-md transition-colors cursor-pointer border border-indigo-100 dark:border-indigo-800/60"
                    >
                      <BookOpen className="w-3 h-3" />
                      {language === 'en' ? 'Edit Book Content' : 'Edit Konten Buku'}
                    </button>
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 dark:text-white leading-tight">
                  {assignedBook?.title || selectedClass.name}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                  {assignedBook?.description || selectedClass.description || (isQuran ? 'Bimbingan hafalan Al-Qur\'an per halaman berbasis interval retensi adaptif.' : 'Bimbingan penguasaan materi kitab terarah.')}
                </p>
              </div>

              {/* Class Code Pill Box */}
              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <span className="text-xs text-slate-500 dark:text-slate-400">Kode Akses:</span>
                <span className="font-mono font-bold text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 px-2 py-0.5 rounded-md">
                  {selectedClass.code}
                </span>
                <button
                  onClick={() => handleCopyCode(selectedClass.code)}
                  className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                  title="Salin Kode Kelas"
                >
                  {copiedCode === selectedClass.code ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Embedded Progress Card */}
          <div className="flex items-center gap-4 p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
            {/* Left Side: Circular Progress */}
            <div className="relative w-16 h-16 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 drop-shadow-sm">
                <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-200 dark:text-slate-700" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray="263.89"
                  strokeDashoffset={allStudents.length === 0 ? 263.89 : 263.89 - (263.89 * (classRetentionPct / 100))}
                  strokeLinecap="round"
                  className={`${allStudents.length === 0 ? 'text-slate-300 dark:text-slate-600' : 'text-emerald-500'} transition-all duration-1000`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-none">
                  {allStudents.length === 0 ? '0%' : `${classRetentionPct}%`}
                </span>
                {allStudents.length > 0 && (
                  <span className="text-[8px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
                    Tuntas
                  </span>
                )}
              </div>
            </div>

            {/* Right Side: Progress Legend */}
            <div className="flex-1 space-y-2 min-w-0">
              {allStudents.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Belum ada santri terdaftar di kelas ini. Bagikan kode akses kelas kepada santri Anda.
                </p>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500 shrink-0" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">Santri Tuntas</span>
                    </div>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0 ml-2">
                      {fluentStudents.length} santri
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-sm bg-amber-500 shrink-0" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">Perlu Review</span>
                    </div>
                    <span className="font-bold text-amber-600 dark:text-amber-400 shrink-0 ml-2">
                      {dueStudents.length} santri
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 3. Section Below: Daftar Santri (Identical to Screenshot 1 "Daftar Isi Kitab") */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <List className="w-5 h-5 text-indigo-600" />
                <span>Daftar Santri ({allStudents.length})</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pilih santri untuk langsung masuk ke lembar hafalan dan kartu materi di dalamnya.
              </p>
            </div>
          </div>

          {/* Search bar & quick filter tabs matching Screenshot 1 & 4 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari santri..."
                value={studentSearchQuery}
                onChange={e => setStudentSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>

            {/* Segmented control tabs matching Screenshot 4 */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 shrink-0 flex-wrap sm:flex-nowrap">
              <button
                onClick={() => setStudentFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  studentFilter === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Semua {allStudents.length}
              </button>
              <button
                onClick={() => setStudentFilter('due')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  studentFilter === 'due'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs'
                    : 'text-slate-500 hover:text-amber-600'
                }`}
              >
                Belum Review {dueStudents.length}
              </button>
              <button
                onClick={() => setStudentFilter('fluent')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  studentFilter === 'fluent'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-500 hover:text-emerald-600'
                }`}
              >
                Tuntas {fluentStudents.length}
              </button>
              <button
                onClick={() => setStudentFilter('ready_advance')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  studentFilter === 'ready_advance'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-500 hover:text-indigo-600'
                }`}
                title="Santri dengan beban review tuntas dan ingatan mapan (siap tambah materi/halaman baru)"
              >
                Siap Tambah {readyStudents.length}
              </button>
            </div>
          </div>

          {/* Student Items List (Matching Screenshot 1 & 4 clean layout) */}
          <div className="space-y-2 pt-2">
            {displayedStudents.map((student) => {
              const analysis = studentAnalysisMap.get(student.id) || {
                dueInfo: { count: 0, specific: null, isDue: false },
                activeItems: 0,
                masteredItems: 0,
                isReadyToAdvance: false,
                isHeavyLoad: false,
                retentionRate: 100
              };
              const { dueInfo } = analysis;

              return (
                <div
                  key={student.id}
                  onClick={() => setInspectingStudentId(student.id)}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3.5 sm:p-4 hover:border-indigo-400 dark:hover:border-indigo-500/60 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {student.name}
                      </h4>
                      {analysis.isReadyToAdvance && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800">
                          <Sparkles className="w-3 h-3 text-indigo-500" />
                          <span>Siap Tambah</span>
                        </span>
                      )}
                      {analysis.isHeavyLoad && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800">
                          <span>Beban Tinggi</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 flex-wrap text-xs">
                      {dueInfo.isDue ? (
                        <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 min-w-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 animate-pulse" />
                          <span className="truncate">
                            Belum review: <strong className="font-semibold text-amber-800 dark:text-amber-300">{dueInfo.specific}</strong>
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                          <span>Tuntas review harian</span>
                        </div>
                      )}
                      <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                        {analysis.masteredItems} materi mapan ({analysis.retentionRate}% retensi)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {dueInfo.isDue ? (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/50 flex items-center gap-1 shadow-2xs">
                        <span>{dueInfo.count} Review</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/50">
                        Lancar
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setReportStudent(student);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:text-indigo-400 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer shrink-0"
                      title={`Laporan & Raport Evaluasi ${student.name}`}
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteStudent(student.id, student.name);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-950/50 transition-colors cursor-pointer shrink-0"
                      title={`Keluarkan ${student.name} dari daftar santri kelas`}
                    >
                      <LogOut className="w-4 h-4" />
                    </button>

                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              );
            })}

            {displayedStudents.length === 0 && (
              <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
                <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {allStudents.length === 0 ? 'Belum Ada Santri yang Bergabung' : 'Tidak Ada Santri yang Cocok'}
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {allStudents.length === 0
                    ? `Bagikan kode kelas ${selectedClass.code} kepada santri agar mereka dapat bergabung melalui akun mereka.`
                    : 'Coba sesuaikan kata kunci pencarian atau filter di atas.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Shared In-App Modals for Level 2 */}
        {renderSharedModals()}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // LEVEL 1: CLASS LIST VIEW (ULTRA-MINIMALIST: SHOW CLASS LIST AT THE TOP)
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-4 pb-20 md:pb-8">
      {/* 1. Header Bar: Title, Category Tabs, Search, and Create Class */}
      <div className="flex items-center justify-between w-full mb-2 gap-2 flex-wrap sm:flex-nowrap">
        {/* Left: Title & Total Classes Count Badge */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 whitespace-nowrap">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {language === 'en' ? 'Teaching Space' : 'Ruang Guru'}
          </h1>
          <span
            className="flex items-center justify-center px-2.5 h-8.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold border border-slate-200/60 dark:border-slate-700/60 shadow-2xs shrink-0"
            title={`${teachingClasses.length} ${language === 'en' ? 'Classes' : 'Kelas'}`}
          >
            {teachingClasses.length}
          </span>
        </div>

        {/* Right Controls: Category Switcher, Search & Create Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-nowrap">
          {/* Category Tabs Switcher */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800/90 rounded-xl border border-slate-200/60 dark:border-slate-800 shrink-0">
            <button
              onClick={() => setActiveCategory('quran')}
              className={`px-2.5 h-7.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeCategory === 'quran'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{language === 'en' ? "Quran" : "Al-Qur'an"}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                {quranClassesCount}
              </span>
            </button>

            <button
              onClick={() => setActiveCategory('non-quran')}
              className={`px-2.5 h-7.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeCategory === 'non-quran'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <BookMarked className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{language === 'en' ? "Kitab" : "Kitab"}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                {nonQuranClassesCount}
              </span>
            </button>
          </div>

          {/* Search Class */}
          <div className="relative shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder={language === 'en' ? 'Search...' : 'Cari kelas...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-20 sm:w-36 pl-7 pr-2.5 h-8.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all shadow-2xs"
            />
          </div>

          {/* Create Class Button */}
          <button
            onClick={() => handleOpenCreateModal(activeCategory)}
            className="h-8.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{language === 'en' ? 'Create' : 'Tambah'}</span>
          </button>
        </div>
      </div>

      {/* 2. Classes Grid (Top Priority Focus) */}
      {currentCategoryClasses.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 mt-2">
          <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1">
            {language === 'en' ? 'No Classes Found' : 'Belum Ada Kelas'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-sm mx-auto">
            {activeCategory === 'quran'
              ? 'Buat halaqah Al-Qur\'an untuk membagikan kode kelas dan memantau setoran santri.'
              : 'Buat kelas kitab/materi untuk memantau pemahaman dan penguasaan kartu santri.'}
          </p>
          <button
            onClick={() => handleOpenCreateModal(activeCategory)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{language === 'en' ? 'Create New Class' : 'Buat Kelas Sekarang'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3 mt-2">
          {currentCategoryClasses.map(cls => {
            const isQuran = cls.type === 'quran';
            const studentCount = cls.students.length;
            const dueInClass = cls.students.filter(s => getStudentDueInfo(s, cls).isDue).length;

            // For non-quran: calculate total items in the assigned book
            const assignedId = cls.assignedBookIds?.[0];
            const book = books.find(b => b.id === assignedId);
            const bookItems = items.filter(i => i.bookId === assignedId);
            const totalItemsCount = bookItems.length;

            // Review status description
            let reviewStatusText = '';
            if (studentCount === 0) {
              reviewStatusText = 'Belum ada santri';
            } else if (dueInClass > 0) {
              reviewStatusText = `${dueInClass} santri belum review`;
            } else {
              reviewStatusText = 'Semua santri tuntas';
            }

            // Target info / Total item info
            const bottomInfoText = isQuran 
              ? getItemTargetInfo(cls) 
              : `${totalItemsCount} Materi`;

            return (
              <div
                key={cls.id}
                onClick={() => setSelectedClassId(cls.id)}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-indigo-400 dark:hover:border-indigo-500/60 hover:shadow-md transition-all cursor-pointer flex flex-col group relative"
                title={`Buka ${cls.name}`}
              >
                {/* Compact Cover Area */}
                <div className="h-20 sm:h-24 bg-slate-100 dark:bg-slate-800 relative w-full overflow-hidden shrink-0">
                  {cls.coverUrl ? (
                    <img
                      src={cls.coverUrl}
                      alt={cls.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-2 text-slate-300 dark:text-slate-600 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-indigo-100">
                      {isQuran ? <BookOpen className="w-5 h-5 mb-0.5 opacity-60 text-emerald-300" /> : <BookMarked className="w-5 h-5 mb-0.5 opacity-60 text-indigo-300" />}
                      <span className="font-serif font-bold text-[10px] sm:text-xs truncate w-full px-1 text-center text-amber-200">
                        {cls.name}
                      </span>
                    </div>
                  )}

                  {/* Class Code Badge top-left */}
                  <div className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-xs text-white text-[8px] font-bold px-1.5 py-0.5 rounded font-mono shadow-2xs">
                    {cls.code}
                  </div>

                  {/* Closed Status Badge top-right */}
                  {cls.status === 'closed' && (
                    <div className="absolute top-1.5 right-1.5 bg-amber-600/90 backdrop-blur-xs text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-2xs flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      <span>{language === 'en' ? 'Closed' : 'Ditutup'}</span>
                    </div>
                  )}

                  {/* Student Count Badge bottom-right */}
                  <div className="absolute bottom-1.5 right-1.5 bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-1">
                    <Users className="w-2.5 h-2.5" />
                    <span>{studentCount} Santri</span>
                  </div>
                </div>

                {/* Content Area - Clear Title & Review Metric */}
                <div className="p-2.5 flex flex-col justify-center min-w-0">
                  <h4 
                    title={cls.name}
                    className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate whitespace-nowrap overflow-hidden text-ellipsis block group-hover:text-indigo-600 transition-colors"
                  >
                    {cls.name}
                  </h4>
                  
                  <div className="mt-1 flex items-center gap-1 min-w-0">
                    {studentCount === 0 ? (
                      <span className="text-[10px] text-slate-400 font-medium truncate">
                        Belum ada santri
                      </span>
                    ) : dueInClass > 0 ? (
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 truncate flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 animate-pulse" />
                        <span>{dueInClass} santri belum review</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 truncate flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span>Semua tuntas review</span>
                      </span>
                    )}
                  </div>

                  <p className="mt-0.5 text-[9px] text-slate-400 dark:text-slate-500 truncate">
                    {bottomInfoText}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Shared Modals for Level 1 */}
      {renderSharedModals()}
    </div>
  );
};
