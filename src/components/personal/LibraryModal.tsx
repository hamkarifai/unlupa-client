import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { LibraryEntry } from "../../data/sampleBooks";
import { Chapter, BookItem, createInitialFSRSState } from "../../types";
import type { Module as ApiBookModule } from "@/features/personal/types/personal.types";
import { resolveAssetUrl } from "../../lib/assets";
import { HugeiconsIcon } from "@hugeicons/react";
import { BookDashedIcon, Books02Icon } from "@hugeicons/core-free-icons";
import { personalService } from "@/features/personal/services/personal.services";
import { adminService } from "@/features/admin/services/admin.services";
import { BilingualCardText } from "../common/BilingualCardText";
import {
  Search,
  Download,
  Star,
  CheckCircle2,
  Layers,
  ShieldCheck,
  Eye,
  ArrowRight,
  Folder,
  Sparkles,
  SlidersHorizontal,
  Check,
  Loader2,
  Trash2,
} from "@/components/foundations/hugeicons";
import {
  Dialog,
  Modal,
  ModalOverlay,
} from "@/components/application/modals/modal";
import { InlineAlert } from "@/components/base/alert/alert";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { CloseButton } from "@/components/base/buttons/close-button";
import { Input } from "@/components/base/input/input";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const LibraryModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const {
    library,
    books,
    importFromLibrary,
    language,
    isBookPurchased,
    openCheckoutModal,
    userProfile,
    fetchPublishedLibrary,
  } = useApp();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [sortBy, setSortBy] = useState<
    "popular" | "rating" | "cards" | "newest"
  >("popular");
  const [previewEntry, setPreviewEntry] = useState<LibraryEntry | null>(null);
  const [previewSelectedChapterId, setPreviewSelectedChapterId] = useState<
    string | null
  >(null);
  const [justImportedId, setJustImportedId] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [bookToDelete, setBookToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);

  const isAdmin =
    userProfile?.role === "admin" || userProfile?.role === "superadmin";
  const previewBookId = previewEntry?.book.id;
  const previewItemCount = previewEntry?.items.length ?? 0;

  const handleDeletePublishedBook = async (bookId: string, title: string) => {
    setBookToDelete({ id: bookId, title });
  };

  const confirmDeletePublishedBook = async () => {
    if (!bookToDelete) return;
    try {
      await adminService.deletePublishedBook(bookToDelete.id);
      await fetchPublishedLibrary();
      if (previewEntry?.book?.id === bookToDelete.id) {
        setPreviewEntry(null);
      }
      setBookToDelete(null);
    } catch (error) {
      const requestError = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setOperationError(
        requestError.response?.data?.message ||
          requestError.message ||
          (language === "en"
            ? "Failed to remove the book."
            : "Gagal menghapus kitab."),
      );
    }
  };

  // Load preview book details and tree dynamically from backend API if empty
  useEffect(() => {
    if (previewBookId && previewItemCount === 0) {
      setIsLoadingPreview(true);
      personalService
        .getBookTree(previewBookId)
        .then((res) => {
          if (res?.data) {
            const tree = res.data;
            const chaptersList: Chapter[] = [];
            const itemsList: BookItem[] = [];

            if (Array.isArray(tree.items)) {
              tree.items.forEach((item) => {
                itemsList.push({
                  id: item.id,
                  bookId: tree.book_id || previewBookId,
                  chapterId: "",
                  question: item.title || item.content || "",
                  answer: item.answer || "",
                  tags: [],
                  isActive: false,
                  status: "inactive",
                  fsrsData: createInitialFSRSState(),
                  createdAt: new Date().toISOString(),
                });
              });
            }

            const flattenModules = (
              mods: ApiBookModule[],
              parentId: string | null = null,
            ) => {
              mods.forEach((mod) => {
                chaptersList.push({
                  id: mod.id,
                  bookId: tree.book_id || previewBookId,
                  parentId,
                  title: mod.title,
                  description: mod.description,
                  order: mod.order || 1,
                });
                if (Array.isArray(mod.items)) {
                  mod.items.forEach((item) => {
                    itemsList.push({
                      id: item.id,
                      bookId: tree.book_id || previewBookId,
                      chapterId: mod.id,
                      question: item.title || item.content || "",
                      answer: item.answer || "",
                      tags: [],
                      isActive: false,
                      status: "inactive",
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

            setPreviewEntry((prev) =>
              prev
                ? { ...prev, chapters: chaptersList, items: itemsList }
                : null,
            );
          }
        })
        .catch((err) => {
          console.warn("Failed to load preview tree:", err);
        })
        .finally(() => {
          setIsLoadingPreview(false);
        });
    }
  }, [previewBookId, previewItemCount]);

  if (!isOpen) return null;

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const categories = [
    { id: "All", label: language === "en" ? "All Books" : "Semua Kitab" },
    {
      id: "Bahasa Arab",
      label: language === "en" ? "Arabic Language" : "Bahasa Arab",
    },
    {
      id: "Tajwid & Al-Qur'an",
      label: language === "en" ? "Tajweed & Quran" : "Tajwid & Al-Qur'an",
    },
    {
      id: "Hadits & Sunnah",
      label: language === "en" ? "Hadith Studies" : "Hadits & Sunnah",
    },
    {
      id: "Dzikir & Doa",
      label: language === "en" ? "Dhikr & Du'a" : "Dzikir & Doa",
    },
    {
      id: "Umum & Akademik",
      label: language === "en" ? "General & Academic" : "Umum & Akademik",
    },
  ];

  // Filtering & Sorting
  const filteredEntries = library
    .filter((entry) => {
      const matchCategory =
        selectedCategory === "All" || entry.book.category === selectedCategory;
      const matchSearch =
        (entry.book?.title || "")
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        (entry.book?.description || "")
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        (entry.curator || "").toLowerCase().includes(search.toLowerCase()) ||
        (entry.book?.authorName || "")
          .toLowerCase()
          .includes(search.toLowerCase());
      return matchCategory && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === "popular") return (b.downloads || 0) - (a.downloads || 0);
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "cards")
        return (b.items?.length || 0) - (a.items?.length || 0);
      if (sortBy === "newest")
        return (
          new Date(b.book.createdAt || 0).getTime() -
          new Date(a.book.createdAt || 0).getTime()
        );
      return 0;
    });

  const handleImport = async (entry: LibraryEntry) => {
    setImportingId(entry.id);
    setOperationError(null);
    try {
      await importFromLibrary(entry.id);
      setJustImportedId(entry.id);
      setTimeout(() => setJustImportedId(null), 2500);
    } catch (error) {
      setOperationError(
        error instanceof Error
          ? error.message
          : language === "en"
            ? "Failed to import the book."
            : "Gagal mengimpor kitab.",
      );
    } finally {
      setImportingId(null);
    }
  };

  const selectedPreviewChapterCards = previewEntry
    ? previewSelectedChapterId
      ? previewEntry.items.filter(
          (i) => i.chapterId === previewSelectedChapterId,
        )
      : previewEntry.items
    : [];

  return (
    <ModalOverlay
      isOpen
      isDismissable
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Modal className="max-w-6xl overflow-hidden rounded-t-3xl sm:rounded-3xl">
        <Dialog
          aria-label={
            language === "en" ? "Public book library" : "Pustaka kitab publik"
          }
          className="flex max-h-[inherit] flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="relative flex shrink-0 items-start gap-3 border-b border-secondary px-5 py-5 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-200 ring-inset">
                <HugeiconsIcon icon={Books02Icon} className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-primary">
                    {language === "en"
                      ? "Explore the library"
                      : "Jelajahi pustaka"}
                  </h3>
                  <Badge color="brand" size="sm">
                    {library.length} {language === "en" ? "books" : "kitab"}
                  </Badge>
                </div>
                <p className="mt-0.5 max-w-2xl text-sm text-secondary">
                  {language === "en"
                    ? "Discover curated books and import them into your adaptive review collection."
                    : "Temukan kitab terkurasi dan impor ke koleksi murajaah adaptif Anda."}
                </p>
              </div>
            </div>
            <CloseButton
              label={language === "en" ? "Close library" : "Tutup pustaka"}
              onPress={onClose}
              className="absolute right-4 top-4"
            />
          </div>

          {operationError && (
            <div className="shrink-0 px-4 pt-4 sm:px-6">
              <InlineAlert
                variant="error"
                title={operationError}
                onDismiss={() => setOperationError(null)}
              />
            </div>
          )}

          {/* Filter & Controls Bar */}
          <div className="flex shrink-0 flex-col items-stretch justify-between gap-3 border-b border-secondary px-4 py-3 sm:px-6 md:flex-row md:items-center">
            {/* Search */}
            <Input
              icon={Search}
              size="sm"
              aria-label={language === "en" ? "Search library" : "Cari pustaka"}
              placeholder={
                language === "en"
                  ? "Search kitab title, author, or topic..."
                  : "Cari judul kitab, pengarang, materi..."
              }
              value={search}
              onChange={setSearch}
              className="w-full md:max-w-md"
            />

            {/* Sort Selector */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {language === "en" ? "Sort:" : "Urutkan:"}
              </span>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as "popular" | "rating" | "cards" | "newest",
                  )
                }
                className="rounded-lg border border-secondary bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary outline-focus-ring focus:ring-2 focus:ring-brand"
              >
                <option value="popular">
                  {language === "en"
                    ? "Most Popular (Downloads)"
                    : "Terpopuler (Unduhan)"}
                </option>
                <option value="rating">
                  {language === "en" ? "Highest Rated" : "Rating Tertinggi"}
                </option>
                <option value="cards">
                  {language === "en" ? "Most Cards" : "Jumlah Kartu Terbanyak"}
                </option>
                <option value="newest">
                  {language === "en" ? "Recently Added" : "Terbaru"}
                </option>
              </select>
            </div>
          </div>

          {/* Categories Horizontal Scroll */}
          <div className="no-scrollbar flex shrink-0 items-center gap-2 overflow-x-auto border-b border-secondary bg-secondary/30 px-4 py-2.5 sm:px-6">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-brand-solid text-white shadow-xs"
                    : "border border-secondary bg-primary text-secondary hover:border-brand-200 hover:text-primary"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Main Content: Catalog Grid or Empty */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1">
            {filteredEntries.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-secondary bg-secondary/30 px-4 py-16 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-200 ring-inset">
                  <HugeiconsIcon icon={BookDashedIcon} className="size-5" />
                </div>
                <h4 className="mt-3 text-base font-semibold text-primary">
                  {language === "en"
                    ? "No books found"
                    : "Tidak ada kitab yang cocok"}
                </h4>
                <p className="mx-auto mt-1 max-w-sm text-sm text-secondary">
                  {language === "en"
                    ? "Try searching with different keywords or switch the category filter."
                    : "Coba gunakan kata kunci lain atau pilih kategori kitab yang berbeda."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {filteredEntries.map((entry) => {
                  const isAlreadyImported = books.some(
                    (b) => b.title === entry.book.title,
                  );
                  const isJustImported = justImportedId === entry.id;
                  const isPurchased = isBookPurchased(entry.id, entry.book);
                  const isPaid = (entry.book.price || 0) > 0;
                  const coverSrc = resolveAssetUrl(entry.book.coverUrl);

                  return (
                    <div
                      key={entry.id}
                      className="group flex min-h-64 flex-col justify-between rounded-2xl border border-secondary bg-primary p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg sm:rounded-3xl"
                    >
                      <div>
                        {/* Cover & Header Info */}
                        <div className="flex items-start gap-4">
                          <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-lg rounded-r-xl border border-secondary bg-secondary shadow-[0_10px_18px_-10px_rgba(16,24,40,0.55)]">
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-brand-50 px-2 text-center text-brand-700">
                              <HugeiconsIcon
                                icon={BookDashedIcon}
                                className="size-5"
                              />
                              <span className="mt-2 line-clamp-3 text-[10px] font-semibold leading-3.5">
                                {entry.book.title}
                              </span>
                            </div>
                            {coverSrc && (
                              <img
                                src={coverSrc}
                                alt={entry.book.title}
                                onError={(event) => {
                                  event.currentTarget.style.display = "none";
                                }}
                                className="absolute inset-0 size-full object-cover"
                              />
                            )}
                            <div className="pointer-events-none absolute inset-y-0 left-0 w-1.5 border-r border-white/20 bg-black/15" />
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-2 pb-1.5 pt-6 text-center">
                              <p className="truncate text-[8px] font-semibold uppercase tracking-[0.1em] text-white drop-shadow-sm">
                                {entry.book.authorName ||
                                  (language === "en"
                                    ? "Unknown author"
                                    : "Tanpa nama")}
                              </p>
                            </div>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="mb-2 flex flex-wrap items-center gap-1.5">
                              <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700 ring-1 ring-brand-200 ring-inset">
                                {entry.book.category}
                              </span>

                              {/* Price / Free Badge */}
                              {isPaid ? (
                                <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700 ring-1 ring-brand-200 ring-inset">
                                  {formatIDR(entry.book.price || 0)}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200/60 dark:border-emerald-800/60">
                                  Gratis
                                </span>
                              )}

                              <span className="rounded-md border border-secondary bg-secondary/60 px-2 py-0.5 text-[10px] font-semibold text-secondary">
                                {entry.chapters?.length || 1}{" "}
                                {language === "en" ? "chapters" : "bab"}
                              </span>

                              {entry.verified && (
                                <span
                                  className="flex items-center gap-0.5 text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold"
                                  title="Kurasi Resmi Terverifikasi"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                  <span>Kurasi Resmi</span>
                                </span>
                              )}
                            </div>

                            <h4
                              title={entry.book.title}
                              className="line-clamp-2 text-sm font-semibold leading-snug text-primary transition-colors group-hover:text-brand-secondary sm:text-base"
                            >
                              {entry.book.title}
                            </h4>

                            <p className="mt-1 truncate text-xs text-tertiary">
                              {entry.book.authorName}
                            </p>

                            {/* Stats Badge */}
                            <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium text-tertiary">
                              <span className="flex items-center gap-1 font-bold text-brand-700">
                                <Star className="w-3.5 h-3.5 fill-brand-500" />
                                {entry.rating}
                              </span>
                              <span>•</span>
                              <span
                                className="flex items-center gap-1"
                                title="Jumlah unduhan"
                              >
                                <Download className="w-3.5 h-3.5 text-slate-400" />
                                {(entry.downloads || 0).toLocaleString()}
                              </span>
                              <span>•</span>
                              <span
                                className="flex items-center gap-1"
                                title="Jumlah kartu hafalan"
                              >
                                <Layers className="w-3.5 h-3.5 text-slate-400" />
                                {entry.items?.length || 0} kartu
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="mt-3 line-clamp-2 min-h-9 text-xs leading-relaxed text-secondary">
                          {entry.book.description ||
                            (language === "en"
                              ? "No description available."
                              : "Belum ada deskripsi buku.")}
                        </p>
                      </div>

                      {/* Bottom Action Footer */}
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-secondary pt-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewEntry(entry);
                              setPreviewSelectedChapterId(null);
                            }}
                            className="flex min-h-9 items-center gap-1.5 rounded-xl border border-secondary bg-primary px-3 py-1.5 text-xs font-semibold text-secondary outline-none transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-[3px] focus-visible:outline-offset-1 focus-visible:outline-[#ef6905]"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>
                              {language === "en" ? "Preview" : "Intip Isi"}
                            </span>
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDeletePublishedBook(
                                  entry.book.id,
                                  entry.book.title,
                                )
                              }
                              className="p-1.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                              title={
                                language === "en"
                                  ? "Delete from library (Admin)"
                                  : "Hapus dari pustaka (Admin)"
                              }
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {isJustImported ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold animate-in fade-in">
                            <Check className="w-4 h-4 text-emerald-600" />
                            <span>
                              {language === "en"
                                ? "Installed!"
                                : "Berhasil Dipasang!"}
                            </span>
                          </span>
                        ) : isAlreadyImported ? (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              {language === "en" ? "Installed" : "Sudah Ada"}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleImport(entry)}
                              disabled={importingId === entry.id}
                              className="rounded-lg border border-brand-200 px-2.5 py-1 text-[10px] font-semibold text-brand-700 hover:bg-brand-50"
                              title={
                                language === "en"
                                  ? "Import again as fresh duplicate"
                                  : "Pasang ulang sebagai salinan baru"
                              }
                            >
                              + Salin
                            </button>
                          </div>
                        ) : !isPurchased && isPaid ? (
                          <button
                            type="button"
                            onClick={() => openCheckoutModal(entry)}
                            className="flex items-center gap-1.5 rounded-xl bg-brand-solid px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-brand-solid_hover active:scale-95"
                          >
                            <span>
                              Beli ({formatIDR(entry.book.price || 0)})
                            </span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleImport(entry)}
                            disabled={importingId === entry.id}
                            className="flex items-center gap-1.5 rounded-xl bg-brand-solid px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-brand-solid_hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {importingId === entry.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                            <span>
                              {language === "en"
                                ? "1-Click Import"
                                : "Pasang Kitab"}
                            </span>
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
            <ModalOverlay
              isOpen
              isDismissable
              onOpenChange={(open) => {
                if (!open) setPreviewEntry(null);
              }}
              className="z-[1100]"
            >
              <Modal className="max-w-3xl overflow-hidden rounded-t-3xl sm:rounded-3xl">
                <Dialog
                  aria-label={
                    language === "en"
                      ? `Preview ${previewEntry.book.title}`
                      : `Pratinjau ${previewEntry.book.title}`
                  }
                  className="flex max-h-[inherit] flex-col overflow-hidden"
                >
                  {/* Preview Header */}
                  <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/70 dark:bg-slate-850">
                    <div className="flex items-start gap-4">
                      {resolveAssetUrl(previewEntry.book.coverUrl) ? (
                        <img
                          src={resolveAssetUrl(previewEntry.book.coverUrl)}
                          alt={previewEntry.book.title}
                          className="h-24 w-18 shrink-0 rounded-xl object-cover shadow-md ring-1 ring-secondary sm:h-28 sm:w-20"
                        />
                      ) : (
                        <div className="flex h-24 w-18 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 sm:h-28 sm:w-20">
                          <HugeiconsIcon
                            icon={BookDashedIcon}
                            className="size-5"
                          />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="rounded-md bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700 ring-1 ring-brand-200 ring-inset">
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
                          {language === "en" ? "Author" : "Pengarang"}:{" "}
                          <strong>{previewEntry.book.authorName}</strong> •{" "}
                          {language === "en" ? "Curated by" : "Dikurasi oleh"}{" "}
                          {previewEntry.curator}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                          {previewEntry.book.description}
                        </p>
                      </div>
                    </div>
                    <CloseButton
                      label={
                        language === "en" ? "Close preview" : "Tutup pratinjau"
                      }
                      onPress={() => setPreviewEntry(null)}
                    />
                  </div>

                  {/* Preview Body: Chapters Filter & Sample Cards List */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                    {/* Chapter Selector Pills */}
                    <div>
                      <h5 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Folder className="w-3.5 h-3.5 text-brand-700" />
                        <span>
                          {language === "en"
                            ? "Table of Contents"
                            : "Daftar Bab & Materi"}{" "}
                          ({previewEntry.chapters?.length || 0})
                        </span>
                      </h5>
                      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                        <button
                          onClick={() => setPreviewSelectedChapterId(null)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                            previewSelectedChapterId === null
                              ? "bg-brand-solid text-white font-bold shadow-xs"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                          }`}
                        >
                          {language === "en" ? "All Chapters" : "Semua Bab"} (
                          {previewEntry.items.length})
                        </button>
                        {(previewEntry.chapters || []).map((ch) => {
                          const chCardCount = previewEntry.items.filter(
                            (i) => i.chapterId === ch.id,
                          ).length;
                          return (
                            <button
                              key={ch.id}
                              onClick={() => setPreviewSelectedChapterId(ch.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                                previewSelectedChapterId === ch.id
                                  ? "bg-brand-solid text-white font-bold shadow-xs"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
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
                        <Sparkles className="w-3.5 h-3.5 text-brand-700" />
                        <span>
                          {language === "en"
                            ? "Sample Flashcards"
                            : "Sampel Kartu Q&A"}{" "}
                          ({selectedPreviewChapterCards.length})
                        </span>
                      </h5>

                      {isLoadingPreview ? (
                        <div className="flex items-center justify-center py-10 gap-2 text-slate-400 text-xs">
                          <Loader2 className="w-5 h-5 animate-spin text-brand-700" />
                          <span>
                            {language === "en"
                              ? "Loading book content..."
                              : "Memuat isi materi kitab..."}
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {selectedPreviewChapterCards.length === 0 ? (
                            <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                              {language === "en"
                                ? "No cards available in this chapter yet."
                                : "Belum ada kartu hafalan di bab ini."}
                            </div>
                          ) : (
                            selectedPreviewChapterCards.map((card, idx) => (
                              <div
                                key={card.id || idx}
                                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 space-y-2"
                              >
                                <div className="flex items-start gap-2">
                                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700">
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
                                      <span
                                        key={tIdx}
                                        className="px-2 py-0.5 rounded bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-400 text-[10px] font-medium"
                                      >
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
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewEntry(null)}
                        className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        {language === "en"
                          ? "Close Preview"
                          : "Tutup Pratinjau"}
                      </button>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() =>
                            handleDeletePublishedBook(
                              previewEntry.book.id,
                              previewEntry.book.title,
                            )
                          }
                          className="px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                          title={
                            language === "en"
                              ? "Delete from library (Admin)"
                              : "Hapus dari pustaka (Admin)"
                          }
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">
                            {language === "en" ? "Delete" : "Hapus"}
                          </span>
                        </button>
                      )}
                    </div>

                    {!isBookPurchased(previewEntry.id, previewEntry.book) &&
                    (previewEntry.book.price || 0) > 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          const entryToBuy = previewEntry;
                          setPreviewEntry(null);
                          openCheckoutModal(entryToBuy);
                        }}
                        className="flex items-center gap-2 rounded-xl bg-brand-solid px-5 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-brand-solid_hover active:scale-95 sm:text-sm"
                      >
                        <span>
                          Beli Kitab Ini (
                          {formatIDR(previewEntry.book.price || 0)})
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          handleImport(previewEntry);
                          setPreviewEntry(null);
                        }}
                        className="flex items-center gap-2 rounded-xl bg-brand-solid px-5 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-brand-solid_hover active:scale-95 sm:text-sm"
                      >
                        <Download className="w-4 h-4" />
                        <span>
                          {language === "en"
                            ? "Import Full Kitab (1-Click)"
                            : "Pasang Seluruh Kitab (1-Klik)"}
                        </span>
                      </button>
                    )}
                  </div>
                </Dialog>
              </Modal>
            </ModalOverlay>
          )}

          <ModalOverlay
            isOpen={Boolean(bookToDelete)}
            isDismissable
            onOpenChange={(open) => {
              if (!open) setBookToDelete(null);
            }}
            className="z-[1200]"
          >
            <Modal className="max-w-md overflow-hidden rounded-t-3xl sm:rounded-3xl">
              <Dialog
                aria-label={
                  language === "en"
                    ? "Remove published book"
                    : "Hapus kitab terbit"
                }
              >
                {({ close }) => (
                  <div>
                    <div className="relative flex items-start gap-3 border-b border-secondary px-5 py-5 sm:px-6">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-error-primary text-error-primary">
                        <Trash2 className="size-5" />
                      </div>
                      <div className="pr-10">
                        <h2 className="text-lg font-semibold text-primary">
                          {language === "en"
                            ? "Remove from library?"
                            : "Hapus dari pustaka?"}
                        </h2>
                        <p className="mt-1 text-sm text-secondary">
                          {language === "en"
                            ? `This will remove "${bookToDelete?.title}" from the public catalog.`
                            : `Tindakan ini akan menghapus "${bookToDelete?.title}" dari katalog publik.`}
                        </p>
                      </div>
                      <CloseButton
                        label={
                          language === "en"
                            ? "Close confirmation"
                            : "Tutup konfirmasi"
                        }
                        onPress={close}
                        className="absolute right-4 top-4"
                      />
                    </div>
                    <div className="flex flex-col-reverse gap-3 bg-secondary px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                      <Button
                        color="secondary"
                        size="md"
                        onPress={close}
                        className="w-full sm:w-auto"
                      >
                        {language === "en" ? "Cancel" : "Batal"}
                      </Button>
                      <Button
                        color="primary-destructive"
                        size="md"
                        iconLeading={Trash2}
                        onPress={confirmDeletePublishedBook}
                        className="w-full sm:w-auto"
                      >
                        {language === "en" ? "Remove book" : "Hapus kitab"}
                      </Button>
                    </div>
                  </div>
                )}
              </Dialog>
            </Modal>
          </ModalOverlay>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
};
