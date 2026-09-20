import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Award, 
  CalendarDays, 
  Share2, 
  Download, 
  Sparkles, 
  BookOpen, 
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  FolderDown
} from 'lucide-react';
import { downloadDatabaseBackup } from '../../lib/offlineStorage';

interface Props {
  onOpenReport: () => void;
  onOpenAchievementModal: () => void;
  onOpenAttendanceModal: () => void;
}

export const QuickActionsBar: React.FC<Props> = ({
  onOpenReport,
  onOpenAchievementModal,
  onOpenAttendanceModal
}) => {
  const { language, quranPages, books, items, myClasses, teachingClasses, userProfile } = useApp();

  const handleBackup = async () => {
    try {
      downloadDatabaseBackup();
    } catch (e) {
      console.error(e);
    }
  };

  const actions = [
    {
      id: 'report',
      labelEn: 'Progress Report',
      labelId: 'Rapor Progres',
      descEn: 'Share summary card',
      descId: 'Kartu progres belajar',
      icon: <Share2 className="w-5 h-5 text-blue-500" />,
      bg: 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200/70 dark:border-blue-900/60',
      onClick: onOpenReport
    },
    {
      id: 'cert',
      labelEn: 'Certificate Generator',
      labelId: 'Cetak Sertifikat',
      descEn: 'HD printable certificate',
      descId: 'Sertifikat kelulusan tahfizh',
      icon: <Award className="w-5 h-5 text-amber-500" />,
      bg: 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200/70 dark:border-amber-900/60',
      onClick: onOpenAchievementModal
    },
    {
      id: 'attendance',
      labelEn: 'Attendance Log',
      labelId: 'Riwayat Kehadiran',
      descEn: 'Daily presence history',
      descId: 'Rekap kehadiran & izin',
      icon: <CalendarDays className="w-5 h-5 text-purple-500" />,
      bg: 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-200/70 dark:border-purple-900/60',
      onClick: onOpenAttendanceModal
    },
    {
      id: 'backup',
      labelEn: 'Backup Database',
      labelId: 'Cadangkan Data',
      descEn: 'JSON local file export',
      descId: 'Ekspor arsip offline',
      icon: <FolderDown className="w-5 h-5 text-emerald-500" />,
      bg: 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200/70 dark:border-emerald-900/60',
      onClick: handleBackup
    },
  ];

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          {language === 'en' ? 'Quick Tools & Exports' : 'Fitur Cepat & Utilitas'}
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map(action => (
          <button
            key={action.id}
            onClick={action.onClick}
            className={`p-4 rounded-2xl border ${action.bg} flex flex-col items-start justify-between min-h-[105px] text-left transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-2xs group`}
          >
            <div className="p-2 rounded-xl bg-white dark:bg-slate-900 shadow-2xs group-hover:scale-110 transition-transform">
              {action.icon}
            </div>
            <div>
              <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                {language === 'en' ? action.labelEn : action.labelId}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[140px]">
                {language === 'en' ? action.descEn : action.descId}
              </p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};
