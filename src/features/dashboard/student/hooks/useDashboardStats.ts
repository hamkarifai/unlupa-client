import { useQuery } from "@tanstack/react-query";
import { studentDashboardService } from "../services/studentDashboard.service";

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: studentDashboardService.getDashboardStats,
    staleTime: 1000 * 60 * 3, // 3 minutes
    refetchOnWindowFocus: true,
  });
};
