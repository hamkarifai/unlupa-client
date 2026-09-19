import { useState, useCallback } from "react";
import type { MyItemsQuranResponse } from "@/features/alquran/types/quran.types";
import { alquranService } from "@/features/alquran/services/alquran.services";

export const useGetMyItems = () => {
  const [data, setData] = useState<MyItemsQuranResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getMyItems = useCallback(async (type: "quran" | "book" = "quran", classId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await alquranService.getMyItems(type, classId);
      setData(response);
    } catch (err) {
      const message =
        (err as any)?.response?.data?.message || "Failed to fetch items";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, getMyItems };
};
