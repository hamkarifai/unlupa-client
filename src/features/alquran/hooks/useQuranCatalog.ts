import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { quranCatalogService, QuranJuzCatalogItem, JuzPagesResponse } from "../services/quranCatalog.service";

export const useQuranCatalog = (selectedJuzNumber?: number | null) => {
  const queryClient = useQueryClient();
  const [activatingPages, setActivatingPages] = useState<Record<number, boolean>>({});

  // 1. Fetch 30 Juz with user progress stats
  const juzsQuery = useQuery({
    queryKey: ["quran-juzs"],
    queryFn: () => quranCatalogService.getJuzs(),
    staleTime: 1000 * 60 * 5, // 5 mins
  });

  // 2. Fetch Pages for selected Juz
  const pagesQuery = useQuery({
    queryKey: ["quran-juz-pages", selectedJuzNumber],
    queryFn: () => (selectedJuzNumber ? quranCatalogService.getJuzPages(selectedJuzNumber) : null),
    enabled: !!selectedJuzNumber && selectedJuzNumber >= 1 && selectedJuzNumber <= 30,
    staleTime: 1000 * 60 * 2,
  });

  // 3. Activate Page Mutation
  const activateMutation = useMutation({
    mutationFn: async (mushafPage: number) => {
      setActivatingPages(prev => ({ ...prev, [mushafPage]: true }));
      try {
        return await quranCatalogService.activatePage(mushafPage);
      } finally {
        setActivatingPages(prev => ({ ...prev, [mushafPage]: false }));
      }
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh counts and page statuses
      queryClient.invalidateQueries({ queryKey: ["quran-juzs"] });
      queryClient.invalidateQueries({ queryKey: ["quran-juz-pages", data.juz_number] });
      queryClient.invalidateQueries({ queryKey: ["my-items"] });
      queryClient.invalidateQueries({ queryKey: ["daily-tasks"] });
    },
  });

  return {
    juzList: juzsQuery.data ?? [],
    isJuzListLoading: juzsQuery.isLoading,
    juzListError: juzsQuery.error,
    refetchJuzList: juzsQuery.refetch,

    currentJuzData: pagesQuery.data,
    isPagesLoading: pagesQuery.isLoading,
    pagesError: pagesQuery.error,
    refetchPages: pagesQuery.refetch,

    activatePage: activateMutation.mutateAsync,
    isActivating: activateMutation.isPending,
    activatingPages,
  };
};
