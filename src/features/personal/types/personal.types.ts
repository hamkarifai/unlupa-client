export interface Book {
  id: string;
  owner_id: string;
  owner_name?: string;
  title: string;
  description: string;
  cover_image: string;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GetBooksResponse {
  status: number;
  message: string;
  data: Book[];
  timestamp: string;
  path: string;
}

export interface BookCollectionItem {
  book_id: string;
  title: string;
  description: string;
  cover_image: string;
  owner_name: string;
  item_count: number;
  added_at: string;
}

export interface GetMyCollectionResponse {
  status: number;
  message: string;
  data: BookCollectionItem[];
  timestamp: string;
  path: string;
}

export interface CreateBookPayload {
  title: string;
  description: string;
  cover_image?: File | string;
}

export interface CreateBookResponse {
  status: number;
  message: string;
  data: Book;
  timestamp: string;
  path: string;
}

export interface UpdateBookPayload {
  title: string;
  description: string;
  cover_image?: File | string;
}

export interface UpdateBookResponse {
  status: number;
  message: string;
  data: Book;
  timestamp: string;
  path: string;
}

export interface DeleteBookResponse {
  status: number;
  message: string;
  timestamp: string;
  path: string;
}

export interface RequestPublishBookResponse {
  status: number;
  message: string;
  timestamp: string;
  path: string;
}

export interface GetBookDetailResponse {
  status: number;
  message: string;
  data: Book;
  timestamp: string;
  path: string;
}

export interface BookItem {
  id: string;
  book_id: string;
  title: string;
  content: string;
  answer: string;
  explanation?: string;
  image?: string;
  order: number;
  estimated_review_seconds: number;
  review_count: number;
  stability?: number | string;
  next_review_at?: string;
  status:
    | "belum_mulai"
    | "start"
    | "menghafal"
    | "interval"
    | "fsrs_active"
    | "graduate"
    | "inactive";
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  items: BookItem[] | null;
  children: Module[];
}

export interface BookTree {
  book_id: string;
  title: string;
  items: BookItem[];
  modules: Module[];
}

export interface GetBookTreeResponse {
  status: number;
  message: string;
  data: BookTree;
  timestamp: string;
  path: string;
}

export interface CreateModulePayload {
  title: string;
  description: string;
  order: number;
  parent_id: string | null;
}

export interface CreatedModule {
  id: string;
  book_id: string;
  title: string;
  description: string;
  order: number;
  created_at: string;
}

export interface CreateModuleResponse {
  status: number;
  message: string;
  data: CreatedModule;
  timestamp: string;
  path: string;
}

export interface UpdateModulePayload {
  title: string;
  description: string;
  order: number;
}

export interface UpdatedModule {
  id: string;
  book_id: string;
  title: string;
  description: string;
  order: number;
  created_at: string;
}

export interface UpdateModuleResponse {
  status: number;
  message: string;
  data: UpdatedModule;
  timestamp: string;
  path: string;
}

export interface DeleteModuleResponse {
  status: number;
  message: string;
  timestamp: string;
  path: string;
}

export interface CreateItemPayload {
  title: string;
  content: string;
  answer: string;
  explanation?: string;
  image?: File | string;
  order: number;
  estimate_value?: number;
  estimate_unit?: string;
}

export interface CreatedItem {
  id: string;
  book_id: string;
  title: string;
  content: string;
  answer: string;
  explanation?: string;
  image?: string;
  order: number;
  estimated_review_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface CreateItemResponse {
  status: number;
  message: string;
  data: CreatedItem;
  timestamp: string;
  path: string;
}

export interface ItemDetail {
  item_id: string;
  source_type: string;
  status: string;
  content_ref: string;
  estimated_review_seconds: number;
  interval_days: number;
  interval_next_review_at: string;
  next_review_at: string;
  stability: number;
  difficulty: number;
  review_count: number;
  book_title: string;
  book_item_title: string;
  question: string;
  answer: string;
  explanation?: string;
  image?: string;
}

export interface GetItemDetailResponse {
  status: number;
  message: string;
  data: ItemDetail;
  timestamp: string;
  path: string;
}

// Raw Item entity returned by GET /items?status=X
// Go's entities.Item has no JSON tags so fields are PascalCase.
// Status "fsrs_active" is serialized as "ujian" by MarshalJSON.
export interface RawItemEntity {
  ID: string;
  OwnerID: string;
  SourceType: string;
  ContentRef: string;
  Status: string; // "menghafal" | "interval" | "ujian" (fsrs_active) | "graduate" | "inactive" | "start"
  IntervalDays: number;
  Stability: number;
  Difficulty: number;
  ReviewCount: number;
  LastReviewAt: string | null;
  NextReviewAt: string | null;
  IntervalNextReviewAt?: string | null;
  EstimatedReviewSeconds: number;
  CreatedAt: string;
}

export interface GetItemsByStatusResponse {
  status: number;
  message: string;
  data: RawItemEntity[];
  timestamp: string;
  path: string;
}

export interface CreateModuleItemPayload {
  book_id: string;
  title: string;
  content: string;
  answer: string;
  explanation?: string;
  image?: File | string;
  order: number;
  estimate_value: number;
  estimate_unit: string;
}

export interface CreatedModuleItem {
  id: string;
  book_id: string;
  module_id: string;
  title: string;
  content: string;
  answer: string;
  explanation?: string;
  image?: string;
  order: number;
  estimated_review_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface CreateModuleItemResponse {
  status: number;
  message: string;
  data: CreatedModuleItem;
  timestamp: string;
  path: string;
}

export interface UpdateItemPayload {
  title: string;
  content: string;
  answer: string;
  explanation?: string;
  image?: File | string;
  order: number;
  estimate_value: number;
  estimate_unit: string;
}

export interface UpdateItemResponse {
  status: number;
  message: string;
  data: CreatedItem;
  timestamp: string;
  path: string;
}

export interface DeleteItemResponse {
  status: number;
  message: string;
  timestamp: string;
  path: string;
}

export interface StartItemPhaseResponse {
  status: number;
  message: string;
  data: CreatedItem;
  timestamp: string;
  path: string;
}

export interface StartIntervalPhaseResponse {
  status: number;
  message: string;
  data: CreatedItem;
  timestamp: string;
  path: string;
}

export interface ActivateFsrsPhaseResponse {
  status: number;
  message: string;
  data: CreatedItem;
  timestamp: string;
  path: string;
}

// Daily Review Types (Books)
export interface BookDailyGenerateResponse {
  count: number;
  task_date: string;
}

export interface BookDailyTask {
  item_id: string;
  source: string;
  state: string;
  task_date: string;
  content_ref: string;
  status?: string;
  book_title?: string;
  book_item_title?: string;
  estimated_review_seconds?: number;
}

export type BookDailyTasksResponse = BookDailyTask[];

export interface BookDailyReviewEstimate {
  item_id: string;
  content_ref: string;
  status: string;
  estimatedReviewSeconds: number;
  book_title?: string;
  book_item_title?: string;
}

export interface BookDailyReviewGroup {
  book_id: string;
  book_title: string;
  itemCount: number;
  totalEstimatedSeconds: number;
  totalEstimatedMinutes: number;
  items: BookDailyReviewEstimate[];
}

export interface ReviewIntervalPayload {
  rating: 1 | 2 | 3;
}

export interface ReviewFsrsPayload {
  rating: 1 | 2 | 3 | 4;
}

export interface ReviewIntervalResponse {
  status: number;
  message: string;
  data: {
    item_id: string;
    status: string;
    rating: number;
    rating_label: string;
    interval_days: number;
    interval_next_review_at: string;
    review_count: number;
    content_ref: string;
  };
  timestamp: string;
  path: string;
}

export interface ReviewFsrsResponse {
  status: number;
  message: string;
  data: {
    item_id: string;
    status: string;
    stability: number;
    difficulty: number;
    next_interval_days: number;
    next_review_at: string | null;
    last_review_at: string | null;
    review_count: number;
    content_ref: string;
    [key: string]: unknown;
  };
  timestamp?: string;
  path?: string;
}

// Parent-grouped review types
export type ParentType = "book" | "module" | "submodule";

export interface ReviewQueueItem {
  item_id: string;
  task: BookDailyTask;
  estimatedSeconds: number;
}

export interface ParentGroup {
  parent_id: string;
  parent_type: ParentType;
  parent_title: string;
  book_id: string;
  book_title: string;
  items: ReviewQueueItem[];
  totalEstimatedSeconds: number;
}
