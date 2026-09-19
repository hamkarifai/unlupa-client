import { useMemo } from "react";
import { Flame, Trophy, CalendarDays } from "lucide-react";
import type { DailyActivity } from "../types";

interface ConsistencyHeatmapProps {
  activities: DailyActivity[];
  currentStreak: number;
  longestStreak: number;
}

export const ConsistencyHeatmap = ({
  activities = [],
  currentStreak = 0,
  longestStreak = 0,
}: ConsistencyHeatmapProps) => {
  // Map activity array to date map
  const activityMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const act of activities) {
      map.set(act.date, act.count);
    }
    return map;
  }, [activities]);

  // Generate trailing 16 weeks (112 days) for compact beautiful dashboard view
  const days = useMemo(() => {
    const list: { date: string; count: number; dayOfWeek: number }[] = [];
    const today = new Date();
    // Start 16 weeks ago aligned to Monday
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 112);

    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;
      list.push({
        date: dateStr,
        count: activityMap.get(dateStr) || 0,
        dayOfWeek: d.getDay(),
      });
    }
    return list;
  }, [activityMap]);

  const getColorClass = (count: number) => {
    if (count === 0) return "bg-surface-1 border-border/40 hover:border-border";
    if (count <= 2) return "bg-emerald-500/20 border-emerald-500/30 text-emerald-400";
    if (count <= 5) return "bg-emerald-500/50 border-emerald-500/60 text-emerald-200";
    if (count <= 9) return "bg-emerald-500/80 border-emerald-500/90 text-white";
    return "bg-emerald-400 border-emerald-300 text-slate-900 shadow-xs shadow-emerald-500/30";
  };

  const totalReviewsPastPeriod = useMemo(() => {
    return days.reduce((sum, d) => sum + d.count, 0);
  }, [days]);

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-xs relative overflow-hidden transition-all duration-300">
      {/* Background soft glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays className="w-4 h-4 text-emerald-500" />
            <h3 className="text-base font-semibold text-foreground tracking-tight">
              Konsistensi Murajaah
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            {totalReviewsPastPeriod} setoran & review dalam 16 pekan terakhir
          </p>
        </div>

        {/* Streak Badges */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
            <div>
              <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                {currentStreak} Hari
              </span>
              <span className="text-[10px] text-muted-foreground block -mt-0.5">Streak Aktif</span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Trophy className="w-4 h-4 text-amber-500" />
            <div>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                {longestStreak} Hari
              </span>
              <span className="text-[10px] text-muted-foreground block -mt-0.5">Rekor Terbaik</span>
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto pb-2 scrollbar-none">
        <div className="min-w-[600px]">
          <div className="grid grid-flow-col grid-rows-7 gap-1.5">
            {days.map((day) => (
              <div
                key={day.date}
                title={`${day.date}: ${day.count} review`}
                className={`w-3.5 h-3.5 rounded-xs border transition-all duration-150 cursor-pointer hover:scale-125 ${getColorClass(
                  day.count,
                )}`}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between mt-4 text-[10px] text-muted-foreground font-mono">
            <span>Kurang Aktif</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-surface-1 border border-border/40" />
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500/20 border border-emerald-500/30" />
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500/50 border border-emerald-500/60" />
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500/80 border border-emerald-500/90" />
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-400 border border-emerald-300" />
            </div>
            <span>Sangat Aktif</span>
          </div>
        </div>
      </div>
    </div>
  );
};
