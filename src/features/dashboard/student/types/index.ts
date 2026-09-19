// TEACHER REQUEST PAYLOAD

export interface TeacherRequestPayload {
  message: string;
}

export interface TeacherRequestResponse {
  status: number;
  message: string;
  timestamp: string;
  path: string;
}

export interface WeakSpotItem {
  item_id: string;
  title: string;
  subtitle: string;
  source_type: "quran" | "book";
  status: string;
  stability: number;
  difficulty: number;
  review_count: number;
  last_review_at?: string;
  next_review_at?: string;
}

export interface DailyActivity {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface UpcomingReviewForecast {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface DashboardStats {
  total_items: number;
  total_memorized: number;
  total_learning: number;
  due_reviews_today: number;
  completed_reviews_today: number;
  current_streak: number;
  longest_streak: number;
  estimated_focus_minutes: number;
  consistency_heatmap: DailyActivity[];
  weak_spots: WeakSpotItem[];
  upcoming_forecast: UpcomingReviewForecast[];
}