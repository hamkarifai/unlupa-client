import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AppSpace, OnboardingPageKey } from '../types';
import { downloadDatabaseBackup, restoreDatabaseBackup } from '../lib/offlineStorage';
import { 
  Home,
  BookOpen, 
  Library, 
  GraduationCap, 
  Users, 
  Sparkles, 
  Crown,
  Receipt,
  Globe, 
  Sun,
  Moon,
  RotateCcw,
  ExternalLink,
  ChevronDown,
  Info,
  Wifi,
  WifiOff,
  Download,
  Upload,
  CalendarDays,
  HardDrive, User as UserIcon, Settings, Shield, LogOut, Bell, Share2, Flame, Sliders, HelpCircle } from 'lucide-react';
import { requestNotificationPermission } from '../lib/notifications';
import { QuranAttendanceModal } from './attendance/QuranAttendanceModal';
import { StudentReportModal } from './home/StudentReportModal';
import { PWAInstallButton } from './common/PWAInstallButton';
import { AchievementReportModal } from './common/AchievementReportModal';
import { BillingHistoryModal } from './profile/BillingHistoryModal';
import { Award, ShieldAlert } from 'lucide-react';

export const Navigation: React.FC = () => {
  const { 
    activeSpace, 
    setActiveSpace, 
    resetSpaceToRoot,
    language, 
    setLanguage, 
    theme,
    toggleTheme,
    quranPages,
    quranStats, 
    personalStats,
    myClassesStats,
    books,
    chapters,
    items,
    myClasses,
    teachingClasses,
    currentStreak,
    totalActiveMaterials,
    totalMasteredMaterials,
    isLandingPageOpen,
    setIsLandingPageOpen,
    setIsOnboardingOpen,
    isOnboardingEnabled,
    setIsOnboardingEnabled,
    openPageWalkthrough,
    setIsOnboardingSettingsOpen,
    resetToDefaults,
    userProfile,
    currentUser,
    openLoginModal,
    openUpgradeModal,
    logout
  } = useApp();

  const handleSelectSpace = (space: AppSpace) => {
    setIsLandingPageOpen(false);
    if (activeSpace === space) {
      resetSpaceToRoot(space);
    } else {
      setActiveSpace(space);
      resetSpaceToRoot(space);
    }
  };

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAchievementModalOpen, setIsAchievementModalOpen] = useState(false);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  // currentStreak removed as it is now in useApp() destructuring above

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRestoreClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const ok = await restoreDatabaseBackup(file);
      if (ok) {
        alert(language === 'en' ? 'Data restored successfully! Refreshing app...' : 'Data berhasil dipulihkan! Memuat ulang aplikasi...');
        window.location.reload();
      } else {
        alert(language === 'en' ? 'Failed to restore backup file.' : 'Gagal memulihkan file cadangan.');
      }
    };
    input.click();
  };

  const totalDueAll = quranStats.dueToday + personalStats.dueToday + myClassesStats.dueToday;

  const navItems: { space: AppSpace; labelEn: string; labelId: string; labelAr: string; icon: React.ReactNode; badge: number }[] = [
    { 
      space: 'dashboard', 
      labelEn: 'Home',
      labelId: 'Beranda',
      labelAr: 'الرئيسية', 
      icon: <Home className="w-5 h-5" />, 
      badge: 0 
    },
    { 
      space: 'quran', 
      labelEn: 'Al-Quran',
      labelId: 'Al-Qur\'an',
      labelAr: 'القرآن', 
      icon: <BookOpen className="w-5 h-5" />, 
      badge: quranStats.dueToday 
    },
    { 
      space: 'personal', 
      labelEn: 'Books',
      labelId: 'Ruang Buku',
      labelAr: 'الكتب', 
      icon: <Library className="w-5 h-5" />, 
      badge: personalStats.dueToday 
    },
    { 
      space: 'teaching', 
      labelEn: 'Teaching',
      labelId: 'Mengajar',
      labelAr: 'تدريس', 
      icon: <Users className="w-5 h-5" />, 
      badge: 0 
    },
    { 
      space: 'admin', 
      labelEn: 'Admin',
      labelId: 'Admin',
      labelAr: 'المشرف', 
      icon: <ShieldAlert className="w-5 h-5" />, 
      badge: 0 
    }
  ];

  return (
    <>
      {/* Top Application Bar */}
      {activeSpace === 'dashboard' && (
        <header className="print:hidden sticky top-0 z-40 bg-[#090D18]/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            {/* Logo & Brand (Exclusive to Beranda / Home) */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsLandingPageOpen(false)}
                className="flex items-center gap-2.5 text-left group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-[#121315] border border-[#2A2B2E] flex items-center justify-center shadow-lg shadow-amber-500/10 group-hover:scale-105 transition-transform overflow-hidden relative">
                  {/* Custom CSS Logo */}
                  <div className="w-4 h-5 relative flex flex-col justify-between">
                    {/* Left pillar */}
                    <div className="absolute left-0 top-1 bottom-0 w-2 bg-gradient-to-b from-amber-300 via-amber-500 to-amber-600 rounded-sm" style={{ clipPath: 'polygon(0 15%, 100% 0, 100% 100%, 0 85%)' }}></div>
                    {/* Right pillar */}
                    <div className="absolute right-0 top-0 bottom-1 w-2 bg-gradient-to-b from-amber-300 via-amber-500 to-amber-600 rounded-sm" style={{ clipPath: 'polygon(0 0, 100% 15%, 100% 85%, 0 100%)' }}></div>
                    {/* Bottom connector */}
                    <div className="absolute bottom-0 left-1 right-1 h-2 bg-gradient-to-r from-amber-600 to-amber-500" style={{ clipPath: 'polygon(0 100%, 100% 0, 100% 100%, 0 100%)' }}></div>
                    {/* Top connector */}
                    <div className="absolute top-0 left-1 right-1 h-2 bg-gradient-to-r from-amber-400 to-amber-300" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 0)' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-lg tracking-tight text-white uppercase" style={{ fontFamily: 'system-ui, sans-serif', letterSpacing: '-0.02em' }}>
                      Unlupa<span className="text-transparent bg-clip-text bg-gradient-to-br from-amber-400 to-orange-500">.id</span>
                    </span>
                  </div>
                </div>
              </button>
            </div>

            {/* Right Action Tools (Exclusive to Beranda / Home) */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Adaptive Engine Active Pill */}
              <div className="hidden md:inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-[#101b33] border border-blue-500/40 text-blue-300 text-xs font-bold shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>{language === 'en' ? 'ADAPTIVE ENGINE ACTIVE' : 'MESIN ADAPTIF AKTIF'}</span>
              </div>

              <PWAInstallButton />

              {/* Quick Upgrade / Plan Indicator */}
              {userProfile.plan === 'free' ? (
                <button
                  onClick={() => openUpgradeModal('Top Bar Navigation', 'Upgrade ke Unlupa Pro untuk membuka Mushaf 30 Juz, AI Builder, dan kelas tak terbatas.')}
                  className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-[#2a1d0f] border border-amber-500/50 hover:border-amber-400 text-amber-300 text-xs font-black tracking-wider shadow-md shadow-amber-500/10 transition-all cursor-pointer active:scale-95"
                  title="Upgrade ke Unlupa Pro"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>PRO</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsBillingModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-[#2a1d0f] border border-amber-500/50 text-amber-300 text-xs font-black tracking-wider transition-all cursor-pointer active:scale-95"
                  title="Klik untuk melihat status paket Pro & riwayat invoice"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>PRO</span>
                </button>
              )}

              {/* Share Report Trigger (Top Level Access) */}
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-[#161f30] border border-slate-700/80 hover:border-slate-600 text-xs font-bold text-slate-200 shadow-2xs transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                title={language === 'en' ? 'Share Progress Report' : 'Bagikan Rapor Progres'}
              >
                <Share2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>{language === 'en' ? 'Share Report' : 'Bagi Rapor'}</span>
              </button>

              {/* Online / Offline Status Badge */}
              <div className="flex items-center">
                {isOnline ? (
                  <div 
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold bg-[#101b33] border border-blue-500/40 text-blue-300 shadow-2xs"
                    title="Aplikasi siap & tersinkronisasi"
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    <span>Online</span>
                  </div>
                ) : (
                  <div 
                    className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/70 shadow-2xs"
                    title="Mode Offline: Akses Al-Quran & Murajaah tetap berfungsi tanpa internet"
                  >
                    <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Offline</span>
                  </div>
                )}
              </div>

              {/* User Profile Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 px-2.5 h-8.5 rounded-full border border-slate-700/80 hover:border-slate-600 transition-all bg-[#161f30] shadow-2xs cursor-pointer active:scale-95 text-slate-200"
                >
                  <img
                    src={userProfile.avatarUrl}
                    alt={userProfile.fullName}
                    className="w-5.5 h-5.5 rounded-full object-cover border border-slate-600 shrink-0"
                  />
                  <span className="text-xs font-bold text-slate-200 hidden lg:inline max-w-[110px] truncate">
                    {userProfile.fullName || 'Tamu / Murid'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>

                {showProfileMenu && (
                  <div 
                    className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-2 z-50 text-xs animate-in fade-in zoom-in-95"
                    onMouseLeave={() => setShowProfileMenu(false)}
                  >
                    <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                      <div className="flex items-center gap-3 mb-2">
                        <img
                          src={userProfile.avatarUrl}
                          alt={userProfile.fullName}
                          className="w-10 h-10 rounded-xl object-cover border-2 border-white dark:border-slate-700 shadow-sm"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate text-sm">{userProfile.fullName}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{userProfile.email}</p>
                        </div>
                      </div>
                      
                      {/* Subscription Plan Badge & 1-Click Upgrade CTA */}
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status Paket</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                            userProfile.plan === 'premium' || userProfile.plan === 'institutional'
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}>
                            {userProfile.plan === 'premium' || userProfile.plan === 'institutional' ? (
                              <Crown className="w-3 h-3" />
                            ) : (
                              <Sparkles className="w-3 h-3 text-slate-400" />
                            )}
                            <span>{userProfile.plan.toUpperCase()}</span>
                          </span>
                        </div>
                        
                        {userProfile.plan === 'free' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setShowProfileMenu(false);
                              openUpgradeModal('Profile Dropdown', 'Buka seluruh modul hafalan, AI Builder, dan kelas tak terbatas.');
                            }}
                            className="w-full py-1.5 px-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-[11px] flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95 transition-all"
                          >
                            <Crown className="w-3 h-3" />
                            <span>Upgrade ke Unlupa Pro</span>
                          </button>
                        ) : (
                          <div className="flex items-center justify-between text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold pt-0.5">
                            <span>Akses Unlimited Aktif</span>
                            <button
                              type="button"
                              onClick={() => {
                                setShowProfileMenu(false);
                                setIsBillingModalOpen(true);
                              }}
                              className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                            >
                              Kelola
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                          {language === 'en' ? 'Adaptive Engine Active' : 'Mesin Adaptif Aktif'}
                        </span>
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-200 border border-amber-200/60 dark:border-amber-800/60">
                          <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>{currentStreak} Hari</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Tools moved into Profile Menu */}
                    <div className="py-1.5 border-b border-slate-100 dark:border-slate-800 px-2 space-y-1">
                      <button
                        onClick={toggleTheme}
                        className="w-full text-left px-2 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
                          <span>{language === 'en' ? 'Dark Mode' : 'Mode Gelap'}</span>
                        </div>
                        <div className={`w-8 h-4 rounded-full p-0.5 flex items-center transition-colors ${theme === 'dark' ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                          <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0'}`}></div>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => setLanguage(language === 'en' ? 'id' : language === 'id' ? 'ar' : 'en')}
                        className="w-full text-left px-2 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                      >
                        <Globe className="w-4 h-4 text-slate-500" />
                        <span>{language === 'en' ? 'Language: English' : language === 'id' ? 'Bahasa: Indonesia' : 'اللغة: العربية'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsLandingPageOpen(!isLandingPageOpen);
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left px-2 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                      >
                        <ExternalLink className="w-4 h-4 text-slate-500" />
                        <span>{isLandingPageOpen ? (language === 'en' ? 'Back to App' : 'Kembali ke App') : (language === 'en' ? 'Landing Page' : 'Halaman Depan')}</span>
                      </button>
                    </div>

                    <div className="py-1 border-b border-slate-100 dark:border-slate-800">
                      {/* Billing & Invoices shortcut */}
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          setIsBillingModalOpen(true);
                        }}
                        className="w-full text-left px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between group cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          <span>{language === 'en' ? 'Billing & Invoices' : 'Langganan & Invoice'}</span>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100 transition-colors">
                          {userProfile.plan.toUpperCase()}
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          setShowAttendanceModal(true);
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between group cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <CalendarDays className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <span>{language === 'en' ? 'Attendance History' : 'Riwayat Kehadiran'}</span>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 group-hover:bg-purple-100 transition-colors">
                          {language === 'en' ? 'View' : 'Lihat'}
                        </span>
                      </button>
                      <button 
                        onClick={() => {
                          setShowProfileMenu(false);
                          setIsAchievementModalOpen(true);
                        }}
                        className="w-full text-left px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                      >
                        <Award className="w-4 h-4 text-slate-400" />
                        <span>{language === 'en' ? 'Certificate & Report' : 'Cetak Sertifikat & Rapor'}</span>
                      </button>
                      <button 
                        onClick={async () => {
                          const granted = await requestNotificationPermission();
                          if (granted) {
                            alert(language === 'en' ? 'Notifications enabled!' : 'Notifikasi diaktifkan!');
                          } else {
                            alert(language === 'en' ? 'Notification permission denied.' : 'Izin notifikasi ditolak.');
                          }
                        }}
                        className="w-full text-left px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between group cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
                          <span>{language === 'en' ? 'Notifications' : 'Notifikasi Pengingat'}</span>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">
                          {language === 'en' ? 'Enable' : 'Aktifkan'}
                        </span>
                      </button>
                      {/* Onboarding Master Control in Profile Menu */}
                      <div className="pt-1.5 pb-1 border-t border-slate-100 dark:border-slate-800">
                        {/* Status Toggle Switch: Aktif / Nonaktif */}
                        <button
                          type="button"
                          onClick={() => {
                            const nextState = !isOnboardingEnabled;
                            setIsOnboardingEnabled(nextState);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer group transition-colors"
                          title={isOnboardingEnabled ? (language === 'en' ? 'Click to disable onboarding' : 'Klik untuk menonaktifkan onboarding') : (language === 'en' ? 'Click to enable onboarding' : 'Klik untuk mengaktifkan onboarding')}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`p-1.5 rounded-lg transition-colors ${
                              isOnboardingEnabled 
                                ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400' 
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                            }`}>
                              <Sparkles className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 dark:text-slate-200 text-xs leading-none">
                                {language === 'en' ? 'Onboarding' : 'Onboarding'}
                              </p>
                              <p className={`text-[10px] font-semibold mt-1 ${
                                isOnboardingEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                              }`}>
                                {isOnboardingEnabled 
                                  ? (language === 'en' ? '● Active / On' : '● Aktif') 
                                  : (language === 'en' ? '○ Disabled / Off' : '○ Nonaktif')}
                              </p>
                            </div>
                          </div>
                          
                          {/* Toggle Switch */}
                          <div className={`w-9 h-5 rounded-full p-0.5 flex items-center transition-colors duration-200 ${
                            isOnboardingEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                          }`}>
                            <div className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                              isOnboardingEnabled ? 'translate-x-4' : 'translate-x-0'
                            }`} />
                          </div>
                        </button>

                        {/* Direct Replay/Start Guide when user forgot or needs it */}
                        <button 
                          type="button"
                          onClick={() => {
                            setShowProfileMenu(false);
                            const pageMap: Record<string, OnboardingPageKey> = {
                              dashboard: 'home',
                              quran: 'quran',
                              personal: 'personal',
                              classes: 'teaching',
                              teaching: 'teaching',
                              admin: 'home',
                            };
                            if (!isOnboardingEnabled) {
                              setIsOnboardingEnabled(true);
                            }
                            openPageWalkthrough(pageMap[activeSpace] || 'home');
                          }}
                          className="w-full text-left px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between group cursor-pointer text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
                            <span>{language === 'en' ? 'Open Guide Now' : 'Buka Panduan (Lupa / Butuh)'}</span>
                          </div>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 transition-colors">
                            {language === 'en' ? 'Open' : 'Buka'}
                          </span>
                        </button>

                        {/* Optional detail config */}
                        <button 
                          type="button"
                          onClick={() => {
                            setShowProfileMenu(false);
                            setIsOnboardingSettingsOpen(true);
                          }}
                          className="w-full text-left px-3 py-1 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer text-[11px]"
                        >
                          <Sliders className="w-3.5 h-3.5 text-slate-400" />
                          <span>{language === 'en' ? 'Configure per page...' : 'Atur per halaman...'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="py-1">
                      {currentUser ? (
                        <button
                          onClick={async () => {
                            setShowProfileMenu(false);
                            await logout();
                          }}
                          className="w-full text-left px-3 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>{language === 'en' ? 'Sign Out' : language === 'id' ? 'Keluar' : 'تسجيل الخروج'}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            openLoginModal();
                          }}
                          className="w-full text-left px-3 py-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 font-bold flex items-center gap-2 cursor-pointer"
                        >
                          <UserIcon className="w-4 h-4" />
                          <span>{language === 'en' ? 'Sign In with Gmail' : 'Masuk dengan Gmail'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Persistent Bottom Navigation Bar (5 Space Icons - Locked in All Orientations & Viewports) */}
      <nav 
        id="bottom-app-navigation"
        className="print:hidden fixed bottom-0 left-0 right-0 z-[100] bg-[#090D18]/95 dark:bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 px-2 pt-1.5 pb-[calc(0.45rem+env(safe-area-inset-bottom,0px))] shadow-[0_-4px_25px_rgba(0,0,0,0.4)] select-none transition-all"
      >
        <div className="grid grid-cols-5 gap-1 max-w-lg md:max-w-xl lg:max-w-2xl mx-auto items-center">
          {navItems.map(item => {
            const isActive = activeSpace === item.space && !isLandingPageOpen;
            return (
              <button
                key={item.space}
                onClick={() => handleSelectSpace(item.space)}
                className={`flex flex-col items-center justify-center py-1 sm:py-1.5 px-2 sm:px-4 rounded-2xl transition-all relative cursor-pointer active:scale-95 ${
                  isActive
                    ? 'bg-[#132244] text-blue-400 font-extrabold border border-blue-500/30 shadow-md shadow-blue-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 font-medium'
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
                  {language === 'en' ? item.labelEn : language === 'id' ? item.labelId : item.labelAr}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Quran Attendance History Modal */}
      <QuranAttendanceModal
        isOpen={showAttendanceModal}
        onClose={() => setShowAttendanceModal(false)}
        language={language}
      />

      {/* Achievement Report Modal */}
      <AchievementReportModal
        isOpen={isAchievementModalOpen}
        onClose={() => setIsAchievementModalOpen(false)}
      />

      {/* Billing & Transactions Modal */}
      <BillingHistoryModal
        isOpen={isBillingModalOpen}
        onClose={() => setIsBillingModalOpen(false)}
      />

      {/* Student Report Modal */}
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
    </>
  );
};
