export interface Book {
  id?: string;           // MongoDB _id
  title: string;
  author: string;
  year?: number;         // Año opcional
  genre: string;
  isAvailable: boolean;
}

export type BookInput = Pick<Book, 'title' | 'author' | 'genre' | 'year'>;

export type MediaType = 'physical' | 'digital';

import { CategoryRef } from '../../features/categories/categories.api';

export interface BookSummary {
  categoryIds?: readonly string[];
  categories?: readonly CategoryRef[];
  id: string;
  title: string;
  subtitle: string | null;
  authors: readonly string[];
  coverUrl: string | null;
  mediaType: MediaType;
  genres: readonly string[];
  availableCopies: number | null;
  totalCopies: number | null;
  reservationCount: number;
  isFavorite: boolean;
  isActive: boolean;
}

export interface BookDetail extends BookSummary {
  isbn: string | null;
  description: string;
  publisher: string | null;
  publishedDate: string | null;
  language: string;
  pageCount: number | null;
  tags: readonly string[];
  createdAt: string;
  updatedAt: string;
}
