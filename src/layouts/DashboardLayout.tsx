import React, { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { useApp } from "@/context/AppContext";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { 
  Home, 
  BookOpen, 
  Library, 
  Users, 
  ShieldAlert, 
  Sparkles, 
  Crown, 
  Share2, 
  WifiOff, 
  ChevronDown, 
  User as UserIcon, 
  LogOut,
  Moon,
  Sun,
  Flame
} from "lucide-react";
import { PWAInstallButton } from "@/components/common/PWAInstallButton";
import { StudentReportModal } from "@/components/home/StudentReportModal";
import { BillingHistoryModal } from "@/components/profile/BillingHistoryModal";
import { AchievementReportModal } from "@/components/common/AchievementReportModal";

export const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role;

  const {
    quranStats,
    personalStats,
    myClassesStats,
    language,
    theme,
    toggleTheme,
    userProfile,
    openUpgradeModal,
    logout,
    quranPages,
    books,
    items,
    chapters,
    myClasses,
    teachingClasses,
    currentStreak,
    totalActiveMaterials,
    totalMasteredMaterials,
  } = useApp();

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [isAchievementModalOpen, setIsAchievementModalOpen] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const navItems = [
    {
      path: "/dashboard",
      labelEn: "Home",
      labelId: "Beranda",
      icon: <Home className="w-5 h-5" />,
      badge: 0,
      isActive: location.pathname === "/dashboard",
    },
    {
      path: "/dashboard/alquran",
      labelEn: "Al-Quran",
      labelId: "Al-Qur'an",
      icon: <BookOpen className="w-5 h-5" />,
      badge: quranStats?.dueToday || 0,
      isActive: location.pathname.startsWith("/dashboard/alquran"),
    },
    {
      path: "/dashboard/pribadi",
      labelEn: "Books",
      labelId: "Ruang Buku",
      icon: <Library className="w-5 h-5" />,
      badge: personalStats?.dueToday || 0,
      isActive: location.pathname.startsWith("/dashboard/pribadi"),
    },
    {
      path: "/dashboard/kelas",
      labelEn: "Teaching",
      labelId: "Mengajar",
      icon: <Users className="w-5 h-5" />,
      badge: 0,
      isActive: location.pathname.startsWith("/dashboard/kelas"),
    },
    ...(userRole === "admin"
      ? [
          {
            path: "/dashboard/teacher-requests",
            labelEn: "Admin",
            labelId: "Admin",
            icon: <ShieldAlert className="w-5 h-5" />,
            badge: 0,
            isActive:
              location.pathname.startsWith("/dashboard/teacher-requests") ||
              location.pathname.startsWith("/dashboard/user-list") ||
              location.pathname.startsWith("/dashboard/book-requests"),
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-[#070A12] text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Application Bar */}
      <header className="print:hidden sticky top-0 z-40 bg-[#090D18]/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(userRole === "teacher" ? "/dashboard/kelas" : "/dashboard")}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-[#121315] border border-[#2A2B2E] flex items-center justify-center shadow-lg shadow-amber-500/10 group-hover:scale-105 transition-transform overflow-hidden relative">
                {/* Custom CSS Logo */}
                <div className="w-4 h-5 relative flex flex-col justify-between">
                  <div
                    className="absolute left-0 top-1 bottom-0 w-2 bg-gradient-to-b from-amber-300 via-amber-500 to-amber-600 rounded-sm"
                    style={{ clipPath: "polygon(0 15%, 100% 0, 100% 100%, 0 85%)" }}
                  />
                  <div
                    className="absolute right-0 top-0 bottom-1 w-2 bg-gradient-to-b from-amber-300 via-amber-500 to-amber-600 rounded-sm"
                    style={{ clipPath: "polygon(0 0, 100% 15%, 100% 85%, 0 100%)" }}
                  />
                  <div
                    className="absolute bottom-0 left-1 right-1 h-2 bg-gradient-to-r from-amber-600 to-amber-500"
                    style={{ clipPath: "polygon(0 100%, 100% 0, 100% 100%, 0 100%)" }}
                  />
                  <div
                    className="absolute top-0 left-1 right-1 h-2 bg-gradient-to-r from-amber-400 to-amber-300"
                    style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 0)" }}
                  />
                </div>
              </div>
              <div>
                <span
                  className="font-bold text-lg tracking-tight text-white uppercase"
                  style={{ fontFamily: "system-ui, sans-serif", letterSpacing: "-0.02em" }}
                >
                  Unlupa
                  <span className="text-transparent bg-clip-text bg-gradient-to-br from-amber-400 to-orange-500">
                    .id
                  </span>
                </span>
              </div>
            </button>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Adaptive Engine Active Pill */}
            <div className="hidden md:inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-[#101b33] border border-blue-500/40 text-blue-300 text-xs font-bold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>{language === "en" ? "ADAPTIVE ENGINE ACTIVE" : "MESIN ADAPTIF AKTIF"}</span>
            </div>

            <PWAInstallButton />

            {/* Quick Upgrade / Plan Indicator */}
            {userProfile?.plan === "free" ? (
              <button
                type="button"
                onClick={() =>
                  openUpgradeModal(
                    "Top Bar Navigation",
                    "Upgrade ke Unlupa Pro untuk membuka Mushaf 30 Juz, AI Builder, dan kelas tak terbatas."
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-[#2a1d0f] border border-amber-500/50 hover:border-amber-400 text-amber-300 text-xs font-black tracking-wider shadow-md shadow-amber-500/10 transition-all cursor-pointer active:scale-95"
                title="Upgrade ke Unlupa Pro"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>PRO</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsBillingModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-[#2a1d0f] border border-amber-500/50 text-amber-300 text-xs font-black tracking-wider transition-all cursor-pointer active:scale-95"
                title="Klik untuk melihat status paket Pro & riwayat invoice"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>PRO</span>
              </button>
            )}

            {/* Share Report Trigger */}
            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-[#161f30] border border-slate-700/80 hover:border-slate-600 text-xs font-bold text-slate-200 shadow-2xs transition-all cursor-pointer active:scale-95 whitespace-nowrap"
              title={language === "en" ? "Share Progress Report" : "Bagikan Rapor Progres"}
            >
              <Share2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>{language === "en" ? "Share Report" : "Bagi Rapor"}</span>
            </button>

            {/* Online / Offline Status Badge */}
            <div className="flex items-center">
              {isOnline ? (
                <div
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold bg-[#101b33] border border-blue-500/40 text-blue-300 shadow-2xs"
                  title="Aplikasi siap & tersinkronisasi"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span>Online</span>
                </div>
              ) : (
                <div
                  className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/70 shadow-2xs"
                  title="Mode Offline"
                >
                  <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Offline</span>
                </div>
              )}
            </div>

            {/* User Profile Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 px-2.5 h-8.5 rounded-full border border-slate-700/80 hover:border-slate-600 transition-all bg-[#161f30] shadow-2xs cursor-pointer active:scale-95 text-slate-200"
              >
                <img
                  src={userProfile?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256"}
                  alt={userProfile?.fullName || user?.name || "User"}
                  className="w-5.5 h-5.5 rounded-full object-cover border border-slate-600 shrink-0"
                />
                <span className="text-xs font-bold text-slate-200 hidden lg:inline max-w-[110px] truncate">
                  {userProfile?.fullName || user?.name || "Tamu / Murid"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              {showProfileMenu && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-slate-900 rounded-2xl shadow-xl border border-slate-800 p-2 z-50 text-xs animate-in fade-in zoom-in-95"
                  onMouseLeave={() => setShowProfileMenu(false)}
                >
                  <div className="px-3 py-2.5 border-b border-slate-800 bg-slate-800/40 rounded-xl mb-1">
                    <p className="font-bold text-white truncate text-sm">
                      {userProfile?.fullName || user?.name || "Tamu / Murid"}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {userProfile?.email || user?.email}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
                        {userRole === "admin" ? "Admin" : userRole === "teacher" ? "Guru / Asatidz" : "Santri / Murid"}
                      </span>
                      {currentStreak > 0 && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                          <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span>{currentStreak} Hari</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      toggleTheme();
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-800 rounded-xl flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
                      <span>{theme === "dark" ? "Mode Terang" : "Mode Gelap"}</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      setShowProfileMenu(false);
                      await logout();
                      navigate("/login");
                    }}
                    className="w-full text-left px-3 py-2 text-rose-400 hover:bg-rose-950/40 rounded-xl flex items-center gap-2 cursor-pointer mt-1"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Routed Workspace */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-5 pb-28">
        <Outlet />
      </main>

      {/* Persistent Bottom Navigation Bar (5 Space Icons) */}
      <nav
        id="bottom-app-navigation"
        className="print:hidden fixed bottom-0 left-0 right-0 z-[100] bg-[#090D18]/95 dark:bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 px-2 pt-1.5 pb-[calc(0.45rem+env(safe-area-inset-bottom,0px))] shadow-[0_-4px_25px_rgba(0,0,0,0.4)] select-none"
      >
        <div className="grid grid-cols-5 gap-1 max-w-lg md:max-w-xl lg:max-w-2xl mx-auto items-center">
          {navItems.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center py-1 sm:py-1.5 px-2 sm:px-4 rounded-2xl transition-all relative cursor-pointer active:scale-95 ${
                item.isActive
                  ? "bg-[#132244] text-blue-400 font-extrabold border border-blue-500/30 shadow-md shadow-blue-500/10"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 font-medium"
              }`}
            >
              <div className="relative">
                {item.icon}
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-2.5 min-w-[17px] h-4 px-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center shadow-md shadow-amber-500/30 leading-none">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] sm:text-[11px] mt-0.5 tracking-tight truncate max-w-full">
                {language === "en" ? item.labelEn : item.labelId}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* Shared Modals */}
      <StudentReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        userProfile={userProfile}
        quranPages={quranPages}
        quranStats={quranStats}
        books={books}
        items={items}
        chapters={chapters}
        myClasses={myClasses}
        teachingClasses={teachingClasses}
        currentStreak={currentStreak}
        totalActiveMaterials={totalActiveMaterials}
        totalMasteredMaterials={totalMasteredMaterials}
        language={language}
      />

      <BillingHistoryModal
        isOpen={isBillingModalOpen}
        onClose={() => setIsBillingModalOpen(false)}
      />

      <AchievementReportModal
        isOpen={isAchievementModalOpen}
        onClose={() => setIsAchievementModalOpen(false)}
      />
    </div>
  );
};
