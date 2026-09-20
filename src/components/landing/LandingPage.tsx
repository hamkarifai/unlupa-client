import React from 'react';
import { useApp } from '../../context/AppContext';
import { AppSpace } from '../../types';
import { 
  Sparkles, 
  BookOpen, 
  Library, 
  GraduationCap, 
  Users, 
  CheckCircle2, 
  ArrowRight, 
  TrendingUp, 
  Clock, 
  ShieldCheck, 
  Globe, 
  ChevronRight,
  Star,
  LogIn,
  Lock,
  Smartphone,
  KeyRound,
  ShieldAlert
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { 
    setIsLandingPageOpen, 
    setActiveSpace, 
    language, 
    setLanguage,
    openLoginModal,
    openRegisterModal,
    currentUser,
    userProfile,
    logout
  } = useApp();

  const handleEnterApp = (space: AppSpace = 'quran') => {
    setActiveSpace(space);
    setIsLandingPageOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 selection:bg-amber-500 selection:text-white pb-16">
      {/* 1. Header */}
      <header className="border-b border-slate-200/70 bg-white/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">
              Unlupa<span className="text-transparent bg-clip-text bg-gradient-to-br from-amber-400 to-orange-500">.id</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#features" className="hover:text-amber-600 transition-colors">Features</a>
            <a href="#security" className="hover:text-amber-600 transition-colors">Keamanan</a>
            <a href="#solution" className="hover:text-amber-600 transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-amber-600 transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              onClick={() => setLanguage(language === 'en' ? 'id' : language === 'id' ? 'ar' : 'en')}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>{language.toUpperCase()}</span>
            </button>

            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEnterApp('dashboard')}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <img
                    src={userProfile.avatarUrl}
                    alt={userProfile.fullName}
                    className="w-4 h-4 rounded-full object-cover"
                  />
                  <span>{language === 'en' ? 'Dashboard' : 'Buka App'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={openLoginModal}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl text-slate-700 hover:text-amber-600 hover:bg-amber-50/60 border border-slate-200/80 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <LogIn className="w-3.5 h-3.5 text-amber-600" />
                  <span>{language === 'en' ? 'Sign In' : 'Masuk'}</span>
                </button>

                <button
                  onClick={openRegisterModal}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <span>{language === 'en' ? 'Get Started' : 'Daftar'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="pt-12 sm:pt-20 pb-14 px-4 sm:px-6 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 text-blue-800 border border-amber-200/80 text-xs font-semibold mb-6 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>{language === 'en' ? 'Smart Adaptive Review System' : 'Sistem Murajaah Adaptif & Terproteksi'}</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-950 tracking-tight leading-[1.15]">
          {language === 'en' ? 'You learned it.' : 'Anda pernah menghafalnya.'}{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">
            {language === 'en' ? 'Now keep it forever.' : 'Kini jaga seumur hidup.'}
          </span>
        </h1>

        <p className="mt-5 text-sm sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          {language === 'en'
            ? 'Unlupa schedules your reviews precisely before you forget — optimized for Al-Qur\'an and structured knowledge books.'
            : 'Unlupa menjadwalkan murajaah tepat sebelum hafalan menguap. Optimal untuk Al-Qur\'an per halaman dan buku ilmu pengetahuan.'}
        </p>

        {/* CTA Buttons: Focused on Mobile Google Login */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md sm:max-w-none mx-auto">
          <button
            onClick={openLoginModal}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2.5 active:scale-95 cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#ffffff"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#ffffff"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#ffffff"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#ffffff"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{language === 'en' ? 'Sign In with Gmail / Email' : 'Masuk dengan Gmail / Email'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleEnterApp('quran')}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-300/80 shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <span>{language === 'en' ? 'Direct Preview (Guest)' : 'Coba Langsung (Tamu)'}</span>
          </button>
        </div>

        {/* Security Trust Micro-Banner */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-500 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>{language === 'en' ? 'Encrypted with Google Firebase • Strict Access Rules • Anti-Bruteforce' : 'Enkripsi Google Firebase • Hak Akses Ketat • Aman dari Peretasan'}</span>
        </div>

        {/* Hero Interactive Visual Mockup */}
        <div className="mt-10 sm:mt-14 p-4 sm:p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xl max-w-4xl mx-auto text-left">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-blue-400" />
              <span className="text-xs font-mono text-slate-400 ml-2">app.unlupa.id / quran-space</span>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
              Sistem Murajaah Cerdas
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase">Juz 1 • Page 1</span>
              <h4 className="font-bold text-base text-slate-900 mt-1">Al-Fatihah 1-7</h4>
              <p className="text-xs text-blue-700 font-semibold mt-1">Mutqin (Stability 34.5d)</p>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200">
              <span className="text-xs font-semibold text-amber-700 uppercase">Due Today</span>
              <h4 className="font-bold text-base text-slate-900 mt-1">Al-Baqarah 1-5</h4>
              <p className="text-xs text-amber-800 font-semibold mt-1">Interval: 3d • Ready for Review</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 opacity-80">
              <span className="text-xs font-semibold text-slate-400 uppercase">Upcoming</span>
              <h4 className="font-bold text-base text-slate-900 mt-1">Al-Baqarah 6-16</h4>
              <p className="text-xs text-slate-500 mt-1">Next review in 2 days</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Security Highlights Section */}
      <section id="security" className="py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{language === 'en' ? 'Enterprise-Grade Security' : 'Sistem Keamanan Berlapis & Terenkripsi'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {language === 'en' ? 'Safe from Hacks, Easy for Mobile' : 'Keamanan Ketat, Sangat Praktis di HP'}
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm mt-2">
              {language === 'en' 
                ? 'Your memorization data is protected with zero-trust architecture and cryptographic authentication.' 
                : 'Data hafalan Anda terlindungi dengan arsitektur zero-trust dan autentikasi resmi Google tanpa celah peretasan.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">
                {language === 'en' ? '1-Tap Gmail OAuth' : 'Login Gmail Terverifikasi'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {language === 'en' 
                  ? 'Sign in securely without vulnerable plaintext passwords. Google handles token encryption directly on your device.'
                  : 'Masuk instan dengan akun Google di HP tanpa kata sandi yang rawan dibobol. Token sesi terenkripsi langsung dari perangkat.'}
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">
                {language === 'en' ? 'Granular RBAC Security Rules' : 'Aturan Hak Akses Ketat (RBAC)'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {language === 'en'
                  ? 'Firestore database security rules enforce that only verified user IDs can read or modify their personal records.'
                  : 'Aturan database menjamin hanya pemilik akun yang dapat mengakses dan mengubah hafalan miliknya. Mencegah manipulasi data.'}
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">
                {language === 'en' ? 'Anti-Bruteforce & Rate Limiting' : 'Proteksi Anti-Bruteforce'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {language === 'en'
                  ? 'Automatic lockout on consecutive failed attempts stops credential-stuffing bots and unauthorized access.'
                  : 'Sistem pembekuan otomatis saat terdeteksi percobaan berulang menghentikan serangan bot dan peretas otomatis.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Problem Section */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-rose-400 font-bold text-xs uppercase tracking-wider">
              {language === 'en' ? 'The Memory Leak Dilemma' : 'Masalah Lupa'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2 tracking-tight">
              {language === 'en' ? 'You used to know it. Now it\'s gone.' : 'Dulu hafal, sekarang menguap.'}
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-3">
              {language === 'en' 
                ? 'Without mathematical spaced repetition, human memory follows Ebbinghaus\' exponential decay curve.'
                : 'Tanpa penjadwalan murajaah yang tepat, usaha berjam-jam menghafal akan sia-sia.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12 text-center">
            <div className="p-6 rounded-3xl bg-slate-800/80 border border-slate-700">
              <div className="text-4xl sm:text-5xl font-black text-rose-400">40%</div>
              <p className="font-semibold text-sm text-slate-200 mt-2">
                {language === 'en' ? 'Forgotten in 24 Hours' : 'Hilang dalam 24 Jam'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {language === 'en' ? 'Without immediate day-1 recall feedback.' : 'Jika tidak diulang pada hari pertama.'}
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-800/80 border border-slate-700">
              <div className="text-4xl sm:text-5xl font-black text-amber-400">70%</div>
              <p className="font-semibold text-sm text-slate-200 mt-2">
                {language === 'en' ? 'Faded in 1 Week' : 'Menguap dalam 1 Minggu'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {language === 'en' ? 'Memory stability plummets exponentially.' : 'Stabilitas memori merosot drastis.'}
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-800/80 border border-slate-700">
              <div className="text-4xl sm:text-5xl font-black text-slate-400">95%</div>
              <p className="font-semibold text-sm text-slate-200 mt-2">
                {language === 'en' ? 'Lost in 1 Month' : 'Lenyap dalam 1 Bulan'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {language === 'en' ? 'Requiring painful relearning from scratch.' : 'Harus menghafal ulang dari nol.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Solution Section */}
      <section id="solution" className="py-20 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-blue-700 font-bold text-xs uppercase tracking-wider">
            {language === 'en' ? 'The Scientific Solution' : 'Solusi Ilmiah'}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 tracking-tight">
            {language === 'en' ? 'Review the right thing, at the right time.' : 'Murajaah hal yang tepat, di waktu yang tepat.'}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-3">
            {language === 'en'
              ? 'Our adaptive algorithm calculates the exact day each memory trace reaches the threshold of forgetting.'
              : 'Algoritma adaptif kami menghitung hari pasti saat memori mendekati batas ambang lupa, lalu menjadwalkannya.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">
              {language === 'en' ? 'Personalized Intervals' : 'Interval Personal'}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {language === 'en'
                ? 'Every single page and card has its own stability score based on your real recall accuracy.'
                : 'Setiap halaman dan kartu memiliki skor stabilitas unik berdasarkan riwayat hafalan Anda.'}
            </p>
          </div>

          <div className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">
              {language === 'en' ? 'Two Distinct Review Modes' : 'Dua Mode Review'}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {language === 'en'
                ? '2-rating high precision for Quran (with 30-day max interval) and 4-rating for books (Again, Hard, Good, Easy).'
                : 'Mode 2-tombol khusus Quran (maks 30 hari) dan 4-rating untuk buku pengetahuan.'}
            </p>
          </div>

          <div className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">
              {language === 'en' ? 'Visible Progress Tracking' : 'Pantauan Kemajuan Nyata'}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {language === 'en'
                ? 'Live mutqin badges, 30 Juz visual grid, and classroom telemetry for teachers and students.'
                : 'Lencana mutqin, visualisasi 30 juz, serta dashboard analitik murid untuk guru dan ustadz.'}
            </p>
          </div>
        </div>
      </section>

      {/* 6. The 4 Spaces Grid */}
      <section id="features" className="py-16 bg-slate-100/70 border-y border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-blue-700 font-bold text-xs uppercase tracking-wider">
              {language === 'en' ? 'Unified Ecosystem' : 'Ekosistem Terpadu'}
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-1">
              {language === 'en' ? 'One Account. Three Dedicated Spaces.' : 'Satu Akun. Tiga Ruang Penuh.'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Space 1: Quran */}
            <div 
              onClick={() => handleEnterApp('quran')}
              className="bg-white p-7 rounded-3xl border border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center mb-4">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-xl text-slate-900 group-hover:text-blue-700 transition-colors">
                1. Quran Space
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                604 pages Madinah standard. 30 Juz interactive grid, 2 review buttons ("I know" / "Need review"), and 30-day max review intervals.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-blue-700">
                <span>Enter Quran Space</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Space 2: Personal */}
            <div 
              onClick={() => handleEnterApp('personal')}
              className="bg-white p-7 rounded-3xl border border-slate-200 hover:border-indigo-400 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center mb-4">
                <Library className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-xl text-slate-900 group-hover:text-indigo-700 transition-colors">
                2. Personal Space
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Structure any non-Quran knowledge as Book → Chapter → Item. 1-click activation, pre-review question & answer inspector, JSON import/export, and curated community library.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-indigo-700">
                <span>Enter Personal Space</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Space 4: Teaching */}
            <div 
              onClick={() => handleEnterApp('teaching')}
              className="bg-white p-7 rounded-3xl border border-slate-200 hover:border-violet-400 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-800 flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-xl text-slate-900 group-hover:text-violet-700 transition-colors">
                3. Teaching Space
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Create classes, assign books or juz targets, monitor student review retention rates, and identify difficult items needing focused classroom review.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-violet-700">
                <span>Enter Teaching Suite</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Pricing Section */}
      <section id="pricing" className="py-20 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-blue-700 font-bold text-xs uppercase tracking-wider">
            {language === 'en' ? 'Fair & Accessible' : 'Harga Transparan'}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-1">
            {language === 'en' ? 'Simple Plans for Every Learner' : 'Paket Untuk Semua Kebutuhan'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free */}
          <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase text-slate-500">Free Tier</span>
              <div className="text-3xl font-black text-slate-900 mt-2">$0</div>
              <p className="text-xs text-slate-500 mt-1">Forever free for everyday learners</p>

              <ul className="mt-6 space-y-2.5 text-xs text-slate-700">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-600" /> All 4 Spaces included</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-600" /> Full Quran 604 pages</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-600" /> Up to 5 personal books</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-600" /> Unlimited daily reviews</li>
              </ul>
            </div>

            <button
              onClick={openRegisterModal}
              className="mt-8 w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-xs text-slate-800 transition-colors cursor-pointer"
            >
              Get Started Free
            </button>
          </div>

          {/* Premium */}
          <div className="bg-slate-900 text-white p-7 rounded-3xl border-2 border-blue-500 shadow-xl flex flex-col justify-between relative">
            <span className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider">
              Most Popular
            </span>
            <div>
              <span className="text-xs font-bold uppercase text-blue-400">Premium</span>
              <div className="text-3xl font-black text-white mt-2">$4.99 <span className="text-xs font-normal text-slate-400">/ month</span></div>
              <p className="text-xs text-slate-400 mt-1">For serious students and avid memorizers</p>

              <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-400" /> Unlimited books & decks</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-400" /> Unlimited teaching classes</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-400" /> Advanced memory stability charts</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-400" /> Curated library publishing priority</li>
              </ul>
            </div>

            <button
              onClick={openRegisterModal}
              className="mt-8 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 font-bold text-xs text-white transition-colors shadow-md cursor-pointer"
            >
              Start 14-Day Trial
            </button>
          </div>

          {/* Institutional */}
          <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase text-slate-500">Institutional</span>
              <div className="text-3xl font-black text-slate-900 mt-2">Custom</div>
              <p className="text-xs text-slate-500 mt-1">For schools, pesantrens, and madrasahs</p>

              <ul className="mt-6 space-y-2.5 text-xs text-slate-700">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-600" /> Multi-teacher administration</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-600" /> Centralized cohort analytics</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-600" /> Dedicated onboarding & training</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-600" /> Bulk student licensing</li>
              </ul>
            </div>

            <button
              onClick={() => alert('Please contact contact@unlupa.id for institutional partnerships.')}
              className="mt-8 w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-xs text-slate-800 transition-colors cursor-pointer"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* 8. Final CTA Section */}
      <section className="py-16 max-w-4xl mx-auto px-4 text-center">
        <div className="bg-gradient-to-tr from-blue-800 to-indigo-900 text-white rounded-3xl p-8 sm:p-12 shadow-2xl space-y-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {language === 'en' ? 'Your memory deserves a system.' : 'Hafalan Anda berhak atas sistem terbaik.'}
          </h2>
          <p className="text-sm text-blue-100/90 max-w-md mx-auto">
            {language === 'en'
              ? 'Join learners worldwide retaining Al-Qur\'an and knowledge with scientific precision.'
              : 'Bergabunglah dengan para penghafal Al-Qur\'an dan pencari ilmu di seluruh dunia.'}
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={openLoginModal}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white text-blue-950 font-bold text-sm hover:bg-amber-50 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              {language === 'en' ? 'Sign In with Gmail' : 'Masuk dengan Akun Gmail'}
            </button>
            <button
              onClick={() => handleEnterApp('quran')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-blue-700/60 hover:bg-blue-700 text-white font-semibold text-sm border border-blue-400/40 transition-all cursor-pointer"
            >
              {language === 'en' ? 'Explore App Direct' : 'Buka Aplikasi Langsung'}
            </button>
          </div>
        </div>
      </section>

      {/* 9. Footer */}
      <footer className="border-t border-slate-200 pt-8 mt-12 max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span className="font-semibold text-slate-700">Unlupa.id</span>
          <span>• Adaptive Memory System</span>
        </div>

        <div className="flex items-center gap-4">
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>Documentation</span>
        </div>
      </footer>
    </div>
  );
};
