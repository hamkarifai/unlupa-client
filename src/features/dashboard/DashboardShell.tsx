import { useAuthStore } from "@/features/auth/stores/auth.store";
import { AdminDashboardPage } from "@/features/dashboard/admin/pages/AdminDashboardPage";
import { TeacherDashboardPage } from "@/features/dashboard/teacher/pages/TeacherDashboardPage";
import { HomeSpace } from "@/components/home/HomeSpace";
import { useDashboardModeStore } from "@/features/dashboard/stores/dashboard-mode.store";
import { Navigate } from "react-router";

export const DashboardShell = () => {
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role;
  const activeRole = useDashboardModeStore((state) => state.activeRole);

  if (!userRole) return <Navigate to="/login" replace />;

  let finalRole = activeRole;

  if (userRole === "student") {
    finalRole = "student";
  }

  if (userRole === "teacher" && activeRole === "admin") {
    finalRole = "teacher";
  }

  if (finalRole === "admin") {
    return <AdminDashboardPage />;
  }

  if (finalRole === "teacher") {
    return <TeacherDashboardPage />;
  }

  return <HomeSpace />;
};