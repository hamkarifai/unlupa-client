import { api } from "@/lib/axios";
import type {
  CreateBookPayload,
  CreateBookResponse,
  GetBooksResponse,
  GetMyCollectionResponse,
  GetBookDetailResponse,
  GetBookTreeResponse,
  CreateModulePayload,
  CreateModuleResponse,
  UpdateBookPayload,
  UpdateBookResponse,
  DeleteBookResponse,
  RequestPublishBookResponse,
  UpdateModulePayload,
  UpdateModuleResponse,
  DeleteModuleResponse,
  CreateItemPayload,
  CreateItemResponse,
  GetItemDetailResponse,
  GetItemsByStatusResponse,
  CreateModuleItemPayload,
  CreateModuleItemResponse,
  UpdateItemPayload,
  UpdateItemResponse,
  DeleteItemResponse,
  StartItemPhaseResponse,
  StartIntervalPhaseResponse,
  ActivateFsrsPhaseResponse,
  BookDailyGenerateResponse,
  BookDailyTasksResponse,
  ReviewIntervalPayload,
  ReviewIntervalResponse,
  ReviewFsrsPayload,
  ReviewFsrsResponse,
} from "../types/personal.types";

const getImageValue = (data: unknown): string | undefined => {
  if (!data || typeof data !== "object") return undefined;

  const record = data as Record<string, unknown>;
  const value =
    record.image ??
    record.Image ??
    record.image_url ??
    record.imageUrl ??
    record.image_path ??
    record.imagePath;

  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

const normalizeImageUrl = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  if (/^(https?:|blob:|data:)/i.test(value)) return value;

  const baseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (!baseUrl) return value;

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return value;
  }
};

const normalizeItemImage = <T>(item: T): T => {
  if (!item || typeof item !== "object") return item;

  const image = normalizeImageUrl(getImageValue(item));
  if (!image) return item;

  return { ...item, image };
};

const normalizeModulesItemImages = <
  T extends { items?: unknown; children?: T[] },
>(
  modules: T[] | null | undefined,
): T[] => {
  if (!modules) return modules ?? [];

  return modules.map((module) => ({
    ...module,
    items: Array.isArray(module.items)
      ? module.items.map((item) => normalizeItemImage(item))
      : module.items,
    children: normalizeModulesItemImages(module.children),
  }));
};

const normalizeBookTreeItemImages = (tree: GetBookTreeResponse["data"]) => ({
  ...tree,
  items: tree.items.map((item) => normalizeItemImage(item)),
  modules: normalizeModulesItemImages(tree.modules),
});

const toItemFormData = (
  data: CreateItemPayload | CreateModuleItemPayload | UpdateItemPayload,
) => {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (key === "image") {
      if (value instanceof File) {
        formData.append("image", value);
      }
      return;
    }

    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });

  return formData;
};

