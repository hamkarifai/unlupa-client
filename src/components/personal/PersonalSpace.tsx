import React, { useState, useEffect } from 'react';
import { getIntervalDays, getNonQuranIntervalDays, predictNonQuranIntervals, isReviewedToday } from '../../lib/fsrs';
import { useApp } from '../../context/AppContext';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { Book, Chapter, BookItem } from '../../types';
import { BookFormModal } from './BookFormModal';
import { ItemFormModal } from './ItemFormModal';
import { AIImportModal } from './AIImportModal';
import { AIBookBuilderModal } from './AIBookBuilderModal';
import { LibraryModal } from './LibraryModal';
import { PublishModal } from './PublishModal';
import { PersonalReviewModal } from './PersonalReviewModal';
import { ItemPreviewModal } from './ItemPreviewModal';
import { FolderMoveModal } from './FolderMoveModal';
import { ActivityHeatmap } from './ActivityHeatmap';
import { ConfirmModal } from './ConfirmModal';
import { BookInteractionTracker } from './BookInteractionTracker';
import { BookReviewCalendarModal } from './BookReviewCalendarModal';
import { BookReviewForecast7Days } from './BookReviewForecast7Days';
import { GlobalCardSearchModal } from './GlobalCardSearchModal';
import { MemoryMetricGrid } from '../common/MemoryMetricGrid';
import { UnifiedDueCard, DueFilterPill } from '../common/UnifiedDueCard';
import { AudioStorageService } from '../../lib/AudioStorageService';
import { AudioRecorderPlayer } from '../shared/AudioRecorderPlayer';
import { soundEffects } from '../../lib/soundFeedback';
import { BilingualCardText } from '../common/BilingualCardText';
import { normalizeBilingualText } from '../../utils/bilingualHelper';
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Plus, 
  Library, 
  Upload, 
  Download, 
  Play, 
  Eye,
  Mic, 
  EyeOff,
  Power, 
  Trash2, 
  Edit3, Pencil, MoreVertical, 
  ArrowLeft, 
  FolderPlus, 
  Sparkles, 
  Clock, 
  BookOpen, ChevronDown, ChevronRight, ChevronLeft,
  Share2, 
  Tag, 
  FileText,
  Copy,
  Check,
  CheckCircle2,
  ListOrdered,
  Flame,
  Brain,
  CalendarClock,
  Edit2,
  Image,
  CornerDownRight,
  Layers,
  Search,
  Filter,
  CheckSquare,
  Square,
  Folder,
  FolderOpen,
  MoveRight,
  Award,
  X,
  CircleDashed,
  MessageSquare,
  LogOut,
  ShieldCheck,
  CalendarCheck,
  KeyRound,
  LogIn
} from 'lucide-react';

export interface PersonalSpaceProps {
  initialBookId?: string | null;
  classBanner?: {
    className: string;
    classCode: string;
    teacherName?: string;
    onLeaveClass?: () => void;
  };
  isEmbeddedTeacherView?: boolean;
  onExitEmbedded?: () => void;
}

