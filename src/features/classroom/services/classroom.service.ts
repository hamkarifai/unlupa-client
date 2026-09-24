import type {
  ClassBookStudentProgress,
  ClassItem,
  ClassMember,
  CreateClassPayload,
  GetClassBook,
  GraduationActionResponse,
  JoinClassPayload,
  PendingGraduation,
  RemoveBookFromClassResponse,
  StudentProgress,
  UpdateClassPayload,
} from "../types";
import { api } from "@/services/api";

export const classroomService = {
  // GET my Classes (for teacher)
  getMyClassesTeacher: async (): Promise<ClassItem[]> => {
    const response = await api.get(`/api/v1/classes`);
    return response.data.data;
  },

  // CREATE CLASS (for teacher)
  createClass: async (payload: CreateClassPayload): Promise<ClassItem> => {
    if (payload.cover_image instanceof File) {
      const formData = new FormData();
      formData.append("name", payload.name);
      formData.append("description", payload.description);
      formData.append("type", payload.type);
      formData.append("cover_image", payload.cover_image);

      const response = await api.post(`/api/v1/classes`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data.data;
    }

    const response = await api.post(`/api/v1/classes`, payload);
    return response.data.data;
  },

  // UPDATE CLASS (for teacher)
  updateClass: async (
    classId: string,
    payload: UpdateClassPayload,
  ): Promise<ClassItem> => {
    const formData = new FormData();

    if (payload.name) {
      formData.append("name", payload.name);
    }

    if (payload.description !== undefined) {
      formData.append("description", payload.description);
    }

    if (payload.cover_image instanceof File) {
      formData.append("cover_image", payload.cover_image);
    }

    const response = await api.put(`/api/v1/classes/${classId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data.data;
  },

  // DELETE CLASS (for teacher)
  deleteClass: async (classId: string): Promise<ClassItem[]> => {
    const response = await api.delete(`/api/v1/classes/${classId}`);
    return response.data.data;
  },

  // GET MY JOINED CLASS
  getMyJoinedClass: async (): Promise<ClassItem[]> => {
    const response = await api.get(`/api/v1/classes/joined`);
    return response.data.data;
  },

  // JOIN CLASS
  joinClass: async (payload: JoinClassPayload): Promise<ClassItem[]> => {
    const response = await api.post(`/api/v1/classes/join`, payload);
    return response.data.data;
  },

  // LEAVE CLASS (for student)
  leaveClass: async (classId: string): Promise<any> => {
    const response = await api.delete(`/api/v1/classes/${classId}/leave`);
    return response.data;
  },

  // GET CLASS MEMBER (TEACHER)
  getClassMember: async (classId: string): Promise<ClassMember[]> => {
    const response = await api.get(`/api/v1/classes/${classId}/members`);
    return response.data.data;
  },

  // GET CLASS BOOK (STUDENT/TEACHER)
  getClassBook: async (classId: string): Promise<GetClassBook[]> => {
    const response = await api.get(`/api/v1/classes/${classId}/books`);
    return response.data.data;
  },

  // ADD BOOK TO CLASS (TEACHER)
  addBookToClass: async (
    classId: string,
    payload: { book_id: string; order: number },
  ): Promise<any> => {
    const response = await api.post(
      `/api/v1/classes/${classId}/books`,
      payload,
    );
    return response.data.data;
  },

  // CREATE BOOK IN CLASS (TEACHER)
  createBookInClass: async (
    classId: string,
    payload: {
      title: string;
      description?: string;
      order?: number;
      cover_image?: File;
    },
  ): Promise<GetClassBook> => {
    const formData = new FormData();
    formData.append("title", payload.title);
    if (payload.description) {
      formData.append("description", payload.description);
    }
    if (payload.order !== undefined) {
      formData.append("order", payload.order.toString());
    }
    if (payload.cover_image instanceof File) {
      formData.append("cover_image", payload.cover_image);
    }

    const response = await api.post(
      `/api/v1/classes/${classId}/books/create`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data.data;
  },

  // REMOVE BOOK FROM CLASS (TEACHER)
  removeBookFromClass: async (
    classId: string,
    bookId: string,
  ): Promise<RemoveBookFromClassResponse> => {
    const response = await api.delete(
      `/api/v1/classes/${classId}/books/${bookId}`,
    );
    return response.data.data;
  },

  // GET PENDING GRADUATIONS (TEACHER)
  getPendingGraduations: async (
    classId: string,
  ): Promise<PendingGraduation[]> => {
    const response = await api.get(
      `/api/v1/classes/${classId}/graduations/pending`,
    );
    return response.data.data;
  },

  // APPROVE GRADUATION (TEACHER)
  approveGraduation: async (
    classId: string,
    itemId: string,
  ): Promise<GraduationActionResponse> => {
    const response = await api.post(
      `/api/v1/classes/${classId}/graduations/${itemId}/approve`,
    );
    return response.data;
  },

  // REJECT GRADUATION (TEACHER)
  rejectGraduation: async (
    classId: string,
    itemId: string,
  ): Promise<GraduationActionResponse> => {
    const response = await api.post(
      `/api/v1/classes/${classId}/graduations/${itemId}/reject`,
    );
    return response.data;
  },

  // GET STUDENT PROGRESS (TEACHER - QURAN CLASS)
  getStudentProgress: async (classId: string): Promise<StudentProgress[]> => {
    const response = await api.get(`/api/v1/classes/${classId}/progress`);
    return response.data.data;
  },

  // GET CLASS BOOK STUDENT PROGRESS (TEACHER - BOOK CLASS)
  getClassBookStudentProgress: async (
    classId: string,
    bookId: string,
  ): Promise<ClassBookStudentProgress> => {
    const response = await api.get(
      `/api/v1/classes/${classId}/books/${bookId}/progress`,
    );
    return response.data.data;
  },
};
