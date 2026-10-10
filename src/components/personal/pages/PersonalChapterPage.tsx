import type { ReactNode } from "react";
import type { Book, Chapter, Language } from "../../../types";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  Clock,
  FileText,
  Layers,
  Pencil,
  Play,
  Plus,
  Power,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "@/components/foundations/hugeicons";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";

export type ChapterCardFilter =
  | "all"
  | "due"
  | "active"
  | "inactive"
  | "mastered";

interface PersonalChapterPageProps {
  book: Book;
  chapter: Chapter;
  breadcrumbs: Chapter[];
  language: Language;
  variant?: "chapter" | "subchapter" | "unassigned";
  parentTitle?: string;
  position: number;
  totalPositions: number;
  previousChapter?: Chapter;
  nextChapter?: Chapter;
  totalCards: number;
  activeCards: number;
  dueCards: number;
  masteredCards: number;
  filteredCards: number;
  filter: ChapterCardFilter;
  search: string;
  isReadonly: boolean;
  isBulkMode: boolean;
  selectedCount: number;
  allFilteredSelected: boolean;
  children?: ReactNode;
  onBack: () => void;
  onNavigateChapter: (chapter: Chapter) => void;
  onOpenCalendar: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onGenerateAI: () => void;
  onAddCard: () => void;
  onStartReview: () => void;
  onFilterChange: (filter: ChapterCardFilter) => void;
  onSearchChange: (value: string) => void;
  onToggleBulkMode: () => void;
  onToggleSelectAll: () => void;
  onBulkActivate: () => void;
  onBulkDeactivate: () => void;
  onBulkMove: () => void;
  onBulkDelete: () => void;
}

