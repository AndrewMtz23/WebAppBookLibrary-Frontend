import { BookDetail, MediaType } from '../../../shared/models/book.model';

export interface BookManagement { book: BookDetail; digitalResourceUrl: string | null; }
export interface BookWriteRequest {
  title: string; subtitle: string | null; authors: string[]; isbn: string | null;
  description: string; publisher: string | null; publishedDate: string | null;
  language: string; pageCount: number | null; genres: string[]; tags: string[];
  coverUrl: string | null; mediaType: MediaType; digitalResourceUrl: string | null; totalCopies: number | null;
}
export interface StaffBookQuery {
  query: string; genre: string; mediaType: string; language: string; available: string;
  isActive: string; lowStock: string; missingResource: string; sort: string; direction: string;
  page: number; pageSize: number;
}
export const DEFAULT_STAFF_BOOK_QUERY: StaffBookQuery = {
  query: '', genre: '', mediaType: '', language: '', available: '', isActive: '', lowStock: '',
  missingResource: '', sort: 'title', direction: 'asc', page: 1, pageSize: 20
};
