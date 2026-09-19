/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { Navigation } from './components/Navigation';
import { QuranSpace } from './components/quran/QuranSpace';
import { PersonalSpace } from './components/personal/PersonalSpace';
import { TeachingSpace } from './components/classes/TeachingSpace';
import { AdminSpace } from './components/admin/AdminSpace';
import { HomeSpace } from './components/home/HomeSpace';
import { LandingPage } from './components/landing/LandingPage';
import { ProfessionalWalkthroughModal } from './components/onboarding/ProfessionalWalkthroughModal';
import { OnboardingSettingsModal } from './components/profile/OnboardingSettingsModal';
import { PublicReportViewer } from './components/classes/PublicReportViewer';
import { useDailyReminder } from './hooks/useDailyReminder';
import { AuthModal } from './components/auth/AuthModal';
import { RotateCcw, AlertCircle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AppErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  props: ErrorBoundaryProps;
  state: ErrorBoundaryState = { hasError: false, error: null };

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  componentDidMount() {
    try {
      // Validate and sanitize localStorage keys to prevent blank screens
      const keysToCheck = ['unlupa_user_profile_v1', 'unlupa_system_transactions_v1', 'unlupa_books_v3'];
      keysToCheck.forEach(key => {
        const val = localStorage.getItem(key);
        if (val) {
          JSON.parse(val);
        }
      });
    } catch (e) {
      console.warn('Corrupted localStorage detected, resetting cache...', e);
      try {
        localStorage.clear();
        localStorage.setItem('unlupa_active_space_v2', 'dashboard');
      } catch (err) { /* ignore */ }
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Uncaught Error:', error, errorInfo);
  }

  handleReload = () => {
    try {
      localStorage.setItem('unlupa_active_space_v2', 'dashboard');
    } catch (e) { /* ignore */ }
    window.location.reload();
  };

  handleResetState = () => {
    try {
      localStorage.clear();
      localStorage.setItem('unlupa_active_space_v2', 'dashboard');
    } catch (e) { /* ignore */ }
    window.location.href = window.location.pathname;
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Memuat Ulang Aplikasi</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Terjadi kendala saat memuat antarmuka. Silakan klik tombol di bawah untuk menyegarkan tampilan.
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={this.handleReload}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Segarkan Aplikasi</span>
              </button>
              <button
                onClick={this.handleResetState}
                className="w-full py-2 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium transition-colors cursor-pointer"
              >
                Kembali ke Beranda Utama
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const MainContent: React.FC = () => {
  const { 
    activeSpace,
    quranStats,
    personalStats, 
    isLandingPageOpen, 
    setIsLandingPageOpen,
    isWalkthroughOpen,
    closePageWalkthrough,
    activeWalkthroughPage,
    openPageWalkthrough,
    isOnboardingSettingsOpen,
    setIsOnboardingSettingsOpen,
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode
  } = useApp();

  // Route to the Public Report Viewer if the URL has the ?report parameter
  useDailyReminder(quranStats, personalStats);

  const hasReportQuery = new URLSearchParams(window.location.search).has('report');
  if (hasReportQuery) {
    return <PublicReportViewer />;
  }

  if (isLandingPageOpen) {
    return (
      <>
        <LandingPage />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialMode={authModalMode}
          onSuccess={() => setIsLandingPageOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white transition-colors duration-200">
      <OfflineIndicator />
      {/* Navigation Header & Mobile Nav */}
      <Navigation />

      {/* Main Workspace View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-28">
        {activeSpace === 'dashboard' && <HomeSpace />}
        {activeSpace === 'quran' && <QuranSpace />}
        {activeSpace === 'personal' && <PersonalSpace />}
        {activeSpace === 'teaching' && <TeachingSpace />}
        {activeSpace === 'admin' && <AdminSpace />}
        {!['dashboard', 'quran', 'personal', 'teaching', 'admin'].includes(activeSpace) && <HomeSpace />}
      </main>

      {/* Professional Per-Page Walkthrough Modal */}
      <ProfessionalWalkthroughModal
        isOpen={isWalkthroughOpen}
        onClose={closePageWalkthrough}
        initialPageKey={activeWalkthroughPage}
      />

      {/* Per-Page Onboarding Settings Modal */}
      <OnboardingSettingsModal
        isOpen={isOnboardingSettingsOpen}
        onClose={() => setIsOnboardingSettingsOpen(false)}
        onLaunchWalkthrough={(pageKey) => {
          openPageWalkthrough(pageKey);
        }}
      />

      {/* Authentication & Security Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        onSuccess={() => setIsLandingPageOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppErrorBoundary>
      <AppProvider>
        <MainContent />
      </AppProvider>
    </AppErrorBoundary>
  );
}
