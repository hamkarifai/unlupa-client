import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Flame, Check, Trophy } from 'lucide-react';
import { motion } from 'motion/react';

// Helper for safe ISO date extraction
function safeDateKey(val: any): string | null {
  if (!val) return null;
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0];
  } catch (e) {
    return null;
  }
}

export const WeeklyStreakWidget: React.FC = () => {
  const { quranPages, items, currentStreak, language } = useApp();

  const weeklyData = useMemo(() => {
    const countsByDate = new Map<string, number>();
    
    // Aggregate from Quran reviews
    (quranPages || []).forEach(p => {
      (p.reviewLogs || []).forEach(log => {
        const dStr = safeDateKey(log?.date);
        if (dStr) countsByDate.set(dStr, (countsByDate.get(dStr) || 0) + 1);
      });
      const actStr = safeDateKey(p.activatedAt);
      if (actStr) countsByDate.set(actStr, (countsByDate.get(actStr) || 0) + 1);
    });

    // Aggregate from Personal item reviews
    (items || []).forEach(it => {
      (it.reviewLogs || []).forEach(log => {
        const dStr = safeDateKey(log?.date);
        if (dStr) countsByDate.set(dStr, (countsByDate.get(dStr) || 0) + 1);
      });
    });

    // Generate current week (Monday to Sunday)
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - distanceToMonday);
    weekStart.setHours(0, 0, 0, 0);

    const weekDays = [];
    const dayNames = language === 'en' 
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

    let todayIndex = 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const dStr = safeDateKey(d.toISOString());
      
      const isToday = d.toDateString() === today.toDateString();
      if (isToday) todayIndex = i;

      weekDays.push({
        name: dayNames[i],
        date: d,
        isActive: dStr ? (countsByDate.get(dStr) || 0) > 0 : false,
        isToday,
        isFuture: d > today
      });
    }

    return { weekDays, todayIndex };
  }, [quranPages, items, language]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0B101D] border border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xl mb-4 relative overflow-hidden"
      style={{
        background: 'radial-gradient(circle at 35% 15%, rgba(245, 158, 11, 0.12) 0%, transparent 60%), #0B101D'
      }}
    >
      <div className="flex items-center justify-between mb-5 sm:mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
            <Flame className="w-5 h-5 text-slate-950 fill-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-bold text-xs tracking-wide">
                {language === 'en' ? 'Weekly' : 'Pekan'}
              </span>
              <h3 className="text-base sm:text-lg font-serif font-bold text-white tracking-tight">
                {language === 'en' ? 'Streak' : 'Istiqomah'}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {currentStreak} {language === 'en' ? 'days of focus' : 'hari istiqomah'}
            </p>
          </div>
        </div>
        {currentStreak > 0 && (
          <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>{currentStreak} {language === 'en' ? 'Days' : 'Hari'}</span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center gap-2 sm:gap-3">
        {weeklyData.weekDays.map((day, idx) => (
          <div key={idx} className="flex flex-col items-center gap-2.5 flex-1 min-w-0">
            {/* Elongated Vertical Capsule */}
            <div 
              className={`w-full max-w-[42px] sm:max-w-[48px] h-16 sm:h-20 rounded-full transition-all duration-300 ${
                day.isActive 
                  ? 'bg-gradient-to-b from-amber-400 via-amber-500 to-orange-500 shadow-[0_0_25px_rgba(245,158,11,0.5)] flex flex-col items-center justify-start pt-2.5 sm:pt-3 text-slate-950' 
                  : day.isToday
                    ? 'bg-[#131926] border border-amber-500/40 flex items-center justify-center'
                    : day.isFuture
                      ? 'bg-[#0E131F]/50 border border-slate-800/30 opacity-40'
                      : 'bg-[#131926] border border-slate-800/60'
              }`}
            >
              {day.isActive ? (
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950 stroke-[3]" />
              ) : day.isToday ? (
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
              ) : null}
            </div>

            {/* Day Name Label */}
            <span className={`text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider ${
              day.isActive 
                ? 'text-amber-400' 
                : day.isToday 
                ? 'text-white' 
                : 'text-slate-500'
            }`}>
              {day.name}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