export const personalService = {
  async getBooks(): Promise<GetBooksResponse> {
    const response = await api.get("/api/v1/books");
    return response.data;
  },

  async getMyCollection(): Promise<GetMyCollectionResponse> {
    const response = await api.get("/api/v1/books/my-collection");
    return response.data;
  },

  async removeFromMyCollection(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/api/v1/books/my-collection/${id}`);
    return response.data;
  },

  async getPublishedBooks(): Promise<GetBooksResponse> {
    const response = await api.get("/api/v1/books/published");
    return response.data;
  },

  async addPublishedBookToMyBooks(id: string): Promise<CreateBookResponse> {
    const response = await api.post(`/api/v1/books/published/${id}/add-to-my-books`);
    return response.data;
  },

  async getBookById(id: string): Promise<GetBookDetailResponse> {
    const response = await api.get(`/api/v1/books/${id}`);
    return response.data;
  },

  async getBookTree(bookId: string): Promise<GetBookTreeResponse> {
    const response = await api.get(`/api/v1/books/${bookId}/tree`);
    response.data.data = normalizeBookTreeItemImages(response.data.data);
    return response.data;
  },

  async createModule(
    bookId: string,
    payload: CreateModulePayload,
  ): Promise<CreateModuleResponse> {
    const response = await api.post(`/api/v1/books/${bookId}/modules`, payload);
    return response.data;
  },

  async updateModule(
    moduleId: string,
    payload: UpdateModulePayload,
  ): Promise<UpdateModuleResponse> {
    const response = await api.put(
      `/api/v1/books/modules/${moduleId}`,
      payload,
    );
    return response.data;
  },

  async deleteModule(moduleId: string): Promise<DeleteModuleResponse> {
    const response = await api.delete(`/api/v1/books/modules/${moduleId}`);
    return response.data;
  },

  async createItem(
    bookId: string,
    payload: CreateItemPayload,
  ): Promise<CreateItemResponse> {
    const response = await api.post(
      `/api/v1/books/${bookId}/items`,
      toItemFormData(payload),
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    response.data.data = normalizeItemImage(response.data.data);
    return response.data;
  },

  async createModuleItem(
    moduleId: string,
    payload: CreateModuleItemPayload,
  ): Promise<CreateModuleItemResponse> {
    const response = await api.post(
      `/api/v1/books/modules/${moduleId}/items`,
      toItemFormData(payload),
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    response.data.data = normalizeItemImage(response.data.data);
    return response.data;
  },

  async getItemDetail(itemId: string): Promise<GetItemDetailResponse> {
    const response = await api.get(`/api/v1/items/${itemId}`);
    response.data.data = normalizeItemImage(response.data.data);
    return response.data;
  },

  async createBook(data: CreateBookPayload): Promise<CreateBookResponse> {
    if (data.cover_image instanceof File) {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("cover_image", data.cover_image);

      const response = await api.post("/api/v1/books", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    }

    const { cover_image, ...rest } = data;
    const response = await api.post("/api/v1/books", rest);
    return response.data;
  },

  async updateBook(
    id: string,
    data: UpdateBookPayload,
  ): Promise<UpdateBookResponse> {
    if (data.cover_image instanceof File) {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("cover_image", data.cover_image);

      const response = await api.put(`/api/v1/books/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    }

    const { cover_image, ...rest } = data;
    const response = await api.put(`/api/v1/books/${id}`, rest);
    return response.data;
  },

  async deleteBook(id: string): Promise<DeleteBookResponse> {
    const response = await api.delete(`/api/v1/books/${id}`);
    return response.data;
  },

  async requestPublishBook(id: string): Promise<RequestPublishBookResponse> {
    const response = await api.post(`/api/v1/books/${id}/request-publish`);
    return response.data;
  },

  async updateItem(
    itemId: string,
    data: UpdateItemPayload,
  ): Promise<UpdateItemResponse> {
    const response = await api.put(
      `/api/v1/books/items/${itemId}`,
      toItemFormData(data),
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    response.data.data = normalizeItemImage(response.data.data);
    return response.data;
  },

  async deleteItem(itemId: string): Promise<DeleteItemResponse> {
    const response = await api.delete(`/api/v1/books/items/${itemId}`);
    return response.data;
  },

  async startItemPhase(
    bookId: string,
    itemId: string,
  ): Promise<StartItemPhaseResponse> {
    const response = await api.post(
      `/api/v1/books/${bookId}/items/${itemId}/start`,
    );
    return response.data;
  },

  async startIntervalPhase(
    _bookId: string,
    itemId: string,
    intervalDays: number,
  ): Promise<StartIntervalPhaseResponse> {
    const response = await api.post(`/api/v1/items/${itemId}/start-interval`, {
      interval_days: intervalDays,
    });
    return response.data;
  },

  async activateFsrsPhase(
    _bookId: string,
    itemId: string,
  ): Promise<ActivateFsrsPhaseResponse> {
    const response = await api.post(`/api/v1/items/${itemId}/activate-fsrs`);
    return response.data;
  },

  async deactivateItem(itemId: string): Promise<ActivateFsrsPhaseResponse> {
    const response = await api.post(`/api/v1/items/${itemId}/deactivate`);
    return response.data;
  },

  async reactivateItem(itemId: string): Promise<ActivateFsrsPhaseResponse> {
    const response = await api.post(`/api/v1/items/${itemId}/reactivate`);
    return response.data;
  },

  // Daily Review (Books) API methods
  async generateDailyBooks(): Promise<BookDailyGenerateResponse> {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const response = await api.post(`/api/v1/daily/generate?date=${dateStr}`);
    return response.data;
  },

  async getDailyBooks(group: "book"): Promise<BookDailyTasksResponse> {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const response = await api.get(
      `/api/v1/daily?date=${dateStr}&group=${group}`,
    );
    return response.data;
  },

  async reviewIntervalBook(
    itemId: string,
    payload: ReviewIntervalPayload,
  ): Promise<ReviewIntervalResponse> {
    const response = await api.post(
      `/api/v1/items/${itemId}/review-interval`,
      payload,
    );
    return response.data;
  },

  async reviewFsrsBook(
    itemId: string,
    payload: ReviewFsrsPayload,
  ): Promise<ReviewFsrsResponse> {
    const response = await api.post(`/api/v1/items/${itemId}/review`, payload);
    return response.data;
  },

  async getItemsByStatus(status: string): Promise<GetItemsByStatusResponse> {
    const response = await api.get(`/api/v1/items`, { params: { status } });
    return response.data;
  },

  async generateAIBook(payload: { topic?: string; text?: string; language?: string }): Promise<{ status: number; message: string; data: { book: any } }> {
    const response = await api.post("/api/v1/ai/generate-book", payload, {
      timeout: 120000,
    });
    return response.data;
  },

  async generateAICards(payload: { topic?: string; text?: string; language?: string }): Promise<{ status: number; message: string; data: { cards: any[] } }> {
    const response = await api.post("/api/v1/ai/generate-cards", payload, {
      timeout: 120000,
    });
    return response.data;
  },
};
