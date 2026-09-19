import React, { useState } from 'react';
import { QuranPageItem, MapanScheduleConfig } from '../../types';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Calendar, 
  Sparkles, 
  Clock, 
  Check, 
  CalendarDays, 
  Zap, 
  RotateCcw,
  CheckCircle2,
  CalendarCheck2
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  page: QuranPageItem | null;
  onSave?: (config: MapanScheduleConfig, applyToAll: boolean) => void;
}

const WEEK_DAYS = [
  { id: 0, labelId: 'Ahad', labelEn: 'Sunday' },
  { id: 1, labelId: 'Senin', labelEn: 'Monday' },
  { id: 2, labelId: 'Selasa', labelEn: 'Tuesday' },
  { id: 3, labelId: 'Rabu', labelEn: 'Wednesday' },
  { id: 4, labelId: 'Kamis', labelEn: 'Thursday' },
  { id: 5, labelId: "Jum'at", labelEn: 'Friday' },
  { id: 6, labelId: 'Sabtu', labelEn: 'Saturday' },
];

export const MapanScheduleModal: React.FC<Props> = ({
  isOpen,
  onClose,
  page,
  onSave,
}) => {
  const { language, updateQuranMapanSchedule, setGlobalMapanSchedule } = useApp();

  const currentConfig: MapanScheduleConfig = page?.mapanSchedule || { mode: 'fsrs' };

  const [mode, setMode] = useState<'fsrs' | 'weekly' | 'monthly'>(currentConfig.mode || 'fsrs');
  const [weeklyDay, setWeeklyDay] = useState<number>(
    typeof currentConfig.weeklyDay === 'number' ? currentConfig.weeklyDay : 5 // Default Jum'at
  );
  const [monthlyDate, setMonthlyDate] = useState<number>(
    typeof currentConfig.monthlyDate === 'number' ? currentConfig.monthlyDate : 1 // Default tgl 1
  );
  const [applyToAll, setApplyToAll] = useState(false);

  // Sync state if page changes
  React.useEffect(() => {
    if (page?.mapanSchedule) {
      setMode(page.mapanSchedule.mode || 'fsrs');
      if (typeof page.mapanSchedule.weeklyDay === 'number') setWeeklyDay(page.mapanSchedule.weeklyDay);
      if (typeof page.mapanSchedule.monthlyDate === 'number') setMonthlyDate(page.mapanSchedule.monthlyDate);
    } else {
      setMode('fsrs');
    }
    setApplyToAll(false);
  }, [page]);

  if (!isOpen || !page) return null;

  const handleSave = () => {
    const newConfig: MapanScheduleConfig = {
      mode,
      weeklyDay: mode === 'weekly' ? weeklyDay : undefined,
      monthlyDate: mode === 'monthly' ? monthlyDate : undefined,
    };

    if (applyToAll) {
      setGlobalMapanSchedule(newConfig);
    } else {
      updateQuranMapanSchedule(page.pageNumber, newConfig);
    }

    if (onSave) {
      onSave(newConfig, applyToAll);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {language === 'en' ? 'Mastered Murajaah Rhythm' : 'Atur Ritme Murajaah Mapan'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'en' 
                  ? `Page ${page.pageNumber} • ${page.surahNameEn} (Juz ${page.juzNumber})`
                  : `Halaman ${page.pageNumber} • ${page.surahNameEn} (Juz ${page.juzNumber})`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {language === 'en'
              ? 'This page has reached Mastered status (>30 days interval). You can continue with the app-managed adaptive schedule, or choose a custom weekly or monthly rhythm below:'
              : 'Halaman ini telah mencapai status Mapan (rotasi > 30 hari). Anda bisa tetap melanjutkan ritme murajaah sesuai dengan penjadwalan yang ditentukan oleh aplikasi, atau Anda bisa memilih ritme mingguan maupun ritme bulanan:'}
          </p>

          {/* Option 1: App Adaptive (Default) */}
          <div
            onClick={() => setMode('fsrs')}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-2 ${
              mode === 'fsrs'
                ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 dark:border-indigo-500'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${mode === 'fsrs' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {language === 'en' ? 'App Adaptive Schedule (Default)' : 'Penjadwalan Otomatis Aplikasi (Bawaan)'}
                  </h4>
                  <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                    {language === 'en' ? 'Intelligent & continuous interval growth' : 'Interval terus bertumbuh otomatis'}
                  </span>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${mode === 'fsrs' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                {mode === 'fsrs' && <Check className="w-3.5 h-3.5" />}
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 pl-10">
              {language === 'en'
                ? 'Review intervals dynamically expand according to memory stability. If you ever falter, the system automatically schedules it earlier.'
                : 'Jadwal pengulangan diatur secara adaptif oleh sistem. Jika hafalan kelak terasa goyah saat diulang, sistem otomatis menjadwalkan murajaah lebih awal.'}
            </p>
          </div>

          {/* Option 2: Weekly Fixed Day */}
          <div
            onClick={() => setMode('weekly')}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-2 ${
              mode === 'weekly'
                ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 dark:border-emerald-500'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${mode === 'weekly' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {language === 'en' ? 'Fixed Weekly Rhythm' : 'Ritme Mingguan (Pilih Hari)'}
                  </h4>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {language === 'en' ? 'Repeat on a specific day each week' : 'Dimurajaah pada hari tertentu setiap pekan'}
                  </span>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${mode === 'weekly' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                {mode === 'weekly' && <Check className="w-3.5 h-3.5" />}
              </div>
            </div>
            
            {mode === 'weekly' && (
              <div className="mt-2 pl-10 space-y-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  {language === 'en' ? 'Select Day of the Week:' : 'Pilih Hari Murajaah:'}
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  {WEEK_DAYS.map(day => (
                    <button
                      key={day.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setWeeklyDay(day.id);
                      }}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                        weeklyDay === day.id
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {language === 'en' ? day.labelEn.slice(0, 3) : day.labelId}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                  {language === 'en'
                    ? `Item will appear for review every ${WEEK_DAYS.find(d => d.id === weeklyDay)?.labelEn}.`
                    : `Halaman ini akan dijadwalkan setiap hari ${WEEK_DAYS.find(d => d.id === weeklyDay)?.labelId}.`}
                </p>
              </div>
            )}
          </div>

          {/* Option 3: Monthly Fixed Date */}
          <div
            onClick={() => setMode('monthly')}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-2 ${
              mode === 'monthly'
                ? 'border-amber-600 bg-amber-50/60 dark:bg-amber-950/40 dark:border-amber-500'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${mode === 'monthly' ? 'bg-amber-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                  <CalendarCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {language === 'en' ? 'Fixed Monthly Date' : 'Ritme Bulanan (Pilih Tanggal 1–31)'}
                  </h4>
                  <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                    {language === 'en' ? 'Repeat on a specific date every month' : 'Dimurajaah setiap tanggal tertentu tiap bulan'}
                  </span>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${mode === 'monthly' ? 'border-amber-600 bg-amber-600 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                {mode === 'monthly' && <Check className="w-3.5 h-3.5" />}
              </div>
            </div>

            {mode === 'monthly' && (
              <div className="mt-2 pl-10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {language === 'en' ? 'Select Date (1 - 31):' : 'Pilih Tanggal (1 - 31):'}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                    {language === 'en' ? `Day ${monthlyDate}` : `Tanggal ${monthlyDate}`}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="31"
                  value={monthlyDate}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setMonthlyDate(parseInt(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Tgl 1</span>
                  <span>Tgl 10</span>
                  <span>Tgl 20</span>
                  <span>Tgl 31</span>
                </div>
                <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                  {language === 'en'
                    ? `Item will appear for review on the ${monthlyDate}th of each month.`
                    : `Halaman ini akan dijadwalkan setiap tanggal ${monthlyDate} di setiap bulannya.`}
                </p>
              </div>
            )}
          </div>

          {/* Apply to all mastered pages checkbox */}
          <label className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={applyToAll}
              onChange={(e) => setApplyToAll(e.target.checked)}
              className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-900 dark:text-white block">
                {language === 'en' 
                  ? 'Apply this rhythm to all current Mastered pages' 
                  : 'Terapkan ritme ini ke seluruh halaman yang sudah berstatus Mapan'}
              </span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                {language === 'en'
                  ? 'Convenient for harmonizing your monthly/weekly murajaah khatam schedule.'
                  : 'Sangat praktis untuk menyelaraskan jadwal murajaah khatam sebulan atau sepekan.'}
              </span>
            </div>
          </label>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            {language === 'en' ? 'Cancel' : 'Batal'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
          >
            {language === 'en' ? 'Save Schedule' : 'Simpan Ritme'}
          </button>
        </div>
      </div>
    </div>
  );
};
