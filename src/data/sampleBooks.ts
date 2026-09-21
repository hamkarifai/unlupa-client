import { Book, Chapter, BookItem } from '../types';

export const INITIAL_BOOKS: Book[] = [];

export const INITIAL_CHAPTERS: Chapter[] = [];

export const INITIAL_ITEMS: BookItem[] = [];

export interface LibraryEntry {
  id: string;
  book: Book;
  chapters: Chapter[];
  items: BookItem[];
  downloads: number;
  rating: number;
  curator: string;
  verified: boolean;
}

export const CURATED_LIBRARY: LibraryEntry[] = [];
