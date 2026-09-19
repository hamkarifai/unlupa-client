import React, { useState } from 'react';
import { ShieldAlert, Users, CreditCard, BookOpen, Activity, TrendingUp, DollarSign, Settings, UserCheck, Sliders, Compass } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SystemLimitsConfigTab } from './SystemLimitsConfigTab';
import { AdminTransactionsTab } from './AdminTransactionsTab';
import { AdminRoadmapTab } from './AdminRoadmapTab';

export const AdminSpace: React.FC = () => {
  const { language, transactions } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'limits' | 'users' | 'transactions' | 'royalties' | 'roadmap'>('overview');

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const totalGMV = transactions.filter(t => t.status === 'success').reduce((acc, t) => acc + t.amount, 0);
  const totalPlatformCut = transactions.filter(t => t.status === 'success').reduce((acc, t) => acc + t.platformFee, 0);
  const totalRoyalties = transactions.filter(t => t.status === 'success').reduce((acc, t) => acc + t.authorRoyalty, 0);
  const totalSalesCount = transactions.filter(t => t.status === 'success').length;

  const stats = [
    {
      title: language === 'en' ? 'Total GMV Sales' : 'Total Transaksi Kitab',
      value: formatIDR(totalGMV),
      change: '+18.2%',
      icon: <DollarSign className="w-5 h-5 text-emerald-500" />,
      bg: 'bg-emerald-50 dark:bg-emerald-950/30'
    },
    {
      title: language === 'en' ? 'Platform Net Revenue' : 'Pendapatan Unlupa (15%)',
      value: formatIDR(totalPlatformCut),
      change: '+15.0%',
      icon: <TrendingUp className="w-5 h-5 text-indigo-500" />,
      bg: 'bg-indigo-50 dark:bg-indigo-950/30'
    },
    {
      title: language === 'en' ? 'Creator Royalties (85%)' : 'Hak Royalti Penulis',
      value: formatIDR(totalRoyalties),
      change: '+14.8%',
      icon: <UserCheck className="w-5 h-5 text-purple-500" />,
      bg: 'bg-purple-50 dark:bg-purple-950/30'
    },
    {
      title: language === 'en' ? 'Completed Book Purchases' : 'Buku Terbeli & Aktif',
      value: `${totalSalesCount} Kitab`,
      change: '+24.5%',
      icon: <BookOpen className="w-5 h-5 text-amber-500" />,
      bg: 'bg-amber-50 dark:bg-amber-950/30'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-rose-600 dark:text-rose-500" />
            <span>{language === 'en' ? 'Super Admin' : 'Super Admin'}</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {language === 'en' ? 'Manage platform, users, revenues, and royalties.' : 'Kelola platform, pengguna, pendapatan, dan royalti.'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'overview', labelEn: 'Overview', labelId: 'Ringkasan', icon: <Activity className="w-4 h-4" /> },
          { id: 'limits', labelEn: 'Tier & Feature Limits', labelId: 'Batas Fitur & Paket', icon: <Sliders className="w-4 h-4" /> },
          { id: 'transactions', labelEn: 'Transactions & Marketplace', labelId: 'Transaksi & Marketplace', icon: <CreditCard className="w-4 h-4" /> },
          { id: 'roadmap', labelEn: 'Development Roadmap', labelId: 'Roadmap Pengembangan', icon: <Compass className="w-4 h-4 text-amber-500" /> },
          { id: 'users', labelEn: 'Users & Roles', labelId: 'Pengguna & Role', icon: <Users className="w-4 h-4" /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {tab.icon}
            {language === 'en' ? tab.labelEn : tab.labelId}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'limits' && <SystemLimitsConfigTab />}

      {activeTab === 'transactions' && <AdminTransactionsTab />}

      {activeTab === 'roadmap' && <AdminRoadmapTab />}

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                    {stat.icon}
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-lg">
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">{stat.title}</h3>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Transactions List */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-500" />
                  {language === 'en' ? 'Recent Transactions' : 'Transaksi Terakhir'}
                </h3>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  {language === 'en' ? 'View All' : 'Lihat Semua'} →
                </button>
              </div>
              <div className="space-y-3">
                {transactions.slice(0, 4).map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                        IDR
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">{tx.bookTitle}</p>
                        <p className="text-[11px] text-slate-500">{tx.userName} • {tx.id}</p>
                      </div>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                      +{formatIDR(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Author Royalties Summary */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                  {language === 'en' ? 'Author Royalties (85%)' : 'Distribusi Royalti Penulis'}
                </h3>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  {language === 'en' ? 'Manage' : 'Kelola'} →
                </button>
              </div>
              <div className="space-y-3">
                {transactions.slice(0, 3).map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">{tx.authorName}</p>
                        <p className="text-[11px] text-slate-500">{tx.bookTitle}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs sm:text-sm font-bold text-purple-600 dark:text-purple-400 block">
                        {formatIDR(tx.authorRoyalty)}
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Telah Ditransfer</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
          <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            {language === 'en' ? 'User & Role Directory' : 'Direktori Pengguna & Role'}
          </h3>
          <p className="text-sm text-slate-500 max-w-sm">
            {language === 'en' 
              ? 'Multi-role authentication system supports student, teacher, and super-admin accounts.' 
              : 'Sistem otentikasi multi-peran mendukung akun santri/siswa, ustadz/guru, dan super-admin.'}
          </p>
        </div>
      )}
    </div>
  );
};
