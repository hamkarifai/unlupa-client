import React, { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { useApp } from "@/context/AppContext";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Books02Icon,
  Home03Icon,
  Quran02Icon,
  SecurityIcon,
  Share01Icon,
  TeachingIcon,
} from "@hugeicons/core-free-icons";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import {
  Crown,
  ChevronDown,
  LogOut,
  Moon,
  Sun,
  Flame,
  Download,
  Languages,
  Smartphone,
  CheckCircle2,
} from "@/components/foundations/hugeicons";
import { StudentReportModal } from "@/components/home/StudentReportModal";
import { BillingHistoryModal } from "@/components/profile/BillingHistoryModal";
import { AchievementReportModal } from "@/components/common/AchievementReportModal";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { CloseButton } from "@/components/base/buttons/close-button";
import { Toggle } from "@/components/base/toggle/toggle";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role;

  const {
    quranStats,
    personalStats,
    language,
    setLanguage,
    theme,
    setTheme,
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

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [isAchievementModalOpen, setIsAchievementModalOpen] = useState(false);
  const [showIOSInstallGuide, setShowIOSInstallGuide] = useState(false);
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const profileName = userProfile?.fullName || user?.name || "Tamu / Murid";
  const profileInitials = profileName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  const hasPaidPlan =
    userProfile?.plan === "premium" || userProfile?.plan === "institutional";
  const hasProAccess =
    hasPaidPlan ||
    userProfile?.role === "admin" ||
    userProfile?.role === "superadmin" ||
    userRole === "admin";

  const navItems = [
    {
      path: "/dashboard",
      labelEn: "Home",
      labelId: "Beranda",
      icon: <HugeiconsIcon icon={Home03Icon} className="size-5" />,
      badge: 0,
      isActive: location.pathname === "/dashboard",
    },
    {
      path: "/dashboard/alquran",
      labelEn: "Al-Quran",
      labelId: "Al-Qur'an",
      icon: <HugeiconsIcon icon={Quran02Icon} className="size-5" />,
      badge: quranStats?.dueToday || 0,
      isActive: location.pathname.startsWith("/dashboard/alquran"),
    },
    {
      path: "/dashboard/pribadi",
      labelEn: "Books",
      labelId: "Ruang Buku",
      icon: <HugeiconsIcon icon={Books02Icon} className="size-5" />,
      badge: personalStats?.dueToday || 0,
      isActive: location.pathname.startsWith("/dashboard/pribadi"),
    },
    {
      path: "/dashboard/kelas",
      labelEn: "Teaching",
      labelId: "Mengajar",
      icon: <HugeiconsIcon icon={TeachingIcon} className="size-5" />,
      badge: 0,
      isActive: location.pathname.startsWith("/dashboard/kelas"),
    },
    ...(userRole === "admin"
      ? [
          {
            path: "/dashboard/teacher-requests",
            labelEn: "Admin",
            labelId: "Admin",
            icon: <HugeiconsIcon icon={SecurityIcon} className="size-5" />,
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
    <div className="flex min-h-screen flex-col bg-primary font-sans text-primary transition-colors selection:bg-brand-500 selection:text-white">
      {/* Top Application Bar */}
      <header className="sticky top-0 z-40 overflow-visible border-b border-brand-200/80 bg-primary/90 shadow-[0_8px_30px_rgba(239,105,5,0.06)] backdrop-blur-xl transition-colors print:hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--color-brand-500),transparent)] opacity-70" />
        <div className="pointer-events-none absolute -top-20 left-[8%] size-36 rounded-full bg-brand-200/25 blur-3xl" />
        <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                navigate(
                  userRole === "teacher" ? "/dashboard/kelas" : "/dashboard",
                )
              }
              className="group flex cursor-pointer items-center gap-2.5 rounded-xl text-left outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              <div className="relative flex size-9 items-center justify-center overflow-hidden rounded-lg border border-brand-200 bg-white shadow-md shadow-brand-500/15 transition-transform duration-200 group-hover:-rotate-3 group-hover:scale-105 dark:bg-slate-950">
                <img
                  src="/unlupa.logo.png"
                  alt="Logo Unlupa"
                  className="size-full scale-[1.45] object-contain"
                  draggable={false}
                />
              </div>
              <div>
                <span
                  className="text-lg font-black uppercase tracking-tight text-primary"
                  style={{
                    fontFamily: "system-ui, sans-serif",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Unlupa
                  <span className="bg-gradient-to-br from-orange-500 to-brand-700 bg-clip-text text-transparent">
                    .id
                  </span>
                </span>
                <span className="hidden text-[9px] font-semibold uppercase tracking-[0.18em] text-tertiary sm:block">
                  Keep knowledge alive
                </span>
              </div>
            </button>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Share Report Trigger */}
            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="hidden h-9 cursor-pointer items-center gap-2 whitespace-nowrap rounded-xl border border-brand-200 bg-brand-50 px-3 text-xs font-bold text-brand-700 shadow-xs transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-100 hover:shadow-md active:scale-95 sm:inline-flex"
              title={
                language === "en"
                  ? "Share Progress Report"
                  : "Bagikan Rapor Progres"
              }
            >
              <HugeiconsIcon icon={Share01Icon} className="size-4" />
              <span>{language === "en" ? "Share Report" : "Bagi Rapor"}</span>
            </button>

            {/* User Profile Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowProfileMenu((isOpen) => !isOpen)}
                className={`flex h-10 items-center rounded-xl border shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-95 ${hasProAccess ? "gap-2 border-brand-300 bg-[linear-gradient(135deg,var(--color-brand-50),var(--color-brand-100))] py-1 pl-1.5 pr-2.5 shadow-brand-500/10 hover:border-brand-400" : "gap-2 border-secondary bg-primary px-2 hover:border-brand-200 hover:bg-primary_hover"}`}
                aria-expanded={showProfileMenu}
              >
                <span
                  className={`inline-flex shrink-0 rounded-lg ${hasProAccess ? "ring-2 ring-brand-500 ring-offset-1 ring-offset-brand-50" : ""}`}
                >
                  <Avatar
                    size="xs"
                    src={userProfile?.avatarUrl}
                    alt={profileName}
                    initials={profileInitials}
                    border
                  />
                </span>
                <span
                  className={`hidden max-w-[120px] truncate text-sm font-semibold xl:inline ${hasProAccess ? "text-brand-900" : "text-primary"}`}
                >
                  {profileName}
                </span>
                {hasProAccess && (
                  <>
                    <Crown className="size-3.5 fill-brand-600 text-brand-600 sm:hidden" />
                    <span className="hidden rounded-full bg-brand-solid px-1.5 py-0.5 text-[9px] font-black tracking-wider text-white shadow-xs sm:inline">
                      PRO
                    </span>
                  </>
                )}
                <ChevronDown
                  className={`size-3.5 shrink-0 ${hasProAccess ? "text-brand-700" : "text-fg-quaternary"}`}
                />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 max-h-[calc(100dvh-4.5rem)] w-[min(22rem,calc(100vw-1rem))] origin-top-right space-y-2 overflow-y-auto rounded-3xl border border-secondary bg-primary p-2 text-xs text-secondary shadow-xl animate-in fade-in zoom-in-95">
                  <section className="rounded-2xl bg-secondary/50 p-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        size="md"
                        src={userProfile?.avatarUrl}
                        alt={profileName}
                        initials={profileInitials}
                        border
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-primary">
                          {profileName}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-secondary">
                          {userProfile?.email || user?.email}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <Badge color="gray" size="sm">
                            {userRole === "admin"
                              ? "Admin"
                              : userRole === "teacher"
                                ? language === "en"
                                  ? "Teacher"
                                  : "Guru / Asatidz"
                                : language === "en"
                                  ? "Student"
                                  : "Santri / Murid"}
                          </Badge>
                          {currentStreak > 0 && (
                            <Badge color="warning" size="sm" className="gap-1">
                              <Flame className="size-3 fill-current" />
                              {currentStreak}{" "}
                              {language === "en" ? "days" : "hari"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>

                  <section
                    className={`relative overflow-hidden rounded-2xl border ${hasProAccess ? "border-[#f59e0b]/50 p-4 shadow-lg shadow-[#ef6905]/15" : "border-secondary bg-primary p-3"}`}
                    style={
                      hasProAccess
                        ? {
                            background:
                              "radial-gradient(circle at 100% 0%, rgba(239,105,5,0.35), transparent 45%), linear-gradient(135deg, #26170c 0%, #130d09 100%)",
                          }
                        : undefined
                    }
                  >
                    {hasProAccess && (
                      <div className="pointer-events-none absolute -right-8 -top-10 size-28 rounded-full border border-white/10" />
                    )}
                    <div className="relative flex items-start gap-3">
                      <div
                        className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${hasProAccess ? "bg-[#ef6905] text-white shadow-md shadow-[#ef6905]/30" : "bg-brand-50 text-brand-700"}`}
                      >
                        <Crown className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={`text-sm font-semibold ${hasProAccess ? "text-white" : "text-primary"}`}
                          >
                            {hasProAccess
                              ? "Unlupa Pro"
                              : language === "en"
                                ? "Free plan"
                                : "Paket gratis"}
                          </p>
                          {hasProAccess ? (
                            <span className="rounded-full border border-[#fbbf24]/70 bg-[#ef6905] px-2.5 py-0.5 text-[10px] font-black tracking-wider text-white shadow-sm shadow-black/20">
                              PRO
                            </span>
                          ) : (
                            <Badge color="gray" size="sm">
                              FREE
                            </Badge>
                          )}
                        </div>
                        <p
                          className={`mt-1 text-xs leading-relaxed ${hasProAccess ? "text-[#fed7aa]" : "text-secondary"}`}
                        >
                          {hasProAccess
                            ? language === "en"
                              ? "Full feature access is active on this account."
                              : "Akses penuh fitur aktif pada akun ini."
                            : language === "en"
                              ? "Upgrade for full Quran, AI, and teaching access."
                              : "Upgrade untuk akses penuh Quran, AI, dan fitur mengajar."}
                        </p>
                      </div>
                    </div>

                    {!hasProAccess ? (
                      <Button
                        size="sm"
                        iconLeading={Crown}
                        onPress={() => {
                          setShowProfileMenu(false);
                          openUpgradeModal(
                            "Profile Dropdown",
                            "Upgrade ke Unlupa Pro untuk membuka Mushaf 30 Juz, AI Builder, dan kelas tak terbatas.",
                          );
                        }}
                        className="mt-3 w-full"
                      >
                        {language === "en"
                          ? "Upgrade to Pro"
                          : "Upgrade ke Pro"}
                      </Button>
                    ) : hasPaidPlan ? (
                      <Button
                        size="sm"
                        color="secondary"
                        onPress={() => {
                          setShowProfileMenu(false);
                          setIsBillingModalOpen(true);
                        }}
                        className="relative mt-3 w-full bg-white/10 text-white ring-white/20 hover:bg-white/15 hover:text-white"
                      >
                        {language === "en"
                          ? "Manage subscription"
                          : "Kelola langganan"}
                      </Button>
                    ) : (
                      <div className="relative mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/8 px-3 py-2.5 text-xs font-medium text-[#fde68a]">
                        <CheckCircle2 className="size-4 text-[#fbbf24]" />
                        {language === "en"
                          ? "Pro access via account role"
                          : "Akses Pro melalui peran akun"}
                      </div>
                    )}
                  </section>

                  {!isInstalled && (isInstallable || isIOS) && (
                    <section className="flex items-center gap-3 rounded-2xl border border-secondary bg-primary p-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                        <Smartphone className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-primary">
                          {language === "en"
                            ? "Install Unlupa"
                            : "Instal Unlupa"}
                        </p>
                        <p className="mt-0.5 text-xs text-secondary">
                          {language === "en"
                            ? "Faster access from your device."
                            : "Akses lebih cepat dari perangkatmu."}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        color="secondary"
                        iconLeading={Download}
                        onPress={async () => {
                          if (isIOS && !isInstallable) {
                            setShowProfileMenu(false);
                            setShowIOSInstallGuide(true);
                            return;
                          }
                          const installed = await install();
                          if (installed) setShowProfileMenu(false);
                        }}
                      >
                        {language === "en" ? "Install" : "Instal"}
                      </Button>
                    </section>
                  )}

                  <section className="overflow-hidden rounded-2xl border border-secondary bg-primary">
                    <div className="flex items-center gap-3 border-b border-secondary p-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-fg-quaternary">
                        {theme === "dark" ? (
                          <Moon className="size-4.5" />
                        ) : (
                          <Sun className="size-4.5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-primary">
                          {language === "en" ? "Dark theme" : "Tema gelap"}
                        </p>
                        <p className="text-xs text-secondary">
                          {theme === "dark"
                            ? language === "en"
                              ? "Enabled"
                              : "Aktif"
                            : language === "en"
                              ? "Disabled"
                              : "Nonaktif"}
                        </p>
                      </div>
                      <Toggle
                        size="md"
                        aria-label={
                          language === "en"
                            ? "Toggle dark theme"
                            : "Ubah tema gelap"
                        }
                        isSelected={theme === "dark"}
                        onChange={(isSelected) =>
                          setTheme(isSelected ? "dark" : "light")
                        }
                      />
                    </div>

                    <div className="flex items-center gap-3 p-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-fg-quaternary">
                        <Languages className="size-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-primary">
                          {language === "en" ? "Language" : "Bahasa"}
                        </p>
                        <p className="text-xs text-secondary">
                          {language === "en" ? "English" : "Indonesia"}
                        </p>
                      </div>
                      <span className="text-[10px] font-semibold text-tertiary">
                        ID
                      </span>
                      <Toggle
                        size="md"
                        aria-label={
                          language === "en"
                            ? "Switch to Indonesian"
                            : "Ganti ke bahasa Inggris"
                        }
                        isSelected={language === "en"}
                        onChange={(isEnglish) =>
                          setLanguage(isEnglish ? "en" : "id")
                        }
                      />
                      <span className="text-[10px] font-semibold text-tertiary">
                        EN
                      </span>
                    </div>
                  </section>

                  <Button
                    size="md"
                    color="tertiary-destructive"
                    iconLeading={LogOut}
                    onPress={async () => {
                      setShowProfileMenu(false);
                      await logout();
                      navigate("/login");
                    }}
                    className="w-full justify-start"
                  >
                    {language === "en" ? "Sign out" : "Keluar"}
                  </Button>
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

      {/* Mobile workspace navigation */}
      <nav
        id="bottom-app-navigation"
        aria-label={language === "en" ? "Main navigation" : "Navigasi utama"}
        className="fixed inset-x-0 bottom-0 z-[100] border-t border-secondary bg-primary/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl print:hidden"
      >
        <div
          className={`mx-auto grid w-full max-w-lg items-center gap-1 ${
            navItems.length > 4 ? "grid-cols-5" : "grid-cols-4"
          }`}
        >
          {navItems.map((item) => {
            const label = language === "en" ? item.labelEn : item.labelId;

            return (
              <button
                key={item.path}
                type="button"
                aria-label={label}
                aria-current={item.isActive ? "page" : undefined}
                title={label}
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate(item.path);
                }}
                className={`relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-center transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring active:scale-95 ${
                  item.isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-tertiary hover:bg-primary_hover hover:text-secondary"
                }`}
              >
                {item.icon}
                <span className="max-w-full truncate text-[11px] font-semibold leading-none">
                  {label}
                </span>
                {item.badge > 0 && (
                  <span className="absolute right-2 top-1 flex min-w-4.5 items-center justify-center rounded-full bg-brand-solid px-1 text-[9px] font-bold leading-4 text-white shadow-xs ring-2 ring-brand-50">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </button>
            );
          })}
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

      {showIOSInstallGuide && (
        <div className="fixed inset-0 z-[400] flex items-end justify-center sm:items-center sm:p-4">
          <button
            type="button"
            aria-label={
              language === "en"
                ? "Close installation guide"
                : "Tutup panduan instalasi"
            }
            onClick={() => setShowIOSInstallGuide(false)}
            className="absolute inset-0 bg-overlay/70 backdrop-blur-sm"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-sm rounded-t-3xl border border-secondary bg-primary p-5 shadow-2xl sm:rounded-3xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <Smartphone className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-primary">
                    {language === "en"
                      ? "Install on iPhone or iPad"
                      : "Instal di iPhone atau iPad"}
                  </h2>
                  <p className="mt-0.5 text-sm text-secondary">
                    {language === "en"
                      ? "Add Unlupa to your Home Screen."
                      : "Tambahkan Unlupa ke Layar Utama."}
                  </p>
                </div>
              </div>
              <CloseButton
                slot={null}
                size="sm"
                onPress={() => setShowIOSInstallGuide(false)}
                label="Close installation guide"
              />
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex gap-3 rounded-2xl bg-secondary/50 p-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-brand-700 shadow-xs">
                  1
                </span>
                <p className="pt-1.5 text-sm text-secondary">
                  {language === "en"
                    ? "Tap Share in the Safari toolbar."
                    : "Ketuk Bagikan pada toolbar Safari."}
                </p>
              </div>
              <div className="flex gap-3 rounded-2xl bg-secondary/50 p-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-brand-700 shadow-xs">
                  2
                </span>
                <p className="pt-1.5 text-sm text-secondary">
                  {language === "en"
                    ? "Choose Add to Home Screen."
                    : "Pilih Tambahkan ke Layar Utama."}
                </p>
              </div>
            </div>

            <Button
              size="lg"
              onPress={() => setShowIOSInstallGuide(false)}
              className="mt-5 w-full"
            >
              {language === "en" ? "Understood" : "Mengerti"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
