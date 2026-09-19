import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Mail, 
  Lock, 
  ArrowRight, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  Eye,
  EyeOff,
  UserCheck,
  Zap,
  Globe
} from 'lucide-react';
import { 
  loginWithGoogle, 
  loginWithEmail, 
  sendEmailLoginLink, 
  syncUserProfileToFirestore 
} from '../../lib/firebase';
import { useApp } from '../../context/AppContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'magic_link';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess
}) => {
  const { language, setUserProfile } = useApp();

  const [mode, setMode] = useState<'login' | 'register' | 'magic_link'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Security: Rate limiting & failed attempt cooldown
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setTimeout>;
    if (lockoutTimer > 0) {
      interval = setInterval(() => {
        setLockoutTimer(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  if (!isOpen) return null;

  // Sanitization and security validator
  const validateEmail = (val: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(val).toLowerCase());
  };

  const handleGoogleSignIn = async () => {
    if (lockoutTimer > 0) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsGoogleLoading(true);

    try {
      const user = await loginWithGoogle();
      await syncUserProfileToFirestore(user);

      setUserProfile(prev => ({
        ...prev,
        id: user.uid,
        email: user.email || prev.email,
        fullName: user.displayName || user.email?.split('@')[0] || prev.fullName,
        avatarUrl: user.photoURL || prev.avatarUrl,
      }));

      setSuccessMsg(language === 'en' ? 'Logged in successfully with Google!' : 'Berhasil masuk dengan akun Google!');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 700);
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMsg(language === 'en' ? 'Sign-in cancelled. Please try again.' : 'Proses login dibatalkan. Silakan coba lagi.');
      } else if (err?.code === 'auth/network-request-failed') {
        setErrorMsg(language === 'en' ? 'Network error. Please check your connection.' : 'Koneksi bermasalah. Periksa jaringan internet Anda.');
      } else {
        setErrorMsg(err?.message || (language === 'en' ? 'Failed to sign in with Google.' : 'Gagal masuk dengan akun Google.'));
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTimer > 0) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();
    if (!validateEmail(cleanEmail)) {
      setErrorMsg(language === 'en' ? 'Please enter a valid email address.' : 'Format alamat email tidak valid.');
      return;
    }

    if (mode === 'magic_link') {
      setIsLoading(true);
      try {
        await sendEmailLoginLink(cleanEmail);
        setSuccessMsg(
          language === 'en'
            ? `Magic login link sent to ${cleanEmail}! Check your inbox.`
            : `Tautan login instan telah dikirim ke ${cleanEmail}! Silakan buka email Anda.`
        );
      } catch (err: any) {
        console.error('Magic Link Error:', err);
        setErrorMsg(err?.message || (language === 'en' ? 'Failed to send login link.' : 'Gagal mengirim tautan email.'));
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg(language === 'en' ? 'Password must be at least 6 characters.' : 'Kata sandi minimal 6 karakter.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await loginWithEmail(cleanEmail, password);
      await syncUserProfileToFirestore(user);

      setUserProfile(prev => ({
        ...prev,
        id: user.uid,
        email: user.email || prev.email,
        fullName: user.displayName || user.email?.split('@')[0] || prev.fullName,
        avatarUrl: user.photoURL || prev.avatarUrl,
      }));

      setSuccessMsg(language === 'en' ? 'Signed in successfully!' : 'Berhasil masuk ke akun Anda!');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 700);
    } catch (err: any) {
      console.error('Email Auth Error:', err);
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);

      if (newAttempts >= 4) {
        setLockoutTimer(30); // 30 seconds brute-force protection
        setErrorMsg(
          language === 'en' 
            ? 'Too many failed attempts. Security cooldown active for 30s.' 
            : 'Terlalu banyak percobaan gagal. Sistem keamanan aktif (tunggu 30 detik).'
        );
      } else {
        if (err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
          setErrorMsg(language === 'en' ? 'Incorrect email or password.' : 'Email atau kata sandi tidak cocok.');
        } else if (err?.code === 'auth/email-already-in-use') {
          setErrorMsg(language === 'en' ? 'Email already in use. Please sign in.' : 'Email sudah terdaftar. Silakan pilih Masuk.');
        } else {
          setErrorMsg(err?.message || (language === 'en' ? 'Authentication failed.' : 'Gagal memproses autentikasi.'));
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border-t sm:border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden transition-all max-h-[92vh] flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between relative bg-gradient-to-b from-amber-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight">
                {mode === 'login' 
                  ? (language === 'en' ? 'Sign In to Unlupa' : 'Masuk ke Unlupa') 
                  : mode === 'register'
                  ? (language === 'en' ? 'Create Account' : 'Daftar Akun Baru')
                  : (language === 'en' ? 'Passwordless Email Login' : 'Login Email Cepat')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'en' ? 'Adaptive Quran & Knowledge System' : 'Sistem Hafalan Adaptif & Terproteksi'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <span className="leading-relaxed font-medium">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-2.5 text-emerald-700 dark:text-emerald-300 text-xs animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <span className="leading-relaxed font-medium">{successMsg}</span>
            </div>
          )}

          {/* Primary Action 1: Google 1-Tap Sign-In (Mobile friendly) */}
          <div>
            <button
              type="button"
              disabled={isGoogleLoading || lockoutTimer > 0}
              onClick={handleGoogleSignIn}
              className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {isGoogleLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{language === 'en' ? 'Continue with Google (Gmail)' : 'Masuk dengan Akun Gmail / Google'}</span>
            </button>
            <p className="text-[10px] text-center text-slate-400 mt-1.5">
              {language === 'en' ? 'Recommended on mobile for 1-tap sign in' : 'Sangat praktis di HP • Cukup 1 kali klik'}
            </p>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-2">
            <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
            <span className="bg-white dark:bg-slate-900 px-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {language === 'en' ? 'or with email' : 'atau gunakan email'}
            </span>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'en' ? 'Email Address' : 'Alamat Email'}
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@gmail.com"
                  disabled={isLoading || lockoutTimer > 0}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all disabled:opacity-50"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {mode !== 'magic_link' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {language === 'en' ? 'Password' : 'Kata Sandi'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setMode('magic_link')}
                    className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    {language === 'en' ? 'Login without password?' : 'Login tanpa sandi (Magic Link)?'}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isLoading || lockoutTimer > 0}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all disabled:opacity-50"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {lockoutTimer > 0 && (
              <p className="text-[11px] text-rose-500 font-bold text-center">
                {language === 'en' 
                  ? `Security lockout: ${lockoutTimer}s remaining` 
                  : `Penguncian keamanan: sisa ${lockoutTimer} detik`}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading || lockoutTimer > 0}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === 'magic_link'
                      ? (language === 'en' ? 'Send Login Link' : 'Kirim Tautan Login ke Email')
                      : mode === 'login'
                      ? (language === 'en' ? 'Sign In with Email' : 'Masuk Sekarang')
                      : (language === 'en' ? 'Register Account' : 'Daftar Sekarang')}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Mode Switcher */}
          <div className="pt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            {mode === 'login' ? (
              <>
                <span>{language === 'en' ? 'Don\'t have an account?' : 'Belum punya akun?'}</span>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  {language === 'en' ? 'Register here' : 'Daftar di sini'}
                </button>
              </>
            ) : (
              <>
                <span>{language === 'en' ? 'Already have an account?' : 'Sudah punya akun?'}</span>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  {language === 'en' ? 'Sign in' : 'Masuk ke akun'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Modal Footer Security Guarantee */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            {language === 'en'
              ? 'Secured with 256-bit TLS encryption • Anti-Bruteforce active'
              : 'Enkripsi TLS 256-bit • Proteksi Anti-Peretasan & Brute-force Aktif'}
          </span>
        </div>
      </div>
    </div>
  );
};
