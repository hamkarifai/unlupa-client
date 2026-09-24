import { api } from "@/services/api";

export interface QuranJuzCatalogItem {
  juz_number: number;
  name_ar: string;
  name_en: string;
  start_page: number;
  end_page: number;
  total_pages: number;
  start_surah: string;
  end_surah: string;
  surah_span: string;
  ayah_span: string;
  active_pages: number;
  mastered_pages: number;
  due_today: number;
}

export interface QuranPageCatalogItem {
  mushaf_page: number;
  juz_number: number;
  page_number_in_juz: number;
  surah_name_en: string;
  surah_name_ar: string;
  surah_number: number;
  ayah_range: string;
  start_verse_key: string;
  end_verse_key: string;
  content_ref: string;
  is_activated: boolean;
  activation_status: "not_activated" | "active" | "mastered";
  review_status: string;
  item_id?: string;
  next_review_at?: string;
  last_review_at?: string;
  stability: number;
  difficulty: number;
  review_count: number;
  is_due: boolean;
}

export interface JuzPagesResponse {
  juz: QuranJuzCatalogItem;
  total_pages: number;
  active_pages: number;
  mastered_pages: number;
  due_today: number;
  pages: QuranPageCatalogItem[];
}

export interface ActivatePageResponse {
  item: {
    ID: string;
    OwnerID: string;
    SourceType: string;
    ContentRef: string;
    Status: string;
    IntervalDays: number;
    Stability: number;
    Difficulty: number;
    ReviewCount: number;
    NextReviewAt?: string;
    CreatedAt: string;
  };
  mushaf_page: number;
  juz_number: number;
  status: string;
  already_active: boolean;
  message: string;
}

export const quranCatalogService = {
  async getJuzs(userId?: string): Promise<QuranJuzCatalogItem[]> {
    const params = userId ? { user_id: userId } : undefined;
    const res = await api.get<{ data: QuranJuzCatalogItem[] }>("/api/v1/quran/juzs", { params });
    return res.data.data;
  },

  async getJuzPages(juzNumber: number, userId?: string): Promise<JuzPagesResponse> {
    const params = userId ? { user_id: userId } : undefined;
    const res = await api.get<{ data: JuzPagesResponse }>(`/api/v1/quran/juzs/${juzNumber}/pages`, { params });
    return res.data.data;
  },

  async activatePage(mushafPage: number): Promise<ActivatePageResponse> {
    const res = await api.post<{ data: ActivatePageResponse }>(`/api/v1/quran/pages/${mushafPage}/activate`);
    return res.data.data;
  },
};
