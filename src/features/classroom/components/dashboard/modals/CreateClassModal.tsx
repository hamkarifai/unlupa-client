import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { 
  BookOpen, 
  BookMarked, 
  Image as ImageIcon, 
  LayoutGrid, 
  X, 
  Upload, 
  Check, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles,
  Layers,
  AlertCircle
} from "lucide-react";
import { JuzRangeSelector } from "@/components/classes/JuzRangeSelector";
import { useApp } from "@/context/AppContext";

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

export interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (payload: {
    name: string;
    description: string;
    type: "book" | "quran";
    cover_image?: File | string;
    assignedBookId?: string;
    targetJuz?: string;
  }) => void;
  isLoading?: boolean;
}

export const CreateClassModal: React.FC<CreateClassModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  isLoading = false,
}) => {
  const { books, items, language } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"personal" | "imported">("personal");
  const [formState, setFormState] = useState<{
    name: string;
    description: string;
    type: "book" | "quran";
    coverFile: File | null;
    coverUrl: string;
    targetJuz: string;
    assignedBookId: string;
  }>({
    name: "",
    description: "",
    type: "quran",
    coverFile: null,
    coverUrl: "",
    targetJuz: "1-5",
    assignedBookId: "",
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      const defaultBook = books.find((b) => !b.isReadonly) || books[0];
      setFormState({
        name: "",
        description: "",
        type: "quran",
        coverFile: null,
        coverUrl: "",
        targetJuz: "1-5",
        assignedBookId: defaultBook?.id || "",
      });
      setActiveTab(defaultBook?.isReadonly ? "imported" : "personal");
      setErrorMessage(null);
    }
  }, [isOpen, books]);

  if (!isOpen) return null;

  const personalBooks = books.filter((b) => !b.isReadonly && !b.masterBookId);
  const importedBooks = books.filter((b) => b.isReadonly);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
      if (!validTypes.includes(file.type)) {
        setErrorMessage("Format file tidak didukung. Harap pilih gambar JPG, PNG, atau WebP.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage("Ukuran gambar terlalu besar. Maksimal 5MB.");
        return;
      }
      setErrorMessage(null);
      setFormState((prev) => ({
        ...prev,
        coverFile: file,
        coverUrl: URL.createObjectURL(file),
      }));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage("Ukuran gambar terlalu besar. Maksimal 5MB.");
        return;
      }
      setErrorMessage(null);
      setFormState((prev) => ({
        ...prev,
        coverFile: file,
        coverUrl: URL.createObjectURL(file),
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim()) {
      setErrorMessage("Nama kelas wajib diisi.");
      return;
    }

    if (formState.type === "book" && !formState.assignedBookId && books.length > 0) {
      setErrorMessage("Silakan pilih kitab untuk kelas ini.");
      return;
    }

    setErrorMessage(null);

    // Build description with target juz if Quran class
    let finalDesc = formState.description.trim();
    if (formState.type === "quran" && formState.targetJuz) {
      const targetLabel = formState.targetJuz === "all" ? "Juz 1-30" : `Juz ${formState.targetJuz}`;
      finalDesc = finalDesc ? `[Target: ${targetLabel}] ${finalDesc}` : `Target Hafalan: ${targetLabel}`;
    }

    onCreate({
      name: formState.name.trim(),
      description: finalDesc,
      type: formState.type,
      cover_image: formState.coverFile || formState.coverUrl || undefined,
      assignedBookId: formState.type === "book" ? formState.assignedBookId : undefined,
      targetJuz: formState.type === "quran" ? formState.targetJuz : undefined,
    });
  };

  const currentSelectedBook = books.find((b) => b.id === formState.assignedBookId);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl sm:rounded-3xl max-w-2xl w-full flex flex-col max-h-[90vh] relative shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between bg-surface-1/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-foreground">
                Buat Kelas Baru
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Bina halaqah tahfidz Al-Qur'an atau kelas bimbingan kitab terstruktur.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-2 rounded-full hover:bg-surface-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 min-h-0">
          {/* 1. Segmented Type Toggle (Quran vs Book) */}
          <div>
            <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
              Jenis Kelas <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-surface-1 border border-border">
              <button
                type="button"
                onClick={() => setFormState((prev) => ({ ...prev, type: "quran", coverUrl: "", coverFile: null }))}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  formState.type === "quran"
                    ? "bg-primary text-primary-foreground shadow-md font-bold scale-[1.01]"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
                }`}
              >
                <BookOpen className="w-4 h-4 shrink-0" />
                <span>Al-Qur'an (Tahfidz)</span>
              </button>

              <button
                type="button"
                onClick={() => setFormState((prev) => ({ ...prev, type: "book", coverUrl: "", coverFile: null }))}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  formState.type === "book"
                    ? "bg-primary text-primary-foreground shadow-md font-bold scale-[1.01]"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
                }`}
              >
                <BookMarked className="w-4 h-4 shrink-0" />
                <span>Kitab & Materi</span>
              </button>
            </div>
          </div>

          {/* 2. Class Name */}
          <div>
            <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
              Nama Kelas / Halaqah <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                <LayoutGrid className="h-4 w-4" />
              </div>
              <input
                type="text"
                required
                value={formState.name}
                onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
                placeholder={
                  formState.type === "quran"
                    ? "Misal: Halaqah Tahfidz Al-Jazari / Juz 30"
                    : "Misal: Kelas Matan Al-Ajurrumiyyah / Nahwu Dasar"
                }
                disabled={isLoading}
                className="w-full rounded-xl border border-border bg-surface-1 py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* 3. Conditional: Quran Target Juz Range Selector */}
          {formState.type === "quran" && (
            <div>
              <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
                Target Hafalan Santri
              </label>
              <JuzRangeSelector
                value={formState.targetJuz}
                onChange={(val) => setFormState((prev) => ({ ...prev, targetJuz: val }))}
              />
            </div>
          )}

          {/* 4. Conditional: Book Selector for Book Classes */}
          {formState.type === "book" && (
            <div className="space-y-3 rounded-2xl border border-border bg-surface-1/40 p-3.5 sm:p-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
                  Pilih Kitab Pembelajaran Kelas
                </label>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {personalBooks.length} Karya Pribadi · {importedBooks.length} Impor
                </span>
              </div>

              {/* Tabs: Karya Pribadi vs Kitab Impor */}
              <div className="flex rounded-xl bg-surface-1 p-1 border border-border">
                <button
                  type="button"
                  onClick={() => setActiveTab("personal")}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === "personal"
                      ? "bg-card text-primary shadow-xs border border-border/80"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>Karya Pribadi</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-primary/10 text-primary font-bold">
                    {personalBooks.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("imported")}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === "imported"
                      ? "bg-card text-amber-500 shadow-xs border border-border/80"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>Kitab Impor Pustaka</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/10 text-amber-500 font-bold">
                    {importedBooks.length}
                  </span>
                </button>
              </div>

              {/* Description Banner */}
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                {activeTab === "personal" ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Karya pribadi: dapat diedit, ditambah kartu materi/hafalan, dan dikelola penuh untuk santri.</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>Kitab impor: terstruktur rapi dari pustaka publik untuk dibagikan ke santri.</span>
                  </>
                )}
              </p>

              {/* Books List Grid */}
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {(activeTab === "personal" ? personalBooks : importedBooks).length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
                    {activeTab === "personal"
                      ? "Belum ada karya pribadi. Buat buku baru di Ruang Buku."
                      : "Belum ada kitab impor. Pasang kitab dari Pustaka Publik di Ruang Buku."}
                  </div>
                ) : (
                  (activeTab === "personal" ? personalBooks : importedBooks).map((b) => {
                    const isSelected = formState.assignedBookId === b.id;
                    const bItemsCount = items.filter((i) => i.bookId === b.id).length;

                    return (
                      <div
                        key={b.id}
                        onClick={() => setFormState((prev) => ({ ...prev, assignedBookId: b.id }))}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? "border-primary bg-primary/10 ring-1 ring-primary shadow-xs"
                            : "border-border hover:border-border/80 bg-card hover:bg-surface-1/60"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-12 rounded-md overflow-hidden bg-surface-2 shrink-0 border border-border">
                            {b.coverUrl ? (
                              <img src={b.coverUrl} alt={b.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">
                                {b.title.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="text-xs font-bold text-foreground truncate">{b.title}</div>
                            <div className="text-[10px] text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
                              <span>{b.authorName || "Pribadi"}</span>
                              <span>•</span>
                              <span>{bItemsCount} kartu</span>
                            </div>
                            <div className="mt-1">
                              {b.isReadonly ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                  Hanya Baca
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                  Bisa Diedit
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border"
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {currentSelectedBook && (
                <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/20 text-xs flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span className="truncate">
                    Kitab terpilih: <strong>{currentSelectedBook.title}</strong>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 5. Cover Image & Presets */}
          <div>
            <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
              Gambar Sampul Kelas (Opsional)
            </label>

            {/* Drag & Drop / Upload Box */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="rounded-2xl border-2 border-dashed border-border hover:border-primary/50 transition-colors bg-surface-1/50 p-4"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {formState.coverUrl ? (
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-border relative bg-surface-2">
                    <img src={formState.coverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-foreground block truncate">
                      Gambar Sampul Terpasang
                    </span>
                    <span className="text-[11px] text-emerald-500 flex items-center gap-1 mt-0.5 font-medium">
                      <Check className="w-3.5 h-3.5" /> Siap digunakan
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1.5 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-surface-2 cursor-pointer transition-colors"
                    >
                      Ganti
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormState((prev) => ({ ...prev, coverUrl: "", coverFile: null }))}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center py-2 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-primary hover:underline">
                    Pilih foto dari penyimpanan perangkat
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    Mendukung JPG, PNG, WebP (Maks. 5MB)
                  </span>
                </div>
              )}
            </div>

            {/* Presets Grid */}
            <div className="mt-3">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Atau gunakan pilihan sampul estetik:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(formState.type === "quran" ? COVER_PRESETS.quran : COVER_PRESETS.nonQuran).map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => setFormState((prev) => ({ ...prev, coverUrl: preset.url, coverFile: null }))}
                    className={`relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                      formState.coverUrl === preset.url
                        ? "border-primary ring-2 ring-primary/30 scale-[1.02]"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={preset.url} alt={preset.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-black/70 p-1 text-[9px] text-white text-center font-semibold truncate">
                      {preset.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 6. Description / Schedule */}
          <div>
            <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
              Deskripsi & Jadwal Pertemuan (Opsional)
            </label>
            <textarea
              rows={2}
              value={formState.description}
              onChange={(e) => setFormState((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Misal: Halaqah rutin setiap Ahad ba'da Subuh dan setoran hafalan harian..."
              disabled={isLoading}
              className="w-full rounded-xl border border-border bg-surface-1 py-2.5 px-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-border text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-60 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isLoading ? "Membuat Kelas..." : "Buat Kelas Sekarang"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
