import React, { useState, useEffect } from "react";
import {
  getIntervalDays,
  getNonQuranIntervalDays,
  predictNonQuranIntervals,
  isReviewedToday,
} from "../../lib/fsrs";
import { useApp } from "../../context/AppContext";
import { useSwipeGesture } from "../../hooks/useSwipeGesture";
import { Book, Chapter, BookItem } from "../../types";
import { BookFormModal } from "./BookFormModal";
import { ItemFormModal } from "./ItemFormModal";
import { AIImportModal } from "./AIImportModal";
import { AIBookBuilderModal } from "./AIBookBuilderModal";
import { LibraryModal } from "./LibraryModal";
import { PublishModal } from "./PublishModal";
import { PersonalReviewModal } from "./PersonalReviewModal";
import { ItemPreviewModal } from "./ItemPreviewModal";
import { FolderMoveModal } from "./FolderMoveModal";
import { ActivityHeatmap } from "./ActivityHeatmap";
import { ConfirmModal } from "./ConfirmModal";
import { BookInteractionTracker } from "./BookInteractionTracker";
import { BookReviewCalendarModal } from "./BookReviewCalendarModal";
import { BookReviewForecast7Days } from "./BookReviewForecast7Days";
import { BookCoverVisual } from "./BookCoverVisual";
import { GlobalCardSearchModal } from "./GlobalCardSearchModal";
import { PersonalBookPage } from "./pages/PersonalBookPage";
import {
  PersonalChapterPage,
  type ChapterCardFilter,
} from "./pages/PersonalChapterPage";
import { PersonalSubchapterPage } from "./pages/PersonalSubchapterPage";
import { MemoryMetricGrid } from "../common/MemoryMetricGrid";
import { UnifiedDueCard, DueFilterPill } from "../common/UnifiedDueCard";
import { AudioStorageService } from "../../lib/AudioStorageService";
import { AudioRecorderPlayer } from "../shared/AudioRecorderPlayer";
import { soundEffects } from "../../lib/soundFeedback";
import { BilingualCardText } from "../common/BilingualCardText";
import { normalizeBilingualText } from "../../utils/bilingualHelper";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AiEditingIcon,
  Book02Icon,
  BookCopyIcon,
  BookDashedIcon,
  BookMarkedIcon,
  Books02Icon,
  BookUp2Icon,
  ClockAlertIcon,
  SwatchBookIcon,
  WalletCardsIcon,
} from "@hugeicons/core-free-icons";
import {
  Dialog,
  Modal,
  ModalOverlay,
} from "@/components/application/modals/modal";
import { InlineAlert } from "@/components/base/alert/alert";
import { toast } from "sonner";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { CloseButton } from "@/components/base/buttons/close-button";
import { Input } from "@/components/base/input/input";
import { TextArea } from "@/components/base/textarea/textarea";
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  Edit3,
  Pencil,
  MoreVertical,
  ArrowLeft,
  FolderPlus,
  Sparkles,
  Clock,
  BookOpen,
  ChevronDown,
  ChevronRight,
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
  FolderOpen,
  MoveRight,
  Award,
  X,
  MessageSquare,
  LogOut,
  ShieldCheck,
  KeyRound,
  LogIn,
  BookPublish,
  Calendar,
  RotateCw,
} from "@/components/foundations/hugeicons";

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
  onExitEmbedded,
}) => {
  const {
    books,
    setBooks,
    library,
    chapters,
    items,
    personalStats,
    activateItem,
    deactivateItem,
    reviewItem,
    createBook,
    updateBook,
    deleteBook,
    createChapter,
    updateChapter,
    deleteChapter,
    createItem,
    updateItem,
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
    userProfile,
    fetchClasses,
  } = useApp();

  useEffect(() => {
    void fetchClasses();
  }, [fetchClasses]);

  const handleTriggerNewBook = () => {
    const check = isFeatureAllowed("create_book");
    if (!check.allowed) {
      openUpgradeModal(
        check.reason,
        language === "en"
          ? `Free tier allows up to ${check.limit} personal books. Upgrade to Unlupa Pro for unlimited modules & books.`
          : `Batas akun Free adalah maksimal ${check.limit} buku pribadi. Upgrade ke Unlupa Pro untuk membuat materi tanpa batas.`,
      );
      return;
    }
    setIsNewBookOpen(true);
  };

  const handleTriggerAIBuilder = () => {
    const check = isFeatureAllowed("ai_builder");
    if (!check.allowed) {
      openUpgradeModal(
        check.reason,
        language === "en"
          ? `Free daily AI generation quota is ${check.limit}x/day. Upgrade to Unlupa Pro for up to 30 generations/day.`
          : `Batas harian AI Builder akun Free adalah ${check.limit}x per hari. Upgrade ke Unlupa Pro untuk kuota hingga 30x/hari.`,
      );
      return;
    }
    setIsAIBookBuilderOpen(true);
  };

  const handleTriggerAIImport = () => {
    const check = isFeatureAllowed("ai_extractor");
    if (!check.allowed) {
      openUpgradeModal(
        check.reason,
        language === "en"
          ? "Smart AI Extractor is exclusive to Unlupa Pro. Upgrade to extract flashcards automatically."
          : "Smart AI Extractor adalah fitur eksklusif Unlupa Pro. Upgrade sekarang untuk membuat materi otomatis.",
      );
      return;
    }
    setIsAIImportOpen(true);
  };

  // Active classes only (excluding closed classes)
  const activeTeachingClasses = teachingClasses.filter(
    (c) => c.status !== "closed",
  );
  const activeJoinedClasses = myClasses.filter((c) => c.status !== "closed");
  const activeClassIds = new Set<string>([
    ...activeTeachingClasses.map((c) => c.id),
    ...activeJoinedClasses.map((c) => c.id),
  ]);

  const assignedBookIds = new Set<string>();
  activeTeachingClasses.forEach((c) => {
    c.assignedBookIds?.forEach((id) => assignedBookIds.add(id));
  });

  const joinedBookIds = new Set<string>();
  activeJoinedClasses.forEach((c) => {
    c.assignedBookIds?.forEach((id) => joinedBookIds.add(id));
  });

  const isBookInActiveClass = (b: Book): boolean => {
    if (b.category === "class") return true;
    if (b.classId && (activeClassIds.has(b.classId) || activeClassIds.size === 0)) return true;
    if (b.id.startsWith("class-book-")) return true;
    if (joinedBookIds.has(b.id) || assignedBookIds.has(b.id)) return true;
    return false;
  };

  const [selectedBookId, setSelectedBookId] = useState<string | null>(
    initialBookId || null,
  );

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

  const resolvedBookFromLibrary = selectedBookId
    ? library.find(
        (l) =>
          l.book.id === selectedBookId ||
          l.id === selectedBookId ||
          `lib-book-${l.id.replace("lib-", "")}` === selectedBookId,
      )?.book
    : null;

  const selectedBook =
    books.find((b) => b.id === selectedBookId) ||
    (resolvedBookFromLibrary
      ? ({
          ...resolvedBookFromLibrary,
          category: "class" as const,
          isReadonly: true,
        } as Book)
      : null) ||
    (selectedBookId && classBanner
      ? ({
          id: selectedBookId,
          userId: "",
          title: classBanner.className,
          description: `Kitab Kelas ${classBanner.className}`,
          category: "class" as const,
          classId: undefined,
          isReadonly: true,
          isPublic: false,
          authorName: classBanner.teacherName || "Pengajar",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Book)
      : null);

  useEffect(() => {
    if (selectedBook && !books.some((b) => b.id === selectedBook.id)) {
      setBooks((prev: Book[]) => [
        {
          ...selectedBook,
          category: "class" as const,
          isReadonly: true,
        },
        ...prev,
      ]);
    }
  }, [selectedBook, books, setBooks]);
  const setSelectedBook = (b: Book | null) =>
    setSelectedBookId(b ? b.id : null);

  useEffect(() => {
    if (selectedBookId) {
      loadBookTree(selectedBookId);
    }
  }, [selectedBookId, loadBookTree]);

  useEffect(() => {
    if (
      spaceResetCounter?.space === "personal" &&
      spaceResetCounter.count > 0
    ) {
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
      setChapterCardSearch("");
      setTocSearch("");
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
  const [publishPreselectedId, setPublishPreselectedId] = useState<
    string | null
  >(null);
  const [activeBookTab, setActiveBookTab] = useState<"personal" | "imported">(
    "personal",
  );
  const [isJoinClassModalOpen, setIsJoinClassModalOpen] = useState(false);
  const [isJoiningClass, setIsJoiningClass] = useState(false);
  const [codeInputValue, setCodeInputValue] = useState("");
  const [joinMessage, setJoinMessage] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);
  const [classToLeave, setClassToLeave] = useState<string | null>(null);

  const handleJoinClass = async () => {
    const cleanCode = codeInputValue.trim();
    if (!cleanCode) {
      setJoinMessage({
        text:
          language === "en"
            ? "Class code cannot be empty"
            : "Kode kelas tidak boleh kosong",
        isError: true,
      });
      return;
    }
    setIsJoiningClass(true);
    try {
      const res = await joinClassByCode(cleanCode);
      if (res.success) {
        setJoinMessage({ text: res.message, isError: false });
        setTimeout(() => {
          setCodeInputValue("");
          setJoinMessage(null);
          setIsJoinClassModalOpen(false);
        }, 1400);
      } else {
        setJoinMessage({ text: res.message, isError: true });
      }
    } catch (error) {
      setJoinMessage({
        text:
          error instanceof Error
            ? error.message
            : language === "en"
              ? "Failed to join class."
              : "Gagal bergabung ke kelas.",
        isError: true,
      });
    } finally {
      setIsJoiningClass(false);
    }
  };

  const closeJoinClassModal = () => {
    if (isJoiningClass) return;
    setIsJoinClassModalOpen(false);
    setCodeInputValue("");
    setJoinMessage(null);
  };

  const handleConfirmLeaveClass = () => {
    if (!classToLeave) return;
    leaveClass(classToLeave);
    setClassToLeave(null);
  };
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewSpecificBookId, setReviewSpecificBookId] = useState<
    string | null
  >(null);
  const [previewItem, setPreviewItem] = useState<BookItem | null>(null);

  // Book Review Calendar Modal state
  const [isBookCalendarOpen, setIsBookCalendarOpen] = useState(false);
  const [calendarBook, setCalendarBook] = useState<Book | null>(null);
  const [calendarChapterFilter, setCalendarChapterFilter] = useState<
    string | null
  >(null);

  // Global Card Search Modal state
  const [isGlobalCardSearchOpen, setIsGlobalCardSearchOpen] = useState(false);

  // Dialogs
  const [isNewBookOpen, setIsNewBookOpen] = useState(false);
  const [isNewChapterOpen, setIsNewChapterOpen] = useState(false);
  const [parentChapterIdForNew, setParentChapterIdForNew] = useState<
    string | null
  >(null);
  const [isNewItemOpen, setIsNewItemOpen] = useState(false);
  const [isAIImportOpen, setIsAIImportOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [editingItem, setEditingItem] = useState<BookItem | null>(null);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(
    null,
  );
  const [virtualSelectedChapter, setVirtualSelectedChapter] =
    useState<Chapter | null>(null);

  const selectedChapter = virtualSelectedChapter
    ? virtualSelectedChapter
    : chapters.find((c) => c.id === selectedChapterId) || null;
  const setSelectedChapter = (c: Chapter | null) => {
    if (c && c.id === "__unassigned__") {
      setVirtualSelectedChapter(c);
      setSelectedChapterId(c.id);
    } else {
      setVirtualSelectedChapter(null);
      setSelectedChapterId(c ? c.id : null);
    }
  };
  const [chapterFilter, setChapterFilter] = useState<ChapterCardFilter>("all");
  const [chapterCardSearch, setChapterCardSearch] = useState("");
  const [tocSearch, setTocSearch] = useState("");
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(
    new Set(),
  );
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [targetMoveChapterId, setTargetMoveChapterId] = useState<string>("");
  const [movingItem, setMovingItem] = useState<BookItem | null>(null);
  const [movingChapter, setMovingChapter] = useState<Chapter | null>(null);
  const [selectedChapterIdForItem, setSelectedChapterIdForItem] =
    useState<string>("");
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(
    new Set(),
  );
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const handleBulkActivate = () => {
    selectedCardIds.forEach((id) => activateItem(id));
    setSelectedCardIds(new Set());
  };

  const handleBulkDeactivate = () => {
    selectedCardIds.forEach((id) => deactivateItem(id));
    setSelectedCardIds(new Set());
  };

  const handleBulkDelete = () => {
    const count = selectedCardIds.size;
    if (count === 0) return;
    setConfirmDialog({
      isOpen: true,
      message:
        language === "en"
          ? `Delete ${count} selected cards?`
          : `Hapus ${count} kartu yang dipilih?`,
      onConfirm: () => {
        selectedCardIds.forEach((id) => deleteItem(id));
        setSelectedCardIds(new Set());
        setIsBulkMode(false);
        setConfirmDialog(null);
      },
    });
  };

  const handleConfirmMove = () => {
    const targetId =
      targetMoveChapterId === "__unassigned__" ? "" : targetMoveChapterId;

    if (movingChapter) {
      if (targetId === movingChapter.id) {
        alert(
          language === "en"
            ? "Cannot move chapter into itself."
            : "Bab tidak bisa dipindah ke dalam dirinya sendiri.",
        );
        return;
      }
      updateChapter(movingChapter.id, {
        parentId: targetId ? targetId : null,
      });
      setMovingChapter(null);
    } else if (movingItem) {
      updateItem(movingItem.id, {
        chapterId: targetId || undefined,
      });
      setMovingItem(null);
    } else if (selectedCardIds.size > 0) {
      selectedCardIds.forEach((id) => {
        updateItem(id, {
          chapterId: targetId || undefined,
        });
      });
      setSelectedCardIds(new Set());
      setIsBulkMode(false);
    }
    setIsMoveModalOpen(false);
    setTargetMoveChapterId("");
  };

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 2000, tolerance: 15 },
    }),
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
        updatedItems[oldIndex] = {
          ...activeItem,
          chapterId: overItem.chapterId,
        };
      }

      updatedItems = arrayMove(updatedItems, oldIndex, newIndex);
      reorderItems(updatedItems);
    }
  };

  const [isAIBookBuilderOpen, setIsAIBookBuilderOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  // Form states
  const [bookForm, setBookForm] = useState({
    title: "",
    description: "",
    coverUrl: "",
    isPublic: false,
  });
  const [chapterForm, setChapterForm] = useState({
    title: "",
    description: "",
  });
  const [itemForm, setItemForm] = useState({
    question: "",
    answer: "",
    tags: "",
    imageQ: "",
    imageA: "",
  });
  const [importJsonText, setImportJsonText] = useState("");
  const [importMessage, setImportMessage] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) => {
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
    setBookForm({ title: "", description: "", coverUrl: "", isPublic: false });
    setIsNewBookOpen(false);
    if (created) setSelectedBook(created);
  };

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook || !chapterForm.title.trim()) return;

    if (editingChapter) {
      await updateChapter(editingChapter.id, {
        title: chapterForm.title,
        description: chapterForm.description,
      });
    } else {
      await createChapter({
        bookId: selectedBook.id,
        title: chapterForm.title,
        description: chapterForm.description,
        parentId: parentChapterIdForNew,
      });
    }

    setChapterForm({ title: "", description: "" });
    setIsNewChapterOpen(false);
    setEditingChapter(null);
    setParentChapterIdForNew(null);
  };

  const closeChapterModal = () => {
    setChapterForm({ title: "", description: "" });
    setIsNewChapterOpen(false);
    setEditingChapter(null);
    setParentChapterIdForNew(null);
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook || !itemForm.question.trim() || !itemForm.answer.trim())
      return;
    const tagsArray = itemForm.tags
      .split(",")
      .map((t) => t.trim())
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

    setItemForm({ question: "", answer: "", tags: "", imageQ: "", imageA: "" });
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
        setImportJsonText("");
        setImportMessage(null);
      }, 1500);
    } else {
      setImportMessage({ text: res.message, isError: true });
    }
  };

  const bookChapters = selectedBook
    ? chapters.filter((c) => c.bookId === selectedBook.id)
    : [];
  const bookItems = selectedBook
    ? items.filter((i) => i.bookId === selectedBook.id)
    : [];
  const currentChapter = virtualSelectedChapter
    ? virtualSelectedChapter
    : selectedChapterId
      ? chapters.find((c) => c.id === selectedChapterId)
      : null;

  // Compute all navigable chapters in order (including unassigned general cards if any)
  const unassignedCount = selectedBook
    ? bookItems.filter(
        (i) => !i.chapterId || !bookChapters.some((c) => c.id === i.chapterId),
      ).length
    : 0;
  const navigableChapters = React.useMemo(() => {
    if (!selectedBook) return [];
    const list = [...bookChapters].sort(
      (a, b) => (a.order || 0) - (b.order || 0),
    );
    if (unassignedCount > 0) {
      list.push({
        id: "__unassigned__",
        bookId: selectedBook.id,
        title:
          language === "en"
            ? "General Cards (No Chapter)"
            : "Kartu Umum (Tanpa Bab)",
        order: 9999,
      });
    }
    return list;
  }, [selectedBook, bookChapters, unassignedCount, language]);

  const currentChapterIdx = currentChapter
    ? navigableChapters.findIndex((c) => c.id === currentChapter.id)
    : -1;
  const prevChapter =
    currentChapterIdx > 0 ? navigableChapters[currentChapterIdx - 1] : null;
  const nextChapter =
    currentChapterIdx >= 0 && currentChapterIdx < navigableChapters.length - 1
      ? navigableChapters[currentChapterIdx + 1]
      : null;

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
      curr = chapters.find((c) => c.id === curr!.parentId);
    }
    return crumbs;
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
      isReviewOpen,
    ),
    onSwipeRight: () => {
      // 1. If single item preview is open, go to previous item or close preview
      if (previewItem) {
        const cCards =
          currentChapter?.id === "__unassigned__"
            ? bookItems.filter(
                (i) =>
                  !i.chapterId ||
                  !bookChapters.some((c) => c.id === i.chapterId),
              )
            : bookItems.filter((i) => i.chapterId === currentChapter?.id);
        const pIdx = cCards.findIndex((i) => i.id === previewItem.id);
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
          setChapterFilter("all");
          setChapterCardSearch("");
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
      setActiveSpace("quran");
    },
    onSwipeLeft: () => {
      // 1. If single item preview is open, go to next item
      if (previewItem) {
        const cCards =
          currentChapter?.id === "__unassigned__"
            ? bookItems.filter(
                (i) =>
                  !i.chapterId ||
                  !bookChapters.some((c) => c.id === i.chapterId),
              )
            : bookItems.filter((i) => i.chapterId === currentChapter?.id);
        const pIdx = cCards.findIndex((i) => i.id === previewItem.id);
        if (pIdx >= 0 && pIdx < cCards.length - 1) {
          setPreviewItem(cCards[pIdx + 1]);
        }
        return;
      }

      // 2. If inside a chapter: swipe left goes to next chapter
      if (currentChapter) {
        if (
          currentChapterIdx >= 0 &&
          currentChapterIdx < navigableChapters.length - 1
        ) {
          setSelectedChapter(navigableChapters[currentChapterIdx + 1]);
          setChapterFilter("all");
          setChapterCardSearch("");
        } else if (currentChapterIdx === navigableChapters.length - 1) {
          // Reached end of book's chapters -> go to next book if exists, or teaching space
          const bIdx = books.findIndex((b) => b.id === selectedBook?.id);
          if (bIdx >= 0 && bIdx < books.length - 1) {
            setSelectedBook(books[bIdx + 1]);
            setSelectedChapter(null);
          } else {
            setActiveSpace("teaching");
          }
        }
        return;
      }

      // 3. If in Book Overview: swipe left opens the first chapter if available
      if (selectedBook) {
        if (navigableChapters.length > 0) {
          setSelectedChapter(navigableChapters[0]);
          setChapterFilter("all");
          setChapterCardSearch("");
        } else {
          const bIdx = books.findIndex((b) => b.id === selectedBook.id);
          if (bIdx >= 0 && bIdx < books.length - 1) {
            setSelectedBook(books[bIdx + 1]);
            setSelectedChapter(null);
          } else {
            setActiveSpace("teaching");
          }
        }
        return;
      }

      // 4. If in Library Root: swipe left goes to Teaching space
      setActiveSpace("teaching");
    },
    threshold: 40,
    minRatio: 1.15,
  });

  useEffect(() => {
    if (
      selectedBook &&
      (selectedBook.category === "class" ||
        Boolean(selectedBook.classId) ||
        selectedBook.id.startsWith("class-book-"))
    ) {
      if (!isBookInActiveClass(selectedBook) && !onExitEmbedded && !initialBookId) {
        setSelectedBook(null);
        setSelectedBookId(null);
      }
    }
  }, [selectedBook, activeClassIds, onExitEmbedded, initialBookId]);

  const isCurrentBookReadonly = selectedBook
    ? (selectedBook.isReadonly && !assignedBookIds.has(selectedBook.id)) ||
      (onExitEmbedded && !isEmbeddedTeacherView) ||
      (joinedBookIds.has(selectedBook.id) &&
        !assignedBookIds.has(selectedBook.id) &&
        !isEmbeddedTeacherView) ||
      (selectedBook.userId ? selectedBook.userId !== userProfile.id : false)
    : false;

  const personalBookCount = books.filter(
    (book) => !isBookInActiveClass(book) && !book.isReadonly,
  ).length;
  const importedBookCount = books.filter(
    (book) => !isBookInActiveClass(book) && book.isReadonly,
  ).length;
  const visibleBooks = books
    .filter((book) => !isBookInActiveClass(book))
    .filter((book) =>
      (book.title || "")
        .toLowerCase()
        .includes(searchQuery.trim().toLowerCase()),
    )
    .filter((book) => {
      if (activeBookTab === "personal") return !book.isReadonly;
      if (activeBookTab === "imported") return book.isReadonly;
      return true;
    });

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-20 md:pb-10">
      {!selectedBook && (
        <div className="space-y-6">
          <header className="flex flex-col gap-4 border-b border-secondary pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-200 ring-inset">
                <HugeiconsIcon icon={Book02Icon} className="size-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
                    {language === "en" ? "Books Space" : "Ruang Buku"}
                  </h1>
                  <Badge color="brand" size="sm">
                    {personalBookCount + importedBookCount} {language === "en" ? "books" : "kitab"}
                  </Badge>
                </div>
                <p className="mt-1 max-w-2xl text-sm text-secondary">
                  {language === "en"
                    ? "Build a personal library, organize learning cards, and keep every review on schedule."
                    : "Bangun koleksi pribadi, susun kartu belajar, dan jaga setiap murajaah tetap terjadwal."}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Button
                color="secondary"
                size="sm"
                iconLeading={Search}
                onPress={() => setIsGlobalCardSearchOpen(true)}
              >
                {language === "en" ? "Search cards" : "Cari kartu"}
              </Button>
              <Button
                size="sm"
                iconLeading={Plus}
                onPress={handleTriggerNewBook}
              >
                {language === "en" ? "New book" : "Buat kitab"}
              </Button>
            </div>
          </header>

          <section className="relative overflow-hidden rounded-2xl border border-brand-200 bg-[linear-gradient(135deg,var(--color-bg-primary)_35%,var(--color-brand-50)_100%)] p-5 shadow-xs sm:rounded-3xl">
            <div className="pointer-events-none absolute -right-12 -top-16 size-48 rounded-full bg-brand-100/70 blur-2xl" />
            <div className="relative grid gap-3 sm:grid-cols-[1.25fr_repeat(3,minmax(0,1fr))]">
              <div className="flex items-center gap-3 px-1 py-2">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-solid text-white shadow-lg shadow-brand-500/20">
                  <HugeiconsIcon icon={Books02Icon} className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary">
                    {language === "en"
                      ? "Your learning library"
                      : "Koleksi belajar Anda"}
                  </p>
                  <p className="mt-0.5 text-xs text-secondary">
                    {language === "en"
                      ? "A quick overview of your books"
                      : "Ringkasan cepat seluruh kitab"}
                  </p>
                </div>
              </div>
              {[
                {
                  value: books.length,
                  label: language === "en" ? "All books" : "Semua kitab",
                  icon: (
                    <HugeiconsIcon icon={Book02Icon} className="size-4.5" />
                  ),
                },
                {
                  value: personalStats.activeItems,
                  label: language === "en" ? "Active cards" : "Kartu aktif",
                  icon: (
                    <HugeiconsIcon
                      icon={WalletCardsIcon}
                      className="size-4.5"
                    />
                  ),
                },
                {
                  value: personalStats.dueToday,
                  label: language === "en" ? "Due today" : "Jatuh tempo",
                  icon: (
                    <HugeiconsIcon icon={ClockAlertIcon} className="size-4.5" />
                  ),
                },
              ].map(({ value, label, icon }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-white/70 bg-primary/80 p-3.5 shadow-xs backdrop-blur-sm sm:rounded-2xl"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    {icon}
                  </div>
                  <div>
                    <p className="text-xl font-semibold tracking-tight text-primary">
                      {value}
                    </p>
                    <p className="text-xs text-secondary">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section
            aria-label={language === "en" ? "Daily review" : "Murajaah harian"}
          >
            <UnifiedDueCard
              language={language}
              title={language === "en" ? "Daily Review" : "Kartu Jatuh Tempo"}
              dueCount={personalStats.dueToday}
              totalActiveCount={personalStats.activeItems}
              itemTypeLabel={language === "en" ? "cards" : "kartu"}
              primaryActionLabel={
                language === "en"
                  ? `All (${personalStats.dueToday})`
                  : `Semua (${personalStats.dueToday})`
              }
              pillGridCols="books"
              onStartAll={() => {
                setReviewSpecificBookId(null);
                setIsReviewOpen(true);
              }}
              onOpenCalendar={() => {
                const nonClassBooks = books.filter((b) => !isBookInActiveClass(b));
                const targetBook =
                  nonClassBooks.find((b) =>
                    items.some(
                      (i) =>
                        i.bookId === b.id &&
                        i.isActive &&
                        (!i.fsrsData.nextReview ||
                          new Date(i.fsrsData.nextReview) <= new Date()),
                    ),
                  ) || nonClassBooks[0];
                if (targetBook) {
                  setCalendarBook(targetBook);
                  setCalendarChapterFilter(null);
                  setIsBookCalendarOpen(true);
                }
              }}
              filterPills={books
                .filter(
                  (b) =>
                    !isBookInActiveClass(b) &&
                    items.some(
                      (i) =>
                        i.bookId === b.id &&
                        i.isActive &&
                        (!i.fsrsData.nextReview ||
                          new Date(i.fsrsData.nextReview) <= new Date()),
                    ),
                )
                .map((book) => ({
                  id: book.id,
                  label: book.title,
                  count: items.filter(
                    (i) =>
                      i.bookId === book.id &&
                      i.isActive &&
                      (!i.fsrsData.nextReview ||
                        new Date(i.fsrsData.nextReview) <= new Date()),
                  ).length,
                  onClick: () => {
                    setReviewSpecificBookId(book.id);
                    setIsReviewOpen(true);
                  },
                }))}
              allCaughtUpTitle={
                language === "en"
                  ? "All personal flashcards reviewed today!"
                  : "Semua kartu materi telah selesai diulang!"
              }
            />
          </section>

          <section className="rounded-2xl border border-secondary bg-primary p-5 shadow-xs sm:rounded-3xl">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-primary">
                {language === "en" ? "Quick actions" : "Aksi cepat"}
              </h2>
              <p className="mt-0.5 text-xs text-secondary">
                {language === "en"
                  ? "Create, discover, and share learning material."
                  : "Buat, temukan, dan bagikan materi belajar."}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                {
                  label: language === "en" ? "Build with AI" : "Buat dengan AI",
                  description:
                    language === "en"
                      ? "Draft a structured book"
                      : "Susun draf kitab terstruktur",
                  icon: (
                    <HugeiconsIcon icon={AiEditingIcon} className="size-4.5" />
                  ),
                  iconClass:
                    "bg-utility-purple-50 text-utility-purple-700 ring-utility-purple-200 group-hover:bg-utility-purple-100",
                  onClick: handleTriggerAIBuilder,
                },
                {
                  label: language === "en" ? "Create book" : "Buat kitab",
                  description:
                    language === "en"
                      ? "Start from a blank book"
                      : "Mulai dari kitab kosong",
                  icon: (
                    <HugeiconsIcon icon={BookCopyIcon} className="size-4.5" />
                  ),
                  iconClass:
                    "bg-brand-50 text-brand-700 ring-brand-200 group-hover:bg-brand-100",
                  onClick: handleTriggerNewBook,
                },
                {
                  label:
                    language === "en" ? "Explore library" : "Jelajahi pustaka",
                  description:
                    language === "en"
                      ? "Import shared books"
                      : "Impor kitab yang dibagikan",
                  icon: (
                    <HugeiconsIcon icon={Books02Icon} className="size-4.5" />
                  ),
                  iconClass:
                    "bg-utility-blue-50 text-utility-blue-700 ring-utility-blue-200 group-hover:bg-utility-blue-100",
                  onClick: () => setIsLibraryOpen(true),
                },
                {
                  label: language === "en" ? "Publish book" : "Publikasi kitab",
                  description:
                    language === "en"
                      ? "Share your collection"
                      : "Bagikan koleksi Anda",
                  icon: (
                    <HugeiconsIcon icon={BookUp2Icon} className="size-4.5" />
                  ),
                  iconClass:
                    "bg-utility-green-50 text-utility-green-700 ring-utility-green-200 group-hover:bg-utility-green-100",
                  onClick: () => {
                    setPublishPreselectedId(null);
                    setIsPublishOpen(true);
                  },
                },
              ].map(({ label, description, icon, iconClass, onClick }) => (
                <button
                  key={label}
                  type="button"
                  onClick={onClick}
                  className="group flex items-center gap-3 rounded-xl border border-secondary bg-secondary/30 p-3.5 text-left transition hover:border-brand-200 hover:bg-brand-50/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 sm:rounded-2xl"
                >
                  <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset transition ${iconClass}`}
                  >
                    {icon}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-primary">
                      {label}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-secondary">
                      {description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-secondary bg-primary p-5 shadow-xs sm:rounded-3xl">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="inline-flex w-full rounded-xl bg-secondary p-1 lg:w-auto">
                {[
                  {
                    id: "personal" as const,
                    label: language === "en" ? "Personal" : "Pribadi",
                    count: personalBookCount,
                    icon: (
                      <HugeiconsIcon icon={Book02Icon} className="size-4" />
                    ),
                  },
                  {
                    id: "imported" as const,
                    label: language === "en" ? "Library" : "Pustaka",
                    count: importedBookCount,
                    icon: (
                      <HugeiconsIcon icon={SwatchBookIcon} className="size-4" />
                    ),
                  },
                ].map(({ id, label, count, icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveBookTab(id)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition lg:flex-none ${activeBookTab === id ? "bg-primary text-brand-secondary shadow-xs ring-1 ring-primary" : "text-secondary hover:text-primary"}`}
                  >
                    {icon}
                    <span>{label}</span>
                    <Badge
                      color={activeBookTab === id ? "brand" : "gray"}
                      size="sm"
                    >
                      {count}
                    </Badge>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  aria-label={language === "en" ? "Search books" : "Cari kitab"}
                  icon={Search}
                  size="sm"
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder={
                    language === "en" ? "Search books" : "Cari kitab"
                  }
                  className="min-w-0 flex-1 lg:w-72"
                />
              </div>
            </div>

            {visibleBooks.length > 0 ? (
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visibleBooks.map((book) => {
                  const bookItemsList = items.filter(
                    (i) => i.bookId === book.id,
                  );
                  const activeCount = bookItemsList.filter(
                    (i) => i.isActive,
                  ).length;
                  const dueCount = bookItemsList.filter(
                    (i) =>
                      i.isActive &&
                      (!i.fsrsData.nextReview ||
                        new Date(i.fsrsData.nextReview) <= new Date()),
                  ).length;
                  const isClassBook = isBookInActiveClass(book);
                  return (
                    <article
                      key={book.id}
                      role="button"
                      tabIndex={0}
                      onClick={(event) => {
                        if ((event.target as HTMLElement).closest("button"))
                          return;
                        setSelectedBook(book);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedBook(book);
                        }
                      }}
                      className="group cursor-pointer rounded-2xl border border-secondary bg-primary p-3.5 shadow-xs outline-focus-ring transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 sm:rounded-3xl"
                    >
                      <div className="relative flex h-64 items-center justify-center overflow-hidden rounded-xl border border-secondary bg-[radial-gradient(circle_at_50%_28%,var(--color-brand-100)_0%,var(--color-bg-secondary)_68%)] sm:rounded-2xl">
                        <div className="absolute inset-x-5 bottom-4 h-2 rounded-full bg-black/10 blur-sm dark:bg-black/30" />
                        <div className="absolute inset-x-0 bottom-0 h-7 border-t border-[#d8c7ae] bg-[linear-gradient(180deg,#eadfce_0%,#cdb99d_100%)] dark:border-[#51483d] dark:bg-[linear-gradient(180deg,#51483d_0%,#302a24_100%)]" />
                        <BookCoverVisual
                          src={book.coverUrl}
                          title={book.title}
                          author={book.authorName || userProfile.fullName}
                          className="h-52 w-[9.25rem]"
                        />
                        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5">
                          <Badge
                            color={
                              isClassBook
                                ? "brand"
                                : book.isReadonly
                                  ? "warning"
                                  : "success"
                            }
                            size="sm"
                            className="bg-primary/90 backdrop-blur-sm"
                          >
                            {isClassBook
                              ? language === "en"
                                ? "Class"
                                : "Kelas"
                              : book.isReadonly
                                ? language === "en"
                                  ? "Read-only"
                                  : "Hanya baca"
                                : language === "en"
                                  ? "Personal"
                                  : "Pribadi"}
                          </Badge>
                          <ButtonUtility
                            icon={CalendarClock}
                            color="tertiary"
                            tooltip={
                              language === "en"
                                ? `View ${book.title} review calendar`
                                : `Lihat kalender jadwal ${book.title}`
                            }
                            onPress={() => {
                              setCalendarBook(book);
                              setCalendarChapterFilter(null);
                              setIsBookCalendarOpen(true);
                            }}
                            className="bg-primary/90 shadow-xs backdrop-blur-sm"
                          />
                        </div>
                      </div>
                      <div className="px-1 pb-1 pt-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h2 className="truncate text-base font-semibold text-primary transition-colors group-hover:text-brand-secondary">
                              {book.title}
                            </h2>
                            <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-secondary">
                              {book.description ||
                                (language === "en"
                                  ? "No description has been added yet."
                                  : "Belum ada deskripsi untuk kitab ini.")}
                            </p>
                          </div>
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-fg-quaternary transition-colors group-hover:bg-brand-50 group-hover:text-brand-700">
                            <ChevronRight className="size-4.5" />
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <Badge color="gray" size="sm" className="gap-1.5">
                            <Layers className="size-3.5" />
                            {activeCount}{" "}
                            {language === "en" ? "active" : "aktif"}
                          </Badge>
                          {dueCount > 0 ? (
                            <BadgeWithDot color="warning" size="sm">
                              {dueCount}{" "}
                              {language === "en" ? "due" : "jatuh tempo"}
                            </BadgeWithDot>
                          ) : (
                            <BadgeWithDot color="success" size="sm">
                              {language === "en" ? "On schedule" : "Terjadwal"}
                            </BadgeWithDot>
                          )}
                        </div>
                        <div className="mt-4 flex items-center justify-between border-t border-secondary pt-3 text-xs text-tertiary">
                          <span>
                            {bookItemsList.length}{" "}
                            {language === "en" ? "total cards" : "total kartu"}
                          </span>
                          <span>
                            {
                              chapters.filter(
                                (chapter) => chapter.bookId === book.id,
                              ).length
                            }{" "}
                            {language === "en" ? "chapters" : "bab"}
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-secondary bg-secondary/30 px-5 py-12 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-200 ring-inset">
                  {searchQuery ? (
                    <Search className="size-5" />
                  ) : (
                    <HugeiconsIcon icon={BookDashedIcon} className="size-5" />
                  )}
                </div>
                <h2 className="mt-3 text-sm font-semibold text-primary">
                  {searchQuery
                    ? language === "en"
                      ? "No matching books"
                      : "Kitab tidak ditemukan"
                    : language === "en"
                      ? "No books here yet"
                      : "Belum ada kitab di sini"}
                </h2>
                <p className="mx-auto mt-1 max-w-md text-sm text-secondary">
                  {searchQuery
                    ? language === "en"
                      ? "Try another title or clear the current search."
                      : "Coba judul lain atau hapus pencarian saat ini."
                    : activeBookTab === "personal"
                      ? language === "en"
                        ? "Create a book to begin organizing your learning cards."
                        : "Buat kitab untuk mulai menyusun kartu belajar Anda."
                      : language === "en"
                        ? "Explore the public library and import a shared book."
                        : "Jelajahi pustaka publik dan impor kitab yang dibagikan."}
                </p>
                <div className="mt-4 flex justify-center">
                  {searchQuery ? (
                    <Button
                      color="secondary"
                      size="sm"
                      onPress={() => setSearchQuery("")}
                    >
                      {language === "en" ? "Clear search" : "Hapus pencarian"}
                    </Button>
                  ) : activeBookTab === "personal" ? (
                    <Button
                      size="sm"
                      iconLeading={Plus}
                      onPress={handleTriggerNewBook}
                    >
                      {language === "en" ? "Create book" : "Buat kitab"}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      iconLeading={Library}
                      onPress={() => setIsLibraryOpen(true)}
                    >
                      {language === "en"
                        ? "Explore library"
                        : "Jelajahi pustaka"}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* 2. Book Level: Buku Induk & Hierarki Bab (Ketika Buku dipilih, belum memilih bab) */}
      {selectedBook && !currentChapter && (
        <PersonalBookPage>
          <div className="flex flex-col gap-3 border-b border-secondary pb-5 sm:flex-row sm:items-center sm:justify-between">
            <Button
              color="secondary"
              size="sm"
              iconLeading={ArrowLeft}
              onPress={() => {
                if (onExitEmbedded) {
                  onExitEmbedded();
                } else {
                  setSelectedBook(null);
                  setSelectedChapter(null);
                }
              }}
            >
              {onExitEmbedded
                ? (language === "en" ? "Back to Class" : "Kembali ke Kelas")
                : (language === "en" ? "Back to Library" : "Kembali ke Koleksi")}
            </Button>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                color="secondary"
                size="sm"
                iconLeading={CalendarClock}
                onPress={() => {
                  setCalendarBook(selectedBook);
                  setCalendarChapterFilter(null);
                  setIsBookCalendarOpen(true);
                }}
              >
                <span className="hidden sm:inline">
                  {language === "en" ? "Review Calendar" : "Kalender Jadwal"}
                </span>
              </Button>

              {!isCurrentBookReadonly && (
                <>
                  <Button
                    color="secondary"
                    size="sm"
                    iconLeading={Edit3}
                    onPress={() => setEditingBook(selectedBook)}
                  >
                    <span className="hidden sm:inline">
                      {language === "en" ? "Edit Book" : "Edit Buku"}
                    </span>
                  </Button>
                  <Button
                    color="secondary"
                    size="sm"
                    iconLeading={BookPublish}
                    onPress={() => {
                      setPublishPreselectedId(selectedBook.id);
                      setIsPublishOpen(true);
                    }}
                  >
                    <span className="hidden sm:inline">
                      {language === "en" ? "Publish" : "Publikasi"}
                    </span>
                  </Button>
                </>
              )}
              {!classBanner && !isCurrentBookReadonly && (
                <ButtonUtility
                  icon={Trash2}
                  color="tertiary"
                  tooltip={language === "en" ? "Delete book" : "Hapus buku"}
                  onPress={() => {
                    setConfirmDialog({
                      isOpen: true,
                      message:
                        language === "en"
                          ? "Are you sure you want to delete this book?"
                          : "Hapus buku ini beserta seluruh isinya?",
                      onConfirm: () => {
                        deleteBook(selectedBook.id);
                        setSelectedBook(null);
                        setSelectedChapter(null);
                        setConfirmDialog(null);
                      },
                    });
                  }}
                  className="text-error-primary hover:bg-error-primary"
                />
              )}
            </div>
          </div>

          {/* Master Book Presentation - Authentic 3D Book Cover & Two Learning Progress Metrics */}
          {(() => {
            const totalCards = bookItems.length;
            const activeBookCards = bookItems.filter((i) => i.isActive);
            const dueBookCards = bookItems.filter((i) => isItemDue(i));
            const masteredCards = activeBookCards.filter(
              (i) => getNonQuranIntervalDays(i.fsrsData) >= 300,
            );

            // Ukuran 1: Persentase kartu diaktifkan dari total kartu pada buku
            const activationPct =
              totalCards > 0
                ? Math.round((activeBookCards.length / totalCards) * 100)
                : 0;

            // Ukuran 2: Kemajuan belajar (persentase kartu yang mencapai interval >300 hari)
            const masteryPct =
              totalCards > 0
                ? Math.round((masteredCards.length / totalCards) * 100)
                : 0;
            const joinedClass = myClasses.find((c) =>
              c.assignedBookIds?.includes(selectedBook.id),
            );

            return (
              <section className="relative flex flex-col overflow-hidden rounded-2xl border border-brand-200 bg-[linear-gradient(145deg,var(--color-bg-primary)_0%,var(--color-bg-primary)_58%,var(--color-brand-50)_100%)] shadow-lg sm:rounded-3xl">
                {/* Embedded Class Integration Bar for Enrolled Students */}
                {joinedClass && (
                  <div className="relative flex flex-col gap-3 border-b border-brand-200 bg-brand-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="text-xs font-semibold text-primary sm:text-sm">
                        Kelas: {joinedClass.name}
                      </span>
                      <span className="rounded-lg bg-primary px-2 py-0.5 font-mono text-[10px] font-semibold text-brand-secondary ring-1 ring-brand-200 ring-inset">
                        {joinedClass.code}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-600 text-white">
                        Terhubung Pengajar
                      </span>
                      {joinedClass.teacherName && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          • Pengajar:{" "}
                          <strong className="text-slate-700 dark:text-slate-200">
                            {joinedClass.teacherName}
                          </strong>
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setClassToLeave(joinedClass.id);
                        setConfirmDialog({
                          isOpen: true,
                          message:
                            language === "en"
                              ? "Are you sure you want to leave this class?"
                              : "Yakin ingin keluar dari kelas ini?",
                          onConfirm: () => {
                            leaveClass(joinedClass.id);
                            setSelectedBook(null);
                          },
                        });
                      }}
                      className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs self-start sm:self-auto"
                      title={
                        language === "en"
                          ? "Leave this class"
                          : "Keluar dari kelas ini"
                      }
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>
                        {language === "en" ? "Leave Class" : "Keluar Kelas"}
                      </span>
                    </button>
                  </div>
                )}

                <div className="relative grid gap-6 p-5 sm:p-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
                  {/* Compact 3D Book Cover Object */}
                  <div className="group relative mx-auto w-full max-w-[220px] lg:mx-0">
                    <div className="relative flex aspect-[4/5] flex-col justify-between overflow-hidden rounded-2xl shadow-xl ring-1 ring-secondary ring-inset transition-transform duration-300 group-hover:-translate-y-1">
                      {/* Lighting reflection & spine ridge overlay */}
                      <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/35 via-white/25 to-transparent pointer-events-none z-20" />
                      <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-l from-black/20 to-transparent pointer-events-none z-20" />
                      <div className="absolute inset-0 bg-gradient-to-tr from-black/15 via-transparent to-white/10 pointer-events-none z-20" />

                      {selectedBook.coverUrl ? (
                        <img
                          src={selectedBook.coverUrl}
                          alt={selectedBook.title}
                          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        /* Handcrafted Hardcover Cloth/Leather Kitab */
                        <div className="relative flex size-full select-none flex-col justify-between overflow-hidden bg-[linear-gradient(145deg,#431407_0%,#9a3412_55%,#ef6905_100%)] p-5 text-brand-50">
                          <div className="absolute -right-6 -bottom-6 w-20 h-20 rounded-full border-4 border-amber-400/10 pointer-events-none" />
                          <div className="pointer-events-none absolute inset-4 rounded-xl border border-white/20" />

                          {/* Top ornament */}
                          <div className="relative z-10 pt-0.5 text-center">
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-black/20 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-brand-100 ring-1 ring-white/20 ring-inset">
                              <BookOpen className="size-3" />
                              <span className="max-w-32 truncate">
                                {language === "en" ? "Book" : "Kitab"}
                              </span>
                            </div>
                          </div>

                          {/* Center Title */}
                          <div className="relative z-10 my-auto text-center px-1">
                            <h3
                              title={selectedBook.title}
                              className="line-clamp-3 text-xl font-semibold leading-7 text-white drop-shadow-md"
                            >
                              {selectedBook.title}
                            </h3>
                            <div className="mx-auto mt-3 h-0.5 w-12 bg-gradient-to-r from-transparent via-brand-100 to-transparent" />
                          </div>

                          {/* Bottom */}
                          <div className="relative z-10 pb-0.5 text-center">
                            <span className="block text-[9px] font-semibold uppercase tracking-[0.2em] text-brand-100">
                              {language === "en"
                                ? "Learning book"
                                : "Kitab belajar"}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Bookmark ribbon */}
                      <div className="absolute -bottom-1 right-5 z-10 h-7 w-4 bg-brand-600 shadow-sm [clip-path:polygon(0_0,100%_0,100%_100%,50%_75%,0_100%)]" />

                      {/* Readonly Badge on Cover */}
                      {isCurrentBookReadonly && (
                        <div className="absolute right-3 top-3 z-30 rounded-full bg-primary/90 px-2.5 py-1 text-xs font-semibold text-secondary shadow-xs backdrop-blur-sm">
                          {language === "en" ? "Read-only" : "Hanya Baca"}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Book Metadata & Compact Progress Bar beside Cover */}
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <h1
                          title={selectedBook.title}
                          className="block text-2xl font-semibold leading-tight tracking-tight text-primary sm:text-3xl"
                        >
                          {selectedBook.title}
                        </h1>
                        {isCurrentBookReadonly ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                            <ShieldCheck className="size-3 shrink-0 text-brand-600" />
                            <span>
                              {language === "en" ? "Read-only" : "Hanya Baca"}
                            </span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span>
                              {language === "en" ? "Editable" : "Dapat Diedit"}
                            </span>
                          </span>
                        )}
                      </div>
                      {selectedBook.description && (
                        <p className="mt-2 line-clamp-3 max-w-3xl text-sm leading-6 text-secondary sm:text-base">
                          {selectedBook.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
                      {[
                        {
                          label: language === "en" ? "Chapters" : "Bab",
                          value: bookChapters.length,
                          icon: <Layers className="size-4" />,
                          color:
                            "bg-utility-blue-50 text-utility-blue-700 ring-utility-blue-200",
                        },
                        {
                          label:
                            language === "en" ? "Total cards" : "Total kartu",
                          value: totalCards,
                          icon: <BookOpen className="size-4" />,
                          color: "bg-brand-50 text-brand-700 ring-brand-200",
                        },
                        {
                          label: language === "en" ? "Active" : "Aktif",
                          value: activeBookCards.length,
                          icon: <Power className="size-4" />,
                          color:
                            "bg-utility-green-50 text-utility-green-700 ring-utility-green-200",
                        },
                        {
                          label:
                            language === "en" ? "Due today" : "Perlu review",
                          value: dueBookCards.length,
                          icon: <Clock className="size-4" />,
                          color:
                            "bg-utility-yellow-50 text-utility-yellow-700 ring-utility-yellow-200",
                        },
                      ].map((metric) => (
                        <div
                          key={metric.label}
                          className="rounded-xl border border-secondary bg-primary p-4 shadow-xs sm:rounded-2xl"
                        >
                          <div
                            className={`flex size-8 items-center justify-center rounded-lg ring-1 ring-inset ${metric.color}`}
                          >
                            {metric.icon}
                          </div>
                          <p className="mt-3 text-2xl font-semibold tabular-nums text-primary">
                            {metric.value}
                          </p>
                          <p className="text-xs text-secondary">
                            {metric.label}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Single Straight Progress Line (Active & Mapan) */}
                    <div className="mt-2 rounded-xl border border-secondary bg-primary p-4 shadow-xs sm:rounded-2xl">
                      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-secondary">
                        <div className="flex items-center gap-2.5">
                          <span className="inline-flex items-center gap-1.5 font-semibold text-utility-green-700">
                            <span className="size-2 shrink-0 rounded-full bg-utility-green-500" />
                            {language === "en" ? "Active" : "Aktif"}:{" "}
                            {activeBookCards.length}/{totalCards} (
                            {activationPct}%)
                          </span>
                          <span className="inline-flex items-center gap-1.5 font-semibold text-brand-secondary">
                            <span className="size-2 shrink-0 rounded-full bg-brand-solid" />
                            {language === "en" ? "Mastered" : "Mapan"}:{" "}
                            {masteredCards.length}/{totalCards} ({masteryPct}%)
                          </span>
                        </div>
                        {dueBookCards.length > 0 && (
                          <span className="font-semibold text-brand-secondary">
                            {dueBookCards.length}{" "}
                            {language === "en" ? "due today" : "perlu review"}
                          </span>
                        )}
                      </div>

                      {/* Single segmented straight bar */}
                      <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-secondary">
                        {/* Mastered portion (amber) */}
                        <div
                          style={{
                            width: `${totalCards > 0 ? (masteredCards.length / totalCards) * 100 : 0}%`,
                          }}
                          className="h-full shrink-0 bg-brand-solid transition-all duration-500"
                          title={`Mapan: ${masteredCards.length}`}
                        />
                        {/* Active non-mastered portion (emerald) */}
                        <div
                          style={{
                            width: `${totalCards > 0 ? (Math.max(0, activeBookCards.length - masteredCards.length) / totalCards) * 100 : 0}%`,
                          }}
                          className="h-full shrink-0 bg-utility-green-500 transition-all duration-500"
                          title={`Aktif: ${activeBookCards.length}`}
                        />
                      </div>
                    </div>

                    {/* Action Buttons: Review & Review Calendar */}
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      {dueBookCards.length > 0 && (
                        <Button
                          size="sm"
                          iconLeading={Play}
                          onPress={() => {
                            setReviewSpecificBookId(selectedBook.id);
                            setIsReviewOpen(true);
                          }}
                        >
                          {language === "en"
                            ? `Review ${dueBookCards.length} cards`
                            : `Review ${dueBookCards.length} kartu`}
                        </Button>
                      )}
                      <Button
                        color="secondary"
                        size="sm"
                        iconLeading={Calendar}
                        onPress={() => {
                          setCalendarBook(selectedBook);
                          setCalendarChapterFilter(null);
                          setIsBookCalendarOpen(true);
                        }}
                      >
                        {language === "en" ? "Open schedule" : "Buka jadwal"}
                      </Button>
                    </div>
                  </div>
                </div>
              </section>
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

          <section className="space-y-4 rounded-2xl border border-secondary bg-primary p-5 shadow-xs sm:rounded-3xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-base font-semibold text-primary">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-200 ring-inset">
                    <ListOrdered className="size-4" />
                  </span>
                  <span>
                    {language === "en"
                      ? "Table of Contents"
                      : "Daftar Isi Kitab"}
                  </span>
                </h2>
                <p className="mt-1 text-sm text-secondary">
                  {language === "en"
                    ? "Select any chapter or subchapter to view and study its flashcards."
                    : "Pilih bab atau sub-bab untuk langsung masuk ke materi dan kartu flashcard di dalamnya."}
                </p>
              </div>

              {/* Table of Contents Search & Quick Add */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative min-w-0 sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={
                      language === "en"
                        ? "Search TOC..."
                        : "Cari bab / sub-bab..."
                    }
                    value={tocSearch}
                    onChange={(e) => setTocSearch(e.target.value)}
                    className="w-full rounded-lg border border-primary bg-primary py-2 pl-8 pr-8 text-sm text-primary shadow-xs outline-none transition placeholder:text-placeholder focus:border-brand focus:ring-2 focus:ring-brand-600/20"
                  />
                  {tocSearch && (
                    <button
                      onClick={() => setTocSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {!isCurrentBookReadonly && (
                  <div className="flex items-center gap-2">
                    <Button
                      color="secondary"
                      size="sm"
                      iconLeading={Sparkles}
                      onPress={() => {
                        setSelectedChapterIdForItem("");
                        handleTriggerAIImport();
                      }}
                    >
                      <span className="hidden sm:inline">
                        {language === "en" ? "AI Generate" : "Buat dgn AI"}
                      </span>
                    </Button>
                    <Button
                      size="sm"
                      iconLeading={Plus}
                      onPress={() => {
                        setParentChapterIdForNew(null);
                        setIsNewChapterOpen(true);
                      }}
                    >
                      <span className="hidden sm:inline">
                        {language === "en" ? "New Chapter" : "Bab Baru"}
                      </span>
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {bookChapters.length === 0 && bookItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-secondary bg-secondary/30 px-5 py-12 text-center">
                <HugeiconsIcon
                  icon={BookDashedIcon}
                  className="mx-auto mb-3 size-10 text-brand-500"
                />
                <h3 className="text-sm font-semibold text-primary">
                  {language === "en"
                    ? "This book is empty"
                    : "Buku ini masih kosong"}
                </h3>
                <p className="mx-auto mb-4 mt-1 max-w-sm text-sm text-secondary">
                  {language === "en"
                    ? "Create chapters and flashcards to begin learning."
                    : "Tambahkan bab dan kartu pertanyaan-jawaban untuk mulai belajar."}
                </p>
                {!isCurrentBookReadonly ? (
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Button
                      color="secondary"
                      size="sm"
                      iconLeading={Sparkles}
                      onPress={() => {
                        setSelectedChapterIdForItem("");
                        handleTriggerAIImport();
                      }}
                    >
                      {language === "en" ? "AI Generate" : "Buat dgn AI"}
                    </Button>
                    <Button
                      size="sm"
                      iconLeading={Plus}
                      onPress={() => {
                        setParentChapterIdForNew(null);
                        setIsNewChapterOpen(true);
                      }}
                    >
                      {language === "en"
                        ? "Add First Chapter"
                        : "Tambah Bab Pertama"}
                    </Button>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700">
                    <ShieldCheck className="size-4 text-brand-600" />
                    <span>
                      {language === "en"
                        ? "Authentic Protected Material"
                        : "Materi Otentik Terkunci oleh Pengajar"}
                    </span>
                  </div>
                )}
              </div>
            ) : null}

            {/* Table of Contents Container */}
            <div className="space-y-2 rounded-xl bg-secondary/20 p-3 pb-12 sm:rounded-2xl">
              {(() => {
                const renderChapterHierarchyTree = (
                  parentId: string | null = null,
                  depth = 0,
                  parentIdxPrefix = "",
                ): React.ReactNode[] => {
                  let chaptersInLevel = bookChapters.filter(
                    (c) => (c.parentId || null) === parentId,
                  );

                  if (tocSearch.trim()) {
                    const q = tocSearch.toLowerCase();
                    // Keep chapter if it or any descendant matches
                    const matchesOrHasMatchingDescendants = (
                      ch: Chapter,
                    ): boolean => {
                      if (
                        (ch.title || "").toLowerCase().includes(q) ||
                        (ch.description || "").toLowerCase().includes(q)
                      )
                        return true;
                      const children = bookChapters.filter(
                        (c) => c.parentId === ch.id,
                      );
                      return children.some(matchesOrHasMatchingDescendants);
                    };
                    chaptersInLevel = chaptersInLevel.filter(
                      matchesOrHasMatchingDescendants,
                    );
                  }

                  return chaptersInLevel.map((chapter, idx) => {
                    const directItems = bookItems.filter(
                      (i) => i.chapterId === chapter.id,
                    );
                    const childChapters = bookChapters.filter(
                      (c) => c.parentId === chapter.id,
                    );
                    const dueCount = directItems.filter((i) =>
                      isItemDue(i),
                    ).length;
                    const currentIdxStr = parentIdxPrefix
                      ? `${parentIdxPrefix}.${idx + 1}`
                      : `${idx + 1}`;
                    const isExpanded = !expandedChapters.has(chapter.id); // default expanded
                    const isNearBottom =
                      idx >= Math.max(0, chaptersInLevel.length - 2) ||
                      (depth > 0 &&
                        idx >= Math.max(0, chaptersInLevel.length - 1));

                    return (
                      <div key={chapter.id} className="space-y-1">
                        <div
                          onClick={() => {
                            setSelectedChapter(chapter);
                            setChapterFilter("all");
                            setChapterCardSearch("");
                          }}
                          className={`group transition-all cursor-pointer select-none rounded-xl border ${
                            depth === 0
                              ? "border-secondary bg-primary px-3 py-3 shadow-xs hover:border-brand-300 hover:bg-brand-50/50 sm:px-3.5"
                              : depth === 1
                                ? "ml-3 border-secondary bg-primary/80 px-2.5 py-2 hover:border-brand-200 hover:bg-brand-50/30 sm:ml-6 sm:px-3"
                                : "ml-6 border-secondary bg-primary/60 px-2 py-2 hover:border-brand-200 hover:bg-brand-50/30 sm:ml-10 sm:px-2.5"
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
                                    setExpandedChapters((prev) => {
                                      const next = new Set(prev);
                                      if (next.has(chapter.id)) {
                                        next.delete(chapter.id);
                                      } else {
                                        next.add(chapter.id);
                                      }
                                      return next;
                                    });
                                  }}
                                  className="shrink-0 rounded-lg p-1 text-fg-quaternary transition-colors hover:bg-brand-50 hover:text-brand-700"
                                  title={
                                    isExpanded
                                      ? "Collapse subchapters"
                                      : "Expand subchapters"
                                  }
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="size-3.5 text-brand-600" />
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
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 uppercase tracking-wider ${
                                    depth === 0
                                      ? "bg-brand-100 text-brand-800"
                                      : depth === 1
                                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300"
                                        : "bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-300"
                                  }`}
                                >
                                  {depth === 0
                                    ? language === "en"
                                      ? `Ch ${idx + 1}`
                                      : `Bab ${idx + 1}`
                                    : depth === 1
                                      ? `Sub ${currentIdxStr}`
                                      : `↳ ${currentIdxStr}`}
                                </span>

                                <h3
                                  className={`truncate font-semibold text-primary transition-colors group-hover:text-brand-secondary ${
                                    depth === 0
                                      ? "text-xs sm:text-sm"
                                      : "text-xs"
                                  }`}
                                >
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
                                {directItems.length}{" "}
                                {language === "en" ? "cards" : "kartu"}
                              </span>

                              {/* Review Task Button (Direct Jump to Chapter Due Review) */}
                              {dueCount > 0 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedChapter(chapter);
                                    setChapterFilter("due");
                                    setChapterCardSearch("");
                                  }}
                                  className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-200 border border-amber-300/80 dark:border-amber-700/60 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                                  title={
                                    language === "en"
                                      ? `${dueCount} cards due for review in this chapter`
                                      : `${dueCount} kartu perlu direview di bab ini`
                                  }
                                >
                                  <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                  <span>
                                    {dueCount}{" "}
                                    {language === "en" ? "due" : "perlu review"}
                                  </span>
                                </button>
                              )}

                              {/* Three-Dots Menu (Kebab) for Professional UX */}
                              {!isCurrentBookReadonly && (
                                <div
                                  className="relative shrink-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setActiveMenuId(
                                        activeMenuId === `chap-${chapter.id}`
                                          ? null
                                          : `chap-${chapter.id}`,
                                      )
                                    }
                                    className="rounded-lg p-1 text-fg-quaternary transition-colors hover:bg-primary_hover hover:text-secondary_hover"
                                    title="Options"
                                  >
                                    <MoreVertical className="w-3.5 h-3.5" />
                                  </button>

                                  {activeMenuId === `chap-${chapter.id}` && (
                                    <div
                                      className={`absolute right-0 ${isNearBottom ? "bottom-full mb-1.5" : "top-full mt-1.5"} z-50 w-48 rounded-xl border border-secondary bg-primary py-1.5 text-xs shadow-2xl`}
                                    >
                                      {depth < 2 && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveMenuId(null);
                                            setParentChapterIdForNew(
                                              chapter.id,
                                            );
                                            setIsNewChapterOpen(true);
                                          }}
                                          className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-secondary hover:bg-primary_hover"
                                        >
                                          <FolderPlus className="w-3.5 h-3.5 text-emerald-600" />
                                          <span>
                                            {language === "en"
                                              ? "Add Subchapter"
                                              : "Tambah Subbab"}
                                          </span>
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMenuId(null);
                                          setEditingChapter(chapter);
                                          setChapterForm({
                                            title: chapter.title,
                                            description:
                                              chapter.description || "",
                                          });
                                          setIsNewChapterOpen(true);
                                        }}
                                        className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-secondary hover:bg-primary_hover"
                                      >
                                        <Pencil className="size-3.5 text-brand-600" />
                                        <span>
                                          {language === "en"
                                            ? "Edit Chapter"
                                            : "Edit Bab"}
                                        </span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMenuId(null);
                                          setConfirmDialog({
                                            isOpen: true,
                                            message:
                                              language === "en"
                                                ? "Delete this chapter and all its subchapters?"
                                                : "Yakin ingin menghapus bab ini beserta sub-bab dan kartunya?",
                                            onConfirm: () => {
                                              deleteChapter(chapter.id);
                                              setConfirmDialog(null);
                                            },
                                          });
                                        }}
                                        className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2 cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>
                                          {language === "en"
                                            ? "Delete Chapter"
                                            : "Hapus Bab"}
                                        </span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Buka Bab Arrow Button */}
                              <div className="rounded-lg p-1 text-fg-quaternary transition-colors group-hover:text-brand-600">
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Recursively render children if expanded */}
                        {childChapters.length > 0 && isExpanded && (
                          <div className="space-y-1">
                            {renderChapterHierarchyTree(
                              chapter.id,
                              depth + 1,
                              currentIdxStr,
                            )}
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
                const unassignedItems = bookItems.filter(
                  (i) =>
                    !i.chapterId ||
                    !bookChapters.some((c) => c.id === i.chapterId),
                );
                if (unassignedItems.length === 0) return null;

                return (
                  <div
                    onClick={() => {
                      setSelectedChapter({
                        id: "__unassigned__",
                        bookId: selectedBook.id,
                        title:
                          language === "en"
                            ? "General Cards (No Chapter)"
                            : "Kartu Umum (Tanpa Bab)",
                        order: 999,
                      });
                      setChapterFilter("all");
                      setChapterCardSearch("");
                    }}
                    className="group flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-secondary bg-primary p-3.5 transition-all hover:border-brand-300 hover:bg-brand-50/40 sm:rounded-2xl"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="size-4 text-fg-quaternary group-hover:text-brand-600" />
                      <div>
                        <h4 className="text-xs font-semibold text-primary transition-colors group-hover:text-brand-secondary">
                          {language === "en"
                            ? "General Cards (No Chapter)"
                            : "Kartu Umum (Tanpa Bab)"}
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {language === "en"
                            ? `${unassignedItems.length} cards not organized into a chapter`
                            : `${unassignedItems.length} kartu di luar bab`}
                        </p>
                      </div>
                    </div>
                    {!isCurrentBookReadonly && (
                      <div
                        className="relative shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setActiveMenuId(
                              activeMenuId === "unassigned-menu"
                                ? null
                                : "unassigned-menu",
                            )
                          }
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
                          title="Options"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                        {activeMenuId === "unassigned-menu" && (
                          <div className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-1 z-50 text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                setConfirmDialog({
                                  isOpen: true,
                                  message:
                                    language === "en"
                                      ? "Delete all cards in this category?"
                                      : "Hapus semua kartu di kategori ini?",
                                  onConfirm: () => {
                                    unassignedItems.forEach((i) =>
                                      deleteItem(i.id),
                                    );
                                    setConfirmDialog(null);
                                    setSelectedChapter(null);
                                  },
                                });
                              }}
                              className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>
                                {language === "en"
                                  ? "Delete All Cards"
                                  : "Hapus Semua Kartu"}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-secondary group-hover:text-brand-secondary">
                      <span className="text-[11px] font-semibold">
                        {language === "en" ? "Open Cards" : "Buka"}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                );
              })()}
            </div>
          </section>
        </PersonalBookPage>
      )}

      {/* 3. Chapter View: Halaman Khusus Bab & Item-Item Kartu (Seperti Halaman Juz Al-Qur'an) */}
      {selectedBook &&
        currentChapter &&
        (() => {
          const isUnassigned = currentChapter.id === "__unassigned__";
          const chapterCards = isUnassigned
            ? bookItems.filter(
                (item) =>
                  !item.chapterId ||
                  !bookChapters.some(
                    (chapter) => chapter.id === item.chapterId,
                  ),
              )
            : bookItems.filter((item) => item.chapterId === currentChapter.id);
          const activeCards = chapterCards.filter((card) => card.isActive);
          const dueCards = chapterCards.filter((card) => isItemDue(card));
          const masteredCards = chapterCards.filter(
            (card) => card.fsrsData.stability >= 74.5,
          );
          const filteredCards = chapterCards.filter((card) => {
            if (chapterFilter === "active" && !card.isActive) return false;
            if (chapterFilter === "inactive" && card.isActive) return false;
            if (
              chapterFilter === "due" &&
              !isItemDue(card) &&
              !isReviewedToday(card.fsrsData.lastReview)
            ) {
              return false;
            }
            if (
              chapterFilter === "mastered" &&
              card.fsrsData.stability < 74.5
            ) {
              return false;
            }
            if (chapterCardSearch.trim()) {
              const query = chapterCardSearch.toLowerCase();
              const matchesQuestion = (card.question || "")
                .toLowerCase()
                .includes(query);
              const matchesAnswer = (card.answer || "")
                .toLowerCase()
                .includes(query);
              const matchesTag = (card.tags || []).some((tag) =>
                (tag || "").toLowerCase().includes(query),
              );
              if (!matchesQuestion && !matchesAnswer && !matchesTag) {
                return false;
              }
            }
            return true;
          });

          const navigateToChapter = (chapter: Chapter) => {
            setSelectedChapter(chapter);
            setChapterFilter("all");
            setChapterCardSearch("");
          };
          const openCardForm = (generateWithAI: boolean) => {
            setSelectedChapterIdForItem(isUnassigned ? "" : currentChapter.id);
            if (generateWithAI) setIsAIImportOpen(true);
            else setIsNewItemOpen(true);
          };
          const deleteCurrentSection = () => {
            if (isUnassigned) {
              if (chapterCards.length === 0) return;
              setConfirmDialog({
                isOpen: true,
                message:
                  language === "en"
                    ? "Delete all cards in this category?"
                    : "Hapus semua kartu di kategori ini?",
                onConfirm: () => {
                  chapterCards.forEach((item) => deleteItem(item.id));
                  setConfirmDialog(null);
                  setSelectedChapter(null);
                },
              });
              return;
            }
            setConfirmDialog({
              isOpen: true,
              message:
                language === "en"
                  ? "Are you sure you want to delete this chapter?"
                  : "Hapus bab ini beserta isinya?",
              onConfirm: () => {
                deleteChapter(currentChapter.id);
                setSelectedChapter(null);
                setConfirmDialog(null);
              },
            });
          };
          const toggleBulkMode = () => {
            setIsBulkMode((current) => !current);
            setSelectedCardIds(new Set());
          };
          const allFilteredSelected =
            filteredCards.length > 0 &&
            filteredCards.every((card) => selectedCardIds.has(card.id));

          const cardGrid = (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredCards.map((item) => item.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {filteredCards.map((item) => (
                    <SortableItemWrapper
                      key={item.id}
                      activeMenuId={activeMenuId}
                      setActiveMenuId={setActiveMenuId}
                      isReadonly={isCurrentBookReadonly}
                      item={item}
                      isBulkMode={isBulkMode}
                      isSelected={selectedCardIds.has(item.id)}
                      onToggleSelect={() => {
                        setSelectedCardIds((previous) => {
                          const next = new Set(previous);
                          if (next.has(item.id)) next.delete(item.id);
                          else next.add(item.id);
                          return next;
                        });
                      }}
                      onMove={() => {
                        setMovingItem(item);
                        setMovingChapter(null);
                        setTargetMoveChapterId(
                          item.chapterId || "__unassigned__",
                        );
                        setIsMoveModalOpen(true);
                      }}
                      onPreview={() => setPreviewItem(item)}
                      onEdit={() => setEditingItem(item)}
                      onActivate={() => activateItem(item.id)}
                      onDeactivate={() => deactivateItem(item.id)}
                      onReview={(rating: 1 | 2 | 3 | 4) =>
                        reviewItem(item.id, rating)
                      }
                      onDelete={() => deleteItem(item.id)}
                      language={language}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          );

          const pageProps = {
            book: selectedBook,
            chapter: currentChapter,
            breadcrumbs: isUnassigned
              ? []
              : getChapterBreadcrumbs(currentChapter),
            language,
            position: currentChapterIdx + 1,
            totalPositions: navigableChapters.length,
            previousChapter: prevChapter || undefined,
            nextChapter: nextChapter || undefined,
            totalCards: chapterCards.length,
            activeCards: activeCards.length,
            dueCards: dueCards.length,
            masteredCards: masteredCards.length,
            filteredCards: filteredCards.length,
            filter: chapterFilter,
            search: chapterCardSearch,
            isReadonly: isCurrentBookReadonly,
            isBulkMode,
            selectedCount: selectedCardIds.size,
            allFilteredSelected,
            onBack: () => setSelectedChapter(null),
            onNavigateChapter: navigateToChapter,
            onOpenCalendar: () => {
              setCalendarBook(selectedBook);
              setCalendarChapterFilter(
                isUnassigned ? "unassigned" : currentChapter.id,
              );
              setIsBookCalendarOpen(true);
            },
            onEdit: isUnassigned
              ? undefined
              : () => {
                  setEditingChapter(currentChapter);
                  setChapterForm({
                    title: currentChapter.title,
                    description: currentChapter.description || "",
                  });
                  setIsNewChapterOpen(true);
                },
            onDelete: deleteCurrentSection,
            onGenerateAI: () => openCardForm(true),
            onAddCard: () => openCardForm(false),
            onStartReview: () => setIsReviewOpen(true),
            onFilterChange: setChapterFilter,
            onSearchChange: setChapterCardSearch,
            onToggleBulkMode: toggleBulkMode,
            onToggleSelectAll: () => {
              setSelectedCardIds(
                allFilteredSelected
                  ? new Set()
                  : new Set(filteredCards.map((card) => card.id)),
              );
            },
            onBulkActivate: handleBulkActivate,
            onBulkDeactivate: handleBulkDeactivate,
            onBulkMove: () => {
              setMovingItem(null);
              setMovingChapter(null);
              setTargetMoveChapterId(
                isUnassigned ? "__unassigned__" : currentChapter.id,
              );
              setIsMoveModalOpen(true);
            },
            onBulkDelete: handleBulkDelete,
          };

          return currentChapter.parentId ? (
            <PersonalSubchapterPage
              {...pageProps}
              parentTitle={
                bookChapters.find(
                  (chapter) => chapter.id === currentChapter.parentId,
                )?.title || ""
              }
            >
              {cardGrid}
            </PersonalSubchapterPage>
          ) : (
            <PersonalChapterPage
              {...pageProps}
              variant={isUnassigned ? "unassigned" : "chapter"}
            >
              {cardGrid}
            </PersonalChapterPage>
          );
        })()}

      {/* Dialog: New Book */}
      <BookFormModal
        isOpen={isNewBookOpen || !!editingBook}
        onClose={() => {
          setIsNewBookOpen(false);
          setEditingBook(null);
        }}
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
        <ModalOverlay
          isOpen
          isDismissable
          onOpenChange={(open) => {
            if (!open) closeChapterModal();
          }}
        >
          <Modal className="max-w-lg overflow-hidden rounded-t-3xl sm:rounded-3xl">
            <Dialog
              aria-label={
                editingChapter
                  ? language === "en"
                    ? "Edit chapter"
                    : "Edit bab"
                  : language === "en"
                    ? "Create chapter"
                    : "Buat bab"
              }
            >
              <form
                onSubmit={handleCreateChapter}
                className="flex max-h-[inherit] flex-col"
              >
                <div className="relative shrink-0 overflow-hidden border-b border-brand-200 bg-[linear-gradient(135deg,var(--color-brand-50)_0%,var(--color-bg-primary)_75%)] px-5 py-5 sm:px-6">
                  <div className="pointer-events-none absolute -right-10 -top-16 size-36 rounded-full bg-brand-200/40 blur-3xl" />
                  <div className="relative flex items-start gap-3 pr-10">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-solid text-white shadow-xs ring-1 ring-brand-600 ring-inset">
                      {parentChapterIdForNew ? (
                        <FolderPlus className="size-5" />
                      ) : (
                        <ListOrdered className="size-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-primary">
                          {editingChapter
                            ? language === "en"
                              ? "Edit chapter"
                              : "Edit bab"
                            : language === "en"
                              ? parentChapterIdForNew
                                ? "Add subchapter"
                                : "Add chapter"
                              : parentChapterIdForNew
                                ? "Tambah subbab"
                                : "Tambah bab"}
                        </h2>
                        <Badge color="brand" size="sm">
                          {parentChapterIdForNew
                            ? language === "en"
                              ? "Nested"
                              : "Subbab"
                            : language === "en"
                              ? "Main chapter"
                              : "Bab utama"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm leading-5 text-secondary">
                        {editingChapter
                          ? language === "en"
                            ? "Update the chapter name and its short description."
                            : "Perbarui nama bab dan deskripsi singkatnya."
                          : parentChapterIdForNew
                            ? language === "en"
                              ? "Organize related cards under the selected parent chapter."
                              : "Kelompokkan kartu terkait di bawah bab induk yang dipilih."
                            : language === "en"
                              ? "Create a clear section for organizing this book's cards."
                              : "Buat bagian yang jelas untuk menyusun kartu dalam kitab ini."}
                      </p>
                    </div>
                  </div>
                  <ButtonUtility
                    icon={X}
                    color="tertiary"
                    tooltip={
                      language === "en"
                        ? "Close chapter form"
                        : "Tutup form bab"
                    }
                    onPress={closeChapterModal}
                    className="absolute right-4 top-4 bg-primary/80 shadow-xs backdrop-blur-sm"
                  />
                </div>

                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
                  {parentChapterIdForNew && (
                    <div className="flex items-center gap-3 rounded-2xl border border-secondary bg-secondary/40 p-3.5">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-brand-700 shadow-xs ring-1 ring-secondary ring-inset">
                        <CornerDownRight className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-tertiary">
                          {language === "en" ? "Parent chapter" : "Bab induk"}
                        </p>
                        <p className="truncate text-sm font-semibold text-primary">
                          {bookChapters.find(
                            (chapter) => chapter.id === parentChapterIdForNew,
                          )?.title ||
                            (language === "en"
                              ? "Selected chapter"
                              : "Bab terpilih")}
                        </p>
                      </div>
                    </div>
                  )}

                  <Input
                    autoFocus
                    label={language === "en" ? "Chapter title" : "Judul bab"}
                    isRequired
                    value={chapterForm.title}
                    onChange={(value) =>
                      setChapterForm((current) => ({
                        ...current,
                        title: value,
                      }))
                    }
                    placeholder={
                      language === "en"
                        ? "Example: Chapter 1 - Foundations"
                        : "Contoh: Bab 1 - Dasar-dasar"
                    }
                    hint={
                      language === "en"
                        ? "Use a concise title that is easy to scan."
                        : "Gunakan judul singkat yang mudah dipindai."
                    }
                  />

                  <TextArea
                    label={language === "en" ? "Description" : "Deskripsi"}
                    value={chapterForm.description}
                    onChange={(value) =>
                      setChapterForm((current) => ({
                        ...current,
                        description: value,
                      }))
                    }
                    placeholder={
                      language === "en"
                        ? "What material is covered in this chapter?"
                        : "Materi apa yang dibahas dalam bab ini?"
                    }
                    rows={3}
                    hint={
                      language === "en"
                        ? "Optional. This appears alongside the chapter title."
                        : "Opsional. Teks ini tampil bersama judul bab."
                    }
                  />
                </div>

                <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-secondary bg-secondary px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                  <Button
                    color="secondary"
                    size="md"
                    onPress={closeChapterModal}
                    className="w-full sm:w-auto"
                  >
                    {language === "en" ? "Cancel" : "Batal"}
                  </Button>
                  <Button
                    type="submit"
                    size="md"
                    iconLeading={editingChapter ? Pencil : Plus}
                    isDisabled={!chapterForm.title.trim()}
                    className="w-full sm:w-auto"
                  >
                    {editingChapter
                      ? language === "en"
                        ? "Save changes"
                        : "Simpan perubahan"
                      : language === "en"
                        ? parentChapterIdForNew
                          ? "Add subchapter"
                          : "Add chapter"
                        : parentChapterIdForNew
                          ? "Tambah subbab"
                          : "Tambah bab"}
                  </Button>
                </div>
              </form>
            </Dialog>
          </Modal>
        </ModalOverlay>
      )}

      {/* Dialog: New Item Card */}
      {isAIBookBuilderOpen && (
        <AIBookBuilderModal
          language={language}
          onClose={() => setIsAIBookBuilderOpen(false)}
          onImport={async (bookData) => {
            const newBook = await createBook({
              title:
                bookData.title ||
                (language === "en" ? "Generated Book" : "Buku Baru"),
              description: bookData.description || "",
              coverUrl: "",
              isPublic: false,
            });
            const newBookId = newBook.id;

            if (bookData.chapters && Array.isArray(bookData.chapters)) {
              for (
                let chIndex = 0;
                chIndex < bookData.chapters.length;
                chIndex++
              ) {
                const ch = bookData.chapters[chIndex];
                const newChapter = await createChapter({
                  bookId: newBookId,
                  title: ch.title || `Chapter ${chIndex + 1}`,
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
                tags: [],
              });
            });
            setIsAIImportOpen(false);
          }}
        />
      )}
      <ItemFormModal
        isOpen={isNewItemOpen || !!editingItem}
        onClose={() => {
          setIsNewItemOpen(false);
          setEditingItem(null);
        }}
        onSubmit={(data, keepOpen) => {
          if (editingItem) {
            updateItem(editingItem.id, data);
            setEditingItem(null);
            setIsNewItemOpen(false);
          } else if (selectedBook) {
            createItem({
              bookId: selectedBook.id,
              ...data,
              tags: [],
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
        const previewList =
          currentChapter?.id === "__unassigned__"
            ? bookItems.filter(
                (i) =>
                  !i.chapterId ||
                  !bookChapters.some((c) => c.id === i.chapterId),
              )
            : currentChapter
              ? bookItems.filter((i) => i.chapterId === currentChapter.id)
              : bookItems;
        const pIdx = previewItem
          ? previewList.findIndex((i) => i.id === previewItem.id)
          : -1;
        const nextPreviewItem =
          pIdx >= 0 && pIdx < previewList.length - 1
            ? previewList[pIdx + 1]
            : undefined;
        const prevPreviewItem = pIdx > 0 ? previewList[pIdx - 1] : undefined;

        return (
          <ItemPreviewModal
            item={previewItem}
            isOpen={Boolean(previewItem)}
            onClose={() => setPreviewItem(null)}
            onNavigateNext={
              nextPreviewItem
                ? () => setPreviewItem(nextPreviewItem)
                : undefined
            }
            onNavigatePrev={
              prevPreviewItem
                ? () => setPreviewItem(prevPreviewItem)
                : undefined
            }
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
        key={`${isReviewOpen}-${selectedBook?.id || reviewSpecificBookId || "all"}-${currentChapter?.id || "all"}`}
        isOpen={isReviewOpen}
        onClose={() => {
          setIsReviewOpen(false);
          setReviewSpecificBookId(null);
        }}
        specificBookId={
          selectedBook ? selectedBook.id : reviewSpecificBookId || undefined
        }
        specificChapterId={
          currentChapter && currentChapter.id !== "__unassigned__"
            ? currentChapter.id
            : undefined
        }
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
          chapters={chapters.filter((c) => c.bookId === calendarBook.id)}
          language={language}
          initialChapterFilter={calendarChapterFilter}
          onStartReview={(chapterId) => {
            setIsBookCalendarOpen(false);
            setReviewSpecificBookId(calendarBook.id);
            setSelectedBook(calendarBook);
            if (chapterId) {
              const ch = chapters.find((c) => c.id === chapterId);
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
      <ModalOverlay
        isOpen={isJoinClassModalOpen}
        isDismissable={!isJoiningClass}
        onOpenChange={(open) => {
          if (!open) closeJoinClassModal();
        }}
      >
        <Modal className="max-w-md overflow-hidden rounded-t-3xl sm:rounded-3xl">
          <Dialog
            aria-label={
              language === "en"
                ? "Join class with code"
                : "Gabung kelas dengan kode"
            }
          >
            {({ close }) => (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  handleJoinClass();
                }}
                className="flex max-h-[inherit] flex-col"
              >
                <div className="relative flex shrink-0 items-start gap-3 border-b border-secondary px-5 py-5 sm:px-6">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-200 ring-inset">
                    <KeyRound className="size-5" />
                  </div>
                  <div className="min-w-0 pr-10">
                    <h2 className="text-lg font-semibold text-primary">
                      {language === "en" ? "Join a class" : "Gabung kelas"}
                    </h2>
                    <p className="mt-0.5 text-sm text-secondary">
                      {language === "en"
                        ? "Enter the invitation code shared by your teacher."
                        : "Masukkan kode undangan yang dibagikan oleh guru Anda."}
                    </p>
                  </div>
                  <CloseButton
                    label={
                      language === "en"
                        ? "Close join class modal"
                        : "Tutup modal gabung kelas"
                    }
                    onPress={close}
                    isDisabled={isJoiningClass}
                    className="absolute right-4 top-4"
                  />
                </div>

                <div className="space-y-4 px-5 py-5 sm:px-6">
                  <Input
                    label={language === "en" ? "Class code" : "Kode kelas"}
                    icon={KeyRound}
                    autoFocus
                    value={codeInputValue}
                    onChange={(value) => {
                      setCodeInputValue(value.toUpperCase());
                      if (joinMessage) setJoinMessage(null);
                    }}
                    placeholder={
                      language === "en"
                        ? "Example: BOOK-89AB"
                        : "Contoh: BOOK-89AB"
                    }
                    inputClassName="font-semibold uppercase tracking-wider placeholder:normal-case placeholder:font-normal placeholder:tracking-normal"
                    isInvalid={Boolean(joinMessage?.isError)}
                  />
                  {joinMessage && (
                    <InlineAlert
                      variant={joinMessage.isError ? "error" : "success"}
                      title={joinMessage.text}
                      onDismiss={() => setJoinMessage(null)}
                    />
                  )}
                </div>

                <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-secondary bg-secondary px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                  <Button
                    color="secondary"
                    size="md"
                    onPress={close}
                    isDisabled={isJoiningClass}
                    className="w-full sm:w-auto"
                  >
                    {language === "en" ? "Cancel" : "Batal"}
                  </Button>
                  <Button
                    type="submit"
                    size="md"
                    iconLeading={LogIn}
                    isDisabled={!codeInputValue.trim()}
                    isLoading={isJoiningClass}
                    className="w-full sm:w-auto"
                  >
                    {language === "en" ? "Join class" : "Gabung kelas"}
                  </Button>
                </div>
              </form>
            )}
          </Dialog>
        </Modal>
      </ModalOverlay>

      {confirmDialog?.isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 text-center">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {language === "en" ? "Confirmation" : "Konfirmasi"}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              {confirmDialog.message}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {language === "en" ? "Cancel" : "Batal"}
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-sm transition-colors cursor-pointer"
              >
                {language === "en" ? "Yes" : "Ya"}
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
  onReview?: (rating: 1 | 2 | 3 | 4) => Promise<number> | void;
  onDelete: () => void;
  onMove?: () => void;
  isBulkMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  language: "en" | "id";
}

const SortableItemWrapper = (props: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.item.id, disabled: props.isReadonly });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging
      ? 50
      : props.activeMenuId === `item-${props.item.id}`
        ? 50
        : undefined,
    position:
      isDragging || props.activeMenuId === `item-${props.item.id}`
        ? "relative"
        : undefined,
    opacity: isDragging ? 0.9 : 1,
    boxShadow: isDragging
      ? "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
      : undefined,
    scale: isDragging ? "1.02" : "1",
    touchAction: "manipulation", // Allows scroll but handles drag
    WebkitUserSelect: "none",
    WebkitTouchCallout: "none",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="select-none"
    >
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
  isReadonly,
}) => {
  const [showInlineAnswer, setShowInlineAnswer] = useState(false);
  const [isMobileFlipping, setIsMobileFlipping] = useState(false);
  const mobileFlipTimeoutRef = React.useRef<number | null>(null);
  const [justReviewedRating, setJustReviewedRating] = useState<number | null>(
    null,
  );
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
  const [showAudio, setShowAudio] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);

  const submitReview = async (rating: 1 | 2 | 3) => {
    if (!onReview || isReviewSubmitting) return;
    setIsReviewSubmitting(true);
    try {
      await onReview(rating);
      soundEffects.playRatingFeedback(rating);
      setJustReviewedRating(rating);
      window.setTimeout(() => setJustReviewedRating(null), 1500);
    } catch (error) {
      console.error("Book review failed:", error);
      toast.error("Review gagal disimpan. Coba lagi.");
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    AudioStorageService.hasAudio(item.id).then((exists) => {
      if (mounted) setHasAudio(exists);
    });

    const handleAudioChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ itemId: string | number }>;
      if (String(customEvent.detail?.itemId) === String(item.id)) {
        AudioStorageService.hasAudio(item.id).then((exists) => {
          if (mounted) setHasAudio(exists);
        });
      }
    };

    window.addEventListener("audio-updated", handleAudioChange);

    return () => {
      mounted = false;
      window.removeEventListener("audio-updated", handleAudioChange);
    };
  }, [item.id]);

  const isDueToday =
    item.isActive &&
    (!item.fsrsData.nextReview ||
      new Date(item.fsrsData.nextReview) <= new Date());
  const reviewedToday = isReviewedToday(item.fsrsData.lastReview);
  const showDimmed = reviewedToday && !isDueToday;
  const intervalDays = getNonQuranIntervalDays(item.fsrsData);
  const isMapan = item.isActive && intervalDays >= 300;
  const intervals = predictNonQuranIntervals(item.fsrsData);
  const hasVisualMedia = Boolean(item.imageQ || item.imageA);

  const formatDate = (d: string | null) => {
    if (!d) return language === "en" ? "Today" : "Hari ini";
    const nextDate = new Date(d);
    const now = new Date();
    const formatted = nextDate.toLocaleDateString(
      language === "en" ? "en-US" : "id-ID",
      { month: "short", day: "numeric" },
    );
    if (nextDate <= now) {
      return language === "en"
        ? `Today (${formatted})`
        : `Hari ini (${formatted})`;
    }
    return formatted;
  };

  const getFullDueDateStr = (d: string | null) => {
    if (!d) return language === "en" ? "Today" : "Hari ini";
    const nextDate = new Date(d);
    return nextDate.toLocaleDateString(language === "en" ? "en-US" : "id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const menuId = `item-${item.id}`;
  const isMenuOpen = activeMenuId === menuId;

  const handleMobileCardFlip = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();
    if (isBulkMode) {
      onToggleSelect?.();
      return;
    }
    if (mobileFlipTimeoutRef.current !== null) return;

    setIsMobileFlipping(true);
    mobileFlipTimeoutRef.current = window.setTimeout(() => {
      setShowInlineAnswer((current) => !current);
      setIsMobileFlipping(false);
      mobileFlipTimeoutRef.current = null;
    }, 160);
  };

  useEffect(() => {
    return () => {
      if (mobileFlipTimeoutRef.current !== null) {
        window.clearTimeout(mobileFlipTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`group relative flex flex-col justify-between gap-2.5 rounded-xl border p-3 transition-all sm:rounded-2xl sm:p-3.5 ${isMenuOpen ? "z-50 ring-2 ring-brand-500/20" : ""} ${
        isSelected
          ? "border-brand-500 bg-brand-50/40 ring-2 ring-brand-500/30 shadow-2xs"
          : isDueToday
            ? "border-amber-300/90 bg-amber-50/25 dark:bg-amber-950/20 dark:border-amber-700/60 shadow-2xs"
            : showDimmed
              ? "border-emerald-200/50 bg-emerald-50/10 dark:bg-emerald-950/10 dark:border-emerald-800/30 opacity-75 grayscale-[20%]"
              : item.isActive
                ? "border-secondary bg-primary shadow-2xs hover:border-brand-300 hover:shadow-md"
                : "border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 opacity-80 hover:opacity-100"
      }`}
    >
      {/* Top Header: Checkbox (if bulk) + 1-Tap Activation Pill + Due Status + Pop-up Eye (Mata 1) + Menu */}
      <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Bulk Selection Checkbox */}
          {isBulkMode && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect?.();
              }}
              className="shrink-0 rounded-md p-1 text-brand-600 transition-transform hover:scale-105"
              title={isSelected ? "Deselect" : "Select"}
            >
              {isSelected ? (
                <CheckSquare className="size-4 text-brand-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
            </button>
          )}

          {/* Prominent 1-Tap Activation Pill */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              item.isActive ? onDeactivate() : onActivate();
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 active:scale-95 group/act ${
              item.isActive
                ? "bg-emerald-600 hover:bg-rose-600 text-white shadow-2xs"
                : "bg-slate-100 hover:bg-emerald-600 hover:text-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            }`}
            title={
              item.isActive
                ? language === "en"
                  ? "Card is Active (click to deactivate)"
                  : "Kartu Aktif (klik untuk menonaktifkan)"
                : language === "en"
                  ? "Card is Inactive (click to activate)"
                  : "Kartu Nonaktif (klik untuk mengaktifkan)"
            }
          >
            {item.isActive ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 group-hover/act:hidden" />
                <Power className="w-3.5 h-3.5 hidden group-hover/act:inline" />
                <span className="group-hover/act:hidden">
                  {language === "en" ? "Active" : "Aktif"}
                </span>
                <span className="hidden group-hover/act:inline">
                  {language === "en" ? "Deactivate" : "Nonaktifkan"}
                </span>
              </>
            ) : (
              <>
                <Power className="w-3.5 h-3.5" />
                <span>{language === "en" ? "Activate" : "Aktifkan"}</span>
              </>
            )}
          </button>

          {/* Due Today indicator */}
          {isDueToday && (
            <span className="px-2 py-0.5 rounded-md bg-amber-100/90 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 font-bold text-[10px] flex items-center gap-1 border border-amber-200 dark:border-amber-800/60">
              <Flame className="w-3 h-3 text-amber-500" />
              {language === "en" ? "Due Today" : "Perlu Review"}
            </span>
          )}

          {/* Mapan Badge (>300 Hari) */}
          {isMapan && (
            <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-[10px] border border-amber-300 dark:border-amber-700 flex items-center gap-1">
              <Award className="w-3 h-3 text-amber-500" />
              {language === "en" ? "Mastered (>300d)" : "Mapan (>300d)"}
            </span>
          )}
        </div>

        {/* Right Header Actions: Ikon Mata 1 (Lihat Lengkap via Pop-up Modal) + Menu */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            className="flex cursor-pointer items-center gap-1 rounded-lg border border-brand-200 bg-brand-50/80 px-2.5 py-1 text-[11px] font-semibold text-brand-700 transition-colors hover:bg-brand-100"
            title={
              language === "en"
                ? "Open popup viewer"
                : "Buka jendela pop-up lengkap"
            }
          >
            <Eye className="size-3.5 text-brand-500" />
            <span>{language === "en" ? "Pop-up" : "Lihat"}</span>
          </button>

          {!isReadonly && (
            <div className="relative shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenuId(activeMenuId === menuId ? null : menuId);
                }}
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
                    onClick={() => {
                      setActiveMenuId(null);
                      onEdit();
                    }}
                    className="w-full text-left px-3 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                  >
                    <Edit2 className="size-3.5 text-brand-500" />
                    <span>{language === "en" ? "Edit" : "Edit"}</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveMenuId(null);
                      onDelete();
                    }}
                    className="w-full text-left px-3 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{language === "en" ? "Delete" : "Hapus"}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile uses one layer so browser compositing cannot hide both faces. */}
      <div className="[perspective:1200px] sm:hidden">
        <button
          type="button"
          onClick={handleMobileCardFlip}
          aria-label={
            isBulkMode
              ? language === "en"
                ? "Select card"
                : "Pilih kartu"
              : showInlineAnswer
                ? language === "en"
                  ? "Flip to question"
                  : "Balik ke pertanyaan"
                : language === "en"
                  ? "Flip to answer"
                  : "Balik ke jawaban"
          }
          aria-pressed={showInlineAnswer}
          className={`flex w-full min-w-0 flex-col overflow-hidden rounded-xl border p-3 text-left outline-none transition-transform duration-150 ease-in-out [transform-style:preserve-3d] focus-visible:outline-[3px] focus-visible:outline-offset-1 focus-visible:outline-[#ef6905] ${
            hasVisualMedia ? "min-h-64" : "min-h-44"
          } ${
            showInlineAnswer
              ? "border-brand-200 bg-brand-50/40"
              : "border-secondary bg-secondary/35"
          } ${
            isMobileFlipping
              ? "[transform:rotateY(90deg)]"
              : "[transform:rotateY(0deg)]"
          }`}
        >
          <span className="mb-3 flex w-full items-center justify-between gap-2 text-[9px] font-bold uppercase tracking-[0.12em] text-quaternary">
            <span>
              {showInlineAnswer
                ? language === "en"
                  ? "Answer"
                  : "Jawaban"
                : language === "en"
                  ? "Question"
                  : "Pertanyaan"}
            </span>
            {!isBulkMode && (
              <span className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[9px] normal-case tracking-normal text-brand-700 shadow-xs">
                <RotateCw className="size-3" />
                {language === "en" ? "Flip" : "Balik"}
              </span>
            )}
          </span>

          {showInlineAnswer ? (
            <>
              {item.imageA && (
                <div className="mb-3 flex h-40 w-full items-center justify-center overflow-hidden rounded-lg border border-brand-200 bg-primary shadow-2xs">
                  <img
                    src={item.imageA}
                    alt={language === "en" ? "Answer media" : "Media jawaban"}
                    className="size-full object-contain"
                  />
                </div>
              )}

              <div className="my-auto w-full min-w-0">
                <BilingualCardText
                  text={item.answer}
                  type="answer"
                  variant="card-list"
                  emptyFallback={
                    language === "en"
                      ? "[No text answer]"
                      : "[Tidak ada teks jawaban]"
                  }
                />

                {item.explanation && (
                  <div className="mt-3 border-t border-brand-200 pt-2 text-xs text-secondary">
                    <span className="font-semibold text-brand-700">
                      {language === "en" ? "Explanation" : "Penjelasan"}:{" "}
                    </span>
                    <BilingualCardText
                      text={item.explanation}
                      type="answer"
                      variant="card-list"
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {item.imageQ && (
                <div className="mb-3 flex h-40 w-full items-center justify-center overflow-hidden rounded-lg border border-secondary bg-primary shadow-2xs">
                  <img
                    src={item.imageQ}
                    className="size-full object-contain"
                    alt={
                      language === "en" ? "Question media" : "Media pertanyaan"
                    }
                  />
                </div>
              )}

              <div className="my-auto w-full min-w-0">
                <BilingualCardText
                  text={item.question}
                  type="question"
                  variant="card-list"
                  emptyFallback={
                    language === "en" ? "[Image Only]" : "[Hanya Gambar]"
                  }
                />
              </div>
            </>
          )}

          {!isBulkMode && (
            <span
              className={`mt-4 flex items-center justify-center gap-1.5 border-t pt-2.5 text-[10px] font-medium text-brand-700 ${
                showInlineAnswer ? "border-brand-200" : "border-secondary"
              }`}
            >
              <RotateCw className="size-3" />
              {showInlineAnswer
                ? language === "en"
                  ? "Tap to return to the question"
                  : "Ketuk untuk kembali ke pertanyaan"
                : language === "en"
                  ? "Tap to see the answer"
                  : "Ketuk untuk melihat jawaban"}
            </span>
          )}
        </button>
      </div>

      {/* Desktop: retain the side-by-side/stacked layout. */}
      <div className="hidden sm:block">
        <div
          className={hasVisualMedia ? "grid grid-cols-2 gap-3" : "space-y-2.5"}
        >
          <button
            type="button"
            className={`group/content flex min-w-0 flex-col rounded-2xl border border-secondary bg-secondary/35 p-3 text-left outline-none transition hover:border-brand-200 hover:bg-brand-50/35 focus-visible:outline-[3px] focus-visible:outline-offset-1 focus-visible:outline-[#ef6905] ${
              hasVisualMedia ? "min-h-44" : "w-full"
            }`}
            onClick={(event) => {
              if (isBulkMode) {
                event.stopPropagation();
                onToggleSelect?.();
              } else {
                onPreview();
              }
            }}
            title={
              isBulkMode
                ? language === "en"
                  ? "Click to select/deselect"
                  : "Klik untuk memilih kartu"
                : language === "en"
                  ? "Click to open pop-up preview"
                  : "Klik untuk melihat pop-up lengkap"
            }
          >
            <span className="mb-2 text-[9px] font-bold uppercase tracking-[0.12em] text-quaternary">
              {language === "en" ? "Question" : "Pertanyaan"}
            </span>
            {item.imageQ && (
              <div className="mb-3 flex h-28 w-full items-center justify-center overflow-hidden rounded-xl border border-secondary bg-primary shadow-2xs sm:h-40">
                <img
                  src={item.imageQ}
                  className="size-full object-contain transition-transform duration-300 group-hover/content:scale-[1.02]"
                  alt={language === "en" ? "Question media" : "Media pertanyaan"}
                />
              </div>
            )}
            <div
              className={`min-w-0 ${hasVisualMedia && !item.imageQ ? "my-auto w-full" : "w-full"}`}
            >
              <BilingualCardText
                text={item.question}
                type="question"
                variant="card-list"
                emptyFallback={
                  language === "en" ? "[Image Only]" : "[Hanya Gambar]"
                }
              />
            </div>
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setShowInlineAnswer((current) => !current);
            }}
            className={`flex min-w-0 flex-col rounded-2xl border p-3 text-left outline-none transition focus-visible:outline-[3px] focus-visible:outline-offset-1 focus-visible:outline-[#ef6905] ${
              hasVisualMedia ? "min-h-44" : "w-full"
            } ${
              showInlineAnswer
                ? "border-brand-200 bg-brand-50/40"
                : "border-secondary bg-secondary/35 hover:border-brand-200 hover:bg-brand-50/35"
            }`}
          >
            <span className="mb-2 flex w-full items-center justify-between gap-2 text-[9px] font-bold uppercase tracking-[0.12em] text-quaternary">
              <span>{language === "en" ? "Answer" : "Jawaban"}</span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-primary px-2 py-1 text-[9px] normal-case tracking-normal text-brand-700 shadow-xs">
                {showInlineAnswer ? (
                  <EyeOff className="size-3" />
                ) : (
                  <Eye className="size-3" />
                )}
                {showInlineAnswer
                  ? language === "en"
                    ? "Hide"
                    : "Tutup"
                  : language === "en"
                    ? "Open"
                    : "Buka"}
              </span>
            </span>

            {showInlineAnswer ? (
              <>
                {item.imageA && (
                  <div className="mb-3 flex h-28 w-full items-center justify-center overflow-hidden rounded-xl border border-brand-200 bg-primary shadow-2xs sm:h-40">
                    <img
                      src={item.imageA}
                      alt={language === "en" ? "Answer media" : "Media jawaban"}
                      className="size-full object-contain"
                    />
                  </div>
                )}
                <div
                  className={`min-w-0 ${hasVisualMedia && !item.imageA ? "my-auto w-full" : "w-full"}`}
                >
                  <BilingualCardText
                    text={item.answer}
                    type="answer"
                    variant="card-list"
                    emptyFallback={
                      language === "en"
                        ? "[No text answer]"
                        : "[Tidak ada teks jawaban]"
                    }
                  />

                  {item.explanation && (
                    <div className="mt-3 border-t border-brand-200 pt-2 text-xs text-secondary">
                      <span className="font-semibold text-brand-700">
                        {language === "en" ? "Explanation" : "Penjelasan"}:{" "}
                      </span>
                      <BilingualCardText
                        text={item.explanation}
                        type="answer"
                        variant="card-list"
                      />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <span className="my-auto flex w-full flex-col items-center justify-center gap-2 py-6 text-center text-xs font-medium text-tertiary">
                <span className="flex size-9 items-center justify-center rounded-full bg-brand-solid text-white shadow-md shadow-brand-500/20">
                  <Eye className="size-4" />
                </span>
                {language === "en"
                  ? "Click to reveal the answer"
                  : "Klik untuk buka jawaban"}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 3 Tombol Evaluasi Kartu (hanya muncul jika aktif dan sudah waktunya review) */}
      {item.isActive ? (
        isDueToday ? (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                disabled={isReviewSubmitting}
                onClick={(e) => {
                  e.stopPropagation();
                  void submitReview(1);
                }}
                className={`py-1.5 px-1 rounded-lg border text-center transition-all flex flex-col items-center justify-center cursor-pointer shadow-2xs ${
                  justReviewedRating === 1
                    ? "bg-rose-600 text-white border-rose-600 ring-2 ring-rose-400"
                    : "border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300"
                }`}
                title={
                  language === "en"
                    ? "Review again tomorrow"
                    : "Lupa total / Ulang lagi"
                }
              >
                <span className="text-[11px] font-bold leading-tight">
                  {language === "en" ? "Again" : "Lagi"}
                </span>
                <span className="text-[9px] font-semibold opacity-85 mt-0.5">
                  {intervals.again}
                </span>
              </button>
              <button
                type="button"
                disabled={isReviewSubmitting}
                onClick={(e) => {
                  e.stopPropagation();
                  void submitReview(2);
                }}
                className={`py-1.5 px-1 rounded-lg border text-center transition-all flex flex-col items-center justify-center cursor-pointer shadow-2xs ${
                  justReviewedRating === 2
                    ? "bg-amber-600 text-white border-amber-600 ring-2 ring-amber-400"
                    : "border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300"
                }`}
                title={
                  language === "en"
                    ? "Hard to recall"
                    : "Ingat dengan susah payah"
                }
              >
                <span className="text-[11px] font-bold leading-tight">
                  {language === "en" ? "Hard" : "Sulit"}
                </span>
                <span className="text-[9px] font-semibold opacity-85 mt-0.5">
                  {intervals.hard}
                </span>
              </button>
              <button
                type="button"
                disabled={isReviewSubmitting}
                onClick={(e) => {
                  e.stopPropagation();
                  void submitReview(3);
                }}
                className={`py-1.5 px-1 rounded-lg border text-center transition-all flex flex-col items-center justify-center cursor-pointer shadow-2xs ${
                  justReviewedRating === 3
                    ? "bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-400"
                    : "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"
                }`}
                title={language === "en" ? "Good recall" : "Ingat dengan baik"}
              >
                <span className="text-[11px] font-bold leading-tight">
                  {language === "en" ? "Good" : "Baik"}
                </span>
                <span className="text-[9px] font-semibold opacity-85 mt-0.5">
                  {intervals.good}
                </span>
              </button>
            </div>
          </div>
        ) : null
      ) : (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 italic">
            {language === "en"
              ? "Activate card to enable scheduled review"
              : "Aktifkan kartu untuk mulai jadwal review"}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onActivate();
            }}
            className="flex cursor-pointer items-center gap-1 rounded-lg bg-brand-solid px-2.5 py-1 text-[11px] font-semibold text-white shadow-2xs hover:bg-brand-solid_hover"
          >
            <Plus className="w-3 h-3" />
            <span>{language === "en" ? "Activate" : "Aktifkan"}</span>
          </button>
        </div>
      )}

      {/* Bottom Row: Learning Metrics (Api, Otak, Kalender) & Ikon Mata Buka/Tutup Jawaban di Pojok Kanan Bawah */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60 text-xs">
        {item.isActive ? (
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <div
              className="flex items-center gap-1"
              title={
                language === "en"
                  ? `Reviewed: ${item.fsrsData.reps} times`
                  : `Direview: ${item.fsrsData.reps} kali`
              }
            >
              <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                {item.fsrsData.reps}×
              </span>
            </div>
            <div
              className="flex items-center gap-1"
              title={
                language === "en"
                  ? `Calculated Interval: ${intervalDays} days`
                  : `Interval terhitung: ${intervalDays} hari`
              }
            >
              <Brain className="size-3.5 shrink-0 text-brand-500" />
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                {intervalDays}d
              </span>
            </div>
            <div
              className="flex items-center gap-1"
              title={
                language === "en"
                  ? `Due Date: ${getFullDueDateStr(item.fsrsData.nextReview)}`
                  : `Jatuh tempo: ${getFullDueDateStr(item.fsrsData.nextReview)}`
              }
            >
              <CalendarClock
                className={`w-3.5 h-3.5 shrink-0 ${isDueToday ? "text-amber-500" : "text-sky-500"}`}
              />
              <span
                className={`text-[11px] font-semibold ${isDueToday ? "text-amber-600 dark:text-amber-400 font-bold" : "text-slate-500 dark:text-slate-400"}`}
              >
                {formatDate(item.fsrsData.nextReview)}
              </span>
            </div>

            {/* Saved feedback */}
            {justReviewedRating && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5 animate-pulse ml-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {language === "en" ? "Saved!" : "Tersimpan!"}
              </span>
            )}
          </div>
        ) : (
          <div className="text-[11px] text-slate-400 italic">
            {language === "en"
              ? "Card inactive (not in daily review)"
              : "Nonaktif (tidak masuk review harian)"}
          </div>
        )}

        {/* Pojok Kanan Bawah: Tags + Ikon Mata Buka/Tutup Jawaban (Jempol Kanan) */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          {/* Audio Recording & Playback button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowAudio(!showAudio);
            }}
            className={`relative w-7 h-7 rounded-full border flex items-center justify-center transition-all shadow-2xs cursor-pointer hover:scale-105 active:scale-95 ${
              hasAudio
                ? "border-brand-300 bg-brand-50 text-brand-600 shadow-brand-500/10"
                : showAudio
                  ? "bg-slate-200 border-slate-300 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700"
            }`}
            title={language === "en" ? "Voice Recording" : "Rekaman Suara"}
          >
            <Mic className="w-3 h-3" />
            {hasAudio && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {item.tags && item.tags.length > 0 && (
            <div className="hidden sm:flex items-center gap-1 overflow-hidden">
              {item.tags.slice(0, 1).map((t, idx) => (
                <span
                  key={idx}
                  className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 truncate max-w-[60px]"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Ikon Mata Buka/Tutup Jawaban di Sebelah Kanan Bawah */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowInlineAnswer((prev) => !prev);
            }}
            className={`hidden px-2 py-0.5 rounded-lg border transition-all cursor-pointer sm:flex items-center gap-1 text-[11px] font-medium shadow-2xs ${
              showInlineAnswer
                ? "border-brand-300 bg-brand-100 text-brand-700"
                : "border-secondary bg-secondary text-secondary hover:bg-brand-50 hover:text-brand-700"
            }`}
            title={
              showInlineAnswer
                ? language === "en"
                  ? "Hide answer"
                  : "Tutup jawaban"
                : language === "en"
                  ? "Show answer"
                  : "Buka jawaban"
            }
          >
            {showInlineAnswer ? (
              <EyeOff className="size-3.5 text-brand-600" />
            ) : (
              <Eye className="size-3.5 text-fg-quaternary hover:text-brand-500" />
            )}
            <span className="text-[10px]">
              {showInlineAnswer
                ? language === "en"
                  ? "Hide"
                  : "Tutup"
                : language === "en"
                  ? "Answer"
                  : "Jawaban"}
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
            itemLabel={language === "en" ? "Voice Note" : "Setoran Suara"}
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
