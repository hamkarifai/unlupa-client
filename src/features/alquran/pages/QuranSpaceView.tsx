import { useState, useMemo } from "react";
import {
  BookOpen,
  Search,
  ShieldCheck,
  Clock,
  AlertCircle,
  Circle,
  Filter,
  Layers,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { useQuranPages } from "../hooks/useQuranPages";
import { PageReviewModal } from "../components/PageReviewModal";
import { Juz30TrackerWidget } from "../components/Juz30TrackerWidget";
import type { QuranPageSummary } from "../types/quran-pages.types";

export const QuranSpaceView = () => {
  const { data, isLoading } = useQuranPages();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJuz, setSelectedJuz] = useState<number | "all">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activePageForReview, setActivePageForReview] = useState<QuranPageSummary | null>(null);

  const stats = data?.stats;
  const pages = data?.pages ?? [];

  // Filtered pages
  const filteredPages = useMemo(() => {
    return pages.filter((page) => {
      // Juz filter
      if (selectedJuz !== "all" && page.juz_number !== selectedJuz) {
        return false;
      }

      // Status filter
      if (statusFilter === "mapan" && page.status !== "mapan") return false;
      if (statusFilter === "due" && !page.is_due) return false;
      if (statusFilter === "learning" && page.status !== "learning" && page.status !== "review")
        return false;
      if (statusFilter === "new" && page.status !== "new") return false;

      // Search query (Page Number)
      if (searchQuery.trim() !== "") {
        const query = searchQuery.trim();
        if (!String(page.page_number).includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [pages, selectedJuz, statusFilter, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 space-y-8 transition-all duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-5 h-5 text-emerald-500" />
            <h1 className="text-2xl font-bold font-serif text-foreground tracking-tight">
              Quran Space • 604 Halaman Mushaf
            </h1>
          </div>
          <p className="text-xs text-muted-foreground font-sans">
            Pelacakan status hafalan dan murajaah 30 Juz Mushaf Standar Madani dengan algoritma FSRS.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-card border border-border/60 px-3 py-1.5 rounded-xl shadow-xs">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <span>FSRS Target Retention: 90%</span>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Pages */}
        <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block mb-1">
            Total Mushaf
          </span>
          <h3 className="text-2xl font-bold font-mono text-foreground">604</h3>
          <span className="text-xs text-muted-foreground">Halaman Madani</span>
        </div>

        {/* Mapan */}
        <div className="bg-card border border-emerald-500/20 rounded-2xl p-4 shadow-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Mapan (Stabil)
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {isLoading ? "..." : stats?.mapan_pages ?? 0}
          </h3>
          <span className="text-xs text-muted-foreground font-mono">
            {stats?.mapan_percent ?? 0}% dari seluruh Quran
          </span>
        </div>

        {/* Butuh Murajaah (Due) */}
        <div className="bg-card border border-amber-500/20 rounded-2xl p-4 shadow-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-600 dark:text-amber-400">
              Perlu Murajaah
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <h3 className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {isLoading ? "..." : stats?.due_pages_today ?? 0}
          </h3>
          <span className="text-xs text-muted-foreground">Due hari ini</span>
        </div>

        {/* Sedang Dihafal */}
        <div className="bg-card border border-sky-500/20 rounded-2xl p-4 shadow-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-sky-600 dark:text-sky-400">
              Sedang Dihafal
            </span>
            <AlertCircle className="w-4 h-4 text-sky-500" />
          </div>
          <h3 className="text-2xl font-bold font-mono text-sky-600 dark:text-sky-400">
            {isLoading ? "..." : (stats?.learning_pages ?? 0) + (stats?.review_pages ?? 0)}
          </h3>
          <span className="text-xs text-muted-foreground">FSRS active</span>
        </div>

        {/* Belum Dimulai */}
        <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Belum Dimulai
            </span>
            <Circle className="w-4 h-4 text-muted-foreground/40" />
          </div>
          <h3 className="text-2xl font-bold font-mono text-muted-foreground">
            {isLoading ? "..." : stats?.new_pages ?? 604}
          </h3>
          <span className="text-xs text-muted-foreground">Belum masuk memori</span>
        </div>
      </div>

      {/* JUZ 30 TRACKER WIDGET */}
      <Juz30TrackerWidget onSelectPage={(page) => setActivePageForReview(page)} />

      {/* FILTER & SEARCH BAR */}
      <div className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition cursor-pointer shrink-0 ${
                statusFilter === "all"
                  ? "bg-primary text-primary-foreground font-bold shadow-xs"
                  : "bg-surface-1 text-muted-foreground hover:text-foreground border border-border/60"
              }`}
            >
              Semua ({pages.length})
            </button>
            <button
              onClick={() => setStatusFilter("mapan")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition cursor-pointer shrink-0 ${
                statusFilter === "mapan"
                  ? "bg-emerald-500 text-white font-bold shadow-xs"
                  : "bg-surface-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20"
              }`}
            >
              🟢 Mapan ({stats?.mapan_pages ?? 0})
            </button>
            <button
              onClick={() => setStatusFilter("due")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition cursor-pointer shrink-0 ${
                statusFilter === "due"
                  ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                  : "bg-surface-1 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 border border-amber-500/20"
              }`}
            >
              🟡 Perlu Review ({stats?.due_pages_today ?? 0})
            </button>
            <button
              onClick={() => setStatusFilter("learning")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition cursor-pointer shrink-0 ${
                statusFilter === "learning"
                  ? "bg-sky-500 text-white font-bold shadow-xs"
                  : "bg-surface-1 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 border border-sky-500/20"
              }`}
            >
              🔵 Dihafal ({(stats?.learning_pages ?? 0) + (stats?.review_pages ?? 0)})
            </button>
            <button
              onClick={() => setStatusFilter("new")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition cursor-pointer shrink-0 ${
                statusFilter === "new"
                  ? "bg-muted text-foreground font-bold shadow-xs"
                  : "bg-surface-1 text-muted-foreground hover:text-foreground border border-border/60"
              }`}
            >
              ⚪ Belum ({stats?.new_pages ?? 0})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-56 shrink-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari No. Halaman..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-1 border border-border/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-foreground placeholder-muted-foreground focus:outline-hidden focus:border-primary/50"
            />
          </div>
        </div>

        {/* Juz Selector (1-30) */}
        <div className="pt-2 border-t border-border/40">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground shrink-0 mr-1">
              Juz:
            </span>
            <button
              onClick={() => setSelectedJuz("all")}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition cursor-pointer shrink-0 ${
                selectedJuz === "all"
                  ? "bg-primary text-primary-foreground font-bold"
                  : "bg-surface-1 text-muted-foreground hover:text-foreground border border-border/40"
              }`}
            >
              Semua
            </button>
            {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => (
              <button
                key={juz}
                onClick={() => setSelectedJuz(juz)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition cursor-pointer shrink-0 ${
                  selectedJuz === juz
                    ? "bg-primary text-primary-foreground font-bold"
                    : "bg-surface-1 text-muted-foreground hover:text-foreground border border-border/40"
                }`}
              >
                {juz}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 604 PAGES GRID */}
      <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Grid Halaman Mushaf ({filteredPages.length} Halaman Ditampilkan)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">
            Klik halaman untuk menilai murajaah
          </span>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-muted-foreground text-sm font-mono">
            Memuat data 604 halaman mushaf...
          </div>
        ) : filteredPages.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <p className="text-sm">Tidak ada halaman yang cocok dengan filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-16 lg:grid-cols-20 gap-2">
            {filteredPages.map((p) => {
              const isMapan = p.status === "mapan";
              const isDue = p.is_due;
              const isLearning = p.status === "learning" || p.status === "review";

              return (
                <button
                  key={p.page_number}
                  onClick={() => setActivePageForReview(p)}
                  title={`Halaman ${p.page_number} • Juz ${p.juz_number} • Status: ${p.status}`}
                  className={`h-11 rounded-xl flex flex-col items-center justify-center border transition-all duration-150 cursor-pointer hover:scale-108 relative overflow-hidden group ${
                    isDue
                      ? "bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-xs shadow-amber-500/30 animate-pulse"
                      : isMapan
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30"
                      : isLearning
                      ? "bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/40 hover:bg-sky-500/30"
                      : "bg-surface-1 text-muted-foreground/80 border-border/50 hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  <span className="text-xs font-mono font-bold">{p.page_number}</span>
                  <span className="text-[8px] font-mono opacity-70">J{p.juz_number}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Modal Dialog */}
      {activePageForReview && (
        <PageReviewModal
          page={activePageForReview}
          onClose={() => setActivePageForReview(null)}
        />
      )}
    </div>
  );
};
