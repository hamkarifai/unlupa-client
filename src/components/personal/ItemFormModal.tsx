import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import {
  BookOpen,
  ChevronDown,
  Image as ImageIcon,
  Plus,
  UploadCloud,
  WalletCards,
  X,
} from "@/components/foundations/hugeicons";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { InlineAlert } from "@/components/base/alert/alert";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { TextArea } from "@/components/base/textarea/textarea";
import type { BookItem, Chapter, Language } from "../../types";
import { uploadImageToStorage } from "../../lib/imageUtils";

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data: {
      question: string;
      answer: string;
      explanation?: string;
      imageQ?: string;
      imageA?: string;
      chapterId?: string;
    },
    keepOpen?: boolean,
  ) => void;
  chapters: Chapter[];
  initialData?: Partial<BookItem>;
  initialChapterId?: string;
  language: Language;
}

type FormState = {
  question: string;
  answer: string;
  explanation: string;
  imageQ: string;
  imageA: string;
  chapterId: string;
};

const emptyForm: FormState = {
  question: "",
  answer: "",
  explanation: "",
  imageQ: "",
  imageA: "",
  chapterId: "",
};

export const ItemFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  chapters,
  initialData,
  initialChapterId,
  language,
}: ItemFormModalProps) => {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [showExplanation, setShowExplanation] = useState(false);
  const [uploadingField, setUploadingField] = useState<"imageQ" | "imageA" | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputQ = useRef<HTMLInputElement>(null);
  const fileInputA = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setShowExplanation(Boolean(initialData?.explanation));
    setUploadError(null);
    setForm({
      question: initialData?.question || "",
      answer: initialData?.answer || "",
      explanation: initialData?.explanation || "",
      imageQ: initialData?.imageQ || "",
      imageA: initialData?.imageA || "",
      chapterId: initialData?.chapterId || initialChapterId || "",
    });
  }, [isOpen, initialData, initialChapterId]);

  if (!isOpen) return null;

  const isEditing = Boolean(initialData?.id);
  const isUploading = uploadingField !== null;
  const hasQuestion = Boolean(form.question.trim() || form.imageQ);
  const hasAnswer = Boolean(form.answer.trim() || form.imageA);
  const canSubmit = hasQuestion && hasAnswer && !isUploading;

  const submitForm = (keepOpen: boolean) => {
    if (!canSubmit) return;
    onSubmit(
      {
        question: form.question.trim(),
        answer: form.answer.trim(),
        explanation: form.explanation.trim() || undefined,
        imageQ: form.imageQ || undefined,
        imageA: form.imageA || undefined,
        chapterId: form.chapterId || undefined,
      },
      keepOpen,
    );

    if (keepOpen) {
      setForm((current) => ({ ...emptyForm, chapterId: current.chapterId }));
      setShowExplanation(false);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    submitForm(false);
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>, field: "imageQ" | "imageA") => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingField(field);
    setUploadError(null);
    try {
      const storageUrl = await uploadImageToStorage(file);
      setForm((current) => ({ ...current, [field]: storageUrl }));
    } catch (error) {
      console.error("Image upload failed", error);
      setUploadError(language === "en" ? "The image could not be uploaded. Please try another file." : "Gambar gagal diunggah. Coba gunakan file lain.");
    } finally {
      setUploadingField(null);
      event.target.value = "";
    }
  };

  const renderChapterOptions = (parentId: string | null = null, depth = 0): ReactNode[] => {
    return chapters
      .filter((chapter) => (chapter.parentId || null) === parentId)
      .flatMap((chapter) => [
        <option key={chapter.id} value={chapter.id}>
          {`${"  ".repeat(depth)}${depth > 0 ? "- " : ""}${chapter.title}`}
        </option>,
        ...renderChapterOptions(chapter.id, depth + 1),
      ]);
  };

  const renderImageControl = (field: "imageQ" | "imageA", inputRef: typeof fileInputQ) => {
    const imageUrl = form[field];
    const label = field === "imageQ" ? (language === "en" ? "Question image" : "Gambar pertanyaan") : language === "en" ? "Answer image" : "Gambar jawaban";

    return (
      <div className="mt-3 rounded-2xl border border-dashed border-secondary bg-secondary/30 p-3">
        {imageUrl ? (
          <div className="flex items-center gap-3">
            <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-secondary shadow-xs ring-1 ring-secondary ring-inset">
              <img src={imageUrl} alt={label} className="size-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-primary">{label}</p>
              <p className="mt-0.5 text-xs text-secondary">{language === "en" ? "Image attached to this side of the card." : "Gambar terpasang pada sisi kartu ini."}</p>
              <div className="mt-2 flex gap-2">
                <Button color="secondary" size="xs" iconLeading={UploadCloud} onPress={() => inputRef.current?.click()} isDisabled={isUploading}>
                  {language === "en" ? "Replace" : "Ganti"}
                </Button>
                <Button color="tertiary-destructive" size="xs" onPress={() => setForm((current) => ({ ...current, [field]: "" }))} isDisabled={isUploading}>
                  {language === "en" ? "Remove" : "Hapus"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="flex w-full items-center gap-3 rounded-xl p-1 text-left outline-brand transition hover:bg-primary focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-brand-700 shadow-xs ring-1 ring-brand-200 ring-inset">
              <ImageIcon className="size-4.5" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary">{uploadingField === field ? (language === "en" ? "Uploading image..." : "Mengunggah gambar...") : language === "en" ? "Add an image" : "Tambahkan gambar"}</p>
              <p className="mt-0.5 text-xs text-secondary">{language === "en" ? "Optional. JPG, PNG, or WebP." : "Opsional. JPG, PNG, atau WebP."}</p>
            </div>
          </button>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(event) => handleImageUpload(event, field)} />
      </div>
    );
  };

  return (
    <ModalOverlay
      isOpen
      isDismissable={!isUploading}
      onOpenChange={(open) => {
        if (!open && !isUploading) onClose();
      }}
    >
      <Modal className="max-w-4xl overflow-hidden rounded-t-3xl sm:rounded-3xl">
        <Dialog aria-label={isEditing ? (language === "en" ? "Edit card" : "Edit kartu") : language === "en" ? "Add card" : "Tambah kartu"}>
          {({ close }) => (
            <form onSubmit={handleSubmit} className="flex max-h-[inherit] flex-col">
              <div className="relative shrink-0 overflow-hidden border-b border-brand-200 bg-[linear-gradient(135deg,var(--color-brand-50)_0%,var(--color-bg-primary)_74%)] px-5 py-5 sm:px-6">
                <div className="pointer-events-none absolute -right-14 -top-20 size-48 rounded-full bg-brand-200/40 blur-3xl" />
                <div className="relative flex items-start gap-3 pr-10">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-solid text-white shadow-xs ring-1 ring-brand-600 ring-inset">
                    <WalletCards className="size-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-primary">
                        {isEditing ? (language === "en" ? "Edit knowledge card" : "Edit kartu pengetahuan") : language === "en" ? "Add a knowledge card" : "Tambah kartu pengetahuan"}
                      </h2>
                      <Badge color="brand" size="sm">{isEditing ? (language === "en" ? "Editing" : "Mengedit") : language === "en" ? "New card" : "Kartu baru"}</Badge>
                    </div>
                    <p className="mt-1 max-w-2xl text-sm leading-5 text-secondary">
                      {language === "en" ? "Build a focused prompt and answer. Text or an image can be used on either side." : "Susun pertanyaan dan jawaban yang fokus. Setiap sisi dapat menggunakan teks atau gambar."}
                    </p>
                  </div>
                </div>
                <ButtonUtility
                  icon={X}
                  color="tertiary"
                  tooltip={language === "en" ? "Close card form" : "Tutup form kartu"}
                  onPress={close}
                  isDisabled={isUploading}
                  className="absolute right-4 top-4 bg-primary/80 shadow-xs backdrop-blur-sm"
                />
              </div>

              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
                {uploadError && <InlineAlert variant="error" title={uploadError} onDismiss={() => setUploadError(null)} />}

                {chapters.length > 0 && (
                  <div className="rounded-2xl border border-secondary bg-secondary/30 p-3.5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-brand-700 shadow-xs ring-1 ring-brand-200 ring-inset">
                          <BookOpen className="size-4" />
                        </div>
                        <div>
                          <label htmlFor="item-chapter" className="text-sm font-medium text-primary">{language === "en" ? "Save to chapter" : "Simpan ke bab"}</label>
                          <p className="text-xs text-secondary">{language === "en" ? "You can move the card later." : "Kartu dapat dipindahkan kembali nanti."}</p>
                        </div>
                      </div>
                      <div className="relative sm:w-72">
                        <select
                          id="item-chapter"
                          value={form.chapterId}
                          onChange={(event) => setForm((current) => ({ ...current, chapterId: event.target.value }))}
                          className="w-full appearance-none rounded-lg bg-primary px-3 py-2 pr-9 text-sm text-primary shadow-xs ring-1 ring-primary outline-none ring-inset focus:ring-2 focus:ring-brand"
                        >
                          <option value="">{language === "en" ? "General cards (no chapter)" : "Kartu umum (tanpa bab)"}</option>
                          {renderChapterOptions()}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-fg-quaternary" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid gap-4 lg:grid-cols-2">
                  <section className="rounded-2xl border border-secondary bg-primary p-5 shadow-xs sm:rounded-3xl">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex size-7 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-brand-700 ring-1 ring-brand-200 ring-inset">Q</span>
                      <div>
                        <h3 className="text-sm font-semibold text-primary">{language === "en" ? "Question" : "Pertanyaan"}</h3>
                        <p className="text-xs text-secondary">{language === "en" ? "What should you recall?" : "Apa yang ingin Anda ingat?"}</p>
                      </div>
                    </div>
                    <TextArea
                      aria-label={language === "en" ? "Question text" : "Teks pertanyaan"}
                      value={form.question}
                      onChange={(value) => setForm((current) => ({ ...current, question: value }))}
                      placeholder={language === "en" ? "Write a concise question or prompt..." : "Tulis pertanyaan atau pemantik yang singkat..."}
                      rows={5}
                      isDisabled={isUploading}
                    />
                    {renderImageControl("imageQ", fileInputQ)}
                    {!hasQuestion && <p className="mt-2 text-xs text-tertiary">{language === "en" ? "Question text or an image is required." : "Teks pertanyaan atau gambar wajib diisi."}</p>}
                  </section>

                  <section className="rounded-2xl border border-secondary bg-primary p-5 shadow-xs sm:rounded-3xl">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex size-7 items-center justify-center rounded-lg bg-utility-green-50 text-xs font-bold text-utility-green-700 ring-1 ring-utility-green-200 ring-inset">A</span>
                      <div>
                        <h3 className="text-sm font-semibold text-primary">{language === "en" ? "Answer" : "Jawaban"}</h3>
                        <p className="text-xs text-secondary">{language === "en" ? "What is the expected response?" : "Apa jawaban yang diharapkan?"}</p>
                      </div>
                    </div>
                    <TextArea
                      aria-label={language === "en" ? "Answer text" : "Teks jawaban"}
                      value={form.answer}
                      onChange={(value) => setForm((current) => ({ ...current, answer: value }))}
                      placeholder={language === "en" ? "Write the answer clearly..." : "Tulis jawaban dengan jelas..."}
                      rows={5}
                      isDisabled={isUploading}
                    />
                    {renderImageControl("imageA", fileInputA)}
                    {!hasAnswer && <p className="mt-2 text-xs text-tertiary">{language === "en" ? "Answer text or an image is required." : "Teks jawaban atau gambar wajib diisi."}</p>}
                  </section>
                </div>

                <section className="overflow-hidden rounded-2xl border border-secondary bg-secondary/30">
                  <button
                    type="button"
                    onClick={() => setShowExplanation((current) => !current)}
                    className="flex w-full items-center justify-between gap-3 p-3.5 text-left transition hover:bg-primary_hover"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-brand-700 shadow-xs ring-1 ring-brand-200 ring-inset"><BookOpen className="size-4" /></div>
                      <div>
                        <p className="text-sm font-medium text-primary">{language === "en" ? "Add an explanation" : "Tambahkan penjelasan"}</p>
                        <p className="text-xs text-secondary">{language === "en" ? "Optional context, notes, or memory tips." : "Konteks, catatan, atau tips mengingat yang bersifat opsional."}</p>
                      </div>
                    </div>
                    <ChevronDown className={`size-4 text-fg-quaternary transition-transform ${showExplanation ? "rotate-180" : ""}`} />
                  </button>
                  {showExplanation && (
                    <div className="border-t border-secondary bg-primary p-3.5 animate-in fade-in slide-in-from-top-2">
                      <TextArea
                        label={language === "en" ? "Explanation" : "Penjelasan"}
                        value={form.explanation}
                        onChange={(value) => setForm((current) => ({ ...current, explanation: value }))}
                        placeholder={language === "en" ? "Add context that helps explain the answer..." : "Tambahkan konteks yang membantu menjelaskan jawaban..."}
                        rows={3}
                        isDisabled={isUploading}
                      />
                    </div>
                  )}
                </section>
              </div>

              <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-secondary bg-secondary px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="hidden text-xs text-tertiary sm:block">{language === "en" ? "Both sides require text or an image." : "Kedua sisi membutuhkan teks atau gambar."}</p>
                <div className="flex flex-col-reverse gap-3 sm:flex-row">
                  <Button color="secondary" size="md" onPress={close} isDisabled={isUploading} className="w-full sm:w-auto">
                    {language === "en" ? "Cancel" : "Batal"}
                  </Button>
                  {!isEditing && (
                    <Button color="secondary" size="md" iconLeading={Plus} onPress={() => submitForm(true)} isDisabled={!canSubmit} className="w-full sm:w-auto">
                      {language === "en" ? "Save & add another" : "Simpan & tambah lagi"}
                    </Button>
                  )}
                  <Button type="submit" size="md" isDisabled={!canSubmit} isLoading={isUploading} showTextWhileLoading className="w-full sm:w-auto">
                    {isUploading ? (language === "en" ? "Uploading image..." : "Mengunggah gambar...") : isEditing ? (language === "en" ? "Save changes" : "Simpan perubahan") : language === "en" ? "Save card" : "Simpan kartu"}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
};
