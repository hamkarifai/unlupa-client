import {
  Menu,
  ShieldCheck,
  Target,
  Trophy,
  UserCheck,
  X,
  Loader2,
  Clock,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";

import { useGetMyItems } from "@/features/alquran/hooks/useGetMyItems";
import { QuickAccessCards } from "@/components/ui/QuickAccessCards";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useGetDaily } from "@/features/alquran/hooks/useGetDaily";
import { useTeacherRequest } from "../hooks/useTeacherRequest";
import { useDashboardStats } from "../hooks/useDashboardStats";
import { ConsistencyHeatmap } from "../components/ConsistencyHeatmap";
import { SwipeableReviewQueue } from "../components/SwipeableReviewQueue";
import { WeakSpotsWidget } from "../components/WeakSpotsWidget";
import { VisualReviewCalendar } from "../components/VisualReviewCalendar";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export const StudentDashboardPage = () => {
  const { name } = useCurrentUser();

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useDashboardStats();
  const { data: myItems, loading: myItemsLoading, getMyItems } = useGetMyItems();
  const { data: dailyTasks, loading: dailyLoading, getDaily } = useGetDaily();

  const { sendTeacherRequest } = useTeacherRequest();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isRequested, setIsRequested] = useState(false);

  useEffect(() => {
    void getMyItems("quran");
    void getDaily();
  }, [getMyItems, getDaily]);

  const totalTerjaga =
    stats?.total_items ??
    myItems?.data.groups.reduce((sum, group) => sum + group.item_count, 0) ??
    0;

  const totalSelesai = stats?.total_memorized ?? 0;
  const reviewHariIni = stats?.due_reviews_today ?? (dailyTasks?.length ?? 0);
  const focusTime = stats?.estimated_focus_minutes ?? (reviewHariIni * 3);

  const initialLetter = name ? name.charAt(0).toUpperCase() : "U";

  const handleRequestTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const toastId = toast.loading("Sedang mengirim pengajuan Anda...");
    try {
      await sendTeacherRequest.mutateAsync({ message: message });
      setIsRequested(true);
      setIsModalOpen(false);
      setMessage("");
      toast.success("Pengajuan berhasil dikirim! Menunggu persetujuan admin.", {
        id: toastId,
        duration: 4000,
      });
    } catch (error: unknown) {
      const errorMessage = isAxiosError(error)
        ? (error.response?.data as { message?: string } | undefined)?.message ||
          "Gagal mengirim permintaan. Anda mungkin sudah mengajukannya sebelumnya."
        : "Terjadi kesalahan yang tidak diketahui.";
      toast.error(errorMessage, {
        id: toastId,
        duration: 5000,
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 space-y-8 transition-all duration-300 relative">
      {/* HEADER (PROFILE FOCUS) */}
      <nav className="flex justify-between items-center gap-2 sm:gap-4">
        {/* Left: Menu Trigger */}
        <button
          type="button"
          className="flex items-center gap-3 text-muted-foreground hover:text-primary transition group cursor-pointer shrink-0"
        >
          <div className="p-2.5 rounded-xl border border-border/80 group-hover:border-primary/50 bg-card shadow-xs">
            <Menu className="w-5 h-5" />
          </div>
          <span className="text-xs font-mono tracking-widest uppercase hidden sm:inline">
            Menu
          </span>
        </button>

        {/* Right: User Identity & Request Teacher Action */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <ThemeToggle />
          <div className="text-right flex flex-col items-end min-w-0">
            <p className="text-sm text-foreground font-semibold truncate max-w-[8rem] sm:max-w-[13rem]">
              {name}
            </p>
            <div className="hidden sm:flex items-center gap-2 mt-0.5">
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
                Santri / Pembelajar
              </p>
              <span className="text-muted-foreground text-[10px]">•</span>
              <button
                onClick={() => !isRequested && setIsModalOpen(true)}
                disabled={isRequested}
                className={`text-[10px] font-mono uppercase tracking-widest transition cursor-pointer flex items-center gap-1 ${
                  isRequested
                    ? "text-emerald-500 cursor-not-allowed"
                    : "text-amber-600 dark:text-amber-400 hover:underline decoration-amber-500/30 underline-offset-4"
                }`}
              >
                {isRequested ? "Request Pending" : "Jadi Guru?"}
              </button>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold text-primary-foreground shrink-0 shadow-xs">
            {initialLetter}
          </div>
        </div>
      </nav>

      {/* QUICK ACCESS CARDS */}
      <QuickAccessCards role="student" />

      {/* CORE STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Stat 1: Total Terjaga */}
        <div className="bg-card border border-border/60 rounded-2xl p-5 relative overflow-hidden shadow-xs group hover:border-border transition-all">
          <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
              Total Terjaga
            </p>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-foreground font-mono mb-1">
            {statsLoading || myItemsLoading ? "..." : totalTerjaga}
          </h3>
          <p className="text-xs text-muted-foreground">
            Item hafalan aktif terdaftar
          </p>
        </div>

        {/* Stat 2: Review Hari Ini */}
        <div className="bg-card border border-primary/30 rounded-2xl p-5 relative overflow-hidden shadow-xs group hover:border-primary/50 transition-all">
          <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] text-primary/80 uppercase tracking-widest font-mono font-bold">
              Review Hari Ini
            </p>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-foreground font-mono mb-1">
            {dailyLoading || statsLoading ? "..." : reviewHariIni}
          </h3>
          <p className="text-xs text-muted-foreground">
            {reviewHariIni > 0 ? "Siap untuk dimurajaah" : "Semua review beres"}
          </p>
        </div>

        {/* Stat 3: Total Selesai / Graduate */}
        <div className="bg-card border border-border/60 rounded-2xl p-5 relative overflow-hidden shadow-xs group hover:border-border transition-all">
          <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
              Taraf Mapan
            </p>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-foreground font-mono mb-1">
            {statsLoading ? "..." : totalSelesai}
          </h3>
          <p className="text-xs text-muted-foreground">
            {totalTerjaga > 0
              ? `${Math.round((totalSelesai / Math.max(totalTerjaga, 1)) * 100)}% dari seluruh materi`
              : "Menuju kestabilan tinggi"}
          </p>
        </div>

        {/* Stat 4: Estimasi Waktu Fokus */}
        <div className="bg-card border border-border/60 rounded-2xl p-5 relative overflow-hidden shadow-xs group hover:border-border transition-all">
          <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
              Fokus Hari Ini
            </p>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-foreground font-mono mb-1">
            ±{focusTime} <span className="text-sm font-sans font-normal text-muted-foreground">menit</span>
          </h3>
          <p className="text-xs text-muted-foreground">
            Investasi waktu murajaah
          </p>
        </div>
      </div>

      {/* SWIPEABLE REVIEW QUEUE */}
      {dailyTasks && dailyTasks.flatMap((g) => g.items).length > 0 && (
        <SwipeableReviewQueue
          tasks={dailyTasks.flatMap((g) => g.items)}
          onReviewCompleted={() => {
            void getDaily();
            void refetchStats();
          }}
        />
      )}

      {/* CONSISTENCY & WEAK SPOTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ConsistencyHeatmap
            activities={stats?.consistency_heatmap ?? []}
            currentStreak={stats?.current_streak ?? 0}
            longestStreak={stats?.longest_streak ?? 0}
          />
        </div>
        <div>
          <WeakSpotsWidget
            weakSpots={stats?.weak_spots ?? []}
            onReviewItem={() => {
              void getDaily();
            }}
          />
        </div>
      </div>

      {/* REVIEW FORECAST CALENDAR */}
      {stats?.upcoming_forecast && stats.upcoming_forecast.length > 0 && (
        <VisualReviewCalendar forecast={stats.upcoming_forecast} />
      )}

      {/* MOTIVATIONAL FOOTER */}
      <div className="border-t border-border/60 pt-6 pb-2">
        <div className="bg-card border border-border/60 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left shadow-xs">
          <div>
            <p className="font-serif italic text-foreground text-base mb-1">
              "Sebaik-baik kalian adalah orang yang belajar Al-Qur'an dan mengajarkannya."
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              HR. Bukhari • Terus jaga konsistensi dengan Spaced Repetition
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2 text-primary text-xs font-mono font-medium">
            <Sparkles className="w-4 h-4" />
            <span>FSRS v6 Active</span>
          </div>
        </div>
      </div>

      {/* MODAL DIALOG: REQUEST TEACHER */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs transition-opacity duration-300">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 relative shadow-xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20 text-primary">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-foreground">
                  Ajukan Sebagai Pengajar
                </h4>
                <p className="text-xs text-muted-foreground">
                  Bimbing santri dan kelola kelas halaqah hafalan.
                </p>
              </div>
            </div>

            <form onSubmit={handleRequestTeacher} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                  Pesan / Kualifikasi Pengajuan
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Contoh: Saya lulusan ma'had tahfizh dan ingin membimbing santri di halaqah..."
                  className="w-full bg-surface-1 border border-border rounded-xl p-3 text-sm text-foreground placeholder-muted-foreground focus:outline-hidden focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground border border-transparent hover:border-border rounded-lg transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={sendTeacherRequest.isPending}
                  className="px-5 py-2 text-xs font-mono uppercase tracking-widest bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg transition shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {sendTeacherRequest.isPending ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    "Kirim Pengajuan"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
