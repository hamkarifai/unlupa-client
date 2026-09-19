import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { quranPageService } from "../services/quranPage.service";
import type { ReviewPagePayload } from "../types/quran-pages.types";
import { toast } from "sonner";

export const useQuranPages = () => {
  return useQuery({
    queryKey: ["quran-pages-progress"],
    queryFn: quranPageService.getPagesProgress,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useJuz30Progress = () => {
  return useQuery({
    queryKey: ["quran-juz30-progress"],
    queryFn: quranPageService.getJuz30Progress,
    staleTime: 1000 * 60 * 5,
  });
};

export const useReviewQuranPage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ReviewPagePayload) => quranPageService.reviewPage(payload),
    onSuccess: (_, variables) => {
      toast.success(`Halaman ${variables.page_number} berhasil direview!`);
      queryClient.invalidateQueries({ queryKey: ["quran-pages-progress"] });
      queryClient.invalidateQueries({ queryKey: ["quran-juz30-progress"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (error: unknown) => {
      toast.error("Gagal mengirim penilaian halaman. Silakan coba lagi.");
    },
  });
};
