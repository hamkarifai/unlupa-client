import { api } from "@/services/api";
import type {
  QuranPagesResponseData,
  Juz30ProgressResponse,
  ReviewPagePayload,
} from "../types/quran-pages.types";

export const quranPageService = {
  getPagesProgress: async (): Promise<QuranPagesResponseData> => {
    const response = await api.get("/api/v1/quran/pages");
    return response.data.data;
  },

  getJuz30Progress: async (): Promise<Juz30ProgressResponse> => {
    const response = await api.get("/api/v1/quran/juz30");
    return response.data.data;
  },

  reviewPage: async (payload: ReviewPagePayload) => {
    const response = await api.post("/api/v1/quran/pages/review", payload);
    return response.data.data;
  },
};
