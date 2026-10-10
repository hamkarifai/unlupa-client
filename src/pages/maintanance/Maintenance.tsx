import React from 'react';

export const MaintenancePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#070A12] text-slate-100 flex items-center justify-center px-6 relative overflow-hidden selection:bg-amber-500 selection:text-white">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[500px] h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg text-center relative z-10 p-8 rounded-3xl bg-[#0F1420]/80 border border-slate-800/80 shadow-2xl backdrop-blur-xl">
        {/* Brand Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-lg shadow-amber-500/10">
          <span className="text-4xl select-none">🚧</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
          Unlupa.id Sedang Dalam Maintenance
        </h1>

        {/* Description */}
        <p className="text-slate-400 leading-relaxed text-sm sm:text-base">
          Kami sedang melakukan beberapa perbaikan dan peningkatan pada sistem Unlupa.id.
        </p>

        <div className="mt-5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-semibold text-slate-300">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>Sistem akan segera kembali aktif</span>
        </div>

        <p className="text-slate-500 text-xs mt-4">
          Silakan kembali beberapa saat lagi. Terima kasih atas kesabaran Anda.
        </p>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-slate-800/60 text-xs text-slate-500 font-mono">
          © {new Date().getFullYear()} Unlupa.id • Sistem Manajemen Hafalan
        </div>
      </div>
    </div>
  );
};