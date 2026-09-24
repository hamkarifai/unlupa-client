import { api } from '@/lib/axios';
import type { Book } from '@/features/personal/types/personal.types';

export const adminService = {
  /**
   * Fetch pending books awaiting admin approval.
   */
  async fetchPendingBooks() {
    const response = await api.get('/api/v1/admin/books/pending');
    // Assuming the API returns data under response.data.data
    return response.data as { status: number; message: string; data: Book[] };
  },

  /**
   * Approve a pending book.
   * @param bookId ID of the book to approve.
   */
  async approveBook(bookId: string) {
    const response = await api.post(`/api/v1/admin/books/${bookId}/approve`);
    return response.data as { status: number; message: string; data: Book };
  },

  /**
   * Reject a pending book.
   * @param bookId ID of the book to reject.
   */
  async rejectBook(bookId: string) {
    const response = await api.post(`/api/v1/admin/books/${bookId}/reject`);
    return response.data as { status: number; message: string; data: Book };
  },

  /**
   * Delete a published book from library (Admin only).
   * @param bookId ID of the published book to delete.
   */
  async deletePublishedBook(bookId: string) {
    const response = await api.delete(`/api/v1/admin/books/${bookId}`);
    return response.data as { status: number; message: string };
  },
};
