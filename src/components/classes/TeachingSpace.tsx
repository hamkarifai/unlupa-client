import React, { useState, useRef, useMemo, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { useSwipeGesture } from "../../hooks/useSwipeGesture";
import { ClassStudent, ClassGroup, Book } from "../../types";
import { StudentQuranView } from "./StudentQuranView";
import { StudentBookView } from "./StudentBookView";
import { StudentProgressReportModal } from "./StudentProgressReportModal";
import { JuzRangeSelector } from "./JuzRangeSelector";
import { PersonalSpace } from "../personal/PersonalSpace";
import { isDue } from "../../lib/fsrs";
import { UnifiedDueCard } from "../common/UnifiedDueCard";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import {
  Dialog,
  Modal,
  ModalOverlay,
} from "@/components/application/modals/modal";
import { InlineAlert } from "@/components/base/alert/alert";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { CloseButton } from "@/components/base/buttons/close-button";
import { Input } from "@/components/base/input/input";
import { TextArea } from "@/components/base/textarea/textarea";
import {
  BookOpen,
  Users,
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
  MessageCircle,
  CheckCircle2,
  ChevronRight,
  Edit3,
  List,
  ShieldCheck,
  LogOut,
  Archive,
  RotateCcw,
  Lock,
  UserPlus,
  School,
  KeyRound,
  Layers3,
  Books,
  Clock5,
  Share8,
} from "@/components/foundations/hugeicons";

// Preset cover images as aesthetic alternatives
const COVER_PRESETS = {
  quran: [
    {
      id: "q1",
      title: "Mushaf Klasik",
      url: "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "q2",
      title: "Mushaf Madinah",
      url: "https://images.unsplash.com/photo-1585036156171-384164a8c675?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "q3",
      title: "Halaqah Masjid",
      url: "https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=600&auto=format&fit=crop&q=80",
    },
  ],
  nonQuran: [
    {
      id: "b1",
      title: "Kitab Kuning",
      url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "b2",
      title: "Kaidah Nahwu",
      url: "https://images.unsplash.com/photo-1519817650390-64a93db51149?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "b3",
      title: "Manuskrip",
      url: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&auto=format&fit=crop&q=80",
    },
  ],
};

const generateRandomCode = (type: "quran" | "non-quran") => {
  const prefix = type === "quran" ? "QRN" : "BOOK";
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${num}`;
};

// Canvas-based image compression: scales down to max 640px and converts to 82% JPEG
const compressAndResizeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca file gambar."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () =>
        reject(new Error("Format file bukan gambar yang valid."));
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

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(reader.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", 0.82);
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
    myClasses,
    joinClassByCode,
    createTeachingClass,
    deleteTeachingClass,
    closeTeachingClass,
    reopenTeachingClass,
    updateTeachingClass,
    removeStudentFromClass,
    leaveClass,
    fetchClasses,
    fetchClassMembers,
    fetchClassBooks,
    books,
    setBooks,
    library,
    items,
    language,
    setActiveSpace,
    quranSpaceCode,
    quranStats,
    quranPages,
    userProfile,
    getLiveStudentQuranData,
    getLiveStudentBookItems,
  } = useApp();

  const authUser = useAuthStore((s) => s.user);
  const isTeacher = Boolean(
    (userProfile?.role as string) === "teacher" ||
    userProfile?.role === "admin" ||
    userProfile?.role === "superadmin" ||
    authUser?.role === "teacher" ||
    authUser?.role === "admin",
  );

  // Active Category: 'quran' | 'non-quran'
  const [activeCategory, setActiveCategory] = useState<"quran" | "non-quran">(
    "quran",
  );

  // Tab for book selector: 'personal' (Karya Pribadi) vs 'imported' (Kitab Impor)
  const [bookPickerTab, setBookPickerTab] = useState<"personal" | "imported">(
    "personal",
  );

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Drill-down navigation state
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  // (Student listener is now automatically managed in AppContext globally)
  const [isManagingBook, setIsManagingBook] = useState(false);
  const [classToEditId, setClassToEditId] = useState<string | null>(null);
  const [inspectingStudentId, setInspectingStudentId] = useState<string | null>(
    null,
  );

  // Student list quick-filter and search in Level 2
  const [studentFilter, setStudentFilter] = useState<
    "all" | "due" | "fluent" | "ready_advance"
  >("all");
  const [studentSearchQuery, setStudentSearchQuery] = useState("");

  // Student progress report modal
  const [reportStudent, setReportStudent] = useState<ClassStudent | null>(null);

  // Modal & UI states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [joinInputCode, setJoinInputCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [createdClassSuccess, setCreatedClassSuccess] =
    useState<ClassGroup | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // In-app confirmation states
  const [studentToRemove, setStudentToRemove] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [classToDelete, setClassToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [classToLeave, setClassToLeave] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [classToClose, setClassToClose] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Image upload state
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit Class Modal State
  const [isEditClassOpen, setIsEditClassOpen] = useState(false);

  // Form state for creating / editing class
  const [formState, setFormState] = useState<{
    type: "quran" | "non-quran";
    name: string;
    description: string;
    coverUrl: string;
    targetJuz: string;
    assignedBookId: string;
  }>({
    type: "quran",
    name: "",
    description: "",
    coverUrl: "",
    targetJuz: "1-5",
    assignedBookId: books[0]?.id || "",
  });

  // Fetch latest classes from backend API on mount or role change
  useEffect(() => {
    void fetchClasses();
  }, [fetchClasses]);

  const selectedOwnedClassId =
    selectedClassId &&
    teachingClasses.some((item) => item.id === selectedClassId)
      ? selectedClassId
      : null;

  // Member identities and progress are only available to the class owner.
  useEffect(() => {
    if (selectedOwnedClassId) {
      void fetchClassMembers(selectedOwnedClassId);
    }
  }, [selectedOwnedClassId, fetchClassMembers]);

  // Combine classes based on role / enrolled list
  const combinedClasses = useMemo(() => {
    const classMap = new Map<string, ClassGroup>();
    if (isTeacher) {
      (teachingClasses || []).forEach((c) => classMap.set(c.id, c));
    }
    (myClasses || []).forEach((c) => {
      if (!classMap.has(c.id)) {
        classMap.set(c.id, c);
      }
    });
    return Array.from(classMap.values());
  }, [isTeacher, teachingClasses, myClasses]);

  const selectedClassType = combinedClasses.find(
    (cls) => cls.id === selectedClassId,
  )?.type;

  // Fetch books for selected non-quran class (both teacher and enrolled student)
  useEffect(() => {
    if (selectedClassId && selectedClassType === "non-quran") {
      void fetchClassBooks(selectedClassId);
    }
  }, [selectedClassId, selectedClassType, fetchClassBooks]);

  // Filter classes by category & search query
  const quranClasses = combinedClasses.filter((c) => c.type === "quran");
  const nonQuranClasses = combinedClasses.filter((c) => c.type === "non-quran");

  // Swipe gesture: direct horizontal navigation
  useSwipeGesture(null, {
    disabled:
      isCreateOpen ||
      isJoinOpen ||
      isEditClassOpen ||
      Boolean(studentToRemove) ||
      Boolean(classToDelete) ||
      Boolean(createdClassSuccess),
    onSwipeRight: () => {
      if (inspectingStudentId) {
        setInspectingStudentId(null);
      } else if (selectedClassId) {
        setSelectedClassId(null);
        setIsManagingBook(false);
      } else if (activeCategory === "non-quran") {
        setActiveCategory("quran");
      } else if (activeCategory === "quran") {
        setActiveSpace("teaching");
      }
    },
    onSwipeLeft: () => {
      if (inspectingStudentId) {
        // Next student
        const currentStudents = selectedClass?.students || [];
        const sIdx = currentStudents.findIndex(
          (s) => s.id === inspectingStudentId,
        );
        if (sIdx >= 0 && sIdx < currentStudents.length - 1) {
          setInspectingStudentId(currentStudents[sIdx + 1].id);
        }
      } else if (selectedClassId) {
        // Next class in list
        const currentList =
          activeCategory === "quran" ? quranClasses : nonQuranClasses;
        const cIdx = currentList.findIndex((c) => c.id === selectedClassId);
        if (cIdx >= 0 && cIdx < currentList.length - 1) {
          setSelectedClassId(currentList[cIdx + 1].id);
        }
      } else if (activeCategory === "quran") {
        setActiveCategory("non-quran");
      }
    },
    threshold: 40,
    minRatio: 1.15,
  });

  const currentCategoryClasses = (
    activeCategory === "quran" ? quranClasses : nonQuranClasses
  ).filter(
    (c) =>
      (c.name || "")
        .toLowerCase()
        .includes((searchQuery || "").toLowerCase()) ||
      (c.code || "")
        .toLowerCase()
        .includes((searchQuery || "").toLowerCase()) ||
      (c.description
        ? c.description
            .toLowerCase()
            .includes((searchQuery || "").toLowerCase())
        : false),
  );

  const selectedClass =
    combinedClasses.find((c) => c.id === selectedClassId) || null;
  const isClassOwner = Boolean(
    selectedClass &&
    ((teachingClasses || []).some((tc) => tc.id === selectedClass.id) ||
      (selectedClass.teacherId &&
        (selectedClass.teacherId === userProfile?.id ||
          selectedClass.teacherId === authUser?.id))),
  );
  const inspectingStudent =
    selectedClass?.students.find((s) => s.id === inspectingStudentId) || null;

  // High-level aggregate metrics for the 2-in-1 Stats Banner
  const quranClassesCount = quranClasses.length;
  const nonQuranClassesCount = nonQuranClasses.length;

  const handleCopyCode = (code: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2200);
  };

  const handleShareWhatsApp = (
    code: string,
    className: string,
    e?: React.MouseEvent,
  ) => {
    if (e) e.stopPropagation();
    const text = `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\nUndangan bergabung ke kelas *${className}*:\n🔑 *Kode Kelas:* ${code}\n\nSilakan masukkan kode di atas pada aplikasi untuk bergabung ke halaqah bimbingan. Terima kasih!`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  const handleOpenCreateModal = (typeToCreate?: "quran" | "non-quran") => {
    if (!isTeacher) return;

    const t = typeToCreate || activeCategory;
    setUploadError(null);
    setIsUploadingImage(false);
    // Prefer personal (editable) book as initial default
    const initialBook = books.find((b) => !b.isReadonly) || books[0];
    setFormState({
      type: t,
      name: "",
      description: "",
      coverUrl: "",
      targetJuz: "1-5",
      assignedBookId: initialBook?.id || "",
    });
    setBookPickerTab(initialBook?.isReadonly ? "imported" : "personal");
    setIsCreateOpen(true);
  };

  const handleOpenJoinModal = () => {
    setJoinError(null);
    setJoinInputCode("");
    setIsJoinOpen(true);
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinInputCode.trim();
    if (!cleanCode) return;
    setIsJoining(true);
    setJoinError(null);
    try {
      const res = await joinClassByCode(cleanCode);
      if (res.success) {
        setIsJoinOpen(false);
        setJoinInputCode("");
      } else {
        setJoinError(res.message);
      }
    } catch (err) {
      setJoinError(
        err instanceof Error
          ? err.message
          : language === "en"
            ? "Failed to join class."
            : "Gagal bergabung ke kelas.",
      );
    } finally {
      setIsJoining(false);
    }
  };

  // Process file upload safely from device storage
  const processUploadedFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Harap pilih file gambar (JPG, PNG, atau WebP).");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setUploadError("Ukuran file gambar maksimal 20MB.");
      return;
    }

    try {
      setIsUploadingImage(true);
      setUploadError(null);
      const compressedDataUrl = await compressAndResizeImage(file);
      setFormState((prev) => ({ ...prev, coverUrl: compressedDataUrl }));
    } catch (err) {
      setUploadError(
        err instanceof Error
          ? err.message
          : language === "en"
            ? "Failed to process image. Try another photo."
            : "Gagal memproses gambar. Coba gunakan foto lain.",
      );
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
      description: cls.description || "",
      coverUrl: cls.coverUrl || "",
      targetJuz:
        cls.requiredJuzList && cls.requiredJuzList.length > 0
          ? cls.requiredJuzList.length === 30
            ? "all"
            : cls.requiredJuzList.length === 1
              ? String(cls.requiredJuzList[0])
              : `${Math.min(...cls.requiredJuzList)}-${Math.max(...cls.requiredJuzList)}`
          : "1-5",
      assignedBookId: cls.assignedBookIds?.[0] || books[0]?.id || "",
    });
    const currentBook = books.find(
      (b) => b.id === (cls.assignedBookIds?.[0] || books[0]?.id),
    );
    setBookPickerTab(currentBook?.isReadonly ? "imported" : "personal");
    setIsEditClassOpen(true);
  };

  const parseTargetJuzToNumbers = (val: string): number[] => {
    if (!val || val === "all" || val === "1-30") {
      return Array.from({ length: 30 }, (_, i) => i + 1);
    }
    if (val.includes("-")) {
      const parts = val.split("-").map(Number);
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
      requiredJuzList:
        formState.type === "quran"
          ? parseTargetJuzToNumbers(formState.targetJuz)
          : undefined,
      assignedBookIds:
        formState.type === "non-quran" && formState.assignedBookId
          ? [formState.assignedBookId]
          : undefined,
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
    setSelectedClassId(null);
    setIsManagingBook(false);
  };

  const handleConfirmLeaveClass = () => {
    if (!classToLeave) return;
    leaveClass(classToLeave.id);
    setClassToLeave(null);
    setSelectedClassId(null);
    setIsManagingBook(false);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim() || isCreatingClass) return;

    let finalCover = formState.coverUrl;
    if (!finalCover) {
      const presets =
        formState.type === "quran"
          ? COVER_PRESETS.quran
          : COVER_PRESETS.nonQuran;
      finalCover = presets[Math.floor(Math.random() * presets.length)].url;
    }

    const requiredJuzList =
      formState.type === "quran"
        ? parseTargetJuzToNumbers(formState.targetJuz)
        : undefined;

    setIsCreatingClass(true);
    try {
      const created = await createTeachingClass({
        name: formState.name.trim(),
        type: formState.type,
        description: formState.description.trim(),
        coverUrl: finalCover,
        requiredJuzList,
        assignedBookIds:
          formState.type === "non-quran"
            ? [formState.assignedBookId].filter(Boolean)
            : undefined,
      });

      setIsCreateOpen(false);
      setActiveCategory(created.type);
      setCreatedClassSuccess(created);
    } finally {
      setIsCreatingClass(false);
    }
  };

  const getItemTargetInfo = (cls: ClassGroup) => {
    if (cls.type === "quran") {
      const juz = cls.requiredJuzList;
      if (!juz || juz.length === 0 || juz.length === 30) {
        return language === "en"
          ? "30 Juz (604 pages)"
          : "30 Juz (604 halaman)";
      }
      if (juz.length === 1) {
        return `Juz ${juz[0]} (${juz[0] === 30 ? "23" : "20"} ${language === "en" ? "pages" : "halaman"})`;
      }
      const min = Math.min(...juz);
      const max = Math.max(...juz);
      const pages = max === 30 ? (juz.length - 1) * 20 + 23 : juz.length * 20;
      return `Juz ${min} - ${max} (~${pages} ${language === "en" ? "pages" : "halaman"})`;
    } else {
      const assignedId = cls.assignedBookIds?.[0];
      const book = books.find((b) => b.id === assignedId);
      if (!book)
        return language === "en" ? "No book assigned" : "Belum ada kitab";
      const bookItems = items.filter((i) => i.bookId === book.id);
      const count = bookItems.length || book.totalItemsCount || 0;
      return `${book.title} (${count} ${language === "en" ? "materials" : "materi"})`;
    }
  };

  const getStudentDueInfo = (student: ClassStudent, cls: ClassGroup) => {
    const isQuran = cls.type === "quran";

    if (isQuran) {
      const isCurrentUser = student.quranSpaceCode === quranSpaceCode;

      // 1. If current user, use live quranStats
      if (isCurrentUser) {
        const liveDuePages = (quranStats?.dueList || [])
          .map((p) => p.pageNumber)
          .sort((a, b) => a - b);
        const count = liveDuePages.length;
        if (count > 0) {
          const specific =
            liveDuePages.length <= 4
              ? `Hal. ${liveDuePages.join(", ")}`
              : `Hal. ${liveDuePages.slice(0, 3).join(", ")} (+${liveDuePages.length - 3} hal lagi)`;
          return { count, specific, isDue: true };
        }
        return { count: 0, specific: null, isDue: false };
      }

      // 2. If student has stored quranData
      if (student.quranData && student.quranData.length > 0) {
        const duePages = student.quranData.filter(
          (p) => p.isActive && isDue(p.fsrsData?.nextReview, p.isActive),
        );
        const count = duePages.length;
        if (count > 0) {
          const pageNums = duePages
            .map((p) => p.pageNumber)
            .sort((a, b) => a - b);
          const specific =
            pageNums.length <= 4
              ? `Hal. ${pageNums.join(", ")}`
              : `Hal. ${pageNums.slice(0, 3).join(", ")} (+${pageNums.length - 3} hal lagi)`;
          return { count, specific, isDue: true };
        }
        if (student.quranData.some((p) => p.isActive)) {
          return { count: 0, specific: null, isDue: false };
        }
      }

      // 3. If frequent struggles specified
      if (student.frequentStruggles && student.frequentStruggles.length > 0) {
        return {
          count: student.dueTodayCount || student.frequentStruggles.length,
          specific: student.frequentStruggles.join(", "),
          isDue: true,
        };
      }

      // 4. If dueTodayCount > 0
      if ((student.dueTodayCount || 0) > 0) {
        const samplePages = [3, 7, 14, 18, 22].slice(0, student.dueTodayCount);
        return {
          count: student.dueTodayCount,
          specific: `Hal. ${samplePages.join(", ")}`,
          isDue: true,
        };
      }

      return { count: 0, specific: null, isDue: false };
    } else {
      // Non-Quran (Kitab / Materi)
      const assignedId = cls.assignedBookIds?.[0];
      const assignedClassBookId = assignedId
        ? `class-book-${cls.id}-${assignedId}`
        : undefined;
      const isCurrentUser = Boolean(
        userProfile &&
        (student.email === userProfile.email ||
          student.id === `std-user-${userProfile.id}`),
      );

      // We only care about items assigned to this specific class context.
      if (isCurrentUser && assignedClassBookId) {
        const classItems = items.filter(
          (i) => i.bookId === assignedClassBookId,
        );
        const dueItems = classItems.filter(
          (i) => i.isActive && isDue(i.fsrsData?.nextReview, i.isActive),
        );
        const count = dueItems.length;
        if (count > 0) {
          const titles = dueItems.map((i) => i.question);
          const specific =
            titles.length <= 2
              ? titles.join(", ")
              : `${titles.slice(0, 2).join(", ")} (+${titles.length - 2} lagi)`;
          return { count, specific, isDue: true };
        }
        return { count: 0, specific: null, isDue: false };
      }

      if (student.bookItemsData && student.bookItemsData.length > 0) {
        let studentItems = student.bookItemsData;
        if (assignedClassBookId) {
          const exactClassItems = student.bookItemsData.filter(
            (i) => i.bookId === assignedClassBookId,
          );
          if (exactClassItems.length > 0) {
            studentItems = exactClassItems;
          } else if (assignedId) {
            // Fallback for mock/sample data that uses master bookId
            studentItems = student.bookItemsData.filter(
              (i) => i.bookId === assignedId,
            );
          }
        }

        const dueItems = studentItems.filter(
          (it) => it.isActive && isDue(it.fsrsData?.nextReview, it.isActive),
        );
        const count = dueItems.length;
        if (count > 0) {
          const titles = dueItems.map((i) => i.question);
          const specific =
            titles.length <= 2
              ? titles.join(", ")
              : `${titles.slice(0, 2).join(", ")} (+${titles.length - 2} lagi)`;
          return { count, specific, isDue: true };
        }
        if (studentItems.some((it) => it.isActive)) {
          return { count: 0, specific: null, isDue: false };
        }
      }

      if (student.frequentStruggles && student.frequentStruggles.length > 0) {
        return {
          count: student.dueTodayCount || student.frequentStruggles.length,
          specific: student.frequentStruggles.join(", "),
          isDue: true,
        };
      }

      if (assignedClassBookId) {
        const classItems = items.filter(
          (i) => i.bookId === assignedClassBookId,
        );
        if (classItems.length > 0 && (student.dueTodayCount || 0) > 0) {
          const count = Math.min(student.dueTodayCount, 2);
          const titles = classItems.slice(0, count).map((i) => i.question);
          const extra =
            student.dueTodayCount > count
              ? ` (+${student.dueTodayCount - count} lagi)`
              : "";
          return {
            count: student.dueTodayCount,
            specific: `${titles.join(", ")}${extra}`,
            isDue: true,
          };
        }
      }

      // Final fallback for pure sample data
      if ((student.dueTodayCount || 0) > 0) {
        return {
          count: student.dueTodayCount,
          specific: `${student.dueTodayCount} materi`,
          isDue: true,
        };
      }

      return { count: 0, specific: null, isDue: false };
    }
  };

  const getStudentMasteryInfo = (student: ClassStudent, cls: ClassGroup) => {
    const dueInfo = getStudentDueInfo(student, cls);
    const isQuran = cls.type === "quran";
    let activeItems = 0;
    let masteredItems = 0;

    let totalReps = 0;
    let totalLapses = 0;

    if (isQuran) {
      const isCurrentUser = student.quranSpaceCode === quranSpaceCode;

      const dataset =
        student.quranData ||
        (isCurrentUser && typeof quranPages !== "undefined" ? quranPages : []);

      if (isCurrentUser) {
        activeItems = quranStats?.active || 0;
        masteredItems = quranStats?.mastered || 0;
      } else if (dataset.length > 0) {
        activeItems = dataset.filter((p) => p.isActive).length;
        masteredItems = dataset.filter(
          (p) =>
            p.isActive &&
            ((p.fsrsData?.stability || 0) >= 30 ||
              (p.fsrsData?.reps || 0) >= 4),
        ).length;
      } else {
        activeItems = Math.round(((student.retentionRate || 85) / 100) * 30);
        masteredItems = Math.max(0, activeItems - dueInfo.count);
      }

      dataset.forEach((p) => {
        if (p.isActive && p.fsrsData) {
          totalReps += p.fsrsData.reps || 0;
          totalLapses += p.fsrsData.lapses || 0;
        }
      });
    } else {
      const assignedId = cls.assignedBookIds?.[0];
      const assignedClassBookId = assignedId
        ? `class-book-${cls.id}-${assignedId}`
        : undefined;
      const isCurrentUser = Boolean(
        userProfile &&
        (student.email === userProfile.email ||
          student.id === `std-user-${userProfile.id}`),
      );
      const classItems = isCurrentUser
        ? items.filter(
            (i) => i.bookId === assignedClassBookId || i.bookId === assignedId,
          )
        : student.bookItemsData && student.bookItemsData.length > 0
          ? student.bookItemsData
          : items.filter(
              (i) =>
                i.bookId === assignedClassBookId || i.bookId === assignedId,
            );

      activeItems = classItems.filter((i) => i.isActive).length;
      masteredItems = classItems.filter(
        (i) =>
          i.isActive &&
          (i.status === "mastered" || (i.fsrsData?.stability || 0) >= 30),
      ).length;

      classItems.forEach((i) => {
        if (i.isActive && i.fsrsData) {
          totalReps += i.fsrsData.reps || 0;
          totalLapses += i.fsrsData.lapses || 0;
        }
      });
    }

    const isReadyToAdvance =
      dueInfo.count === 0 &&
      activeItems > 0 &&
      (masteredItems / Math.max(1, activeItems) >= 0.6 || masteredItems >= 3);
    const isHeavyLoad = dueInfo.count >= 10;

    let calcRetentionRate = student.retentionRate || 90;
    if (totalReps > 0) {
      calcRetentionRate = Math.max(
        0,
        Math.round(((totalReps - totalLapses) / totalReps) * 100),
      );
    } else if (activeItems > 0) {
      calcRetentionRate = 100;
    }

    return {
      dueInfo,
      activeItems,
      masteredItems,
      isReadyToAdvance,
      isHeavyLoad,
      retentionRate: calcRetentionRate,
    };
  };

  const renderBookPicker = () => {
    const personalBooks = books.filter((b) => !b.isReadonly);
    const importedBooks = books.filter((b) => b.isReadonly);
    const currentSelectedBook = books.find(
      (b) => b.id === formState.assignedBookId,
    );

    return (
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            {language === "en"
              ? "Select Kitab for Class"
              : "Pilih Kitab untuk Kelas"}
          </label>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {personalBooks.length}{" "}
            {language === "en" ? "Personal" : "Karya Pribadi"} ·{" "}
            {importedBooks.length} {language === "en" ? "Imported" : "Impor"}
          </span>
        </div>

        {/* 2-Category Tabs: Karya Pribadi vs Kitab Impor */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setBookPickerTab("personal")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              bookPickerTab === "personal"
                ? "bg-primary text-brand-secondary shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <span>
              {language === "en" ? "Personal Works" : "Karya Pribadi"}
            </span>
            <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">
              {personalBooks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setBookPickerTab("imported")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              bookPickerTab === "imported"
                ? "bg-primary text-brand-secondary shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <span>{language === "en" ? "Imported Works" : "Kitab Impor"}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-bold">
              {importedBooks.length}
            </span>
          </button>
        </div>

        {/* Category Description Banner */}
        <div className="text-[11px] text-slate-500 dark:text-slate-400">
          {bookPickerTab === "personal" ? (
            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              {language === "en"
                ? "Personal works: fully editable, can add cards, and organize materials freely."
                : "Karya pribadi: dapat diedit, ditambah kartu materi/hafalan, dan dikelola penuh untuk santri."}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 font-medium">
              <BookOpen className="w-3.5 h-3.5 shrink-0 text-amber-500" />
              {language === "en"
                ? "Imported works: classified with edit/read-only permission status."
                : "Kitab impor: terklasifikasi jelas mana yang bisa diedit dan mana yang hanya dibaca."}
            </span>
          )}
        </div>

        {/* List of books in the active tab */}
        <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
          {(bookPickerTab === "personal" ? personalBooks : importedBooks)
            .length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
              {bookPickerTab === "personal"
                ? language === "en"
                  ? "No personal books yet. Create one in Personal Space."
                  : "Belum ada karya pribadi. Buat kitab baru di Ruang Pribadi."
                : language === "en"
                  ? "No imported books yet. Import from Library in Personal Space."
                  : "Belum ada kitab impor. Impor kitab dari Pustaka di Ruang Pribadi."}
            </div>
          ) : (
            (bookPickerTab === "personal" ? personalBooks : importedBooks).map(
              (b) => {
                const isSelected = formState.assignedBookId === b.id;
                const bItemsCount = items.filter(
                  (i) => i.bookId === b.id,
                ).length;
                const isReadonly = b.isReadonly;

                return (
                  <div
                    key={b.id}
                    onClick={() =>
                      setFormState((prev) => ({
                        ...prev,
                        assignedBookId: b.id,
                      }))
                    }
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600 shadow-xs"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-12 rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/60 dark:border-slate-700 shadow-2xs">
                        {b.coverUrl ? (
                          <img
                            src={b.coverUrl}
                            alt={b.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center bg-brand-900 font-serif text-[10px] font-bold text-brand-100">
                            {b.title.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {b.title}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                          <span>
                            {b.authorName ||
                              (language === "en" ? "Personal" : "Pribadi")}
                          </span>
                          <span>·</span>
                          <span>
                            {bItemsCount}{" "}
                            {language === "en" ? "cards" : "kartu"}
                          </span>
                        </div>

                        {/* Status Classification Badge */}
                        <div className="mt-1 flex items-center gap-1.5">
                          {bookPickerTab === "personal" ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              {language === "en"
                                ? "Fully Editable"
                                : "Bisa Diedit & Dikelola"}
                            </span>
                          ) : isReadonly ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                              <BookOpen className="w-2.5 h-2.5" />
                              {language === "en"
                                ? "Read-Only (Cannot add cards)"
                                : "Hanya Dibaca (Tidak bisa tambah kartu)"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              {language === "en"
                                ? "Editable & Readable"
                                : "Bisa Diedit & Dibaca"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 pr-1">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? "border-brand-600 bg-brand-600 text-white"
                            : "border-slate-300 dark:border-slate-600"
                        }`}
                      >
                        {isSelected && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              },
            )
          )}
        </div>

        {/* Selected Kitab Notice & Action */}
        {currentSelectedBook && (
          <div className="pt-1">
            {currentSelectedBook.isReadonly ? (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                  <ShieldCheck className="size-4 shrink-0 text-brand-700" />
                  <span>
                    {language === "en"
                      ? "Authentic Curated Kitab (Read-Only)"
                      : "Kitab Otentik Pustaka (Hanya Baca)"}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                  {language === "en"
                    ? "This book was imported as authentic read-only. You and students can study and review all cards, but cannot add new cards or modify the author’s original work."
                    : "Kitab ini berasal dari impor pustaka yang dilindungi untuk menjaga keotentikan ilmu penulis. Pengajar dan santri dapat mempelajari serta me-review seluruh kartu di dalamnya secara penuh."}
                </p>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 text-[11px] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  {language === "en"
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
      {/* MODAL: GABUNG KELAS DENGAN KODE */}
      {/* --------------------------------------------------------------------- */}
      <ModalOverlay
        isOpen={isJoinOpen}
        isDismissable={!isJoining}
        onOpenChange={(isOpen) => {
          if (isJoining) return;
          setIsJoinOpen(isOpen);
          if (!isOpen) setJoinError(null);
        }}
      >
        <Modal className="max-w-md overflow-hidden rounded-t-3xl sm:rounded-3xl">
          <Dialog
            aria-label={language === "en" ? "Join class" : "Gabung kelas"}
          >
            {({ close }) => (
              <form onSubmit={handleJoinSubmit}>
                <div className="relative px-5 pb-5 pt-6 sm:px-6">
                  <CloseButton
                    label={
                      language === "en"
                        ? "Close join class modal"
                        : "Tutup modal gabung kelas"
                    }
                    onPress={close}
                    isDisabled={isJoining}
                    className="absolute right-4 top-4"
                  />
                  <div className="flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-200 ring-inset">
                    <School className="size-6" />
                  </div>
                  <h2 className="mt-4 pr-10 text-lg font-semibold text-primary">
                    {language === "en" ? "Join a class" : "Gabung ke kelas"}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-secondary">
                    {language === "en"
                      ? "Enter the invitation code shared by your teacher to access the class."
                      : "Masukkan kode undangan dari guru untuk mengakses kelas."}
                  </p>

                  <Input
                    label={language === "en" ? "Class code" : "Kode kelas"}
                    icon={KeyRound}
                    size="md"
                    isRequired
                    value={joinInputCode}
                    onChange={(value) => {
                      setJoinInputCode(value.toUpperCase());
                      if (joinError) setJoinError(null);
                    }}
                    placeholder="QRN-1234 / BOOK-5678"
                    inputClassName="font-mono uppercase tracking-[0.16em]"
                    hint={
                      language === "en"
                        ? "Codes are not case-sensitive."
                        : "Kode tidak membedakan huruf besar dan kecil."
                    }
                    className="mt-5"
                  />

                  {joinError && (
                    <InlineAlert
                      variant="error"
                      title={
                        language === "en"
                          ? "Unable to join class"
                          : "Tidak dapat bergabung"
                      }
                      description={joinError}
                      className="mt-4"
                    />
                  )}
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-secondary bg-secondary px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                  <Button
                    color="secondary"
                    size="md"
                    onPress={close}
                    isDisabled={isJoining}
                    className="w-full sm:w-auto"
                  >
                    {language === "en" ? "Cancel" : "Batal"}
                  </Button>
                  <Button
                    type="submit"
                    size="md"
                    iconLeading={UserPlus}
                    isLoading={isJoining}
                    isDisabled={!joinInputCode.trim()}
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

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: BUAT KELAS BARU */}
      {/* --------------------------------------------------------------------- */}
      <ModalOverlay
        isOpen={isCreateOpen}
        isDismissable={!isUploadingImage && !isCreatingClass}
        onOpenChange={(isOpen) => {
          if (isUploadingImage || isCreatingClass) return;
          setIsCreateOpen(isOpen);
        }}
      >
        <Modal className="max-w-2xl overflow-hidden rounded-t-3xl sm:rounded-3xl">
          <Dialog
            aria-label={
              language === "en" ? "Create a new class" : "Buat kelas baru"
            }
          >
            {({ close }) => (
              <form
                onSubmit={handleCreateSubmit}
                className="flex max-h-[inherit] flex-col"
              >
                <div className="relative flex shrink-0 items-start gap-3 border-b border-secondary px-5 py-5 sm:px-6">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-200 ring-inset">
                    <Plus className="size-5" />
                  </div>
                  <div className="min-w-0 pr-10">
                    <h2 className="text-lg font-semibold text-primary">
                      {language === "en"
                        ? "Create a new class"
                        : "Buat kelas baru"}
                    </h2>
                    <p className="mt-0.5 text-sm text-secondary">
                      {language === "en"
                        ? "Set up a Quran circle or a structured learning class."
                        : "Siapkan halaqah Al-Qur'an atau kelas pembelajaran terstruktur."}
                    </p>
                  </div>
                  <CloseButton
                    label={
                      language === "en"
                        ? "Close create class modal"
                        : "Tutup modal buat kelas"
                    }
                    onPress={close}
                    isDisabled={isUploadingImage || isCreatingClass}
                    className="absolute right-4 top-4"
                  />
                </div>

                <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
                  <div>
                    <p className="mb-2 text-sm font-medium text-secondary">
                      {language === "en" ? "Class type" : "Jenis kelas"}
                    </p>
                    <div className="grid grid-cols-2 gap-2 rounded-2xl bg-secondary p-1.5 ring-1 ring-secondary ring-inset">
                      <Button
                        color={
                          formState.type === "quran" ? "primary" : "tertiary"
                        }
                        size="sm"
                        iconLeading={BookOpen}
                        onPress={() =>
                          setFormState((prev) => ({ ...prev, type: "quran" }))
                        }
                        className="w-full"
                      >
                        {language === "en"
                          ? "Quran circle"
                          : "Halaqah Al-Qur'an"}
                      </Button>
                      <Button
                        color={
                          formState.type === "non-quran"
                            ? "primary"
                            : "tertiary"
                        }
                        size="sm"
                        iconLeading={BookMarked}
                        onPress={() =>
                          setFormState((prev) => ({
                            ...prev,
                            type: "non-quran",
                          }))
                        }
                        className="w-full"
                      >
                        {language === "en"
                          ? "Book & material"
                          : "Kitab & materi"}
                      </Button>
                    </div>
                  </div>

                  <Input
                    label={language === "en" ? "Class name" : "Nama kelas"}
                    icon={School}
                    isRequired
                    value={formState.name}
                    onChange={(value) =>
                      setFormState((prev) => ({ ...prev, name: value }))
                    }
                    placeholder={
                      formState.type === "quran"
                        ? "Halaqah Tahfidz Al-Jazari"
                        : "Matan Al-Ajurrumiyyah"
                    }
                  />

                  {formState.type === "quran" ? (
                    <div>
                      <p className="mb-1.5 text-sm font-medium text-secondary">
                        {language === "en"
                          ? "Memorization target"
                          : "Target hafalan"}
                      </p>
                      <JuzRangeSelector
                        value={formState.targetJuz}
                        onChange={(val) =>
                          setFormState((prev) => ({ ...prev, targetJuz: val }))
                        }
                      />
                    </div>
                  ) : (
                    renderBookPicker()
                  )}

                  <div>
                    <p className="mb-1.5 text-sm font-medium text-secondary">
                      {language === "en" ? "Class cover" : "Sampul kelas"}
                      <span className="ml-1 text-tertiary">
                        ({language === "en" ? "optional" : "opsional"})
                      </span>
                    </p>
                    <div
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={handleDropImage}
                      className="rounded-2xl border border-dashed border-secondary bg-secondary/40 p-3.5 transition-colors hover:border-brand-300"
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
                        <div className="flex flex-col items-center justify-center gap-2 py-4 text-brand-600">
                          <Loader2 className="size-6 animate-spin" />
                          <span className="text-xs font-medium text-secondary">
                            {language === "en"
                              ? "Processing image..."
                              : "Memproses gambar..."}
                          </span>
                        </div>
                      ) : formState.coverUrl ? (
                        <div className="flex items-center gap-3">
                          <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-secondary ring-1 ring-secondary ring-inset">
                            <img
                              src={formState.coverUrl}
                              alt="Cover preview"
                              className="size-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-primary">
                              {language === "en"
                                ? "Cover ready"
                                : "Sampul siap digunakan"}
                            </p>
                            <p className="mt-0.5 text-xs text-success">
                              {language === "en"
                                ? "The image will be used for this class."
                                : "Gambar akan digunakan untuk kelas ini."}
                            </p>
                          </div>
                          <ButtonUtility
                            icon={X}
                            color="tertiary"
                            tooltip={
                              language === "en"
                                ? "Remove image"
                                : "Hapus gambar"
                            }
                            onPress={() =>
                              setFormState((prev) => ({
                                ...prev,
                                coverUrl: "",
                              }))
                            }
                            className="text-error-primary hover:bg-error-primary hover:text-error-primary"
                          />
                        </div>
                      ) : (
                        <label
                          htmlFor="class-cover-input"
                          className="flex cursor-pointer flex-col items-center justify-center py-3 text-center"
                        >
                          <div className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-200 ring-inset">
                            <Upload className="size-5" />
                          </div>
                          <span className="mt-2 text-sm font-semibold text-brand-secondary">
                            {language === "en"
                              ? "Choose an image"
                              : "Pilih gambar"}
                          </span>
                          <span className="mt-0.5 text-xs text-tertiary">
                            JPG, PNG, WebP · max 20MB
                          </span>
                        </label>
                      )}

                      {uploadError && (
                        <InlineAlert
                          variant="error"
                          title={
                            language === "en"
                              ? "Image cannot be used"
                              : "Gambar tidak dapat digunakan"
                          }
                          description={uploadError}
                          className="mt-3"
                        />
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {(formState.type === "quran"
                        ? COVER_PRESETS.quran
                        : COVER_PRESETS.nonQuran
                      ).map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() =>
                            setFormState((prev) => ({
                              ...prev,
                              coverUrl: preset.url,
                            }))
                          }
                          className={`relative aspect-[4/3] overflow-hidden rounded-xl border-2 transition-all ${
                            formState.coverUrl === preset.url
                              ? "border-brand-600 ring-2 ring-brand-200"
                              : "border-transparent opacity-70 hover:opacity-100"
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.title}
                            className="size-full object-cover"
                          />
                          <span className="absolute inset-x-0 bottom-0 truncate bg-black/65 px-1.5 py-1 text-[10px] font-medium text-white">
                            {preset.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <TextArea
                    label={
                      language === "en"
                        ? "Description and schedule"
                        : "Deskripsi dan jadwal"
                    }
                    value={formState.description}
                    onChange={(value) =>
                      setFormState((prev) => ({ ...prev, description: value }))
                    }
                    placeholder={
                      language === "en"
                        ? "Example: Weekly meeting every Sunday after Fajr..."
                        : "Contoh: Pertemuan rutin setiap Ahad ba'da Subuh..."
                    }
                    rows={3}
                    hint={
                      language === "en"
                        ? "Optional. Help students understand the class format."
                        : "Opsional. Bantu santri memahami format kelas."
                    }
                  />
                </div>

                <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-secondary bg-secondary px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                  <Button
                    color="secondary"
                    size="md"
                    onPress={close}
                    isDisabled={isUploadingImage || isCreatingClass}
                    className="w-full sm:w-auto"
                  >
                    {language === "en" ? "Cancel" : "Batal"}
                  </Button>
                  <Button
                    type="submit"
                    size="md"
                    iconLeading={Sparkles}
                    isDisabled={!formState.name.trim() || isUploadingImage || isCreatingClass}
                    isLoading={isCreatingClass}
                    className="w-full sm:w-auto"
                  >
                    {language === "en" ? "Create class" : "Buat kelas"}
                  </Button>
                </div>
              </form>
            )}
          </Dialog>
        </Modal>
      </ModalOverlay>

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: SUKSES TERBIT KELAS & KODE AKSES */}
      {/* --------------------------------------------------------------------- */}
      {createdClassSuccess && (
        <ModalOverlay
          isOpen
          isDismissable
          onOpenChange={(isOpen) => !isOpen && setCreatedClassSuccess(null)}
        >
          <Modal className="max-w-md overflow-hidden rounded-t-3xl sm:rounded-3xl">
            <Dialog
              aria-label={
                language === "en"
                  ? "Class created successfully"
                  : "Kelas berhasil dibuat"
              }
            >
              <div className="px-5 py-6 text-center sm:px-6">
                <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-[#ecfdf3] text-[#079455] ring-1 ring-[#abefc6] ring-inset dark:bg-[#053321] dark:text-[#47cd89] dark:ring-[#085d3a]">
                  <CheckCircle2 className="size-6" />
                </div>
                <Badge color="success" size="sm" className="mt-4">
                  {createdClassSuccess.type === "quran"
                    ? language === "en"
                      ? "Quran class"
                      : "Kelas Al-Qur'an"
                    : language === "en"
                      ? "Book class"
                      : "Kelas kitab"}
                </Badge>
                <h2 className="mt-2 text-lg font-semibold text-primary">
                  {language === "en"
                    ? "Class created successfully"
                    : "Kelas berhasil dibuat"}
                </h2>
                <p className="mt-1 text-sm text-secondary">
                  {language === "en"
                    ? "Share this access code so students can join your class."
                    : "Bagikan kode akses ini agar santri dapat bergabung ke kelas."}
                </p>

                <div className="mt-5 rounded-2xl border border-brand-200 bg-brand-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    {language === "en"
                      ? "Class access code"
                      : "Kode akses kelas"}
                  </p>
                  <p className="mt-2 font-mono text-3xl font-semibold tracking-[0.14em] text-brand-700">
                    {createdClassSuccess.code}
                  </p>
                </div>

                <div className="mt-5 grid gap-2">
                  <Button
                    size="md"
                    iconLeading={
                      copiedCode === createdClassSuccess.code ? Check : Copy
                    }
                    onPress={() => handleCopyCode(createdClassSuccess.code)}
                    className="w-full"
                  >
                    {copiedCode === createdClassSuccess.code
                      ? language === "en"
                        ? "Code copied"
                        : "Kode tersalin"
                      : language === "en"
                        ? "Copy class code"
                        : "Salin kode kelas"}
                  </Button>
                  <Button
                    color="secondary"
                    size="md"
                    iconLeading={MessageCircle}
                    onPress={() =>
                      handleShareWhatsApp(
                        createdClassSuccess.code,
                        createdClassSuccess.name,
                      )
                    }
                    className="w-full"
                  >
                    {language === "en"
                      ? "Share via WhatsApp"
                      : "Bagikan melalui WhatsApp"}
                  </Button>
                  <Button
                    color="tertiary"
                    size="md"
                    onPress={() => {
                      const targetId = createdClassSuccess.id;
                      setCreatedClassSuccess(null);
                      setSelectedClassId(targetId);
                    }}
                    className="w-full"
                  >
                    {language === "en" ? "Open class" : "Buka kelas"}
                  </Button>
                </div>
              </div>
            </Dialog>
          </Modal>
        </ModalOverlay>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: EDIT KELAS */}
      {/* --------------------------------------------------------------------- */}
      {isEditClassOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-brand-700" />
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
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {formState.type === "quran" ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Target Hafalan Juz
                  </label>
                  <JuzRangeSelector
                    value={formState.targetJuz}
                    onChange={(val) =>
                      setFormState((prev) => ({ ...prev, targetJuz: val }))
                    }
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
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-600/20 transition-colors cursor-pointer"
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
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Keluarkan Santri?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin mengeluarkan{" "}
                  <strong>{studentToRemove.name}</strong> dari daftar santri
                  kelas ini?
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
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Tutup Kelas?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menutup kelas{" "}
                  <strong>{classToClose.name}</strong>? Buku kelas ini otomatis
                  terhapus dari kategori buku kelas di semua santri. Catatan
                  pengawasan dan riwayat tetap tersimpan di ruang guru.
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
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Hapus Kelas?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus kelas{" "}
                  <strong>{classToDelete.name}</strong>? Data pengawasan kelas
                  ini akan dihapus.
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
      {/* MODAL: KONFIRMASI KELUAR KELAS */}
      {/* --------------------------------------------------------------------- */}
      {classToLeave && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {language === "en" ? "Leave Class?" : "Keluar dari Kelas?"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {language === "en"
                    ? `Are you sure you want to leave ${classToLeave.name}? You will no longer be listed in this class.`
                    : `Apakah Anda yakin ingin keluar dari kelas ${classToLeave.name}? Anda tidak akan terdaftar lagi di kelas ini.`}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setClassToLeave(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                {language === "en" ? "Cancel" : "Batal"}
              </button>
              <button
                type="button"
                onClick={handleConfirmLeaveClass}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer shadow-xs"
              >
                {language === "en" ? "Leave Class" : "Keluar Kelas"}
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
          classGroup={
            selectedClass ||
            teachingClasses.find((c) =>
              (c.students || []).some((s) => s.id === reportStudent.id),
            ) ||
            teachingClasses[0]
          }
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
    if (selectedClass.type === "quran") {
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
    const isQuran = selectedClass.type === "quran";
    const assignedBook =
      !isQuran
        ? (selectedClass.assignedBookIds?.[0]
            ? books.find((b) => b.id === selectedClass.assignedBookIds?.[0]) ||
              books.find(
                (b) =>
                  b.id ===
                  `class-book-${selectedClass.id}-${selectedClass.assignedBookIds?.[0]}`,
              ) ||
              library.find((l) => l.book.id === selectedClass.assignedBookIds?.[0] || l.id === selectedClass.assignedBookIds?.[0])?.book
            : null) ||
          books.find(
            (b) =>
              b.id === selectedClass.id || b.classId === selectedClass.id,
          ) ||
          library.find((l) => l.book.id === selectedClass.id || l.id === selectedClass.id)?.book ||
          books.find(
            (b) =>
              b.title.trim().toLowerCase() ===
              selectedClass.name.trim().toLowerCase(),
          ) ||
          ({
            id:
              selectedClass.assignedBookIds?.[0] ||
              `class-book-${selectedClass.id}`,
            userId: selectedClass.teacherId || "",
            title: selectedClass.name,
            description: selectedClass.description || "",
            coverUrl: selectedClass.coverUrl,
            category: "class",
            classId: selectedClass.id,
            isReadonly: !isClassOwner,
            isPublic: false,
            authorName: selectedClass.teacherName || "Pengajar",
            createdAt: selectedClass.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as Book)
        : null;
    const assignedId = selectedClass.assignedBookIds?.[0];
    const assignedClassBookId = assignedId
      ? `class-book-${selectedClass.id}-${assignedId}`
      : undefined;

    const allStudents = (selectedClass.students || []).map((std) => {
      // Avoid overwriting the current teacher's own items if they view themselves in their own class
      const isCurrentUser = Boolean(userProfile && std.id === userProfile.id);
      if (isCurrentUser) return std;

      if (isQuran) {
        const liveQuranData = getLiveStudentQuranData(std.id);
        if (liveQuranData.length > 0) {
          return { ...std, quranData: liveQuranData };
        }
      } else {
        const rawLiveItems = getLiveStudentBookItems(std.id);
        if (rawLiveItems.length > 0 && assignedId) {
          const liveItems = rawLiveItems.filter(
            (i) => i.bookId === assignedClassBookId || i.bookId === assignedId,
          );
          return { ...std, bookItemsData: liveItems };
        }
      }
      return std;
    });

    const studentAnalysisMap = new Map<
      string,
      ReturnType<typeof getStudentMasteryInfo>
    >();
    allStudents.forEach((s) => {
      studentAnalysisMap.set(s.id, getStudentMasteryInfo(s, selectedClass));
    });

    const dueStudents = allStudents.filter(
      (s) => studentAnalysisMap.get(s.id)?.dueInfo.isDue,
    );
    const fluentStudents = allStudents.filter(
      (s) => !studentAnalysisMap.get(s.id)?.dueInfo.isDue,
    );
    const readyStudents = allStudents.filter(
      (s) => studentAnalysisMap.get(s.id)?.isReadyToAdvance,
    );

    let displayedStudents = allStudents;
    if (studentFilter === "due") {
      displayedStudents = dueStudents;
    } else if (studentFilter === "fluent") {
      displayedStudents = fluentStudents;
    } else if (studentFilter === "ready_advance") {
      displayedStudents = readyStudents;
    }

    if (studentSearchQuery.trim()) {
      const q = studentSearchQuery.toLowerCase().trim();
      displayedStudents = displayedStudents.filter(
        (s) =>
          (s.name || "").toLowerCase().includes(q) ||
          (s.quranSpaceCode
            ? s.quranSpaceCode.toLowerCase().includes(q)
            : false),
      );
    }

    const classRetentionPct =
      allStudents.length > 0
        ? Math.round((fluentStudents.length / allStudents.length) * 100)
        : 100;

    if (isManagingBook && assignedBook) {
      const realBookId = (assignedBook as any).masterBookId || (assignedBook.id.startsWith('class-book-') ? assignedBook.id.split('-').slice(3).join('-') : assignedBook.id);

      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 h-[calc(100vh-64px)]">
          <PersonalSpace
            initialBookId={realBookId}
            classBanner={{
              className: selectedClass.name,
              classCode: selectedClass.code,
              teacherName: selectedClass.teacherName,
              onLeaveClass: () => leaveClass(selectedClass.id),
            }}
            isEmbeddedTeacherView={isClassOwner}
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
              setSelectedClassId(null);
              setIsManagingBook(false);
              setStudentFilter("all");
              setStudentSearchQuery("");
            }}
            className="inline-flex items-center gap-1.5 px-3 h-8.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{language === "en" ? "Back" : "Kembali"}</span>
          </button>

          {/* Action Icons */}
          <div className="flex items-center gap-1.5">
            {isClassOwner ? (
              <>
                <button
                  onClick={() => handleOpenEditClass(selectedClass)}
                  className="w-8.5 h-8.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer shadow-2xs active:scale-95"
                  title="Edit Info Kelas"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                <button
                  onClick={() =>
                    handleShareWhatsApp(selectedClass.code, selectedClass.name)
                  }
                  className="w-8.5 h-8.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center transition-colors cursor-pointer shadow-2xs active:scale-95"
                  title="Bagikan ke WhatsApp"
                >
                  <Share8 className="w-4 h-4" />
                </button>

                {selectedClass.status === "closed" ? (
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
                    onClick={() =>
                      setClassToClose({
                        id: selectedClass.id,
                        name: selectedClass.name,
                      })
                    }
                    className="w-8.5 h-8.5 rounded-xl border border-amber-200 dark:border-amber-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 flex items-center justify-center transition-colors cursor-pointer shadow-2xs active:scale-95"
                    title="Tutup Kelas (Selesaikan & Bersihkan Buku Santri)"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() =>
                    setClassToDelete({
                      id: selectedClass.id,
                      name: selectedClass.name,
                    })
                  }
                  className="w-8.5 h-8.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer shadow-2xs active:scale-95"
                  title="Hapus Kelas"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() =>
                    handleShareWhatsApp(selectedClass.code, selectedClass.name)
                  }
                  className="w-8.5 h-8.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center transition-colors cursor-pointer shadow-2xs active:scale-95"
                  title="Bagikan ke WhatsApp"
                >
                  <Share8 className="w-4 h-4" />
                </button>

                <button
                  onClick={() =>
                    setClassToLeave({
                      id: selectedClass.id,
                      name: selectedClass.name,
                    })
                  }
                  className="w-8.5 h-8.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-white dark:bg-slate-800 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center justify-center transition-colors cursor-pointer shadow-2xs active:scale-95"
                  title={
                    language === "en" ? "Leave Class" : "Keluar dari Kelas"
                  }
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* 2. Master Presentation Hero Card (Identical structure to Screenshot 1) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col gap-4 sm:gap-6">
          <div className="flex flex-row gap-4 sm:gap-6 items-start">
            {/* 3D Realistic Book / Mushaf Cover Object */}
            <div
              className={`shrink-0 relative group ${assignedBook ? "cursor-pointer" : ""}`}
              onClick={() => {
                if (assignedBook) {
                  setIsManagingBook(true);
                }
              }}
            >
              <div className="w-24 sm:w-32 md:w-36 aspect-[1/1.45] rounded-r-xl rounded-l-xs overflow-hidden shadow-xl shadow-slate-900/25 dark:shadow-black/70 border-l-[6px] border-l-slate-900/50 relative flex flex-col justify-between transition-transform duration-200 group-hover:-translate-y-1">
                {/* Lighting reflection & spine ridge overlay */}
                <div className="absolute inset-y-0 left-0 w-3.5 bg-gradient-to-r from-black/35 via-white/25 to-transparent pointer-events-none z-20" />
                <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-l from-black/20 to-transparent pointer-events-none z-20" />
                <div className="absolute inset-0 bg-gradient-to-tr from-black/15 via-transparent to-white/10 pointer-events-none z-20" />

                {assignedBook?.coverUrl || selectedClass.coverUrl ? (
                  <img
                    src={
                      (assignedBook?.coverUrl ||
                        selectedClass.coverUrl) as string
                    }
                    alt={assignedBook?.title || selectedClass.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-950 p-2.5 flex flex-col justify-between text-amber-100 border border-emerald-700/60 select-none">
                    <div className="relative z-10 pt-1 text-center">
                      <span className="text-[8px] font-mono tracking-widest text-amber-300 uppercase">
                        {isQuran ? "Mushaf Halaqah" : "Kitab Bimbingan"}
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
                    {isQuran ? "Halaqah Al-Qur'an" : "Kelas Kitab"}
                  </span>
                  {selectedClass.status === "closed" && (
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 px-2 py-0.5 rounded-md border border-amber-200/80 dark:border-amber-800/80 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>
                        {language === "en"
                          ? "Closed (Archived)"
                          : "Kelas Ditutup / Selesai"}
                      </span>
                    </span>
                  )}
                  {isClassOwner && assignedBook && (
                    <button
                      onClick={() => {
                        setIsManagingBook(true);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-md border border-brand-200 bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700 transition-colors hover:bg-brand-100 cursor-pointer"
                    >
                      <BookOpen className="w-3 h-3" />
                      {language === "en"
                        ? "Edit Book Content"
                        : "Edit Konten Buku"}
                    </button>
                  )}
                  {!isClassOwner && assignedBook && (
                    <button
                      onClick={() => {
                        setIsManagingBook(true);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-md border border-brand-200 bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700 transition-colors hover:bg-brand-100 cursor-pointer"
                    >
                      <BookOpen className="w-3 h-3" />
                      {language === "en"
                        ? "Open Class Book"
                        : "Buka Materi Kitab"}
                    </button>
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 dark:text-white leading-tight">
                  {assignedBook?.title || selectedClass.name}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                  {assignedBook?.description ||
                    selectedClass.description ||
                    (isQuran
                      ? "Bimbingan hafalan Al-Qur'an per halaman berbasis interval retensi adaptif."
                      : "Bimbingan penguasaan materi kitab terarah.")}
                </p>
              </div>

              {/* Class Code Pill Box */}
              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Kode Akses:
                </span>
                <span className="rounded-md bg-brand-50 px-2 py-0.5 font-mono text-xs font-bold text-brand-700 sm:text-sm">
                  {selectedClass.code}
                </span>
                <button
                  onClick={() => handleCopyCode(selectedClass.code)}
                  className="p-1 rounded text-slate-400 hover:text-brand-700 transition-colors cursor-pointer"
                  title="Salin Kode Kelas"
                >
                  {copiedCode === selectedClass.code ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Embedded Progress Card */}
          {!isClassOwner ? (
            !isQuran && assignedBook ? (
              (() => {
                const studentClassBookId = `class-book-${selectedClass.id}-${assignedBook.id}`;
                const studentClassItems = items.filter(
                  (i) =>
                    i.bookId === studentClassBookId ||
                    i.bookId === assignedBook.id,
                );
                const studentActiveItems = studentClassItems.filter(
                  (i) => i.isActive,
                );
                const studentDueItems = studentActiveItems.filter((i) =>
                  isDue(i.fsrsData.nextReview, i.isActive),
                );
                const studentMasteredItems = studentActiveItems.filter(
                  (i) =>
                    i.status === "mastered" ||
                    (i.fsrsData?.stability || 0) >= 30,
                );

                return (
                  <div className="flex flex-col gap-4 rounded-2xl border border-brand-200 bg-brand-50/40 p-4 sm:p-5 dark:border-brand-900/40 dark:bg-brand-950/20">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-brand-100 dark:border-brand-900/40">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {language === "en"
                              ? "Class Book Progress"
                              : "Progres Materi Kitab Kelas"}
                          </span>
                          <span className="rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-[10px] px-2 py-0.5 border border-amber-200 dark:border-amber-800">
                            {language === "en"
                              ? "Read-Only (Cards can be activated)"
                              : "Mode Santri (Aktifkan Kartu)"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                          {language === "en"
                            ? "You have full access to study and activate cards in this book. Your progress is synced to the teacher."
                            : "Anda dapat mengakses kitab ini, mengaktifkan kartu hafalan/materi, dan melakukan review harian. Progres Anda otomatis dipantau oleh pengajar."}
                        </p>
                      </div>
                      <button
                        onClick={() => setIsManagingBook(true)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>
                          {language === "en"
                            ? "Open & Study Book"
                            : "Buka & Pelajari Kitab"}
                        </span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-center">
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                          Total Kartu
                        </span>
                        <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5 block">
                          {studentClassItems.length}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200/70 dark:border-emerald-900/40 text-center">
                        <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 block">
                          Kartu Aktif
                        </span>
                        <span className="text-base sm:text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-0.5 block">
                          {studentActiveItems.length}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/70 dark:border-amber-900/40 text-center">
                        <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 block">
                          Perlu Review
                        </span>
                        <span className="text-base sm:text-lg font-bold text-amber-700 dark:text-amber-300 mt-0.5 block">
                          {studentDueItems.length}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200/70 dark:border-indigo-900/40 text-center">
                        <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 block">
                          Mapan
                        </span>
                        <span className="text-base sm:text-lg font-bold text-indigo-700 dark:text-indigo-300 mt-0.5 block">
                          {studentMasteredItems.length}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="flex items-center gap-4 rounded-xl border border-slate-200/70 bg-slate-50 p-3.5 dark:border-slate-700/60 dark:bg-slate-800/60 sm:p-4">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-full border-4 border-white bg-brand-50 text-xl font-bold text-brand-700 shadow-sm dark:border-slate-700 dark:bg-brand-950/40 dark:text-brand-300">
                  {Math.max(
                    selectedClass.studentCount ?? 0,
                    selectedClass.students.length,
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {language === "en"
                      ? "Registered students"
                      : "Santri terdaftar"}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {language === "en"
                      ? "Student identities and progress are only visible to the class teacher."
                      : "Identitas dan progres santri hanya dapat dilihat oleh pengajar kelas."}
                  </p>
                </div>
              </div>
            )
          ) : (
            <div className="flex items-center gap-4 p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
              {/* Left Side: Circular Progress */}
              <div className="relative w-16 h-16 shrink-0">
                <svg
                  viewBox="0 0 100 100"
                  className="w-full h-full transform -rotate-90 drop-shadow-sm"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    className="text-slate-200 dark:text-slate-700"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray="263.89"
                    strokeDashoffset={
                      allStudents.length === 0
                        ? 263.89
                        : 263.89 - 263.89 * (classRetentionPct / 100)
                    }
                    strokeLinecap="round"
                    className={`${allStudents.length === 0 ? "text-slate-300 dark:text-slate-600" : "text-emerald-500"} transition-all duration-1000`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-none">
                    {allStudents.length === 0 ? "0%" : `${classRetentionPct}%`}
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
                    Belum ada santri terdaftar di kelas ini. Bagikan kode akses
                    kelas kepada santri Anda.
                  </p>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500 shrink-0" />
                        <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                          Santri Tuntas
                        </span>
                      </div>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0 ml-2">
                        {fluentStudents.length} santri
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-sm bg-amber-500 shrink-0" />
                        <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                          Perlu Review
                        </span>
                      </div>
                      <span className="font-bold text-amber-600 dark:text-amber-400 shrink-0 ml-2">
                        {dueStudents.length} santri
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 3. Section Below: Daftar Santri (Identical to Screenshot 1 "Daftar Isi Kitab") */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <List className="w-5 h-5 text-brand-700" />
                <span>
                  Daftar Santri (
                  {isClassOwner
                    ? allStudents.length
                    : Math.max(
                        selectedClass.studentCount ?? 0,
                        selectedClass.students.length,
                      )}
                  )
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isClassOwner
                  ? "Pilih santri untuk langsung masuk ke lembar hafalan dan kartu materi di dalamnya."
                  : "Jumlah peserta ditampilkan tanpa membuka identitas dan progres pribadi."}
              </p>
            </div>
          </div>

          {isClassOwner ? (
            <>
              {/* Search bar & quick filter tabs matching Screenshot 1 & 4 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Cari santri..."
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                  />
                </div>

                {/* Segmented control tabs matching Screenshot 4 */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 shrink-0 flex-wrap sm:flex-nowrap">
                  <button
                    onClick={() => setStudentFilter("all")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      studentFilter === "all"
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    Semua {allStudents.length}
                  </button>
                  <button
                    onClick={() => setStudentFilter("due")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      studentFilter === "due"
                        ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs"
                        : "text-slate-500 hover:text-amber-600"
                    }`}
                  >
                    Belum Review {dueStudents.length}
                  </button>
                  <button
                    onClick={() => setStudentFilter("fluent")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      studentFilter === "fluent"
                        ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs"
                        : "text-slate-500 hover:text-emerald-600"
                    }`}
                  >
                    Tuntas {fluentStudents.length}
                  </button>
                  <button
                    onClick={() => setStudentFilter("ready_advance")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      studentFilter === "ready_advance"
                        ? "bg-white dark:bg-slate-900 text-brand-700 shadow-2xs"
                        : "text-slate-500 hover:text-brand-700"
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
                    retentionRate: 100,
                  };
                  const { dueInfo } = analysis;

                  return (
                    <div
                      key={student.id}
                      onClick={() => setInspectingStudentId(student.id)}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3.5 sm:p-4 hover:border-brand-300 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate group-hover:text-brand-700 transition-colors">
                            {student.name}
                          </h4>
                          {analysis.isReadyToAdvance && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                              <Sparkles className="w-3 h-3 text-brand-600" />
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
                                Belum review:{" "}
                                <strong className="font-semibold text-amber-800 dark:text-amber-300">
                                  {dueInfo.specific}
                                </strong>
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                              <span>Tuntas review harian</span>
                            </div>
                          )}
                          <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">
                            •
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                            {analysis.masteredItems} materi mapan (
                            {analysis.retentionRate}% retensi)
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
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-700 hover:bg-brand-50 transition-colors cursor-pointer shrink-0"
                          title={`Laporan & Raport Evaluasi ${student.name}`}
                        >
                          <Share8 className="w-4 h-4" />
                        </button>

                        {isClassOwner && (
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
                        )}

                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-700 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  );
                })}

                {displayedStudents.length === 0 && (
                  <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
                    <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {allStudents.length === 0
                        ? "Belum Ada Santri yang Bergabung"
                        : "Tidak Ada Santri yang Cocok"}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      {allStudents.length === 0
                        ? `Bagikan kode kelas ${selectedClass.code} kepada santri agar mereka dapat bergabung melalui akun mereka.`
                        : "Coba sesuaikan kata kunci pencarian atau filter di atas."}
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/50 px-5 py-10 text-center dark:border-slate-800 dark:bg-slate-900/50">
              <Users className="mx-auto mb-3 size-10 text-slate-300 dark:text-slate-600" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {language === "en"
                  ? "Student list is private"
                  : "Daftar santri bersifat privat"}
              </h4>
              <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {language === "en"
                  ? "Only the class teacher can view student identities and learning progress."
                  : "Hanya pengajar kelas yang dapat melihat identitas dan progres belajar setiap santri."}
              </p>
            </div>
          )}
        </div>

        {/* Shared In-App Modals for Level 2 */}
        {renderSharedModals()}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // LEVEL 1: CLASS LIST VIEW
  // ---------------------------------------------------------------------------
  const getClassStudentCount = (classGroup: ClassGroup) =>
    Math.max(classGroup.studentCount ?? 0, classGroup.students.length);

  const currentStudentCount = currentCategoryClasses.reduce(
    (total, classGroup) => total + getClassStudentCount(classGroup),
    0,
  );

  const getClassDueCountForCurrentUser = (cls: ClassGroup) => {
    const isOwner = (teachingClasses || []).some((tc) => tc.id === cls.id);
    if (isOwner) {
      return cls.students.filter((s) => getStudentDueInfo(s, cls).isDue).length;
    }
    if (cls.type === "quran") {
      return (quranStats?.dueList || []).length;
    } else {
      const assignedId = cls.assignedBookIds?.[0];
      if (!assignedId) return 0;
      const assignedClassBookId = `class-book-${cls.id}-${assignedId}`;
      const classItems = items.filter(
        (i) => i.bookId === assignedClassBookId || i.bookId === assignedId,
      );
      return classItems.filter(
        (i) => i.isActive && isDue(i.fsrsData?.nextReview, i.isActive),
      ).length;
    }
  };

  const getClassActiveCountForCurrentUser = (cls: ClassGroup) => {
    const isOwner = (teachingClasses || []).some((tc) => tc.id === cls.id);
    if (isOwner) {
      return cls.students.length;
    }
    if (cls.type === "quran") {
      return quranStats?.active || 0;
    } else {
      const assignedId = cls.assignedBookIds?.[0];
      if (!assignedId) return 0;
      const assignedClassBookId = `class-book-${cls.id}-${assignedId}`;
      const classItems = items.filter(
        (i) => i.bookId === assignedClassBookId || i.bookId === assignedId,
      );
      return classItems.filter((i) => i.isActive).length;
    }
  };

  const classDuePills = currentCategoryClasses
    .map((cls) => ({
      classGroup: cls,
      dueCount: getClassDueCountForCurrentUser(cls),
      activeCount: getClassActiveCountForCurrentUser(cls),
    }))
    .filter((p) => p.dueCount > 0);

  const totalCurrentCategoryDue = classDuePills.reduce(
    (sum, p) => sum + p.dueCount,
    0,
  );
  const totalCurrentCategoryActive = currentCategoryClasses.reduce(
    (sum, cls) => sum + getClassActiveCountForCurrentUser(cls),
    0,
  );

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <header className="flex flex-col gap-4 border-b border-secondary pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-200 ring-inset">
            <School className="size-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
                {language === "en" ? "Classes" : "Kelas"}
              </h1>
              <Badge color="brand" size="sm">
                {combinedClasses.length} {language === "en" ? "total" : "total"}
              </Badge>
            </div>
            <p className="mt-1 max-w-2xl text-sm text-secondary">
              {isTeacher
                ? language === "en"
                  ? "Manage learning communities, materials, and student progress."
                  : "Kelola komunitas belajar, materi, dan perkembangan santri."
                : language === "en"
                  ? "Access your learning groups and keep up with assigned reviews."
                  : "Akses kelompok belajar dan ikuti tugas review yang diberikan."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button
            color="secondary"
            size="sm"
            iconLeading={UserPlus}
            onPress={handleOpenJoinModal}
          >
            {language === "en" ? "Join class" : "Gabung kelas"}
          </Button>
          {isTeacher && (
            <Button
              size="sm"
              iconLeading={Plus}
              onPress={() => handleOpenCreateModal(activeCategory)}
            >
              {language === "en" ? "Create class" : "Buat kelas"}
            </Button>
          )}
        </div>
      </header>

      <section className="relative overflow-hidden rounded-3xl border border-brand-200 bg-[linear-gradient(135deg,var(--color-bg-primary)_35%,var(--color-brand-50)_100%)] p-4 shadow-xs sm:p-5">
        <div className="pointer-events-none absolute -right-12 -top-16 size-48 rounded-full bg-brand-100/70 blur-2xl" />
        <div className="relative grid gap-3 sm:grid-cols-[1.25fr_repeat(3,minmax(0,1fr))]">
          <div className="flex items-center gap-3 px-1 py-2">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-solid text-white shadow-lg shadow-brand-500/20">
              {activeCategory === "quran" ? (
                <BookOpen className="size-5" />
              ) : (
                <BookMarked className="size-5" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-primary">
                {activeCategory === "quran"
                  ? language === "en"
                    ? "Quran circles"
                    : "Halaqah Al-Qur'an"
                  : language === "en"
                    ? "Book classes"
                    : "Kelas kitab"}
              </p>
              <p className="mt-0.5 text-xs text-secondary">
                {language === "en"
                  ? "Current category overview"
                  : "Ringkasan kategori aktif"}
              </p>
            </div>
          </div>
          {[
            {
              value: currentCategoryClasses.length,
              label: language === "en" ? "Classes" : "Kelas",
              icon: Layers3,
            },
            {
              value: currentStudentCount,
              label: language === "en" ? "Students" : "Santri",
              icon: Users,
            },
            {
              value: totalCurrentCategoryDue,
              label: language === "en" ? "Need review" : "Perlu review",
              icon: Clock5,
            },
          ].map(({ value, label, icon: Icon }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-2xl border border-white/70 bg-primary/80 p-3 shadow-xs backdrop-blur-sm"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Icon className="size-4.5" />
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

      {/* Unified Due Review Banner for Classes */}
      <section aria-label={language === "en" ? "Class review queue" : "Antrean review kelas"}>
        <UnifiedDueCard
          language={language}
          title={language === "en" ? "Class Daily Review" : "Kartu Jatuh Tempo Kelas"}
          dueCount={totalCurrentCategoryDue}
          totalActiveCount={totalCurrentCategoryActive}
          itemTypeLabel={
            isTeacher
              ? language === "en"
                ? "students"
                : "santri"
              : activeCategory === "quran"
                ? language === "en"
                  ? "pages"
                  : "halaman"
                : language === "en"
                  ? "cards"
                  : "kartu"
          }
          primaryActionLabel={
            language === "en"
              ? `Review All (${totalCurrentCategoryDue})`
              : `Mulai Review (${totalCurrentCategoryDue})`
          }
          pillGridCols="classes"
          onStartAll={() => {
            const firstDueClass = classDuePills[0]?.classGroup;
            if (firstDueClass) {
              setSelectedClassId(firstDueClass.id);
            }
          }}
          filterPills={classDuePills.map((pill) => ({
            id: pill.classGroup.id,
            label: pill.classGroup.name,
            count: pill.dueCount,
            badge: pill.classGroup.code,
            onClick: () => setSelectedClassId(pill.classGroup.id),
          }))}
          allCaughtUpTitle={
            language === "en"
              ? "All class assignments reviewed for today!"
              : "Semua tugas review kelas tuntas hari ini!"
          }
        />
      </section>

      <section className="rounded-3xl border border-secondary bg-primary p-4 shadow-xs sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="inline-flex w-full rounded-xl bg-secondary p-1 md:w-auto">
            <button
              type="button"
              onClick={() => setActiveCategory("quran")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition md:flex-none ${
                activeCategory === "quran"
                  ? "bg-primary text-brand-secondary shadow-xs ring-1 ring-primary"
                  : "text-secondary hover:text-primary"
              }`}
            >
              <BookOpen className="size-4" />
              <span>{language === "en" ? "Quran" : "Al-Qur'an"}</span>
              <Badge
                color={activeCategory === "quran" ? "brand" : "gray"}
                size="sm"
              >
                {quranClassesCount}
              </Badge>
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory("non-quran")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition md:flex-none ${
                activeCategory === "non-quran"
                  ? "bg-primary text-brand-secondary shadow-xs ring-1 ring-primary"
                  : "text-secondary hover:text-primary"
              }`}
            >
              <Books className="size-4" />
              <span>{language === "en" ? "Books" : "Kitab"}</span>
              <Badge
                color={activeCategory === "non-quran" ? "brand" : "gray"}
                size="sm"
              >
                {nonQuranClassesCount}
              </Badge>
            </button>
          </div>

          <Input
            aria-label={language === "en" ? "Search classes" : "Cari kelas"}
            icon={Search}
            size="sm"
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={
              language === "en" ? "Search name or code" : "Cari nama atau kode"
            }
            className="w-full md:w-72"
          />
        </div>

        {currentCategoryClasses.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-secondary bg-secondary/30 px-5 py-12 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-200 ring-inset">
              {searchQuery ? (
                <Search className="size-5" />
              ) : (
                <School className="size-5" />
              )}
            </div>
            <h2 className="mt-3 text-sm font-semibold text-primary">
              {searchQuery
                ? language === "en"
                  ? "No matching classes"
                  : "Kelas tidak ditemukan"
                : language === "en"
                  ? "No classes in this category"
                  : "Belum ada kelas di kategori ini"}
            </h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-secondary">
              {searchQuery
                ? language === "en"
                  ? "Try another class name or access code."
                  : "Coba nama kelas atau kode akses yang lain."
                : isTeacher
                  ? language === "en"
                    ? "Create a new class or join one using an invitation code."
                    : "Buat kelas baru atau bergabung menggunakan kode undangan."
                  : language === "en"
                    ? "Use an invitation code from your teacher to join a class."
                    : "Gunakan kode undangan dari guru untuk bergabung ke kelas."}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {searchQuery ? (
                <Button
                  color="secondary"
                  size="sm"
                  onPress={() => setSearchQuery("")}
                >
                  {language === "en" ? "Clear search" : "Hapus pencarian"}
                </Button>
              ) : (
                <Button
                  color="secondary"
                  size="sm"
                  iconLeading={UserPlus}
                  onPress={handleOpenJoinModal}
                >
                  {language === "en" ? "Join with code" : "Gabung dengan kode"}
                </Button>
              )}
              {!searchQuery && isTeacher && (
                <Button
                  size="sm"
                  iconLeading={Plus}
                  onPress={() => handleOpenCreateModal(activeCategory)}
                >
                  {language === "en" ? "Create class" : "Buat kelas"}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {currentCategoryClasses.map((classGroup) => {
              const isQuran = classGroup.type === "quran";
              const studentCount = getClassStudentCount(classGroup);
              const dueInClass = classGroup.students.filter(
                (student) => getStudentDueInfo(student, classGroup).isDue,
              ).length;
              const assignedId = classGroup.assignedBookIds?.[0];
              const book = books.find((item) => item.id === assignedId);
              const totalItemsCount =
                items.filter((item) => item.bookId === assignedId).length ||
                book?.totalItemsCount ||
                0;
              const bottomInfoText = isQuran
                ? getItemTargetInfo(classGroup)
                : `${totalItemsCount} ${language === "en" ? "materials" : "materi"}`;

              return (
                <article
                  key={classGroup.id}
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    if ((event.target as HTMLElement).closest("button")) return;
                    setSelectedClassId(classGroup.id);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedClassId(classGroup.id);
                    }
                  }}
                  className="group cursor-pointer rounded-3xl border border-secondary bg-primary p-3 shadow-xs outline-focus-ring transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-secondary">
                    {classGroup.coverUrl ? (
                      <img
                        src={classGroup.coverUrl}
                        alt={classGroup.name}
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-[linear-gradient(145deg,#431407_0%,#9a3412_55%,#ef6905_100%)] text-white">
                        <div className="text-center">
                          {isQuran ? (
                            <BookOpen className="mx-auto size-7" />
                          ) : (
                            <BookMarked className="mx-auto size-7" />
                          )}
                          <p className="mt-2 max-w-52 truncate px-3 text-sm font-semibold">
                            {classGroup.name}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5">
                      <Badge
                        color={isQuran ? "success" : "orange"}
                        size="sm"
                        className="bg-primary/90 backdrop-blur-sm"
                      >
                        {isQuran
                          ? language === "en"
                            ? "Quran"
                            : "Al-Qur'an"
                          : language === "en"
                            ? "Book"
                            : "Kitab"}
                      </Badge>
                      {classGroup.status === "closed" && (
                        <Badge
                          color="warning"
                          size="sm"
                          className="gap-1 bg-primary/90 backdrop-blur-sm"
                        >
                          <Lock className="size-3" />
                          {language === "en" ? "Closed" : "Ditutup"}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="px-1 pb-1 pt-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-base font-semibold text-primary transition-colors group-hover:text-brand-secondary">
                          {classGroup.name}
                        </h2>
                        <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-secondary">
                          {classGroup.description ||
                            (language === "en"
                              ? "No class description yet."
                              : "Belum ada deskripsi kelas.")}
                        </p>
                      </div>
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-fg-quaternary transition-colors group-hover:bg-brand-50 group-hover:text-brand-700">
                        <ChevronRight className="size-4.5" />
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Badge color="gray" size="sm" className="gap-1.5">
                        <Users className="size-3.5" />
                        {studentCount}{" "}
                        {language === "en" ? "students" : "santri"}
                      </Badge>
                      {studentCount === 0 ? (
                        <BadgeWithDot color="gray" size="sm">
                          {language === "en"
                            ? "No students"
                            : "Belum ada santri"}
                        </BadgeWithDot>
                      ) : classGroup.students.length === 0 ? (
                        <BadgeWithDot color="gray" size="sm">
                          {language === "en"
                            ? "Members registered"
                            : "Anggota terdaftar"}
                        </BadgeWithDot>
                      ) : dueInClass > 0 ? (
                        <BadgeWithDot color="warning" size="sm">
                          {dueInClass}{" "}
                          {language === "en" ? "need review" : "perlu review"}
                        </BadgeWithDot>
                      ) : (
                        <BadgeWithDot color="success" size="sm">
                          {language === "en" ? "All complete" : "Semua tuntas"}
                        </BadgeWithDot>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-secondary pt-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs text-tertiary">
                          {bottomInfoText}
                        </p>
                        <p className="mt-0.5 font-mono text-xs font-semibold tracking-wide text-primary">
                          {classGroup.code}
                        </p>
                      </div>
                      <ButtonUtility
                        icon={copiedCode === classGroup.code ? Check : Copy}
                        color="tertiary"
                        tooltip={
                          language === "en"
                            ? "Copy class code"
                            : "Salin kode kelas"
                        }
                        onPress={() => handleCopyCode(classGroup.code)}
                        className={
                          copiedCode === classGroup.code
                            ? "text-success"
                            : undefined
                        }
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {renderSharedModals()}
    </div>
  );
};
