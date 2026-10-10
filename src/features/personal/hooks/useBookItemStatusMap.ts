import { useCallback, useState } from "react";
import { personalService } from "../services/personal.services";
import type { RawItemEntity } from "../types/personal.types";

// Maps content_ref → { status, item_id }
export type ItemStatusEntry = {
  status: string;
  item_id: string;
  owner_id: string;
  content_ref: string;
  stability: number;
  difficulty: number;
  review_count: number;
  last_review_at: string | null;
  next_review_at: string | null;
};
export type ItemStatusMap = Map<string, ItemStatusEntry>;

// content_ref format: book:{bookId}:item:{bookItemId}
export const contentRefForItem = (bookId: string, bookItemId: string) =>
  `book:${bookId}:item:${bookItemId}`;

// All statuses that create an Item entity in the DB.
// "belum_mulai" items don't have an Item entity yet — they're just BookItems.
const REVIEWABLE_STATUSES = ["menghafal", "interval", "fsrs_active", "graduate", "inactive", "start"];

// The Go backend's MarshalJSON converts "fsrs_active" → "ujian" in JSON output.
// Normalize it back so the frontend always works with "fsrs_active".
function normalizeStatus(status: string): string {
  return status === "ujian" ? "fsrs_active" : status;
}

export const useBookItemStatusMap = () => {
  const [statusMap, setStatusMap] = useState<ItemStatusMap>(new Map());
  const [loading, setLoading] = useState(false);

  const fetchStatusMap = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all statuses in parallel
      const results = await Promise.allSettled(
        REVIEWABLE_STATUSES.map((s) => personalService.getItemsByStatus(s))
      );

      const map: ItemStatusMap = new Map();
      results.forEach((result) => {
        if (result.status === "fulfilled") {
          // API returns entities.Item (Go struct) with PascalCase fields and no JSON tags.
          // Fields: ID, ContentRef, Status (may be "ujian" for fsrs_active)
          result.value.data.forEach((item: RawItemEntity) => {
            if (!item.ContentRef) return;
            map.set(item.ContentRef, {
              status: normalizeStatus(item.Status),
              item_id: item.ID,
              owner_id: item.OwnerID,
              content_ref: item.ContentRef,
              stability: item.Stability,
              difficulty: item.Difficulty,
              review_count: item.ReviewCount,
              last_review_at: item.LastReviewAt,
              next_review_at: item.Status === "interval"
                ? item.IntervalNextReviewAt ?? null
                : item.NextReviewAt,
            });
          });
        }
      });
      setStatusMap(map);
      return map;
    } catch {
      return new Map<string, ItemStatusEntry>();
    } finally {
      setLoading(false);
    }
  }, []);

  return { statusMap, loading, fetchStatusMap };
};