export const PersonalChapterPage = ({
  book,
  chapter,
  breadcrumbs,
  language,
  variant = "chapter",
  parentTitle,
  position,
  totalPositions,
  previousChapter,
  nextChapter,
  totalCards,
  activeCards,
  dueCards,
  masteredCards,
  filteredCards,
  filter,
  search,
  isReadonly,
  isBulkMode,
  selectedCount,
  allFilteredSelected,
  children,
  onBack,
  onNavigateChapter,
  onOpenCalendar,
  onEdit,
  onDelete,
  onGenerateAI,
  onAddCard,
  onStartReview,
  onFilterChange,
  onSearchChange,
  onToggleBulkMode,
  onToggleSelectAll,
  onBulkActivate,
  onBulkDeactivate,
  onBulkMove,
  onBulkDelete,
}: PersonalChapterPageProps) => {
  const isSubchapter = variant === "subchapter";
  const isUnassigned = variant === "unassigned";
  const inactiveCards = totalCards - activeCards;

  const filters: Array<{
    id: ChapterCardFilter;
    label: string;
    count: number;
    icon: typeof Layers;
  }> = [
    {
      id: "all",
      label: language === "en" ? "All" : "Semua",
      count: totalCards,
      icon: Layers,
    },
    {
      id: "due",
      label: language === "en" ? "Due" : "Review",
      count: dueCards,
      icon: Clock,
    },
    {
      id: "active",
      label: language === "en" ? "Active" : "Aktif",
      count: activeCards,
      icon: CheckCircle2,
    },
    {
      id: "inactive",
      label: language === "en" ? "Inactive" : "Nonaktif",
      count: inactiveCards,
      icon: CircleDashed,
    },
    {
      id: "mastered",
      label: language === "en" ? "Mastered" : "Mapan",
      count: masteredCards,
      icon: ShieldCheck,
    },
  ];

  return (
    <main
      className="space-y-5"
      data-page={isSubchapter ? "subchapter" : "chapter"}
    >
      <div className="flex flex-col gap-3 border-b border-secondary pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Button
            color="secondary"
            size="sm"
            iconLeading={ArrowLeft}
            onPress={onBack}
          >
            {language === "en" ? "Back to book" : "Kembali ke buku"}
          </Button>

          {totalPositions > 1 && (
            <div className="flex items-center rounded-xl border border-secondary bg-secondary p-1">
              <ButtonUtility
                icon={ChevronLeft}
                color="tertiary"
                size="xs"
                tooltip={
                  previousChapter?.title ||
                  (language === "en"
                    ? "No previous chapter"
                    : "Tidak ada bab sebelumnya")
                }
                isDisabled={!previousChapter}
                onPress={() =>
                  previousChapter && onNavigateChapter(previousChapter)
                }
              />
              <span className="px-2 text-xs font-semibold tabular-nums text-secondary">
                {position} / {totalPositions}
              </span>
              <ButtonUtility
                icon={ChevronRight}
                color="tertiary"
                size="xs"
                tooltip={
                  nextChapter?.title ||
                  (language === "en"
                    ? "No next chapter"
                    : "Tidak ada bab berikutnya")
                }
                isDisabled={!nextChapter}
                onPress={() => nextChapter && onNavigateChapter(nextChapter)}
              />
            </div>
          )}

          <nav
            aria-label="Breadcrumb"
            className="flex min-w-0 items-center gap-1.5 overflow-x-auto text-xs text-tertiary"
          >
            <button
              type="button"
              onClick={onBack}
              className="max-w-36 truncate font-medium hover:text-brand-secondary"
            >
              {book.title}
            </button>
            {breadcrumbs.map((crumb, index) => {
              const isCurrent = index === breadcrumbs.length - 1;
              return (
                <span
                  key={crumb.id}
                  className="flex shrink-0 items-center gap-1.5"
                >
                  <ChevronRight className="size-3 text-fg-quaternary" />
                  <button
                    type="button"
                    disabled={isCurrent}
                    onClick={() => !isCurrent && onNavigateChapter(crumb)}
                    className={
                      isCurrent
                        ? "max-w-48 truncate font-semibold text-primary"
                        : "max-w-40 truncate font-medium hover:text-brand-secondary"
                    }
                  >
                    {crumb.title}
                  </button>
                </span>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 self-end lg:self-auto">
          <Button
            color="secondary"
            size="sm"
            iconLeading={Calendar}
            onPress={onOpenCalendar}
          >
            <span className="hidden sm:inline">
              {language === "en" ? "Calendar" : "Kalender"}
            </span>
          </Button>
          {!isReadonly && onEdit && (
            <Button
              color="secondary"
              size="sm"
              iconLeading={Pencil}
              onPress={onEdit}
            >
              <span className="hidden sm:inline">
                {language === "en" ? "Edit" : "Edit"}
              </span>
            </Button>
          )}
          {!isReadonly && onDelete && (
            <ButtonUtility
              icon={Trash2}
              color="tertiary"
              tooltip={language === "en" ? "Delete chapter" : "Hapus bab"}
              onPress={onDelete}
              className="text-error-primary hover:bg-error-primary"
            />
          )}
        </div>
      </div>

      <section className="relative overflow-hidden rounded-2xl border border-brand-200 bg-[linear-gradient(145deg,var(--color-bg-primary)_0%,var(--color-bg-primary)_60%,var(--color-brand-50)_100%)] p-5 shadow-lg sm:rounded-3xl sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge color="brand" size="sm">
                {isUnassigned
                  ? language === "en"
                    ? "General cards"
                    : "Kartu umum"
                  : isSubchapter
                    ? language === "en"
                      ? "Subchapter"
                      : "Subbab"
                    : language === "en"
                      ? "Main chapter"
                      : "Bab utama"}
              </Badge>
              {isReadonly && (
                <Badge color="gray" size="sm" className="gap-1.5">
                  <ShieldCheck className="size-3.5" />
                  {language === "en" ? "Read-only" : "Hanya baca"}
                </Badge>
              )}
            </div>
            {isSubchapter && parentTitle && (
              <p className="mt-3 text-xs font-medium text-brand-secondary">
                {language === "en" ? "Inside" : "Di dalam"} {parentTitle}
              </p>
            )}
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
              {chapter.title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-secondary">
              {chapter.description ||
                (language === "en"
                  ? "No description has been added for this section."
                  : "Belum ada deskripsi untuk bagian ini.")}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {!isReadonly && (
              <>
                <Button
                  color="secondary"
                  size="sm"
                  iconLeading={Sparkles}
                  onPress={onGenerateAI}
                >
                  {language === "en" ? "Generate with AI" : "Buat dengan AI"}
                </Button>
                <Button size="sm" iconLeading={Plus} onPress={onAddCard}>
                  {language === "en" ? "Add card" : "Tambah kartu"}
                </Button>
              </>
            )}
            {dueCards > 0 && (
              <Button
                color="secondary"
                size="sm"
                iconLeading={Play}
                onPress={onStartReview}
              >
                {language === "en"
                  ? `Review ${dueCards}`
                  : `Review ${dueCards}`}
              </Button>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              label: language === "en" ? "Total cards" : "Total kartu",
              value: totalCards,
              color: "text-brand-700 bg-brand-50 ring-brand-200",
              icon: Layers,
            },
            {
              label: language === "en" ? "Active" : "Aktif",
              value: activeCards,
              color:
                "text-utility-green-700 bg-utility-green-50 ring-utility-green-200",
              icon: CheckCircle2,
            },
            {
              label: language === "en" ? "Due now" : "Perlu review",
              value: dueCards,
              color:
                "text-utility-yellow-700 bg-utility-yellow-50 ring-utility-yellow-200",
              icon: Clock,
            },
            {
              label: language === "en" ? "Mastered" : "Mapan",
              value: masteredCards,
              color:
                "text-utility-blue-700 bg-utility-blue-50 ring-utility-blue-200",
              icon: ShieldCheck,
            },
          ].map(({ label, value, color, icon: Icon }) => (
            <div
              key={label}
              className="rounded-xl border border-secondary bg-primary p-4 shadow-xs sm:rounded-2xl"
            >
              <div
                className={`flex size-8 items-center justify-center rounded-lg ring-1 ring-inset ${color}`}
              >
                <Icon className="size-4" />
              </div>
              <p className="mt-3 text-2xl font-semibold tabular-nums text-primary">
                {value}
              </p>
              <p className="text-xs text-secondary">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {isBulkMode && (
        <section className="flex flex-col gap-3 rounded-xl bg-gray-950 p-4 text-white shadow-lg sm:rounded-2xl sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onToggleSelectAll}
            className="flex items-center gap-2 text-xs font-semibold text-gray-200 hover:text-white"
          >
            {allFilteredSelected ? (
              <CheckSquare className="size-4 text-brand-400" />
            ) : (
              <CheckSquare className="size-4 text-gray-400" />
            )}
            {allFilteredSelected
              ? language === "en"
                ? "Deselect all"
                : "Batalkan semua"
              : language === "en"
                ? `Select all (${filteredCards})`
                : `Pilih semua (${filteredCards})`}
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <BadgeWithDot color="brand" size="sm">
              {selectedCount} {language === "en" ? "selected" : "dipilih"}
            </BadgeWithDot>
            <Button
              color="secondary"
              size="xs"
              iconLeading={CheckCircle2}
              onPress={onBulkActivate}
              isDisabled={selectedCount === 0}
            >
              {language === "en" ? "Activate" : "Aktifkan"}
            </Button>
            <Button
              color="secondary"
              size="xs"
              iconLeading={Power}
              onPress={onBulkDeactivate}
              isDisabled={selectedCount === 0}
            >
              {language === "en" ? "Deactivate" : "Nonaktifkan"}
            </Button>
            {!isReadonly && (
              <Button
                color="secondary"
                size="xs"
                iconLeading={Layers}
                onPress={onBulkMove}
                isDisabled={selectedCount === 0}
              >
                {language === "en" ? "Move" : "Pindah"}
              </Button>
            )}
            {!isReadonly && (
              <Button
                color="secondary-destructive"
                size="xs"
                iconLeading={Trash2}
                onPress={onBulkDelete}
                isDisabled={selectedCount === 0}
              >
                {language === "en" ? "Delete" : "Hapus"}
              </Button>
            )}
            <ButtonUtility
              icon={X}
              color="tertiary"
              size="xs"
              tooltip={
                language === "en" ? "Exit bulk mode" : "Tutup aksi massal"
              }
              onPress={onToggleBulkMode}
              className="text-white hover:bg-white/10"
            />
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-secondary bg-primary p-4 shadow-xs sm:rounded-3xl sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-secondary p-1">
            {filters.map(({ id, label, count, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => onFilterChange(id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${filter === id ? "bg-primary text-brand-secondary shadow-xs ring-1 ring-primary" : "text-secondary hover:text-primary"}`}
              >
                <Icon className="size-3.5" />
                {label}
                <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] tabular-nums">
                  {count}
                </span>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              aria-label={
                language === "en"
                  ? "Search cards in chapter"
                  : "Cari kartu dalam bab"
              }
              icon={Search}
              size="sm"
              value={search}
              onChange={onSearchChange}
              placeholder={language === "en" ? "Search cards" : "Cari kartu"}
              className="min-w-0 flex-1 sm:w-64"
            />
            <Button
              color={isBulkMode ? "primary" : "secondary"}
              size="sm"
              iconLeading={CheckSquare}
              onPress={onToggleBulkMode}
            >
              <span className="hidden sm:inline">
                {isBulkMode
                  ? language === "en"
                    ? "Done"
                    : "Selesai"
                  : language === "en"
                    ? "Bulk actions"
                    : "Aksi massal"}
              </span>
            </Button>
          </div>
        </div>

        <div className="mt-5">
          {filteredCards === 0 ? (
            <div className="rounded-2xl border border-dashed border-secondary bg-secondary/30 px-5 py-12 text-center">
              <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-200 ring-inset">
                <FileText className="size-5" />
              </div>
              <h2 className="mt-3 text-sm font-semibold text-primary">
                {totalCards === 0
                  ? language === "en"
                    ? "No cards in this section"
                    : "Belum ada kartu di bagian ini"
                  : language === "en"
                    ? "No matching cards"
                    : "Kartu tidak ditemukan"}
              </h2>
              <p className="mx-auto mt-1 max-w-md text-sm text-secondary">
                {totalCards === 0
                  ? language === "en"
                    ? "Add a card manually or generate a first draft with AI."
                    : "Tambahkan kartu secara manual atau buat draf pertama dengan AI."
                  : language === "en"
                    ? "Change the active filter or try another search term."
                    : "Ubah filter aktif atau coba kata pencarian lain."}
              </p>
              {!isReadonly && totalCards === 0 && (
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Button
                    color="secondary"
                    size="sm"
                    iconLeading={Sparkles}
                    onPress={onGenerateAI}
                  >
                    {language === "en" ? "Generate with AI" : "Buat dengan AI"}
                  </Button>
                  <Button size="sm" iconLeading={Plus} onPress={onAddCard}>
                    {language === "en"
                      ? "Add first card"
                      : "Tambah kartu pertama"}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            children
          )}
        </div>
      </section>
    </main>
  );
};
