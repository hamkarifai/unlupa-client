import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate, useLocation } from "react-router";
import { toast } from "sonner";
import {
  ArrowLeft,
  LayoutList,
  Loader2,
  AlertCircle,
  FileText,
  Lock,
  Flame,
  Brain,
  Target,
  CheckCircle2,
  Play,
  Edit2,
  Trash2,
  AlertTriangle,
  Image,
  GraduationCap,
} from "@/components/foundations/hugeicons";
import { personalService } from "@/features/personal/services/personal.services";
import type { ItemDetail } from "@/features/personal/types/personal.types";
import { Sidebar } from "@/components/ui/Sidebar";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EditItemModal } from "@/features/personal/components/EditItemModal";
import { IntervalModal } from "@/features/personal/components/IntervalModal";
import { useDeleteItem } from "@/features/personal/hooks/useDeleteItem";
import { useStartItemPhase } from "@/features/personal/hooks/useStartItemPhase";
import { useStartIntervalPhase } from "@/features/personal/hooks/useStartIntervalPhase";
import { useActivateFsrsPhase } from "@/features/personal/hooks/useActivateFsrsPhase";
import {
  useBookTree,
  invalidateBookTreeCache,
  updateItemStatusInCache,
} from "@/features/personal/hooks/useBookTree";
import {
  useBookItemStatusMap,
  contentRefForItem,
} from "@/features/personal/hooks/useBookItemStatusMap";
import type {
  BookItem,
  CreatedItem,
  Module,
} from "@/features/personal/types/personal.types";

