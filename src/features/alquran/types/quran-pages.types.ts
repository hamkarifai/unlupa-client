export type QuranPageStatus = "new" | "learning" | "review" | "mapan";

export interface QuranPageSummary {
  page_number: number;
  juz_number: number;
  status: QuranPageStatus;
  stability: number;
  difficulty: number;
  last_reviewed_at?: string;
  next_review_at?: string;
  review_count: number;
  is_due: boolean;
  has_reached_mapan?: boolean;
}

export interface QuranPagesStats {
  total_pages: number;
  mapan_pages: number;
  review_pages: number;
  learning_pages: number;
  new_pages: number;
  due_pages_today: number;
  mapan_percent: number;
}

export interface QuranPagesResponseData {
  stats: QuranPagesStats;
  pages: QuranPageSummary[];
}

export interface SurahJuz30Info {
  number: number;
  name: string;
  english_name: string;
  start_page: number;
  end_page: number;
  ayah_count: number;
  status: "mapan" | "learning" | "new";
}

export interface Juz30ProgressResponse {
  juz_number: number;
  total_pages: number;
  mapan_pages: number;
  due_pages: number;
  mapan_percent: number;
  pages: QuranPageSummary[];
  surahs: SurahJuz30Info[];
}

export interface ReviewPagePayload {
  page_number: number;
  rating: 1 | 2 | 3 | 4;
}
