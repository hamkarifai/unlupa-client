import { api } from "@/services/api";
import type { TeacherRequestPayload, TeacherRequestResponse, DashboardStats } from "../types";

export const studentDashboardService = {
  sendTeacherRequest: async (
    payload: TeacherRequestPayload,
  ): Promise<TeacherRequestResponse> => {
    const response = await api.post("/api/v1/user/teacher-request", payload);
    return response.data.data;
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await api.get("/api/v1/dashboard/stats");
    return response.data.data;
  },
};