/* ------------------------------------------------------------------ */
/* Item Detail Page (for Book Items)                                    */
/* ------------------------------------------------------------------ */
export const ItemDetailPage = () => {
  const { itemId, bookId } = useParams<{ itemId: string; bookId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const backFrom = (location.state as { from?: string } | null)?.from;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [item, setItem] = useState<BookItem | null>(null);
  const [realItemId, setRealItemId] = useState<string | null>(null);
  // Track if we have a pending optimistic status update that shouldn't be overwritten by tree sync
  const pendingStatusRef = useRef<BookItem["status"] | null>(null);
  // Track the last status confirmed by the API
  const apiStatusRef = useRef<BookItem["status"] | null>(null);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isIntervalModalOpen, setIsIntervalModalOpen] = useState(false);
  const [isActivateFsrsModalOpen, setIsActivateFsrsModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [isReactivateModalOpen, setIsReactivateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemDetail, setItemDetail] = useState<ItemDetail | null>(null);

  const { tree, loading, error, fetchBookTree, removeItemFromTree } =
    useBookTree();
  const { deleteItem: deleteItemFn } = useDeleteItem({
    onBookTreeUpdate: (bid, deletedItemId) => {
      removeItemFromTree(bid, deletedItemId);
    },
  });
  const { startPhase, loading: isStarting } = useStartItemPhase();
  const { startInterval, loading: isStartingInterval } =
    useStartIntervalPhase();
  const { activateFsrs, loading: isActivatingFsrs } = useActivateFsrsPhase();
  const { fetchStatusMap } = useBookItemStatusMap();
  const itemImage = item?.image || itemDetail?.image;

  // Cari modul (terdalam) yang benar-benar menaungi itemId pada BookTree.
  const findContainingModule = (
    modules: Module[],
    itemId: string,
  ): Module | null => {
    for (const mod of modules) {
      if (mod.items?.some((i) => i.id === itemId)) return mod;
      if (mod.children?.length) {
        const found = findContainingModule(mod.children, itemId);
        if (found) return found;
      }
    }
    return null;
  };

  const parentModule = tree
    ? findContainingModule(tree.modules ?? [], itemId!)
    : null;

  // Arah kembali = modul asal item (agar tetap di daftar item untuk melanjutkan
  // aktivasi item berikutnya); fallback ke halaman buku bila item langsung di bawah buku.
  const getParentUrl = () =>
    parentModule
      ? `/dashboard/pribadi/book/${bookId}/module/${parentModule.id}`
      : `/dashboard/pribadi/book/${bookId}`;

  const handleBack = () => {
    if (backFrom) {
      navigate(backFrom);
      return;
    }
    navigate(getParentUrl());
  };

  // Load item: fetch tree for content, fetch statusMap for status
  useEffect(() => {
    if (!bookId || !itemId) return;

    const load = async () => {
      // Fetch tree (for item content/answer/etc) and status map in parallel
      const [treeResult, statusMap] = await Promise.all([
        fetchBookTree(bookId, true).catch(() => null),
        fetchStatusMap().catch(() => new Map()),
      ]);

      if (!treeResult) return;

      // Find item in tree
      const findInTree = (t: typeof treeResult): BookItem | null => {
        const inItems = t.items?.find((i) => i.id === itemId);
        if (inItems) return inItems;
        const searchMods = (mods: typeof t.modules): BookItem | null => {
          for (const m of mods) {
            const found = m.items?.find((i) => i.id === itemId);
            if (found) return found;
            if (m.children?.length) {
              const d = searchMods(m.children);
              if (d) return d;
            }
          }
          return null;
        };
        return searchMods(t.modules);
      };

      const foundItem = findInTree(treeResult);
      if (!foundItem) return;

      // Get status from API (authoritative) — tree doesn't include status
      const contentRef = contentRefForItem(bookId, itemId);
      const entry = statusMap.get(contentRef);

      const finalStatus = (entry?.status ?? "belum_mulai") as BookItem["status"];

      if (entry?.item_id) {
        setRealItemId(entry.item_id);
      } else {
        setRealItemId(null);
      }

      setItem({ ...foundItem, status: finalStatus });
    };

    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, itemId]);

  // Fetch item detail (next review, stability) when realItemId is known
  useEffect(() => {
    if (!realItemId) return;
    personalService
      .getItemDetail(realItemId)
      .then((res) => setItemDetail(res.data))
      .catch(() => setItemDetail(null));
  }, [realItemId]);

  const handleEditSuccess = (updatedItem: CreatedItem) => {
    setItem({
      ...updatedItem,
      review_count: 0,
      status:
        ((updatedItem as unknown as Record<string, unknown>)
          .status as BookItem["status"]) || "belum_mulai",
    });
  };

  const handleDeleteSuccess = async () => {
    if (!itemId) return;

    try {
      await deleteItemFn(itemId, bookId || undefined);
      setIsDeleteModalOpen(false);
      navigate(getParentUrl());
    } catch (err: unknown) {
      // avoid logging raw error objects to prevent leaking internal details
      console.error(
        "[handleDeleteSuccess] Terjadi kesalahan saat menghapus item",
      );
    }
  };

  const handleStartPhase = async () => {
    if (!bookId || !itemId) return;
    try {
      const result = await startPhase(bookId, itemId);
      // result.item_id is the Item state ID needed for interval/fsrs calls
      if (result.item_id) {
        setRealItemId(result.item_id);
      }
      const newStatus = result.status || "menghafal";
      pendingStatusRef.current = newStatus as BookItem["status"];
      apiStatusRef.current = newStatus as BookItem["status"];
      setItem((prev) =>
        prev ? { ...prev, status: newStatus as BookItem["status"] } : null,
      );
      setIsStartModalOpen(false);
    } catch (err: unknown) {
      console.error("[handleStartPhase] Terjadi kesalahan saat memulai fase");
    }
  };

  const handleIntervalSubmit = async (intervalDays: number) => {
    if (!bookId || !itemId) return;
    const itemIdToUse = realItemId;
    if (!itemIdToUse) {
      console.error("[handleIntervalSubmit] No real item_id available");
      return;
    }
    try {
      await startInterval(bookId, itemIdToUse, intervalDays);
      pendingStatusRef.current = "interval";
      apiStatusRef.current = "interval";
      setItem((prev) => (prev ? { ...prev, status: "interval" } : null));
      setIsIntervalModalOpen(false);
    } catch (err: unknown) {
      console.error(
        "[handleIntervalSubmit] Terjadi kesalahan saat mengirim interval",
      );
      toast.error("Gagal mengirim interval.");
    }
  };

  const handleActivateFsrsPhase = async () => {
    if (!bookId || !itemId) return;
    let itemIdToUse = realItemId;
    if (!itemIdToUse && bookId) {
      try {
        const map = await fetchStatusMap();
        const entry = map.get(contentRefForItem(bookId, itemId));
        itemIdToUse = entry?.item_id ?? null;
      } catch {
        itemIdToUse = null;
      }
    }
    if (!itemIdToUse) {
      itemIdToUse = itemId;
    }
    try {
      const res = await activateFsrs(bookId, itemIdToUse);
      const newRealId = (res as any)?.data?.id || (res as any)?.data?.item_id || (res as any)?.id;
      if (newRealId) {
        setRealItemId(newRealId);
      }
      pendingStatusRef.current = "fsrs_active";
      apiStatusRef.current = "fsrs_active";
      setItem((prev) => (prev ? { ...prev, status: "fsrs_active" } : null));
      setIsActivateFsrsModalOpen(false);
      toast.success("Ujian interval (FSRS) berhasil diaktifkan.");
    } catch (err: unknown) {
      console.error(
        "[handleActivateFsrsPhase] Terjadi kesalahan saat mengaktifkan FSRS",
      );
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Terjadi kesalahan saat mengaktifkan FSRS.";
      toast.error(msg);
    }
  };

  const handleDeactivate = async () => {
    if (!itemId) return;
    let itemIdToUse = realItemId;
    if (!itemIdToUse && bookId) {
      try {
        const map = await fetchStatusMap();
        const entry = map.get(contentRefForItem(bookId, itemId));
        itemIdToUse = entry?.item_id ?? null;
      } catch {
        itemIdToUse = null;
      }
    }
    if (!itemIdToUse) {
      itemIdToUse = itemId;
    }
    try {
      const res = await personalService.deactivateItem(itemIdToUse);
      const newRealId = (res as any)?.data?.id || (res as any)?.data?.item_id || (res as any)?.id;
      if (newRealId) {
        setRealItemId(newRealId);
      }
      pendingStatusRef.current = "inactive";
      apiStatusRef.current = "inactive";
      setItem((prev) => (prev ? { ...prev, status: "inactive" } : null));
      setIsDeactivateModalOpen(false);
      toast.success("Item berhasil diluluskan/dinonaktifkan.");
    } catch (err: unknown) {
      console.error(
        "[handleDeactivate] Terjadi kesalahan saat menonaktifkan item",
      );
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Terjadi kesalahan saat menonaktifkan item.";
      toast.error(msg);
    }
  };

  const handleReactivate = async () => {
    if (!itemId) return;

    let itemIdToUse = realItemId;
    if (!itemIdToUse && bookId) {
      try {
        const map = await fetchStatusMap();
        const entry = map.get(contentRefForItem(bookId, itemId));
        itemIdToUse = entry?.item_id ?? null;
      } catch {
        itemIdToUse = null;
      }
    }

    if (!itemIdToUse) {
      itemIdToUse = itemId;
    }

    try {
      const res = await personalService.reactivateItem(itemIdToUse);
      const newRealId = (res as any)?.data?.id || (res as any)?.data?.item_id || (res as any)?.id;
      if (newRealId) {
        setRealItemId(newRealId);
      }
      pendingStatusRef.current = "fsrs_active";
      apiStatusRef.current = "fsrs_active";
      setItem((prev) => (prev ? { ...prev, status: "fsrs_active" } : null));
      setIsReactivateModalOpen(false);
      toast.success("Item berhasil diaktifkan kembali.");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Gagal mengaktifkan kembali item.";
      toast.error(msg);
    }
  };

  const getItemStatus = () => {
    return item?.status || "belum_mulai";
  };

  // Normalize 'start' → 'menghafal' for display purposes
  const getNormalizedStatus = () => {
    const s = getItemStatus();
    return s === "start" ? "menghafal" : s;
  };

  const getStatusConfig = () => {
    const status = getNormalizedStatus();

    switch (status) {
      case "menghafal":
        return {
          label: "Menghafal",
          color: "text-primary",
          bg: "bg-primary/10",
          border: "border-primary/20",
          icon: Brain,
          description: "Item sedang dalam tahap menghafal",
          buttonText: "Mulai Ujian Interval",
          buttonAction: () => setIsActivateFsrsModalOpen(true),
          isLoading: isActivatingFsrs,
        };
      case "fsrs_active":
        return {
          label: "Ujian Interval",
          color: "text-primary",
          bg: "bg-primary/10",
          border: "border-primary/20",
          icon: Target,
          description: "Item sedang dalam ujian interval (FSRS aktif)",
          buttonText: "Luluskan Item Ini",
          buttonAction: () => setIsDeactivateModalOpen(true),
          isDisabled: false,
          isLoading: false,
        };
      case "graduate":
      case "inactive":
        return {
          label: "Lulus",
          color: "text-success",
          bg: "bg-success/10",
          border: "border-success/20",
          icon: CheckCircle2,
          description: "Item telah lulus dari sistem review",
          buttonText: "Aktifkan Kembali",
          buttonAction: () => setIsReactivateModalOpen(true),
          isDisabled: false,
          isLoading: false,
        };
      default:
        return {
          label: "Belum Mulai",
          color: "text-muted-foreground",
          bg: "bg-surface-1",
          border: "border-border",
          icon: Brain,
          description: "Mulai menghafal item ini untuk pertama kali",
          buttonText: "Mulai Menghafal",
          buttonAction: () => setIsStartModalOpen(true),
          isLoading: isStarting,
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-background text-foreground font-primary selection:bg-primary/30">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" />

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top nav */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2.5 rounded-2xl border border-border hover:border-border bg-surface-1 hover:bg-surface-2 transition-all duration-300 text-muted-foreground hover:text-foreground"
          >
            <LayoutList className="w-5 h-5" />
          </button>
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-surface-1 hover:bg-surface-2 border border-border hover:border-border text-muted-foreground hover:text-foreground transition-all duration-300 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Kembali</span>
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            </div>
            <p className="text-muted-foreground text-sm animate-pulse">
              Memuat detail item...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <div className="w-16 h-16 rounded-3xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <p className="text-destructive text-sm font-medium">{error}</p>
            <button
              onClick={() => bookId && fetchBookTree(bookId)}
              className="px-5 py-2.5 rounded-xl bg-surface-1 hover:bg-surface-2 border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Not Found */}
        {!loading && !error && !item && tree && (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <div className="w-16 h-16 rounded-3xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <p className="text-destructive text-sm font-medium">
              Item tidak ditemukan
            </p>
            <button
              onClick={() => navigate(`/dashboard/pribadi/book/${bookId}`)}
              className="px-5 py-2.5 rounded-xl bg-surface-1 hover:bg-surface-2 border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition"
            >
              Kembali
            </button>
          </div>
        )}

        {/* Item Detail Content */}
        {!loading && !error && item && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Hero Card */}
            <div className="relative rounded-3xl overflow-hidden border border-border bg-card">
              <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-primary/40 to-transparent" />

              <div className="px-8 sm:px-10 py-8">
                {/* Status Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-full ${statusConfig.bg} border ${statusConfig.border}`}
                  >
                    <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                    <span
                      className={`text-xs font-bold tracking-widest uppercase ${statusConfig.color}`}
                    >
                      {statusConfig.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Flame className="w-4 h-4 text-primary" />
                    <span className="text-primary font-bold">
                      {itemDetail?.review_count ?? item.review_count ?? 0}x
                    </span>
                    <span>review</span>
                  </div>
                </div>

                {/* Question & Answer */}
                <div className="space-y-4">
                  {itemImage && (
                    <div className="overflow-hidden rounded-3xl border border-border bg-surface-1">
                      <div className="flex items-center gap-2 border-b border-border px-5 py-3">
                        <Image className="h-4 w-4 text-primary" />
                        <span className="text-xs font-bold uppercase tracking-wider text-primary">
                          Gambar Item
                        </span>
                      </div>
                      <img
                        src={itemImage}
                        alt={item.content || "Gambar item"}
                        className="max-h-[420px] w-full object-contain bg-black/20"
                      />
                    </div>
                  )}

                  {/* Question */}
                  <div className="p-5 rounded-2xl bg-surface-1 border border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Pertanyaan
                      </span>
                    </div>
                    <p className="text-lg text-foreground leading-relaxed whitespace-pre-wrap">
                      {item.content}
                    </p>
                  </div>

                  {/* Answer */}
                  <div className="p-5 rounded-2xl bg-surface-1 border border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <Lock className="w-5 h-5 text-muted-foreground" />
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Jawaban
                      </span>
                    </div>
                    <p className="text-lg text-foreground leading-relaxed whitespace-pre-wrap">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons - Edit & Delete */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center justify-center gap-3 px-6 py-4 rounded-lg bg-surface-1 border border-border text-foreground font-bold text-base hover:bg-surface-2 transition-colors"
              >
                <Edit2 className="w-5 h-5" />
                Edit Item
              </button>
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="flex items-center justify-center gap-3 px-6 py-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive font-bold text-base hover:bg-destructive/20 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                Hapus Item
              </button>
            </div>

            {/* Action Section - Hafalan Stages */}
            <div className="relative rounded-3xl overflow-hidden border border-border bg-card">
              <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent" />

              <div className="px-6 sm:px-8 py-6 sm:py-7 border-b border-border">
                <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2.5">
                  <Brain className="w-5 h-5 text-primary" />
                  Tahapan Hafalan
                </h2>
                <p className="text-muted-foreground text-xs sm:text-sm mt-1">
                  {statusConfig.description}
                </p>
              </div>

              {/* Graduated banner */}
              {(getNormalizedStatus() === "inactive" ||
                getNormalizedStatus() === "graduate") && (
                <div className="mx-4 sm:mx-8 mt-6 rounded-xl overflow-hidden border border-primary/30 bg-primary/10">
                  <div className="px-5 py-4 flex items-center gap-4">
                    <div className="w-fit p-3 rounded-full bg-primary/15 border border-primary/30">
                      <GraduationCap className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-primary font-black text-base">
                        Item Ini Sudah Lulus!
                      </p>
                      <p className="text-primary/60 text-xs mt-0.5">
                        Hafalan kamu untuk item ini sudah sangat kuat.
                        Pertahankan terus!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 sm:p-8">
                {/* Progress Steps - Mobile: Horizontal Scroll, Desktop: Flex */}
                <div className="mb-6 sm:mb-8">
                  {/* Desktop View - Hidden on Mobile */}
                  <div className="hidden sm:block">
                    <div className="relative h-10">
                      {/* Progress Line (behind icons, centered on circle row) */}
                      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-0.5 bg-muted z-0 pointer-events-none">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{
                            width:
                              getNormalizedStatus() === "belum_mulai"
                                ? "0%"
                                : getNormalizedStatus() === "menghafal"
                                  ? "35%"
                                  : getNormalizedStatus() === "fsrs_active"
                                    ? "65%"
                                    : "100%",
                          }}
                        />
                      </div>

                      {/* Circles Row */}
                      <div className="relative z-10 flex h-full">
                        {[
                          { key: "belum_mulai", label: "Mulai", icon: Play },
                          { key: "menghafal", label: "Menghafal", icon: Brain },
                          { key: "fsrs_active", label: "Ujian", icon: Target },
                          { key: "graduate", label: "Lulus", icon: CheckCircle2 },
                        ].map((step) => {
                          const status = getNormalizedStatus();
                          const phases = [
                            "belum_mulai",
                            "menghafal",
                            "fsrs_active",
                            "graduate",
                          ];
                          const currentIndex = phases.indexOf(status);
                          const stepIndex = phases.indexOf(step.key);

                          const isActive = status === step.key;
                          const isCompleted = currentIndex > stepIndex;

                          return (
                            <div
                              key={step.key}
                              className="flex-1 flex items-center justify-center"
                            >
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                  isActive
                                    ? "bg-primary border-primary text-primary-foreground scale-110"
                                    : isCompleted
                                      ? "bg-surface-1 border-primary/60 text-primary"
                                      : "bg-surface-1 border-border text-muted-foreground"
                                }`}
                              >
                                <step.icon className="w-5 h-5" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Labels Row */}
                    <div className="mt-3 flex items-start justify-between">
                      {[
                        { key: "belum_mulai", label: "Mulai", icon: Play },
                        { key: "menghafal", label: "Menghafal", icon: Brain },
                        { key: "fsrs_active", label: "Ujian", icon: Target },
                        { key: "graduate", label: "Lulus", icon: CheckCircle2 },
                      ].map((step) => {
                        const status = getNormalizedStatus();
                        const phases = [
                          "belum_mulai",
                          "menghafal",
                          "fsrs_active",
                          "graduate",
                        ];
                        const currentIndex = phases.indexOf(status);
                        const stepIndex = phases.indexOf(step.key);

                        const isActive = status === step.key;
                        const isCompleted = currentIndex > stepIndex;

                        return (
                          <span
                            key={step.key}
                            className={`flex-1 text-center text-xs font-bold uppercase tracking-wider px-1 ${
                              isActive
                                ? "text-primary"
                                : isCompleted
                                  ? "text-primary/70"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {step.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mobile View */}
                  <div className="sm:hidden">
                    <div className="relative">
                      {/* Connector Line (behind icons) */}
                      <div className="absolute top-[19px] left-[12.5%] right-[12.5%] h-0.5 bg-muted z-0 pointer-events-none">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{
                            width:
                              getNormalizedStatus() === "belum_mulai"
                                ? "0%"
                                : getNormalizedStatus() === "menghafal"
                                  ? "35%"
                                  : getNormalizedStatus() === "fsrs_active"
                                    ? "65%"
                                    : "100%",
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-4">
                        {[
                          { key: "belum_mulai", label: "Mulai", icon: Play },
                          { key: "menghafal", label: "Menghafal", icon: Brain },
                          { key: "fsrs_active", label: "Ujian", icon: Target },
                          { key: "graduate", label: "Lulus", icon: CheckCircle2 },
                        ].map((step) => {
                          const status = getNormalizedStatus();
                          const phases = [
                            "belum_mulai",
                            "menghafal",
                            "fsrs_active",
                            "graduate",
                          ];
                          const currentIndex = phases.indexOf(status);
                          const stepIndex = phases.indexOf(step.key);

                          const isActive = status === step.key;
                          const isCompleted = currentIndex > stepIndex;

                          return (
                            <div
                              key={step.key}
                              className="relative z-10 flex flex-col items-center gap-2"
                            >
<div
                                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                  isActive
                                    ? "bg-primary border-primary text-primary-foreground"
                                    : isCompleted
                                      ? "bg-surface-1 border-primary/60 text-primary"
                                      : "bg-surface-1 border-border text-muted-foreground"
                                }`}
                              >
                                <step.icon className="w-4 h-4" />
                              </div>
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider text-center ${
                                  isActive
                                    ? "text-primary"
                                    : isCompleted
                                      ? "text-primary/70"
                                      : "text-muted-foreground"
                                }`}
                              >
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                {(() => {
                  if (statusConfig.buttonAction && !statusConfig.isDisabled) {
                    return (
                      <button
                        onClick={statusConfig.buttonAction}
                        disabled={statusConfig.isLoading}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-lg bg-primary text-primary-foreground font-bold text-base hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {statusConfig.isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Play className="w-5 h-5 fill-current" />
                        )}
                        {statusConfig.isLoading
                          ? "Memproses..."
                          : statusConfig.buttonText}
                      </button>
                    );
                  }
                  return (
                    <div className="text-center p-6 rounded-xl bg-primary/10 border border-primary/20">
                      <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-3" />
                      <p className="text-primary font-medium mb-1">
                        {statusConfig.buttonText}
                      </p>
                      <p className="text-primary/70 text-sm">
                        Terus pertahankan hafalanmu!
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Start Hafalan Modal */}
      {isStartModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-9999 flex items-center justify-center p-3 sm:p-4">
            <div
              className="absolute inset-0 bg-black/75 backdrop-blur-md"
              onClick={() => setIsStartModalOpen(false)}
            />
            <div
              className="relative z-10 w-full max-w-lg animate-in fade-in zoom-in-95 duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative rounded-3xl bg-card border-border overflow-hidden p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
                <div className="text-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-4">
                    <Brain className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">
                    Mulai Menghafal?
                  </h3>
                  <p className="text-muted-foreground text-xs sm:text-sm mb-6 leading-relaxed">
                    Apakah Anda yakin ingin memulai menghafal item ini? Setelah
                    dimulai, item akan masuk ke sistem interval review.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => setIsStartModalOpen(false)}
                      disabled={isStarting}
                      className="flex-1 px-5 py-3 rounded-xl bg-surface-1 hover:bg-surface-2 border border-border text-muted-foreground hover:text-foreground text-sm font-medium transition disabled:opacity-50 cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleStartPhase}
                      disabled={isStarting}
                      className="flex-1 px-5 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isStarting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        "Ya, Mulai"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Interval Modal */}
      {isIntervalModalOpen && item && (
        <IntervalModal
          isOpen={isIntervalModalOpen}
          onClose={() => setIsIntervalModalOpen(false)}
          itemTitle={item.title}
          onSubmit={handleIntervalSubmit}
          isLoading={isStartingInterval}
        />
      )}

      {/* Activate FSRS Confirm Modal */}
      <ConfirmModal
        isOpen={isActivateFsrsModalOpen}
        onClose={() => setIsActivateFsrsModalOpen(false)}
        onConfirm={handleActivateFsrsPhase}
        title="Mulai Ujian Interval?"
        message="Apakah Anda yakin ingin memulai ujian interval? Item akan masuk ke sistem FSRS untuk review terjadwal."
        confirmText="Ya, Mulai"
        cancelText="Tidak"
        icon={Target}
        variant="info"
      />

      {/* Deactivate (Graduate) Confirm Modal */}
      <ConfirmModal
        isOpen={isDeactivateModalOpen}
        onClose={() => setIsDeactivateModalOpen(false)}
        onConfirm={handleDeactivate}
        title="Luluskan Item Ini?"
        message="Item akan ditandai sebagai lulus dan tidak akan muncul di review harian. Anda bisa mengaktifkannya kembali kapan saja."
        confirmText="Ya, Luluskan"
        cancelText="Batal"
        icon={CheckCircle2}
        variant="success"
      />

      {/* Reactivate Confirm Modal */}
      <ConfirmModal
        isOpen={isReactivateModalOpen}
        onClose={() => setIsReactivateModalOpen(false)}
        onConfirm={handleReactivate}
        title="Aktifkan Kembali?"
        message="Item akan dikembalikan ke fase ujian interval dan akan muncul kembali di review harian."
        confirmText="Ya, Aktifkan"
        cancelText="Batal"
        icon={Target}
        variant="info"
      />

      {/* Edit Item Modal */}
      {isEditModalOpen && item && (
        <EditItemModal
          isOpen={isEditModalOpen}
          item={item}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteSuccess}
        title="Hapus Item?"
        message="Apakah Anda yakin ingin menghapus item ini? Tindakan ini tidak dapat dibatalkan dan item akan dihapus secara permanen."
        confirmText="Ya, Hapus"
        cancelText="Batal"
        icon={AlertTriangle}
        variant="danger"
      />
    </div>
  );
};
