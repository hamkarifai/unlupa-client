import { BarChart3 } from "lucide-react";
import type { UpcomingReviewForecast } from "../types";

interface VisualReviewCalendarProps {
  forecast: UpcomingReviewForecast[];
}

export const VisualReviewCalendar = ({
  forecast = [],
}: VisualReviewCalendarProps) => {
  const maxCount = Math.max(...forecast.map((f) => f.count), 5);

  const getDayName = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
      return days[d.getDay()];
    } catch {
      return dateStr;
    }
  };

  const getDayDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.getDate();
    } catch {
      return "";
    }
  };

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-xs relative overflow-hidden">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          <h3 className="text-base font-semibold text-foreground tracking-tight">
            Prakiraan Beban Review (7 Hari)
          </h3>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
          FSRS Load Forecast
        </span>
      </div>

      <div className="grid grid-cols-7 gap-2 pt-4">
        {forecast.map((item, idx) => {
          const heightPercent = Math.min(Math.round((item.count / maxCount) * 100), 100);
          const isToday = idx === 0;

          return (
            <div key={item.date} className="flex flex-col items-center">
              {/* Count badge */}
              <span className="text-[10px] font-mono text-muted-foreground mb-2">
                {item.count}
              </span>

              {/* Bar container */}
              <div className="w-full max-w-[32px] h-24 bg-surface-1 rounded-lg flex items-end p-1 border border-border/40">
                <div
                  className={`w-full rounded-md transition-all duration-500 ${
                    isToday
                      ? "bg-primary shadow-xs shadow-primary/30"
                      : item.count > 0
                      ? "bg-emerald-500/60 hover:bg-emerald-500"
                      : "bg-transparent"
                  }`}
                  style={{
                    height: item.count > 0 ? `${Math.max(heightPercent, 12)}%` : "0%",
                  }}
                />
              </div>

              {/* Day Label */}
              <div className="text-center mt-2">
                <span className={`text-[11px] font-medium block ${isToday ? "text-primary font-bold" : "text-foreground"}`}>
                  {getDayName(item.date)}
                </span>
                <span className="text-[9px] text-muted-foreground font-mono block -mt-0.5">
                  {getDayDate(item.date)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