export const PersonalSpace: React.FC<PersonalSpaceProps> = ({
  initialBookId,
  classBanner,
  isEmbeddedTeacherView,
  onExitEmbedded
}) => {
  const { 
    books, 
    chapters, 
    items, 
    personalStats, 
    activateItem, 
    deactivateItem, 
    reviewItem,
    createBook, updateBook, 
    deleteBook, 
    createChapter, 
    updateChapter,
    deleteChapter, 
    createItem, updateItem,
    deleteItem,
    reorderItems,
    loadBookTree,
    importFromJSON,
    publishBookToLibrary,
    language,
    setActiveSpace,
    spaceResetCounter,
    addStudentDailyFeedback,
    teachingClasses,
    joinClassByCode,
    leaveClass,
    myClasses,
    editingClassBookId,
    setEditingClassBookId,
    isFeatureAllowed,
    openUpgradeModal,
    tierConfig,
    userProfile
  } = useApp();

  const handleTriggerNewBook = () => {
    const check = isFeatureAllowed('create_book');
    if (!check.allowed) {
      openUpgradeModal(
        check.reason,
        language === 'en'
          ? `Free tier allows up to ${check.limit} personal books. Upgrade to Unlupa Pro for unlimited modules & books.`
          : `Batas akun Free adalah maksimal ${check.limit} buku pribadi. Upgrade ke Unlupa Pro untuk membuat materi tanpa batas.`
      );
      return;
    }
    setIsNewBookOpen(true);
  };

  const handleTriggerAIBuilder = () => {
    const check = isFeatureAllowed('ai_builder');
    if (!check.allowed) {
      openUpgradeModal(
        check.reason,
        language === 'en'
          ? `Free daily AI generation quota is ${check.limit}x/day. Upgrade to Unlupa Pro for up to 30 generations/day.`
          : `Batas harian AI Builder akun Free adalah ${check.limit}x per hari. Upgrade ke Unlupa Pro untuk kuota hingga 30x/hari.`
      );
      return;
    }
    setIsAIBookBuilderOpen(true);
  };

  const handleTriggerAIImport = () => {
    const check = isFeatureAllowed('ai_extractor');
    if (!check.allowed) {
      openUpgradeModal(
        check.reason,
        language === 'en'
          ? 'Smart AI Extractor is exclusive to Unlupa Pro. Upgrade to extract flashcards automatically.'
          : 'Smart AI Extractor adalah fitur eksklusif Unlupa Pro. Upgrade sekarang untuk membuat materi otomatis.'
      );
      return;
    }
    setIsAIImportOpen(true);
  };

  // Active classes only (excluding closed classes)
  const activeTeachingClasses = teachingClasses.filter(c => c.status !== 'closed');
  const activeJoinedClasses = myClasses.filter(c => c.status !== 'closed');
  const activeClassIds = new Set<string>([
    ...activeTeachingClasses.map(c => c.id),
    ...activeJoinedClasses.map(c => c.id)
  ]);

  const assignedBookIds = new Set<string>();
  activeTeachingClasses.forEach(c => {
    c.assignedBookIds?.forEach(id => assignedBookIds.add(id));
  });

  const joinedBookIds = new Set<string>();
  activeJoinedClasses.forEach(c => {
    c.assignedBookIds?.forEach(id => joinedBookIds.add(id));
  });

  const isBookInActiveClass = (b: Book): boolean => {
    // If book has a direct classId, that class must be active
    if (b.classId) {
      return activeClassIds.has(b.classId);
    }
    // If book id starts with class-book-{classId}-...
    if (b.id.startsWith('class-book-')) {
      return Array.from(activeClassIds).some(cid => b.id.startsWith(`class-book-${cid}-`));
    }
    // If book is linked through active joined classes and is readonly
    if (joinedBookIds.has(b.id) && b.isReadonly) {
      return true;
    }
    // If book has category 'class' but has no active class association, it's not active
    return false;
  };

  const [selectedBookId, setSelectedBookId] = useState<string | null>(initialBookId || null);

  useEffect(() => {
    if (editingClassBookId) {
      setSelectedBookId(editingClassBookId);
      setEditingClassBookId(null);
    }
  }, [editingClassBookId, setEditingClassBookId]);

  useEffect(() => {
    if (initialBookId) {
      setSelectedBookId(initialBookId);
    }
  }, [initialBookId]);

  const selectedBook = books.find(b => b.id === selectedBookId) || null;
  const setSelectedBook = (b: Book | null) => setSelectedBookId(b ? b.id : null);

  useEffect(() => {
    if (selectedBookId) {
      loadBookTree(selectedBookId);
    }
  }, [selectedBookId, loadBookTree]);

  useEffect(() => {
    if (spaceResetCounter?.space === 'personal' && spaceResetCounter.count > 0) {
      setSelectedBook(null);
      setSelectedChapter(null);
      setIsLibraryOpen(false);
      setIsReviewOpen(false);
      setPreviewItem(null);
      setIsNewBookOpen(false);
      setIsNewChapterOpen(false);
      setIsNewItemOpen(false);
      setEditingBook(null);
      setEditingItem(null);
      setEditingChapter(null);
      setIsBulkMode(false);
      setSelectedCardIds(new Set());
      setChapterCardSearch('');
      setTocSearch('');
      setMovingItem(null);
      setMovingChapter(null);
      setIsMoveModalOpen(false);
      setActiveMenuId(null);
      setIsBookCalendarOpen(false);
      setCalendarBook(null);
      setCalendarChapterFilter(null);
    }
  }, [spaceResetCounter]);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [publishPreselectedId, setPublishPreselectedId] = useState<string | null>(null);
  const [activeBookTab, setActiveBookTab] = useState<'personal' | 'imported' | 'class'>('personal');
  const [isJoinClassModalOpen, setIsJoinClassModalOpen] = useState(false);
  const [codeInputValue, setCodeInputValue] = useState('');
  const [joinMessage, setJoinMessage] = useState<{ text: string, isError: boolean } | null>(null);
  const [classToLeave, setClassToLeave] = useState<string | null>(null);

  const handleJoinClass = async () => {
    const cleanCode = codeInputValue.trim();
    if (!cleanCode) {
      setJoinMessage({ 
        text: language === 'en' ? 'Class code cannot be empty' : 'Kode kelas tidak boleh kosong', 
        isError: true 
      });
      return;
    }
    const res = await joinClassByCode(cleanCode);
    if (res.success) {
      setJoinMessage({ text: res.message, isError: false });
      setTimeout(() => {
        setCodeInputValue('');
        setJoinMessage(null);
        setIsJoinClassModalOpen(false);
      }, 1400);
    } else {
      setJoinMessage({ text: res.message, isError: true });
    }
  };

  const handleConfirmLeaveClass = () => {
    if (!classToLeave) return;
    leaveClass(classToLeave);
    setClassToLeave(null);
  };
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewSpecificBookId, setReviewSpecificBookId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<BookItem | null>(null);

  // Book Review Calendar Modal state
  const [isBookCalendarOpen, setIsBookCalendarOpen] = useState(false);
  const [calendarBook, setCalendarBook] = useState<Book | null>(null);
  const [calendarChapterFilter, setCalendarChapterFilter] = useState<string | null>(null);

  // Global Card Search Modal state
  const [isGlobalCardSearchOpen, setIsGlobalCardSearchOpen] = useState(false);

  // Dialogs
  const [isNewBookOpen, setIsNewBookOpen] = useState(false);
  const [isNewChapterOpen, setIsNewChapterOpen] = useState(false);
  const [parentChapterIdForNew, setParentChapterIdForNew] = useState<string | null>(null);
  const [isNewItemOpen, setIsNewItemOpen] = useState(false);
  const [isAIImportOpen, setIsAIImportOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [editingItem, setEditingItem] = useState<BookItem | null>(null);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, message: string, onConfirm: () => void} | null>(null);
    const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [virtualSelectedChapter, setVirtualSelectedChapter] = useState<Chapter | null>(null);

  const selectedChapter = virtualSelectedChapter ? virtualSelectedChapter : (chapters.find(c => c.id === selectedChapterId) || null);
  const setSelectedChapter = (c: Chapter | null) => {
    if (c && c.id === '__unassigned__') {
      setVirtualSelectedChapter(c);
      setSelectedChapterId(c.id);
    } else {
      setVirtualSelectedChapter(null);
      setSelectedChapterId(c ? c.id : null);
    }
  };
  const [chapterFilter, setChapterFilter] = useState<'all' | 'active' | 'due' | 'inactive' | 'mastered'>('all');
  const [chapterCardSearch, setChapterCardSearch] = useState('');
  const [tocSearch, setTocSearch] = useState('');
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [targetMoveChapterId, setTargetMoveChapterId] = useState<string>('');
  const [movingItem, setMovingItem] = useState<BookItem | null>(null);
  const [movingChapter, setMovingChapter] = useState<Chapter | null>(null);
  const [selectedChapterIdForItem, setSelectedChapterIdForItem] = useState<string>('');
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const handleBulkActivate = () => {
    selectedCardIds.forEach(id => activateItem(id));
    setSelectedCardIds(new Set());
  };

  const handleBulkDeactivate = () => {
    selectedCardIds.forEach(id => deactivateItem(id));
    setSelectedCardIds(new Set());
  };

  const handleBulkDelete = () => {
    const count = selectedCardIds.size;
    if (count === 0) return;
    setConfirmDialog({
        isOpen: true,
        message: language === 'en' ? `Delete ${count} selected cards?` : `Hapus ${count} kartu yang dipilih?`,
        onConfirm: () => {
          selectedCardIds.forEach(id => deleteItem(id));
          setSelectedCardIds(new Set());
          setIsBulkMode(false);
          setConfirmDialog(null);
        }
      });
  };

  const handleConfirmMove = () => {
    const targetId = targetMoveChapterId === '__unassigned__' ? '' : targetMoveChapterId;
    
    if (movingChapter) {
      if (targetId === movingChapter.id) {
        alert(language === 'en' ? 'Cannot move chapter into itself.' : 'Bab tidak bisa dipindah ke dalam dirinya sendiri.');
        return;
      }
      updateChapter(movingChapter.id, {
        parentId: targetId ? targetId : null
      });
      setMovingChapter(null);
    } else if (movingItem) {
      updateItem(movingItem.id, {
        chapterId: targetId || undefined
      });
      setMovingItem(null);
    } else if (selectedCardIds.size > 0) {
      selectedCardIds.forEach(id => {
        updateItem(id, {
          chapterId: targetId || undefined
        });
      });
      setSelectedCardIds(new Set());
      setIsBulkMode(false);
    }
    setIsMoveModalOpen(false);
    setTargetMoveChapterId('');
  };
    
        const sensors = useSensors(
      useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
      useSensor(TouchSensor, { activationConstraint: { delay: 2000, tolerance: 15 } })
    );
    
    
    
    const handleDragEnd = (event: any) => {
      const { active, over } = event;
      if (!over) return;
      if (active.id === over.id) return;

      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        let updatedItems = [...items];
        const activeItem = updatedItems[oldIndex];
        const overItem = updatedItems[newIndex];
        
        if (activeItem.chapterId !== overItem.chapterId) {
          updatedItems[oldIndex] = { ...activeItem, chapterId: overItem.chapterId };
        }
        
        updatedItems = arrayMove(updatedItems, oldIndex, newIndex);
        reorderItems(updatedItems);
      }
    };

  const [isAIBookBuilderOpen, setIsAIBookBuilderOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [bookForm, setBookForm] = useState({ title: '', description: '', coverUrl: '', isPublic: false });
  const [chapterForm, setChapterForm] = useState({ title: '', description: '' });
  const [itemForm, setItemForm] = useState({ question: '', answer: '', tags: '', imageQ: '', imageA: '' });
  const [importJsonText, setImportJsonText] = useState('');
  const [importMessage, setImportMessage] = useState<{ text: string; isError: boolean } | null>(null);

  
  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  };

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookForm.title.trim()) return;
    const created = await createBook(bookForm);
    setBookForm({ title: '', description: '', coverUrl: '', isPublic: false });
    setIsNewBookOpen(false);
    if (created) setSelectedBook(created);
  };

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook || !chapterForm.title.trim()) return;
    
    if (editingChapter) {
      await updateChapter(editingChapter.id, {
        title: chapterForm.title,
        description: chapterForm.description
      });
    } else {
      await createChapter({
        bookId: selectedBook.id,
        title: chapterForm.title,
        description: chapterForm.description,
        parentId: parentChapterIdForNew
      });
    }
    
    setChapterForm({ title: '', description: '' });
    setIsNewChapterOpen(false);
    setEditingChapter(null);
    setParentChapterIdForNew(null);
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook || !itemForm.question.trim() || !itemForm.answer.trim()) return;
    const tagsArray = itemForm.tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    await createItem({
      bookId: selectedBook.id,
      chapterId: selectedChapterIdForItem || undefined,
      question: itemForm.question,
      answer: itemForm.answer,
      tags: tagsArray,
      imageQ: itemForm.imageQ || undefined,
      imageA: itemForm.imageA || undefined,
    });

    setItemForm({ question: '', answer: '', tags: '', imageQ: '', imageA: '' });
    setIsNewItemOpen(false);
  };

  
  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importJsonText.trim()) return;
    const res = importFromJSON(importJsonText);
    if (res.success) {
      setImportMessage({ text: res.message, isError: false });
      setTimeout(() => {
        // setIsImportOpen(false);
        setImportJsonText('');
        setImportMessage(null);
      }, 1500);
    } else {
      setImportMessage({ text: res.message, isError: true });
    }
  };

  const bookChapters = selectedBook ? chapters.filter(c => c.bookId === selectedBook.id) : [];
  const bookItems = selectedBook ? items.filter(i => i.bookId === selectedBook.id) : [];
  const currentChapter = virtualSelectedChapter ? virtualSelectedChapter : (selectedChapterId ? chapters.find(c => c.id === selectedChapterId) : null);

  // Compute all navigable chapters in order (including unassigned general cards if any)
  const unassignedCount = selectedBook ? bookItems.filter(i => !i.chapterId || !bookChapters.some(c => c.id === i.chapterId)).length : 0;
  const navigableChapters = React.useMemo(() => {
    if (!selectedBook) return [];
    const list = [...bookChapters].sort((a, b) => (a.order || 0) - (b.order || 0));
    if (unassignedCount > 0) {
      list.push({
        id: '__unassigned__',
        bookId: selectedBook.id,
        title: language === 'en' ? 'General Cards (No Chapter)' : 'Kartu Umum (Tanpa Bab)',
        order: 9999
      });
    }
    return list;
  }, [selectedBook, bookChapters, unassignedCount, language]);

  const currentChapterIdx = currentChapter ? navigableChapters.findIndex(c => c.id === currentChapter.id) : -1;
  const prevChapter = currentChapterIdx > 0 ? navigableChapters[currentChapterIdx - 1] : null;
  const nextChapter = currentChapterIdx >= 0 && currentChapterIdx < navigableChapters.length - 1 ? navigableChapters[currentChapterIdx + 1] : null;

  const isItemDue = (item: BookItem) => {
    if (!item.isActive) return false;
    if (!item.fsrsData.nextReview) return true;
    return new Date(item.fsrsData.nextReview) <= new Date();
  };

  const getChapterBreadcrumbs = (chap: Chapter): Chapter[] => {
    const crumbs: Chapter[] = [];
    let curr: Chapter | undefined = chap;
    const visited = new Set<string>();
    while (curr && !visited.has(curr.id)) {
      visited.add(curr.id);
      crumbs.unshift(curr);
      if (!curr.parentId) break;
      curr = chapters.find(c => c.id === curr!.parentId);
    }
    return crumbs;
  };

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

  // Comprehensive swipe navigation support for Personal Space (Previous & Next page navigation across all levels)
  useSwipeGesture(null, {
    disabled: Boolean(
      isNewBookOpen ||
      isNewChapterOpen ||
      isNewItemOpen ||
      isAIImportOpen ||
      editingBook ||
      editingItem ||
      editingChapter ||
      confirmDialog ||
      isMoveModalOpen ||
      isPublishOpen ||
      isLibraryOpen ||
      isReviewOpen
    ),
    onSwipeRight: () => {
      // 1. If single item preview is open, go to previous item or close preview
      if (previewItem) {
        const cCards = currentChapter?.id === '__unassigned__'
          ? bookItems.filter(i => !i.chapterId || !bookChapters.some(c => c.id === i.chapterId))
          : bookItems.filter(i => i.chapterId === currentChapter?.id);
        const pIdx = cCards.findIndex(i => i.id === previewItem.id);
        if (pIdx > 0) {
          setPreviewItem(cCards[pIdx - 1]);
        } else {
          setPreviewItem(null);
        }
        return;
      }

      // 2. If inside a chapter: swipe right goes to previous chapter or back to book overview
      if (currentChapter) {
        if (currentChapterIdx > 0) {
          setSelectedChapter(navigableChapters[currentChapterIdx - 1]);
          setChapterFilter('all');
          setChapterCardSearch('');
        } else {
          // At first chapter -> back to Book Overview
          setSelectedChapter(null);
        }
        return;
      }

      // 3. If in Book Overview: swipe right goes back to Library
      if (selectedBook) {
        if (isEmbeddedTeacherView && onExitEmbedded) {
          onExitEmbedded();
        } else {
          setSelectedBook(null);
        }
        return;
      }

      // 4. If in Library Root: swipe right goes to Quran space
      setActiveSpace('quran');
    },
    onSwipeLeft: () => {
      // 1. If single item preview is open, go to next item
      if (previewItem) {
        const cCards = currentChapter?.id === '__unassigned__'
          ? bookItems.filter(i => !i.chapterId || !bookChapters.some(c => c.id === i.chapterId))
          : bookItems.filter(i => i.chapterId === currentChapter?.id);
        const pIdx = cCards.findIndex(i => i.id === previewItem.id);
        if (pIdx >= 0 && pIdx < cCards.length - 1) {
          setPreviewItem(cCards[pIdx + 1]);
        }
        return;
      }

      // 2. If inside a chapter: swipe left goes to next chapter
      if (currentChapter) {
        if (currentChapterIdx >= 0 && currentChapterIdx < navigableChapters.length - 1) {
          setSelectedChapter(navigableChapters[currentChapterIdx + 1]);
          setChapterFilter('all');
          setChapterCardSearch('');
        } else if (currentChapterIdx === navigableChapters.length - 1) {
          // Reached end of book's chapters -> go to next book if exists, or teaching space
          const bIdx = books.findIndex(b => b.id === selectedBook?.id);
          if (bIdx >= 0 && bIdx < books.length - 1) {
            setSelectedBook(books[bIdx + 1]);
            setSelectedChapter(null);
          } else {
            setActiveSpace('teaching');
          }
        }
        return;
      }

      // 3. If in Book Overview: swipe left opens the first chapter if available
      if (selectedBook) {
        if (navigableChapters.length > 0) {
          setSelectedChapter(navigableChapters[0]);
          setChapterFilter('all');
          setChapterCardSearch('');
        } else {
          const bIdx = books.findIndex(b => b.id === selectedBook.id);
          if (bIdx >= 0 && bIdx < books.length - 1) {
            setSelectedBook(books[bIdx + 1]);
            setSelectedChapter(null);
          } else {
            setActiveSpace('teaching');
          }
        }
        return;
      }

      // 4. If in Library Root: swipe left goes to Teaching space
      setActiveSpace('teaching');
    },
    threshold: 40,
    minRatio: 1.15,
  });


  useEffect(() => {
    if (selectedBook && (selectedBook.category === 'class' || Boolean(selectedBook.classId) || selectedBook.id.startsWith('class-book-'))) {
      if (!isBookInActiveClass(selectedBook)) {
        setSelectedBook(null);
        setSelectedBookId(null);
      }
    }
  }, [selectedBook, activeClassIds]);

  const isCurrentBookReadonly = selectedBook 
    ? (selectedBook.isReadonly || isBookInActiveClass(selectedBook) || (joinedBookIds.has(selectedBook.id) && !assignedBookIds.has(selectedBook.id) && !isEmbeddedTeacherView)) 
    : false;
  return (
    <div className="space-y-5 pb-20 md:pb-10 max-w-5xl mx-auto">
      {/* 1. Today's Review & Header Card */}
      {!selectedBook && (
        <div className="space-y-4">
          {/* Header & Search Bar - Clean, Proportional & Consistent with other rooms */}
          <div className="flex items-center justify-between w-full mb-2 gap-2 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 whitespace-nowrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight shrink-0">
                {language === 'en' ? 'Books Space' : 'Ruang Buku'}
              </h1>
              <span
                className="flex items-center justify-center px-2.5 h-8.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold border border-slate-200/60 dark:border-slate-700/60 shadow-2xs shrink-0"
                title={`${books.length} ${language === 'en' ? 'Books' : 'Kitab'}`}
              >
                {books.length}
              </span>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsGlobalCardSearchOpen(true)}
                className="px-2.5 sm:px-3 h-8.5 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title={language === 'en' ? 'Search cards across all books' : 'Cari kartu di seluruh kitab'}
              >
                <Search className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="hidden sm:inline">{language === 'en' ? 'Search Cards' : 'Cari Kartu'}</span>
              </button>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder={language === 'en' ? 'Search book...' : 'Cari buku...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-28 sm:w-44 pl-8 pr-2.5 h-8.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 shadow-2xs transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Standard Minimalist Due Card (Primary Daily Review Card at Top) */}
            <UnifiedDueCard
              language={language}
              title={language === 'en' ? 'Daily Review' : 'Kartu Jatuh Tempo'}
              dueCount={personalStats.dueToday}
              totalActiveCount={personalStats.activeItems}
              itemTypeLabel={language === 'en' ? 'cards' : 'kartu'}
              primaryActionLabel={language === 'en' ? `All (${personalStats.dueToday})` : `Semua (${personalStats.dueToday})`}
              pillGridCols="books"
              onStartAll={() => {
                setReviewSpecificBookId(null);
                setIsReviewOpen(true);
              }}
              onOpenCalendar={() => {
                const targetBook = books.find(b => items.some(i => i.bookId === b.id && i.isActive && (!i.fsrsData.nextReview || new Date(i.fsrsData.nextReview) <= new Date()))) || books[0];
                if (targetBook) {
                  setCalendarBook(targetBook);
                  setCalendarChapterFilter(null);
                  setIsBookCalendarOpen(true);
                }
              }}
              filterPills={books
                .filter(b => items.some(i => i.bookId === b.id && i.isActive && (!i.fsrsData.nextReview || new Date(i.fsrsData.nextReview) <= new Date())))
                .map(book => ({
                  id: book.id,
                  label: book.title,
                  count: items.filter(i => i.bookId === book.id && i.isActive && (!i.fsrsData.nextReview || new Date(i.fsrsData.nextReview) <= new Date())).length,
                  onClick: () => {
                    setReviewSpecificBookId(book.id);
                    setIsReviewOpen(true);
                  }
                }))}
              allCaughtUpTitle={language === 'en' ? 'All personal flashcards reviewed today!' : 'Semua kartu materi telah selesai diulang!'}
            />
            
            {/* Dedicated Action Toolbar: Neatly placed between Daily Murajaah Card and Book Category Tabs */}
            <div className="flex items-center justify-between gap-2 pt-1 pb-2 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={handleTriggerAIBuilder}
                className="flex flex-col items-center justify-center flex-1 min-w-[76px] gap-1.5 p-2 rounded-2xl bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/40 dark:to-slate-900 border border-purple-100 dark:border-purple-900/50 hover:shadow-sm hover:border-purple-300 dark:hover:border-purple-700 text-purple-700 dark:text-purple-300 transition-all active:scale-[0.98] cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center group-hover:scale-110 group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-all">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold whitespace-nowrap">{language === 'en' ? 'AI Builder' : 'Buat via AI'}</span>
              </button>

              <button
                type="button"
                onClick={handleTriggerNewBook}
                className="flex flex-col items-center justify-center flex-1 min-w-[76px] gap-1.5 p-2 rounded-2xl bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/40 dark:to-slate-900 border border-indigo-100 dark:border-indigo-900/50 hover:shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 text-indigo-700 dark:text-indigo-300 transition-all active:scale-[0.98] cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800 transition-all">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold whitespace-nowrap">{language === 'en' ? 'New Book' : 'Tambah Kitab'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsLibraryOpen(true)}
                className="flex flex-col items-center justify-center flex-1 min-w-[76px] gap-1.5 p-2 rounded-2xl bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/40 dark:to-slate-900 border border-amber-100 dark:border-amber-900/50 hover:shadow-sm hover:border-amber-300 dark:hover:border-amber-700 text-amber-700 dark:text-amber-300 transition-all active:scale-[0.98] cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-200 dark:group-hover:bg-amber-800 transition-all">
                  <Library className="w-4 h-4" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold whitespace-nowrap">{language === 'en' ? 'Public Library' : 'Pustaka Kitab'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPublishPreselectedId(null);
                  setIsPublishOpen(true);
                }}
                className="flex flex-col items-center justify-center flex-1 min-w-[76px] gap-1.5 p-2 rounded-2xl bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/40 dark:to-slate-900 border border-blue-100 dark:border-blue-900/50 hover:shadow-sm hover:border-blue-300 dark:hover:border-blue-700 text-blue-700 dark:text-blue-300 transition-all active:scale-[0.98] cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-all">
                  <Share2 className="w-4 h-4" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold whitespace-nowrap">{language === 'en' ? 'Publish' : 'Publikasi'}</span>
              </button>
            </div>

            {/* Book Tabs: Segmented Control (Pribadi vs Pustaka vs Kelas) + Sleek Join Class Trigger */}
            <div className="flex items-center gap-2 mt-2 mb-3">
              {/* Modern Segmented Pill Tabs */}
              <div className="flex-1 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-2xl flex items-center gap-1 border border-slate-200/60 dark:border-slate-700/50 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setActiveBookTab('personal')}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none ${
                    activeBookTab === 'personal' 
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{language === 'en' ? 'Personal' : 'Pribadi'}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    activeBookTab === 'personal'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                      : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}>
                    {books.filter(b => !isBookInActiveClass(b) && !b.isReadonly).length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveBookTab('imported')}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none ${
                    activeBookTab === 'imported' 
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  <Library className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{language === 'en' ? 'Library' : 'Pustaka'}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    activeBookTab === 'imported'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                      : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}>
                    {books.filter(b => !isBookInActiveClass(b) && b.isReadonly).length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveBookTab('class')}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none ${
                    activeBookTab === 'class' 
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  <FolderPlus className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{language === 'en' ? 'Classes' : 'Kelas'}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    activeBookTab === 'class'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                      : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}>
                    {books.filter(b => isBookInActiveClass(b)).length}
                  </span>
                </button>
              </div>

              {/* Minimalist Proportional Join Class Trigger Button */}
              <button
                type="button"
                onClick={() => {
                  setActiveBookTab('class');
                  setIsJoinClassModalOpen(true);
                }}
                className="h-9 px-2.5 sm:px-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60 text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 transition-all active:scale-95 cursor-pointer shadow-2xs group"
                title={language === 'en' ? 'Enter class code to join' : 'Masukkan kode kelas untuk bergabung'}
              >
                <KeyRound className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 group-hover:rotate-12 transition-transform shrink-0" />
                <span className="hidden sm:inline">{language === 'en' ? 'Class Code' : 'Kode Kelas'}</span>
              </button>
            </div>

            {/* Books List Grid - Compact, sleek, 1-line title, only active & total cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
              {books
                .filter(b => (b.title || '').toLowerCase().includes((searchQuery || '').toLowerCase()))
                .filter(b => {
                  const isClass = isBookInActiveClass(b);
                  if (activeBookTab === 'personal') return !isClass && !b.isReadonly;
                  if (activeBookTab === 'imported') return !isClass && b.isReadonly;
                  if (activeBookTab === 'class') return isClass;
                  return false;
                })
                .map(book => {
                const bookItemsList = items.filter(i => i.bookId === book.id);
                const activeCount = bookItemsList.filter(i => i.isActive).length;
                const dueCount = bookItemsList.filter(i => i.isActive && (!i.fsrsData.nextReview || new Date(i.fsrsData.nextReview) <= new Date())).length;
                

  return (
                  <div
                    key={book.id}
                    onClick={() => setSelectedBook(book)}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-indigo-400 dark:hover:border-indigo-500/60 hover:shadow-md transition-all cursor-pointer flex flex-col group"
                  >
                    {/* Compact Cover Area */}
                    <div className="h-20 sm:h-24 bg-slate-100 dark:bg-slate-800 relative w-full overflow-hidden shrink-0">
                      {book.coverUrl ? (
                        <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500 bg-gradient-to-br from-slate-50 to-slate-150 dark:from-slate-800 dark:to-slate-850">
                          <BookOpen className="w-5 h-5 opacity-60" />
                        </div>
                      )}

                      {/* Quick Review Calendar Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCalendarBook(book);
                          setCalendarChapterFilter(null);
                          setIsBookCalendarOpen(true);
                        }}
                        className="absolute top-1.5 left-1.5 w-6 h-6 rounded-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-2xs z-10 cursor-pointer"
                        title={language === 'en' ? `View ${book.title} review calendar` : `Lihat kalender jadwal ${book.title}`}
                      >
                        <CalendarCheck className="w-3.5 h-3.5" />
                      </button>
                      
                      {/* Readonly Badge for Imported Books */}
                      {book.isReadonly && (
                        <div className="absolute top-1.5 right-1.5 bg-black/60 backdrop-blur-xs text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                          {language === 'en' ? 'Read-only' : 'Hanya Baca'}
                        </div>
                      )}
                      
                      {dueCount > 0 && (
                        <div className="absolute bottom-1.5 right-1.5 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-1">
                          <Play className="w-2.5 h-2.5 fill-white" /> {dueCount}
                        </div>
                      )}
                    </div>
                    
                    {/* Content Area - Strict Single Line Title with Ellipsis, Only Active & Total Cards */}
                    <div className="p-2 flex flex-col justify-center min-w-0">
                      <h4 
                        title={book.title}
                        className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate whitespace-nowrap overflow-hidden text-ellipsis block group-hover:text-indigo-600 transition-colors"
                      >
                        {book.title}
                      </h4>
                      <p className="mt-0.5 text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate whitespace-nowrap overflow-hidden text-ellipsis">
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{activeCount} {language === 'en' ? 'active' : 'aktif'}</span>
                        <span className="mx-1 text-slate-300 dark:text-slate-600">•</span>
                        <span>{bookItemsList.length} {language === 'en' ? 'total' : 'total'}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {books.filter(b => {
              const isClass = isBookInActiveClass(b);
              if (activeBookTab === 'personal') return !isClass && !b.isReadonly;
              if (activeBookTab === 'imported') return !isClass && b.isReadonly;
              if (activeBookTab === 'class') return isClass;
              return false;
            }).length === 0 && (
              <div className="text-center py-12 px-4 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 mt-4">
                <Library className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                  {language === 'en' ? 'No Books Found' : 'Tidak Ada Buku'}
                </h3>
                <p className="text-sm text-slate-500 mb-4 max-w-sm mx-auto">
                  {activeBookTab === 'personal' 
                    ? (language === 'en' ? 'Create a new book to start learning.' : 'Buat buku baru untuk mulai belajar.')
                    : activeBookTab === 'imported'
                    ? (language === 'en' ? 'Import a book from the library.' : 'Impor buku dari perpustakaan.')
                    : (language === 'en' ? 'You have not joined any classes yet. Enter your teacher\'s code to join.' : 'Anda belum bergabung dengan kelas manapun. Masukkan kode dari pengajar Anda untuk bergabung.')}
                </p>
                {activeBookTab === 'class' && (
                  <button
                    type="button"
                    onClick={() => setIsJoinClassModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>{language === 'en' ? 'Enter Class Code' : 'Masukkan Kode Kelas'}</span>
                  </button>
                )}
              </div>
            )}

          </div>

        </div>
      )}

      {/* 2. Book Level: Buku Induk & Hierarki Bab (Ketika Buku dipilih, belum memilih bab) */}
      {selectedBook && !currentChapter && (
        <div className="space-y-6">
          {/* Top Bar: Back button, Title & Book Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => { 
                if (isEmbeddedTeacherView && onExitEmbedded) {
                  onExitEmbedded();
                } else {
                  setSelectedBook(null); 
                  setSelectedChapter(null); 
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{language === 'en' ? 'Back to Library' : 'Kembali ke Koleksi'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setCalendarBook(selectedBook);
                  setCalendarChapterFilter(null);
                  setIsBookCalendarOpen(true);
                }}
                className="px-2.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-[10px] sm:text-xs font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title={language === 'en' ? 'Book Review Calendar' : 'Kalender Jadwal Murajaah Buku'}
              >
                <CalendarCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="hidden sm:inline">{language === 'en' ? 'Review Calendar' : 'Kalender Jadwal'}</span>
              </button>

              {!isCurrentBookReadonly && (
                <>
                  <button
                    onClick={() => setEditingBook(selectedBook)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-[10px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
                    title="Edit Book"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden sm:inline">{language === 'en' ? 'Edit Book' : 'Edit Buku'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setPublishPreselectedId(selectedBook.id);
                      setIsPublishOpen(true);
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-[10px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
                    title={language === 'en' ? 'Publish to Library' : 'Publikasikan ke Perpustakaan'}
                  >
                    <Share2 className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden sm:inline">{language === 'en' ? 'Publish' : 'Publikasi'}</span>
                  </button>
                </>
              )}
              {!classBanner && !isCurrentBookReadonly && (
                <button
                  onClick={() => {
                    setConfirmDialog({
                      isOpen: true,
                      message: language === 'en' ? 'Are you sure you want to delete this book?' : 'Hapus buku ini beserta seluruh isinya?',
                      onConfirm: () => {
                        deleteBook(selectedBook.id);
                        setSelectedBook(null);
                        setSelectedChapter(null);
                        setConfirmDialog(null);
                      }
                    });
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  title="Delete Book"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

            </div>

          </div>

          {/* Master Book Presentation - Authentic 3D Book Cover & Two Learning Progress Metrics */}
          {(() => {
            const totalCards = bookItems.length;
            const activeBookCards = bookItems.filter(i => i.isActive);
            const dueBookCards = bookItems.filter(i => isItemDue(i));
            const masteredCards = activeBookCards.filter(i => getNonQuranIntervalDays(i.fsrsData) >= 300);

            // Ukuran 1: Persentase kartu diaktifkan dari total kartu pada buku
            const activationPct = totalCards > 0 ? Math.round((activeBookCards.length / totalCards) * 100) : 0;

            // Ukuran 2: Kemajuan belajar (persentase kartu yang mencapai interval >300 hari)
            const masteryPct = totalCards > 0 ? Math.round((masteredCards.length / totalCards) * 100) : 0;
            const masteryFromActivePct = activeBookCards.length > 0 ? Math.round((masteredCards.length / activeBookCards.length) * 100) : 0;
            const joinedClass = myClasses.find(c => c.assignedBookIds?.includes(selectedBook.id));



  return (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col gap-3">
                {/* Embedded Class Integration Bar for Enrolled Students */}
                {joinedClass && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        Kelas: {joinedClass.name}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-bold border border-indigo-200/60 dark:border-indigo-800/40">
                        {joinedClass.code}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-600 text-white">
                        Terhubung Pengajar
                      </span>
                      {joinedClass.teacherName && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          • Pengajar: <strong className="text-slate-700 dark:text-slate-200">{joinedClass.teacherName}</strong>
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setClassToLeave(joinedClass.id);
                        setConfirmDialog({
                          isOpen: true,
                          message: language === 'en' ? 'Are you sure you want to leave this class?' : 'Yakin ingin keluar dari kelas ini?',
                          onConfirm: () => {
                            leaveClass(joinedClass.id);
                            setSelectedBook(null);
                          }
                        });
                      }}
                      className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs self-start sm:self-auto"
                      title={language === 'en' ? 'Leave this class' : 'Keluar dari kelas ini'}
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? 'Leave Class' : 'Keluar Kelas'}</span>
                    </button>
                  </div>
                )}

                <div className="flex flex-row gap-4 sm:gap-5 items-center">
                  {/* Compact 3D Book Cover Object */}
                  <div className="shrink-0 relative group">
                    <div className="w-20 sm:w-24 md:w-28 aspect-[1/1.38] rounded-r-lg rounded-l-xs overflow-hidden shadow-md shadow-slate-900/20 dark:shadow-black/60 border-l-[5px] border-l-slate-900/50 relative flex flex-col justify-between transition-transform duration-200 group-hover:-translate-y-0.5">
                      {/* Lighting reflection & spine ridge overlay */}
                      <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/35 via-white/25 to-transparent pointer-events-none z-20" />
                      <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-l from-black/20 to-transparent pointer-events-none z-20" />
                      <div className="absolute inset-0 bg-gradient-to-tr from-black/15 via-transparent to-white/10 pointer-events-none z-20" />

                      {selectedBook.coverUrl ? (
                        <img
                          src={selectedBook.coverUrl}
                          alt={selectedBook.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        /* Handcrafted Hardcover Cloth/Leather Kitab */
                        <div className="w-full h-full bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-950 p-2 sm:p-2.5 flex flex-col justify-between text-amber-100 border border-emerald-700/60 relative overflow-hidden select-none">
                          <div className="absolute -right-6 -bottom-6 w-20 h-20 rounded-full border-4 border-amber-400/10 pointer-events-none" />
                          <div className="absolute inset-1.5 border border-amber-400/30 rounded-xs pointer-events-none" />

                          {/* Top ornament */}
                          <div className="relative z-10 pt-0.5 text-center">
                            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/40 border border-amber-400/30 text-[7px] font-extrabold uppercase tracking-widest text-amber-300">
                              <BookOpen className="w-2 h-2 text-amber-400" />
                              <span className="truncate max-w-[70px]">{language === 'en' ? 'Book' : 'Kitab'}</span>
                            </div>
                          </div>

                          {/* Center Title */}
                          <div className="relative z-10 my-auto text-center px-1">
                            <h3 
                              title={selectedBook.title}
                              className="font-serif font-bold text-[11px] sm:text-xs text-amber-50 leading-snug drop-shadow-md truncate whitespace-nowrap overflow-hidden text-ellipsis block tracking-wide"
                            >
                              {selectedBook.title}
                            </h3>
                            <div className="w-6 h-0.5 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent mx-auto mt-1" />
                          </div>

                          {/* Bottom */}
                          <div className="relative z-10 pb-0.5 text-center">
                            <span className="text-[6px] font-semibold text-amber-300/80 tracking-widest uppercase block">
                              {language === 'en' ? 'Manual' : 'Kitab'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Bookmark ribbon */}
                      <div className="absolute bottom-0 right-2.5 w-2.5 h-4 bg-rose-600 shadow-sm transform translate-y-1.5 z-10" />

                      {/* Readonly Badge on Cover */}
                      { (isCurrentBookReadonly) && (
                        <div className="absolute top-1.5 right-1.5 z-30 bg-black/75 backdrop-blur-xs text-amber-200 text-[8px] font-bold px-1.5 py-0.5 rounded shadow-2xs border border-amber-400/40">
                          {language === 'en' ? 'Read-only' : 'Hanya Baca'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Book Metadata & Compact Progress Bar beside Cover */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <h1 
                          title={selectedBook.title}
                          className="text-lg sm:text-xl font-bold font-serif text-slate-900 dark:text-white leading-tight truncate whitespace-nowrap overflow-hidden text-ellipsis block"
                        >
                          {selectedBook.title}
                        </h1>
                        { (isCurrentBookReadonly) ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                            <ShieldCheck className="w-3 h-3 text-indigo-500 shrink-0" />
                            <span>{language === 'en' ? 'Read-only' : 'Hanya Baca'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span>{language === 'en' ? 'Editable' : 'Dapat Diedit'}</span>
                          </span>
                        )}
                      </div>
                      {selectedBook.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-1 leading-relaxed">
                          {selectedBook.description}
                        </p>
                      )}
                    </div>

                    {/* Single Straight Progress Line (Active & Mapan) */}
                    <div className="space-y-1 pt-0.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 flex-wrap gap-x-3 gap-y-0.5">
                        <div className="flex items-center gap-2.5">
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            {language === 'en' ? 'Active' : 'Aktif'}: {activeBookCards.length}/{totalCards} ({activationPct}%)
                          </span>
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                            {language === 'en' ? 'Mastered' : 'Mapan'}: {masteredCards.length}/{totalCards} ({masteryPct}%)
                          </span>
                        </div>
                        {dueBookCards.length > 0 && (
                          <span className="text-amber-600 dark:text-amber-400 font-bold text-[10px]">
                            {dueBookCards.length} {language === 'en' ? 'due today' : 'perlu review'}
                          </span>
                        )}
                      </div>

                      {/* Single segmented straight bar */}
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex shadow-2xs">
                        {/* Mastered portion (amber) */}
                        <div
                          style={{ width: `${totalCards > 0 ? (masteredCards.length / totalCards) * 100 : 0}%` }}
                          className="h-full bg-amber-500 transition-all duration-500 shrink-0"
                          title={`Mapan: ${masteredCards.length}`}
                        />
                        {/* Active non-mastered portion (emerald) */}
                        <div
                          style={{ width: `${totalCards > 0 ? (Math.max(0, activeBookCards.length - masteredCards.length) / totalCards) * 100 : 0}%` }}
                          className="h-full bg-emerald-500 transition-all duration-500 shrink-0"
                          title={`Aktif: ${activeBookCards.length}`}
                        />
                      </div>
                    </div>

                    {/* Action Buttons: Review & Review Calendar */}
                    <div className="pt-1 flex items-center gap-2 flex-wrap">
                      {dueBookCards.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setReviewSpecificBookId(selectedBook.id);
                            setIsReviewOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>{language === 'en' ? `Review (${dueBookCards.length})` : `Review (${dueBookCards.length})`}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setCalendarBook(selectedBook);
                          setCalendarChapterFilter(null);
                          setIsBookCalendarOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold text-xs transition-all cursor-pointer shadow-2xs"
                      >
                        <CalendarCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>{language === 'en' ? 'Review Calendar' : 'Kalender Jadwal'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Pelacakan Frekuensi Interaksi & Ketepatan Tugas (Tepat di Halaman Awal Kitab, di Atas Daftar Isi) */}
          <BookInteractionTracker
            book={selectedBook}
            items={bookItems}
            chapters={bookChapters}
            language={language}
            onSelectCard={(item) => setPreviewItem(item)}
            onOpenCalendar={() => {
              setCalendarBook(selectedBook);
              setCalendarChapterFilter(null);
              setIsBookCalendarOpen(true);
            }}
          />
          
          {/* Prakiraan Beban Review 7 Hari ke Depan (7-Day Review Horizon Forecast) */}
          <BookReviewForecast7Days
            book={selectedBook}
            items={bookItems}
            language={language}
            onOpenCalendarOnDate={() => {
              setCalendarBook(selectedBook);
              setCalendarChapterFilter(null);
              setIsBookCalendarOpen(true);
            }}
          />

          {/* Daftar Isi Kitab (Table of Contents - Professional, Compact, Breathable) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-1">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ListOrdered className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>{language === 'en' ? 'Table of Contents' : 'Daftar Isi Kitab'}</span>
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {language === 'en' 
                    ? 'Select any chapter or subchapter to view and study its flashcards.' 
                    : 'Pilih bab atau sub-bab untuk langsung masuk ke materi dan kartu flashcard di dalamnya.'}
                </p>

              </div>

              {/* Table of Contents Search & Quick Add */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={language === 'en' ? 'Search TOC...' : 'Cari bab / sub-bab...'}
                    value={tocSearch}
                    onChange={(e) => setTocSearch(e.target.value)}
                    className="w-44 sm:w-56 pl-7 pr-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                  {tocSearch && (
                    <button
                      onClick={() => setTocSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}

                </div>

                {!isCurrentBookReadonly && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setSelectedChapterIdForItem('');
                        handleTriggerAIImport();
                      }}
                      className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{language === 'en' ? 'AI Generate' : 'Buat dgn AI'}</span>
                    </button>
                    <button
                      onClick={() => { setParentChapterIdForNew(null); setIsNewChapterOpen(true); }}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{language === 'en' ? 'New Chapter' : 'Bab Baru'}</span>
                    </button>

                  </div>
                )}

              </div>

            </div>

            {bookChapters.length === 0 && bookItems.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border border-slate-200/80 dark:border-slate-800">
                <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2.5" />
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {language === 'en' ? 'This book is empty' : 'Buku ini masih kosong'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                  {language === 'en' ? 'Create chapters and flashcards to begin learning.' : 'Tambahkan bab dan kartu pertanyaan-jawaban untuk mulai belajar.'}
                </p>
                {!isCurrentBookReadonly ? (
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        setSelectedChapterIdForItem('');
                        handleTriggerAIImport();
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {language === 'en' ? 'AI Generate' : 'Buat dgn AI'}
                    </button>
                    <button
                      onClick={() => { setParentChapterIdForNew(null); setIsNewChapterOpen(true); }}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer shadow-sm"
                    >
                      {language === 'en' ? 'Add First Chapter' : 'Tambah Bab Pertama'}
                    </button>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700">
                    <ShieldCheck className="w-4 h-4 text-indigo-500" />
                    <span>{language === 'en' ? 'Authentic Protected Material' : 'Materi Otentik Terkunci oleh Pengajar'}</span>
                  </div>
                )}

              </div>
            ) : null}

            {/* Table of Contents Container */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 sm:p-2.5 pb-12 shadow-2xs space-y-1">
              {(() => {
                const renderChapterHierarchyTree = (parentId: string | null = null, depth = 0, parentIdxPrefix = ''): React.ReactNode[] => {
                  let chaptersInLevel = bookChapters.filter(c => (c.parentId || null) === parentId);

                  if (tocSearch.trim()) {
                    const q = tocSearch.toLowerCase();
                    // Keep chapter if it or any descendant matches
                    const matchesOrHasMatchingDescendants = (ch: Chapter): boolean => {
                      if ((ch.title || '').toLowerCase().includes(q) || (ch.description || '').toLowerCase().includes(q)) return true;
                      const children = bookChapters.filter(c => c.parentId === ch.id);
                      return children.some(matchesOrHasMatchingDescendants);
                    };
                    chaptersInLevel = chaptersInLevel.filter(matchesOrHasMatchingDescendants);
                  }

                  return chaptersInLevel.map((chapter, idx) => {
                    const directItems = bookItems.filter(i => i.chapterId === chapter.id);
                    const childChapters = bookChapters.filter(c => c.parentId === chapter.id);
                    const dueCount = directItems.filter(i => isItemDue(i)).length;
                    const currentIdxStr = parentIdxPrefix ? `${parentIdxPrefix}.${idx + 1}` : `${idx + 1}`;
                    const isExpanded = !expandedChapters.has(chapter.id); // default expanded
                    const isNearBottom = idx >= Math.max(0, chaptersInLevel.length - 2) || (depth > 0 && idx >= Math.max(0, chaptersInLevel.length - 1));


  return (
                      <div key={chapter.id} className="space-y-1">
                        <div
                          onClick={() => {
                            setSelectedChapter(chapter);
                            setChapterFilter('all');
                            setChapterCardSearch('');
                          }}
                          className={`group transition-all cursor-pointer select-none rounded-xl border ${
                            depth === 0
                              ? 'py-2 px-3 sm:px-3.5 bg-slate-50/70 hover:bg-indigo-50/60 dark:bg-slate-800/40 dark:hover:bg-indigo-950/30 border-slate-200/70 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-2xs'
                              : depth === 1
                              ? 'ml-3 sm:ml-6 py-1.5 px-2.5 sm:px-3 bg-white dark:bg-slate-900/80 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 border-slate-200/60 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 shadow-2xs'
                              : 'ml-6 sm:ml-10 py-1.5 px-2 sm:px-2.5 bg-white/70 dark:bg-slate-900/40 hover:bg-sky-50/40 dark:hover:bg-sky-950/20 border-slate-200/50 dark:border-slate-800/60 hover:border-sky-300 dark:hover:border-sky-700'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2.5">
                            {/* Left: Folder Toggle & Chapter Title */}
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {childChapters.length > 0 ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedChapters(prev => {
                                      const next = new Set(prev);
                                      if (next.has(chapter.id)) {
                                        next.delete(chapter.id);
                                      } else {
                                        next.add(chapter.id);
                                      }
                                      return next;
                                    });
                                  }}
                                  className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors shrink-0"
                                  title={isExpanded ? 'Collapse subchapters' : 'Expand subchapters'}
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5 text-indigo-500" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                  )}
                                </button>
                              ) : depth > 0 ? (
                                <CornerDownRight className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0 ml-1" />
                              ) : (
                                <div className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
                                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />

                                </div>
                              )}

                              <div className="min-w-0 flex-1 flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 uppercase tracking-wider ${
                                  depth === 0 
                                    ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300'
                                    : depth === 1
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                                    : 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-300'
                                }`}>
                                  {depth === 0 
                                    ? (language === 'en' ? `Ch ${idx + 1}` : `Bab ${idx + 1}`)
                                    : depth === 1
                                    ? `Sub ${currentIdxStr}`
                                    : `↳ ${currentIdxStr}`}
                                </span>

                                <h3 className={`font-semibold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors ${
                                  depth === 0 ? 'text-xs sm:text-sm' : 'text-xs'
                                }`}>
                                  {chapter.title}
                                </h3>

                                {chapter.description && (
                                  <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate hidden md:inline">
                                    — {chapter.description}
                                  </span>
                                )}

                              </div>

                            </div>

                            {/* Right Status, Review Pill & Kebab Menu */}
                            <div className="flex items-center gap-2 shrink-0">
                              {/* Total Direct Cards */}
                              <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/50 dark:border-slate-700">
                                {directItems.length} {language === 'en' ? 'cards' : 'kartu'}
                              </span>

                              {/* Review Task Button (Direct Jump to Chapter Due Review) */}
                              {dueCount > 0 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedChapter(chapter);
                                    setChapterFilter('due');
                                    setChapterCardSearch('');
                                  }}
                                  className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-200 border border-amber-300/80 dark:border-amber-700/60 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                                  title={language === 'en' ? `${dueCount} cards due for review in this chapter` : `${dueCount} kartu perlu direview di bab ini`}
                                >
                                  <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                  <span>{dueCount} {language === 'en' ? 'due' : 'perlu review'}</span>
                                </button>
                              )}

                              {/* Three-Dots Menu (Kebab) for Professional UX */}
                              {!isCurrentBookReadonly && (
                                <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    onClick={() => setActiveMenuId(activeMenuId === `chap-${chapter.id}` ? null : `chap-${chapter.id}`)}
                                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
                                    title="Options"
                                  >
                                    <MoreVertical className="w-3.5 h-3.5" />
                                  </button>

                                  {activeMenuId === `chap-${chapter.id}` && (
                                    <div className={`absolute right-0 ${isNearBottom ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} w-44 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-1 z-50 text-xs`}>
                                      {depth < 2 && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveMenuId(null);
                                            setParentChapterIdForNew(chapter.id);
                                            setIsNewChapterOpen(true);
                                          }}
                                          className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                                        >
                                          <FolderPlus className="w-3.5 h-3.5 text-emerald-600" />
                                          <span>{language === 'en' ? 'Add Subchapter' : 'Tambah Subbab'}</span>
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMenuId(null);
                                          setEditingChapter(chapter);
                                          setChapterForm({ title: chapter.title, description: chapter.description || '' });
                                          setIsNewChapterOpen(true);
                                        }}
                                        className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                                      >
                                        <Pencil className="w-3.5 h-3.5 text-indigo-500" />
                                        <span>{language === 'en' ? 'Edit Chapter' : 'Edit Bab'}</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMenuId(null);
                                          setConfirmDialog({
                                            isOpen: true,
                                            message: language === 'en' ? 'Delete this chapter and all its subchapters?' : 'Yakin ingin menghapus bab ini beserta sub-bab dan kartunya?',
                                            onConfirm: () => {
                                              deleteChapter(chapter.id);
                                              setConfirmDialog(null);
                                            }
                                          });
                                        }}
                                        className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2 cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>{language === 'en' ? 'Delete Chapter' : 'Hapus Bab'}</span>
                                      </button>

                                    </div>
                                  )}

                                </div>
                              )}

                              {/* Buka Bab Arrow Button */}
                              <div className="p-1 rounded-md text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />

                              </div>

                            </div>

                          </div>

                        </div>

                        {/* Recursively render children if expanded */}
                        {childChapters.length > 0 && isExpanded && (
                          <div className="space-y-1">
                            {renderChapterHierarchyTree(chapter.id, depth + 1, currentIdxStr)}

                          </div>
                        )}

                      </div>
                    );
                  });
                };

                return renderChapterHierarchyTree(null, 0);
              })()}

              {/* Unassigned items box (if any) */}
              {(() => {
                const unassignedItems = bookItems.filter(i => !i.chapterId || !bookChapters.some(c => c.id === i.chapterId));
                if (unassignedItems.length === 0) return null;


  return (
                  <div
                    onClick={() => {
                      setSelectedChapter({
                        id: '__unassigned__',
                        bookId: selectedBook.id,
                        title: language === 'en' ? 'General Cards (No Chapter)' : 'Kartu Umum (Tanpa Bab)',
                        order: 999
                      });
                      setChapterFilter('all');
                      setChapterCardSearch('');
                    }}
                    className="p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/30 hover:border-indigo-400 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 transition-colors">
                          {language === 'en' ? 'General Cards (No Chapter)' : 'Kartu Umum (Tanpa Bab)'}
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {language === 'en' 
                            ? `${unassignedItems.length} cards not organized into a chapter` 
                            : `${unassignedItems.length} kartu di luar bab`}
                        </p>

                      </div>

                    </div>
                    {!isCurrentBookReadonly && (
                      <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setActiveMenuId(activeMenuId === 'unassigned-menu' ? null : 'unassigned-menu')}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
                          title="Options"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                        {activeMenuId === 'unassigned-menu' && (
                          <div className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-1 z-50 text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                setConfirmDialog({
                                  isOpen: true,
                                  message: language === 'en' ? 'Delete all cards in this category?' : 'Hapus semua kartu di kategori ini?',
                                  onConfirm: () => {
                                    unassignedItems.forEach(i => deleteItem(i.id));
                                    setConfirmDialog(null);
                                    setSelectedChapter(null);
                                  }
                                });
                              }}
                              className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{language === 'en' ? 'Delete All Cards' : 'Hapus Semua Kartu'}</span>
                            </button>

                          </div>
                        )}

                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 group-hover:text-indigo-600">
                      <span className="text-[11px] font-semibold">{language === 'en' ? 'Open Cards' : 'Buka'}</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />

                    </div>

                  </div>
                );
              })()}

            </div>

          </div>

        </div>
      )}

      {/* 3. Chapter View: Halaman Khusus Bab & Item-Item Kartu (Seperti Halaman Juz Al-Qur'an) */}
      {selectedBook && currentChapter && (
        <div className="space-y-6">
          {/* Chapter Page Navigation & Breadcrumbs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setSelectedChapter(null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{language === 'en' ? 'Back to Book' : 'Kembali ke Buku Induk'}</span>
              </button>

              {/* Chapter pagination stepper for direct previous/next navigation */}
              {navigableChapters.length > 1 && (
                <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700 shrink-0">
                  <button
                    disabled={!prevChapter}
                    onClick={() => {
                      if (prevChapter) {
                        setSelectedChapter(prevChapter);
                        setChapterFilter('all');
                        setChapterCardSearch('');
                      }
                    }}
                    className="p-1 rounded-md text-slate-600 dark:text-slate-300 disabled:opacity-25 hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer disabled:cursor-not-allowed"
                    title={prevChapter ? (language === 'en' ? `Previous: ${prevChapter.title}` : `Sebelumnya: ${prevChapter.title}`) : undefined}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 px-1.5 select-none whitespace-nowrap">
                    {currentChapterIdx + 1} / {navigableChapters.length}
                  </span>
                  <button
                    disabled={!nextChapter}
                    onClick={() => {
                      if (nextChapter) {
                        setSelectedChapter(nextChapter);
                        setChapterFilter('all');
                        setChapterCardSearch('');
                      }
                    }}
                    className="p-1 rounded-md text-slate-600 dark:text-slate-300 disabled:opacity-25 hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer disabled:cursor-not-allowed"
                    title={nextChapter ? (language === 'en' ? `Next: ${nextChapter.title}` : `Berikutnya: ${nextChapter.title}`) : undefined}
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Breadcrumb Trail */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto py-1">
                <span 
                  onClick={() => setSelectedChapter(null)}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer font-medium truncate max-w-[140px]"
                  title={selectedBook.title}
                >
                  {selectedBook.title}
                </span>
                {currentChapter.id !== '__unassigned__' && getChapterBreadcrumbs(currentChapter).map((crumb, i, arr) => (
                  <React.Fragment key={crumb.id}>
                    <span className="text-slate-400">/</span>
                    <span
                      onClick={() => {
                        if (i !== arr.length - 1) {
                          setSelectedChapter(crumb);
                          setChapterFilter('all');
                          setChapterCardSearch('');
                        }
                      }}
                      className={`truncate max-w-[150px] ${
                        i === arr.length - 1 
                          ? 'font-bold text-slate-900 dark:text-white' 
                          : 'font-medium hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer'
                      }`}
                    >
                      {crumb.title}
                    </span>
                  </React.Fragment>
                ))}

              </div>

            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {/* Chapter Review Calendar Button */}
              <button
                type="button"
                onClick={() => {
                  setCalendarBook(selectedBook);
                  setCalendarChapterFilter(currentChapter.id === '__unassigned__' ? 'unassigned' : currentChapter.id);
                  setIsBookCalendarOpen(true);
                }}
                className="px-2.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title={language === 'en' ? 'Chapter Schedule Calendar' : 'Kalender Jadwal Bab'}
              >
                <CalendarCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="hidden sm:inline">{language === 'en' ? 'Calendar' : 'Kalender Bab'}</span>
              </button>

              {!isCurrentBookReadonly && currentChapter.id !== '__unassigned__' && (
                <>
                  <button
                    onClick={() => {
                      setEditingChapter(currentChapter);
                      setChapterForm({ title: currentChapter.title, description: currentChapter.description || '' });
                      setIsNewChapterOpen(true);
                    }}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1"
                    title="Edit Chapter"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{language === 'en' ? 'Edit' : 'Edit'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setConfirmDialog({
                        isOpen: true,
                        message: language === 'en' ? 'Are you sure you want to delete this chapter?' : 'Hapus bab ini beserta isinya?',
                        onConfirm: () => {
                          deleteChapter(currentChapter.id);
                          setSelectedChapter(null);
                          setConfirmDialog(null);
                        }
                      });
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    title="Delete Chapter"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
              {!isCurrentBookReadonly && currentChapter.id === '__unassigned__' && (
                <button
                  onClick={() => {
                    const unassignedItems = bookItems.filter(i => !i.chapterId || !bookChapters.some(c => c.id === i.chapterId));
                    if (unassignedItems.length === 0) return;
                    setConfirmDialog({
                      isOpen: true,
                      message: language === 'en' ? 'Delete all cards in this category?' : 'Hapus semua kartu di kategori ini?',
                      onConfirm: () => {
                        unassignedItems.forEach(i => deleteItem(i.id));
                        setConfirmDialog(null);
                        setSelectedChapter(null);
                      }
                    });
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  title={language === 'en' ? 'Delete All Cards' : 'Hapus Semua Kartu'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

            </div>

          </div>

          {/* Chapter Hero Card (Like Quran Juz Hero Card) */}
          {(() => {
            const chapterCards = currentChapter.id === '__unassigned__'
              ? bookItems.filter(i => !i.chapterId || !bookChapters.some(c => c.id === i.chapterId))
              : bookItems.filter(i => i.chapterId === currentChapter.id);
            const activeCards = chapterCards.filter(i => i.isActive);
            const dueCards = chapterCards.filter(i => isItemDue(i));
            const masteredCards = chapterCards.filter(i => i.fsrsData.stability >= 74.5);
            const childChapters = currentChapter.id !== '__unassigned__' 
              ? bookChapters.filter(c => c.parentId === currentChapter.id) 
              : [];
            const depth = currentChapter.id !== '__unassigned__' ? getChapterDepth(currentChapter) : 0;

            const filteredCards = chapterCards.filter(card => {
              if (chapterFilter === 'active' && !card.isActive) return false;
              if (chapterFilter === 'due') {
                const isDue = isItemDue(card);
                const isReviewedToday = card.fsrsData.lastReview && new Date(card.fsrsData.lastReview).toDateString() === new Date().toDateString();
                if (!isDue && !isReviewedToday) return false;
              }
              if (chapterFilter === 'mastered' && card.fsrsData.stability < 74.5) return false;
              if (chapterCardSearch.trim()) {
                const q = chapterCardSearch.toLowerCase();
                const matchQ = (card.question || '').toLowerCase().includes(q);
                const matchA = (card.answer || '').toLowerCase().includes(q);
                const matchT = (card.tags || []).some(t => (t || '').toLowerCase().includes(q));
                if (!matchQ && !matchA && !matchT) return false;
              }
              return true;
            });


  return (
              <div className="space-y-4">
                {/* Chapter Banner - Compact & Breathable (Mirip Ruang Al-Qur'an Juz Header) */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-4.5 border border-slate-200 dark:border-slate-800 shadow-2xs relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug truncate">
                        {currentChapter.title}
                      </h1>
                      {currentChapter.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-1 max-w-2xl">
                          {currentChapter.description}
                        </p>
                      )}

                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      {!isCurrentBookReadonly ? (
                        <>
                        <button
                          onClick={() => {
                            setSelectedChapterIdForItem(currentChapter.id === '__unassigned__' ? '' : currentChapter.id);
                            setIsAIImportOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{language === 'en' ? 'AI Generate' : 'Buat dgn AI'}</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedChapterIdForItem(currentChapter.id === '__unassigned__' ? '' : currentChapter.id);
                            setIsNewItemOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{language === 'en' ? 'Add Card' : 'Tambah Kartu'}</span>
                        </button>
                      </>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{language === 'en' ? 'Authentic (Protected)' : 'Materi Otentik (Terkunci)'}</span>
                        </span>
                      )}

                      {dueCards.length > 0 && (
                        <button
                          onClick={() => setIsReviewOpen(true)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>{language === 'en' ? `Review (${dueCards.length})` : `Review Bab (${dueCards.length})`}</span>
                        </button>
                      )}

                    </div>

                  </div>

                </div>

                {/* Bulk Actions Toolbar (Active when isBulkMode) */}
                {isBulkMode && (
                  <div className="bg-indigo-950 text-white rounded-2xl p-3 sm:p-3.5 shadow-lg border border-indigo-800 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedCardIds.size === filteredCards.length && filteredCards.length > 0) {
                            setSelectedCardIds(new Set());
                          } else {
                            setSelectedCardIds(new Set(filteredCards.map(c => c.id)));
                          }
                        }}
                        className="flex items-center gap-2 text-xs font-semibold text-indigo-200 hover:text-white transition-colors"
                      >
                        {selectedCardIds.size === filteredCards.length && filteredCards.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-indigo-300" />
                        ) : (
                          <Square className="w-4 h-4 text-indigo-300" />
                        )}
                        <span>
                          {selectedCardIds.size === filteredCards.length && filteredCards.length > 0
                            ? (language === 'en' ? 'Deselect All' : 'Batal Semua')
                            : (language === 'en' ? `Select All (${filteredCards.length})` : `Pilih Semua (${filteredCards.length})`)}
                        </span>
                      </button>

                      <span className="text-xs text-indigo-300 font-medium">
                        | <strong className="text-white ml-1">{selectedCardIds.size}</strong> {language === 'en' ? 'selected' : 'dipilih'}
                      </span>

                    </div>

                    {/* Bulk Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        disabled={selectedCardIds.size === 0}
                        onClick={handleBulkActivate}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                        title={language === 'en' ? 'Activate selected cards' : 'Aktifkan kartu yang dipilih'}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{language === 'en' ? 'Activate' : 'Aktifkan'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={selectedCardIds.size === 0}
                        onClick={handleBulkDeactivate}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                        title={language === 'en' ? 'Deactivate selected cards' : 'Nonaktifkan kartu yang dipilih'}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{language === 'en' ? 'Deactivate' : 'Nonaktifkan'}</span>
                      </button>

                      {!isCurrentBookReadonly && (
                        <>
                          <button
                            type="button"
                            disabled={selectedCardIds.size === 0}
                            onClick={() => {
                              setMovingItem(null);
                              setMovingChapter(null);
                              setTargetMoveChapterId(currentChapter.id === '__unassigned__' ? '__unassigned__' : currentChapter.id);
                              setIsMoveModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-indigo-700 hover:bg-indigo-600 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                            title={language === 'en' ? 'Move selected cards to chapter' : 'Pindahkan kartu yang dipilih ke bab lain'}
                          >
                            <Folder className="w-3.5 h-3.5" />
                            <span>{language === 'en' ? 'Move' : 'Pindah Bab'}</span>
                          </button>

                          <button
                            type="button"
                            disabled={selectedCardIds.size === 0}
                            onClick={handleBulkDelete}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                            title={language === 'en' ? 'Delete selected cards' : 'Hapus kartu yang dipilih'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{language === 'en' ? 'Delete' : 'Hapus'}</span>
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setIsBulkMode(false);
                          setSelectedCardIds(new Set());
                        }}
                        className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors ml-1"
                        title={language === 'en' ? 'Exit Bulk Selection' : 'Tutup Aksi Massal'}
                      >
                        <X className="w-4 h-4" />
                      </button>

                    </div>

                  </div>
                )}

                {/* Filter Tabs & Search Bar */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                  {/* Tabs */}
                  <div className="flex items-center gap-1 p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl overflow-x-auto border border-slate-200/60 dark:border-slate-700/60">
                    <button
                      onClick={() => setChapterFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                        chapterFilter === 'all'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-600'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5 opacity-70" />
                      {language === 'en' ? 'All' : 'Semua'}
                      <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] ${chapterFilter === 'all' ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' : 'bg-slate-200/50 dark:bg-slate-800/50 text-slate-500'}`}>{chapterCards.length}</span>
                    </button>
                    
                    <button
                      onClick={() => setChapterFilter('due')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                        chapterFilter === 'due'
                          ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-600'
                          : 'text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 opacity-70" />
                      {language === 'en' ? 'Due' : 'Review'}
                      <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] ${chapterFilter === 'due' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'bg-slate-200/50 dark:bg-slate-800/50 text-slate-500'}`}>{dueCards.length}</span>
                    </button>
                    <button
                      onClick={() => setChapterFilter('active')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                        chapterFilter === 'active'
                          ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-600'
                          : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 opacity-70" />
                      {language === 'en' ? 'Active' : 'Aktif'}
                      <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] ${chapterFilter === 'active' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-200/50 dark:bg-slate-800/50 text-slate-500'}`}>{activeCards.length}</span>
                    </button>
                    <button
                      onClick={() => setChapterFilter('inactive')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                        chapterFilter === 'inactive'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-600'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <CircleDashed className="w-3.5 h-3.5 opacity-70" />
                      {language === 'en' ? 'Inactive' : 'Nonaktif'}
                      <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] ${chapterFilter === 'inactive' ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' : 'bg-slate-200/50 dark:bg-slate-800/50 text-slate-500'}`}>{chapterCards.length - activeCards.length}</span>
                    </button>
                  </div>

                  {/* Right: Search + Bulk Mode Toggle */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 sm:flex-initial">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder={language === 'en' ? 'Search cards in chapter...' : 'Cari kartu di bab ini...'}
                        value={chapterCardSearch}
                        onChange={(e) => setChapterCardSearch(e.target.value)}
                        className="w-full sm:w-52 pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      />

                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsBulkMode(!isBulkMode);
                        setSelectedCardIds(new Set());
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                        isBulkMode
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                      title={language === 'en' ? 'Toggle bulk operations' : 'Buka menu aksi massal kartu'}
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">
                        {language === 'en' ? (isBulkMode ? 'Done' : 'Bulk Action') : (isBulkMode ? 'Selesai' : 'Aksi Massal')}
                      </span>
                    </button>

                  </div>

                </div>

                {/* Cards List / Grid */}
                {filteredCards.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-slate-200/80 dark:border-slate-800">
                    <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      {chapterCards.length === 0 
                        ? (language === 'en' ? 'No cards in this chapter yet' : 'Belum ada kartu di bab ini')
                        : (language === 'en' ? 'No cards match the filter' : 'Tidak ada kartu yang cocok dengan filter')}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                      {chapterCards.length === 0 
                        ? (language === 'en' ? 'Add flashcards with questions and answers to begin learning this chapter.' : 'Tambahkan kartu tanya-jawab untuk mulai menguasai bab ini.')
                        : (language === 'en' ? 'Try changing your filter tabs or search keywords.' : 'Coba ganti tab filter atau kata kunci pencarian.')}
                    </p>
                    {!isCurrentBookReadonly && chapterCards.length === 0 && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedChapterIdForItem(currentChapter.id === '__unassigned__' ? '' : currentChapter.id);
                            setIsAIImportOpen(true);
                          }}
                          className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          {language === 'en' ? 'AI Generate' : 'Buat dgn AI'}
                        </button>
                        <button
                        onClick={() => {
                          setSelectedChapterIdForItem(currentChapter.id === '__unassigned__' ? '' : currentChapter.id);
                          setIsNewItemOpen(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
                      >
                        {language === 'en' ? 'Add First Card' : 'Tambah Kartu Pertama'}
                      </button>

                      </div>
                    )}

                  </div>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={filteredCards.map(i => i.id)} strategy={rectSortingStrategy}>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {filteredCards.map(item => (
                          <SortableItemWrapper
                            key={item.id}
                            activeMenuId={activeMenuId}
                            setActiveMenuId={setActiveMenuId}
                            isReadonly={isCurrentBookReadonly}
                            item={item}
                            isBulkMode={isBulkMode}
                            isSelected={selectedCardIds.has(item.id)}
                            onToggleSelect={() => {
                              setSelectedCardIds(prev => {
                                const next = new Set(prev);
                                if (next.has(item.id)) next.delete(item.id);
                                else next.add(item.id);
                                return next;
                              });
                            }}
                            onMove={() => {
                              setMovingItem(item);
                              setMovingChapter(null);
                              setTargetMoveChapterId(item.chapterId || '__unassigned__');
                              setIsMoveModalOpen(true);
                            }}
                            onPreview={() => setPreviewItem(item)}
                            onEdit={() => setEditingItem(item)}
                            onActivate={() => activateItem(item.id)}
                            onDeactivate={() => deactivateItem(item.id)}
                            onReview={(rating: 1 | 2 | 3 | 4) => reviewItem(item.id, rating)}
                            onDelete={() => deleteItem(item.id)}
                            language={language}
                          />
                        ))}

                      </div>
                    </SortableContext>
                  </DndContext>
                )}

              </div>
            );
          })()}

        </div>
      )}

      {/* Dialog: New Book */}
      <BookFormModal 
        isOpen={isNewBookOpen || !!editingBook}
        onClose={() => { setIsNewBookOpen(false); setEditingBook(null); }}
        onSubmit={async (data) => {
          if (editingBook) {
            await updateBook(editingBook.id, data);
          } else {
            const created = await createBook(data);
            if (created) {
              setSelectedBook(created);
            }
          }
          setIsNewBookOpen(false);
          setEditingBook(null);
        }}
        initialData={editingBook || undefined}
        language={language}
      />

      {/* Dialog: New Chapter */}
      {isNewChapterOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {editingChapter 
                ? (language === 'en' ? 'Edit Chapter' : 'Edit Bab')
                : (language === 'en' ? (parentChapterIdForNew ? 'Add Subchapter' : 'Add Chapter') : (parentChapterIdForNew ? 'Tambah Subbab' : 'Tambah Bab'))}
            </h3>
            <form onSubmit={handleCreateChapter} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Chapter Title *' : 'Judul Bab *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === 'en' ? 'e.g. Chapter 1: Foundations' : 'mis. Bab 1: Dasar-dasar'}
                  value={chapterForm.title}
                  onChange={e => setChapterForm({ ...chapterForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Description (Optional)' : 'Deskripsi (Opsional)'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'en' ? 'Summary of this chapter...' : 'Ringkasan bab ini...'}
                  value={chapterForm.description}
                  onChange={e => setChapterForm({ ...chapterForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsNewChapterOpen(false); setEditingChapter(null); setParentChapterIdForNew(null); }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm"
                >
                  Add Chapter
                </button>

              </div>
            </form>

          </div>

        </div>
      )}

      {/* Dialog: New Item Card */}
      {isAIBookBuilderOpen && (
        <AIBookBuilderModal
          language={language}
          onClose={() => setIsAIBookBuilderOpen(false)}
          onImport={async (bookData) => {
            const newBook = await createBook({
              title: bookData.title || (language === 'en' ? 'Generated Book' : 'Buku Baru'),
              description: bookData.description || '',
              coverUrl: '',
              isPublic: false
            });
            const newBookId = newBook.id;
            
            if (bookData.chapters && Array.isArray(bookData.chapters)) {
              for (let chIndex = 0; chIndex < bookData.chapters.length; chIndex++) {
                const ch = bookData.chapters[chIndex];
                const newChapter = await createChapter({
                  bookId: newBookId,
                  title: ch.title || `Chapter ${chIndex+1}`,
                });
                const newChapterId = newChapter.id;
                
                if (ch.cards && Array.isArray(ch.cards)) {
                  for (const card of ch.cards) {
                    await createItem({
                      bookId: newBookId,
                      chapterId: newChapterId,
                      question: normalizeBilingualText(card.question),
                      answer: normalizeBilingualText(card.answer),
                    });
                  }
                }
              }
            }
            
            setIsAIBookBuilderOpen(false);
          }}
        />
      )}
      {isAIImportOpen && (
        <AIImportModal
          language={language}
          onClose={() => setIsAIImportOpen(false)}
          onImport={(cards) => {
            cards.forEach((card) => {
              createItem({
                bookId: selectedBook!.id,
                chapterId: selectedChapterIdForItem || undefined,
                question: normalizeBilingualText(card.question),
                answer: normalizeBilingualText(card.answer),
                tags: []
              });
            });
            setIsAIImportOpen(false);
          }}
        />
      )}
      <ItemFormModal
        isOpen={isNewItemOpen || !!editingItem}
        onClose={() => { setIsNewItemOpen(false); setEditingItem(null); }}
        onSubmit={(data, keepOpen) => {
          if (editingItem) {
            updateItem(editingItem.id, data);
            setEditingItem(null);
            setIsNewItemOpen(false);
          } else if (selectedBook) {
            createItem({
              bookId: selectedBook.id,
              ...data,
              tags: []
            });
            if (!keepOpen) {
              setIsNewItemOpen(false);
            }
          }
        }}
        chapters={bookChapters}
        initialData={editingItem || undefined}
        initialChapterId={selectedChapterIdForItem}
        language={language}
      />




      {/* Dialog: Export JSON */}
      

      {/* Item Preview Modal */}
      {(() => {
        const previewList = currentChapter?.id === '__unassigned__'
          ? bookItems.filter(i => !i.chapterId || !bookChapters.some(c => c.id === i.chapterId))
          : (currentChapter ? bookItems.filter(i => i.chapterId === currentChapter.id) : bookItems);
        const pIdx = previewItem ? previewList.findIndex(i => i.id === previewItem.id) : -1;
        const nextPreviewItem = pIdx >= 0 && pIdx < previewList.length - 1 ? previewList[pIdx + 1] : undefined;
        const prevPreviewItem = pIdx > 0 ? previewList[pIdx - 1] : undefined;


  return (
          <ItemPreviewModal
            item={previewItem}
            isOpen={Boolean(previewItem)}
            onClose={() => setPreviewItem(null)}
            onNavigateNext={nextPreviewItem ? () => setPreviewItem(nextPreviewItem) : undefined}
            onNavigatePrev={prevPreviewItem ? () => setPreviewItem(prevPreviewItem) : undefined}
            onActivate={() => {
              if (previewItem) {
                activateItem(previewItem.id);
                setPreviewItem({ ...previewItem, isActive: true });
              }
            }}
            onDeactivate={() => {
              if (previewItem) {
                deactivateItem(previewItem.id);
                setPreviewItem({ ...previewItem, isActive: false });
              }
            }}
            language={language}
          />
        );
      })()}

      {/* Curated Library Modal */}
      <LibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
      />

      <PublishModal
        isOpen={isPublishOpen}
        onClose={() => {
          setIsPublishOpen(false);
          setPublishPreselectedId(null);
        }}
        preselectedBookId={publishPreselectedId}
      />

      {/* Move Chapter / Item Modal */}
      <FolderMoveModal
        isOpen={isMoveModalOpen}
        onClose={() => {
          setIsMoveModalOpen(false);
          setMovingItem(null);
          setMovingChapter(null);
        }}
        onConfirm={handleConfirmMove}
        targetMoveChapterId={targetMoveChapterId}
        setTargetMoveChapterId={setTargetMoveChapterId}
        chapters={chapters}
        items={items}
        movingItem={movingItem}
        movingChapter={movingChapter}
        selectedCount={selectedCardIds.size}
        language={language}
      />

      {/* Review Modal */}
      <PersonalReviewModal
        isOpen={isReviewOpen}
        onClose={() => {
          setIsReviewOpen(false);
          setReviewSpecificBookId(null);
        }}
        specificBookId={selectedBook ? selectedBook.id : (reviewSpecificBookId || undefined)}
        specificChapterId={currentChapter && currentChapter.id !== '__unassigned__' ? currentChapter.id : undefined}
      />

      {/* Per-Book Review Schedule Calendar Modal */}
      {calendarBook && (
        <BookReviewCalendarModal
          isOpen={isBookCalendarOpen}
          onClose={() => setIsBookCalendarOpen(false)}
          book={calendarBook}
          allBooks={books}
          onSelectBook={(newBook) => {
            setCalendarBook(newBook);
            setCalendarChapterFilter(null);
          }}
          items={items}
          chapters={chapters.filter(c => c.bookId === calendarBook.id)}
          language={language}
          initialChapterFilter={calendarChapterFilter}
          onStartReview={(chapterId) => {
            setIsBookCalendarOpen(false);
            setReviewSpecificBookId(calendarBook.id);
            setSelectedBook(calendarBook);
            if (chapterId) {
              const ch = chapters.find(c => c.id === chapterId);
              if (ch) setSelectedChapter(ch);
            }
            setIsReviewOpen(true);
          }}
          onPreviewItem={(item) => {
            setPreviewItem(item);
          }}
        />
      )}

      {/* Global Flashcard Search Modal across all books */}
      <GlobalCardSearchModal
        isOpen={isGlobalCardSearchOpen}
        onClose={() => setIsGlobalCardSearchOpen(false)}
        books={books}
        items={items}
        chapters={chapters}
        language={language}
        onSelectCard={(item, book, chapter) => {
          setSelectedBook(book);
          if (chapter) {
            setSelectedChapter(chapter);
          } else {
            setSelectedChapter(null);
          }
          setPreviewItem(item);
        }}
      />
      {/* Join Class Code Modal Dialog */}
      {isJoinClassModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 text-left relative">
            <button
              onClick={() => {
                setIsJoinClassModalOpen(false);
                setCodeInputValue('');
                setJoinMessage(null);
              }}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {language === 'en' ? 'Join Class with Code' : 'Gabung Kelas dengan Kode'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'en' ? 'Enter the class invitation code provided by your teacher.' : 'Masukkan kode undangan kelas dari pengajar Anda.'}
                </p>
              </div>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleJoinClass();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {language === 'en' ? 'Class Code' : 'Kode Kelas'}
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    autoFocus
                    placeholder={language === 'en' ? 'e.g. BOOK-89AB' : 'contoh: BOOK-89AB'}
                    value={codeInputValue}
                    onChange={(e) => setCodeInputValue(e.target.value.toUpperCase())}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold tracking-wider text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase placeholder:normal-case placeholder:font-normal placeholder:tracking-normal"
                  />
                </div>
                {joinMessage && (
                  <p className={`text-xs mt-2 ml-1 font-medium ${joinMessage.isError ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {joinMessage.text}
                  </p>
                )}
              </div>

              <div className="flex gap-2.5 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsJoinClassModalOpen(false);
                    setCodeInputValue('');
                    setJoinMessage(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {language === 'en' ? 'Cancel' : 'Batal'}
                </button>
                <button
                  type="submit"
                  disabled={!codeInputValue.trim()}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{language === 'en' ? 'Join Class' : 'Gabung Kelas'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDialog?.isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 text-center">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {language === 'en' ? 'Confirmation' : 'Konfirmasi'}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              {confirmDialog.message}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {language === 'en' ? 'Cancel' : 'Batal'}
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-sm transition-colors cursor-pointer"
              >
                {language === 'en' ? 'Yes' : 'Ya'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface ItemRowProps {
  activeMenuId: string | null;
  setActiveMenuId: (id: string | null) => void;
  isReadonly?: boolean;
  item: BookItem;
  onPreview: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onReview?: (rating: 1 | 2 | 3 | 4) => void;
  onDelete: () => void;
  onMove?: () => void;
  isBulkMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  language: 'en' | 'id';
}


const SortableItemWrapper = (props: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: props.item.id, disabled: props.isReadonly });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : (props.activeMenuId === `item-${props.item.id}` ? 50 : undefined),
    position: (isDragging || props.activeMenuId === `item-${props.item.id}`) ? 'relative' : undefined,
    opacity: isDragging ? 0.9 : 1,
    boxShadow: isDragging ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' : undefined,
    scale: isDragging ? '1.02' : '1',
    touchAction: 'manipulation', // Allows scroll but handles drag
    WebkitUserSelect: 'none',
    WebkitTouchCallout: 'none',
  };


  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="select-none">
      <ItemCardRow {...props} />

      {/* Audio Recorder Drawer ends here */}
    </div>
  );
};

const ItemCardRow: React.FC<ItemRowProps & { onEdit: () => void }> = ({
  item,
  onPreview,
  onEdit,
  onActivate,
  onDeactivate,
  onReview,
  onDelete,
  onMove,
  isBulkMode,
  isSelected,
  onToggleSelect,
  language,
  activeMenuId,
  setActiveMenuId,
  isReadonly
}) => {
  const [showInlineAnswer, setShowInlineAnswer] = useState(false);
  const [justReviewedRating, setJustReviewedRating] = useState<number | null>(null);
  const [showAudio, setShowAudio] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);

  useEffect(() => {
    let mounted = true;
    AudioStorageService.hasAudio(item.id).then(exists => {
      if (mounted) setHasAudio(exists);
    });

    const handleAudioChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ itemId: string | number }>;
      if (String(customEvent.detail?.itemId) === String(item.id)) {
        AudioStorageService.hasAudio(item.id).then(exists => {
          if (mounted) setHasAudio(exists);
        });
      }
    };

    window.addEventListener('audio-updated', handleAudioChange);

  return () => {
      mounted = false;
      window.removeEventListener('audio-updated', handleAudioChange);
    };
  }, [item.id]);

  const isDueToday = item.isActive && (!item.fsrsData.nextReview || new Date(item.fsrsData.nextReview) <= new Date());
  const reviewedToday = isReviewedToday(item.fsrsData.lastReview);
  const showDimmed = reviewedToday && !isDueToday;
  const intervalDays = getNonQuranIntervalDays(item.fsrsData);
  const isMapan = item.isActive && intervalDays >= 300;
  const intervals = predictNonQuranIntervals(item.fsrsData);
  
  const formatDate = (d: string | null) => {
    if (!d) return language === 'en' ? 'Today' : 'Hari ini';
    const nextDate = new Date(d);
    const now = new Date();
    const formatted = nextDate.toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', { month: 'short', day: 'numeric' });
    if (nextDate <= now) {
      return language === 'en' ? `Today (${formatted})` : `Hari ini (${formatted})`;
    }
    return formatted;
  };

  const getFullDueDateStr = (d: string | null) => {
    if (!d) return language === 'en' ? 'Today' : 'Hari ini';
    const nextDate = new Date(d);
    return nextDate.toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const menuId = `item-${item.id}`;
  const isMenuOpen = activeMenuId === menuId;


  return (
    <div className={`group relative p-3 sm:p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 ${isMenuOpen ? 'z-50 ring-2 ring-indigo-500/20' : ''} ${
      isSelected
        ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 ring-2 ring-indigo-500/30 shadow-2xs'
        : isDueToday
        ? 'border-amber-300/90 bg-amber-50/25 dark:bg-amber-950/20 dark:border-amber-700/60 shadow-2xs'
        : showDimmed
        ? 'border-emerald-200/50 bg-emerald-50/10 dark:bg-emerald-950/10 dark:border-emerald-800/30 opacity-75 grayscale-[20%]'
        : item.isActive
        ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-700'
        : 'border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 opacity-80 hover:opacity-100'
    }`}>
      
      {/* Top Header: Checkbox (if bulk) + 1-Tap Activation Pill + Due Status + Pop-up Eye (Mata 1) + Menu */}
      <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Bulk Selection Checkbox */}
          {isBulkMode && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggleSelect?.(); }}
              className="p-1 rounded-md text-indigo-600 hover:scale-105 transition-transform shrink-0"
              title={isSelected ? 'Deselect' : 'Select'}
            >
              {isSelected ? (
                <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
            </button>
          )}

          {/* Prominent 1-Tap Activation Pill */}
          <button
            onClick={(e) => { e.stopPropagation(); item.isActive ? onDeactivate() : onActivate(); }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 active:scale-95 group/act ${
              item.isActive
                ? 'bg-emerald-600 hover:bg-rose-600 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-emerald-600 hover:text-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
            title={item.isActive 
              ? (language === 'en' ? 'Card is Active (click to deactivate)' : 'Kartu Aktif (klik untuk menonaktifkan)')
              : (language === 'en' ? 'Card is Inactive (click to activate)' : 'Kartu Nonaktif (klik untuk mengaktifkan)')
            }
          >
            {item.isActive ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 group-hover/act:hidden" />
                <Power className="w-3.5 h-3.5 hidden group-hover/act:inline" />
                <span className="group-hover/act:hidden">{language === 'en' ? 'Active' : 'Aktif'}</span>
                <span className="hidden group-hover/act:inline">{language === 'en' ? 'Deactivate' : 'Nonaktifkan'}</span>
              </>
            ) : (
              <>
                <Power className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Activate' : 'Aktifkan'}</span>
              </>
            )}
          </button>

          {/* Due Today indicator */}
          {isDueToday && (
            <span className="px-2 py-0.5 rounded-md bg-amber-100/90 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 font-bold text-[10px] flex items-center gap-1 border border-amber-200 dark:border-amber-800/60">
              <Flame className="w-3 h-3 text-amber-500" />
              {language === 'en' ? 'Due Today' : 'Perlu Review'}
            </span>
          )}

          {/* Mapan Badge (>300 Hari) */}
          {isMapan && (
            <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-[10px] border border-amber-300 dark:border-amber-700 flex items-center gap-1">
              <Award className="w-3 h-3 text-amber-500" />
              {language === 'en' ? 'Mastered (>300d)' : 'Mapan (>300d)'}
            </span>
          )}

        </div>

        {/* Right Header Actions: Ikon Mata 1 (Lihat Lengkap via Pop-up Modal) + Menu */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onPreview(); }}
            className="px-2.5 py-1 rounded-lg bg-indigo-50/80 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-semibold text-[11px] flex items-center gap-1 border border-indigo-200/50 dark:border-indigo-800/40 transition-colors cursor-pointer"
            title={language === 'en' ? 'Open popup viewer' : 'Buka jendela pop-up lengkap'}
          >
            <Eye className="w-3.5 h-3.5 text-indigo-500" />
            <span>{language === 'en' ? 'Pop-up' : 'Lihat'}</span>
          </button>

          {!isReadonly && (
            <div className="relative shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === menuId ? null : menuId); }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              
              {activeMenuId === menuId && (
                <div 
                  className="absolute right-0 top-full mt-1 w-28 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-1 z-30 text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => { setActiveMenuId(null); onEdit(); }}
                    className="w-full text-left px-3 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{language === 'en' ? 'Edit' : 'Edit'}</span>
                  </button>
                  <button
                    onClick={() => { setActiveMenuId(null); onDelete(); }}
                    className="w-full text-left px-3 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Delete' : 'Hapus'}</span>
                  </button>

                </div>
              )}

            </div>
          )}

        </div>

      </div>

      {/* Main Content: Question Body */}
      <div 
        className="flex items-start gap-3 cursor-pointer py-0.5 group/content"
        onClick={(e) => {
          if (isBulkMode) {
            e.stopPropagation();
            onToggleSelect?.();
          } else {
            onPreview();
          }
        }}
        title={isBulkMode 
          ? (language === 'en' ? 'Click to select/deselect' : 'Klik untuk memilih kartu')
          : (language === 'en' ? 'Click to open pop-up preview' : 'Klik untuk melihat pop-up lengkap')}
      >
        {/* Thumbnail Image if available */}
        {item.imageQ && (
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-50 dark:bg-slate-800 shrink-0 overflow-hidden flex items-center justify-center shadow-2xs border border-slate-200/70 dark:border-slate-700">
            <img src={item.imageQ} className="w-full h-full object-cover group-hover/content:scale-105 transition-transform" alt="Media" />

          </div>
        )}

        {/* Text Content */}
        <div className="flex-1 min-w-0">
          <BilingualCardText 
            text={item.question}
            type="question"
            variant="card-list"
            emptyFallback={language === 'en' ? '[Image Only]' : '[Hanya Gambar]'}
          />
        </div>

      </div>

      {/* Answer Area: (Inline Reveal when eye icon is clicked) */}
      {showInlineAnswer && (
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
          {/* Formatted Answer Body */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
            {item.imageA && (
              <div className="mb-2 max-h-36 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                <img src={item.imageA} alt="Answer Media" className="w-full h-full object-cover" />

              </div>
            )}
            <BilingualCardText 
              text={item.answer}
              type="answer"
              variant="card-list"
              emptyFallback={language === 'en' ? '[No text answer]' : '[Tidak ada teks jawaban]'}
            />

          </div>

        </div>
      )}


      {/* 4 Tombol Evaluasi Kartu */}
      {item.isActive ? (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="grid grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                soundEffects.playRatingFeedback(1);
                onReview?.(1);
                setJustReviewedRating(1);
                setTimeout(() => setJustReviewedRating(null), 1500);
              }}
              className={`py-1.5 px-1 rounded-lg border text-center transition-all flex flex-col items-center justify-center cursor-pointer shadow-2xs ${
                justReviewedRating === 1
                  ? 'bg-rose-600 text-white border-rose-600 ring-2 ring-rose-400'
                  : 'border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300'
              }`}
              title={language === 'en' ? 'Review again tomorrow' : 'Lupa total / Ulang lagi'}
            >
              <span className="text-[11px] font-bold leading-tight">{language === 'en' ? 'Again' : 'Lagi'}</span>
              <span className="text-[9px] font-semibold opacity-85 mt-0.5">{intervals.again}</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                soundEffects.playRatingFeedback(2);
                onReview?.(2);
                setJustReviewedRating(2);
                setTimeout(() => setJustReviewedRating(null), 1500);
              }}
              className={`py-1.5 px-1 rounded-lg border text-center transition-all flex flex-col items-center justify-center cursor-pointer shadow-2xs ${
                justReviewedRating === 2
                  ? 'bg-amber-600 text-white border-amber-600 ring-2 ring-amber-400'
                  : 'border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300'
              }`}
              title={language === 'en' ? 'Hard to recall' : 'Ingat dengan susah payah'}
            >
              <span className="text-[11px] font-bold leading-tight">{language === 'en' ? 'Hard' : 'Sulit'}</span>
              <span className="text-[9px] font-semibold opacity-85 mt-0.5">{intervals.hard}</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                soundEffects.playRatingFeedback(3);
                onReview?.(3);
                setJustReviewedRating(3);
                setTimeout(() => setJustReviewedRating(null), 1500);
              }}
              className={`py-1.5 px-1 rounded-lg border text-center transition-all flex flex-col items-center justify-center cursor-pointer shadow-2xs ${
                justReviewedRating === 3
                  ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-400'
                  : 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
              }`}
              title={language === 'en' ? 'Good recall' : 'Ingat dengan baik'}
            >
              <span className="text-[11px] font-bold leading-tight">{language === 'en' ? 'Good' : 'Baik'}</span>
              <span className="text-[9px] font-semibold opacity-85 mt-0.5">{intervals.good}</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                soundEffects.playRatingFeedback(4);
                onReview?.(4);
                setJustReviewedRating(4);
                setTimeout(() => setJustReviewedRating(null), 1500);
              }}
              className={`py-1.5 px-1 rounded-lg border text-center transition-all flex flex-col items-center justify-center cursor-pointer shadow-2xs ${
                justReviewedRating === 4
                  ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-400'
                  : 'border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/70 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
              }`}
              title={language === 'en' ? 'Easy recall' : 'Sangat mudah / Refleks langsung hafal'}
            >
              <span className="text-[11px] font-bold leading-tight">{language === 'en' ? 'Easy' : 'Mudah'}</span>
              <span className="text-[9px] font-semibold opacity-85 mt-0.5">{intervals.easy}</span>
            </button>

          </div>

        </div>
      ) : (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 italic">
            {language === 'en' ? 'Activate card to enable scheduled review' : 'Aktifkan kartu untuk mulai jadwal review'}
          </span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onActivate(); }}
            className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-[11px] font-semibold flex items-center gap-1 shadow-2xs hover:bg-indigo-700 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>{language === 'en' ? 'Activate' : 'Aktifkan'}</span>
          </button>
        </div>
      )}
      
      {/* Bottom Row: Learning Metrics (Api, Otak, Kalender) & Ikon Mata Buka/Tutup Jawaban di Pojok Kanan Bawah */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60 text-xs">
        {item.isActive ? (
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <div 
              className="flex items-center gap-1" 
              title={language === 'en' ? `Reviewed: ${item.fsrsData.reps} times` : `Direview: ${item.fsrsData.reps} kali`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{item.fsrsData.reps}×</span>

            </div>
            <div 
              className="flex items-center gap-1" 
              title={language === 'en' ? `Calculated Interval: ${intervalDays} days` : `Interval terhitung: ${intervalDays} hari`}
            >
              <Brain className="w-3.5 h-3.5 text-purple-500 shrink-0" />
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{intervalDays}d</span>

            </div>
            <div 
              className="flex items-center gap-1" 
              title={language === 'en' ? `Due Date: ${getFullDueDateStr(item.fsrsData.nextReview)}` : `Jatuh tempo: ${getFullDueDateStr(item.fsrsData.nextReview)}`}
            >
              <CalendarClock className={`w-3.5 h-3.5 shrink-0 ${isDueToday ? 'text-amber-500' : 'text-sky-500'}`} />
              <span className={`text-[11px] font-semibold ${isDueToday ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                {formatDate(item.fsrsData.nextReview)}
              </span>

            </div>

            {/* Saved feedback */}
            {justReviewedRating && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5 animate-pulse ml-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {language === 'en' ? 'Saved!' : 'Tersimpan!'}
              </span>
            )}

          </div>
        ) : (
          <div className="text-[11px] text-slate-400 italic">
            {language === 'en' ? 'Card inactive (not in daily review)' : 'Nonaktif (tidak masuk review harian)'}

          </div>
        )}

        {/* Pojok Kanan Bawah: Tags + Ikon Mata Buka/Tutup Jawaban (Jempol Kanan) */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          {/* Audio Recording & Playback button */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowAudio(!showAudio); }}
            className={`relative w-7 h-7 rounded-full border flex items-center justify-center transition-all shadow-2xs cursor-pointer hover:scale-105 active:scale-95 ${
              hasAudio 
                ? 'bg-indigo-50 border-indigo-300 text-indigo-600 dark:bg-indigo-950/60 dark:border-indigo-700 dark:text-indigo-300 shadow-indigo-500/10' 
                : showAudio
                ? 'bg-slate-200 border-slate-300 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-white'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700'
            }`}
            title={language === 'en' ? 'Voice Recording' : 'Rekaman Suara'}
          >
            <Mic className="w-3 h-3" />
            {hasAudio && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {item.tags && item.tags.length > 0 && (
            <div className="hidden sm:flex items-center gap-1 overflow-hidden">
              {item.tags.slice(0, 1).map((t, idx) => (
                <span key={idx} className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 truncate max-w-[60px]">
                  #{t}
                </span>
              ))}

            </div>
          )}

          {/* Ikon Mata Buka/Tutup Jawaban di Sebelah Kanan Bawah */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowInlineAnswer(prev => !prev); }}
            className={`px-2 py-0.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 text-[11px] font-medium shadow-2xs ${
              showInlineAnswer
                ? 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300 border-slate-200 dark:border-slate-700'
            }`}
            title={showInlineAnswer 
              ? (language === 'en' ? 'Hide answer' : 'Tutup jawaban') 
              : (language === 'en' ? 'Show answer' : 'Buka jawaban')}
          >
            {showInlineAnswer ? <EyeOff className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> : <Eye className="w-3.5 h-3.5 text-slate-500 hover:text-indigo-500" />}
            <span className="text-[10px]">
              {showInlineAnswer 
                ? (language === 'en' ? 'Hide' : 'Tutup') 
                : (language === 'en' ? 'Answer' : 'Jawaban')}
            </span>
          </button>
        </div>
      </div>

      {/* Collapsible Audio Recorder Player Drawer */}
      {showAudio && (
        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <AudioRecorderPlayer 
            itemId={item.id}
            itemType="book"
            itemLabel={language === 'en' ? 'Voice Note' : 'Setoran Suara'}
            language={language} 
            compact={true} 
            onHasRecordingChange={setHasAudio}
          />
        </div>
      )}
    </div>
  );
};

export default PersonalSpace;

