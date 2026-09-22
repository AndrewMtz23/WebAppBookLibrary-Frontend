import { MediaType } from '../../../shared/models/book.model';

export type CatalogSort = 'createdAt' | 'title' | 'publishedDate' | 'reservationCount' | 'relevance';
export type SortDirection = 'asc' | 'desc';

export interface CatalogQuery {
  query: string | null;
  categoryId?: string | null;
  genre: string | null;
  mediaType: MediaType | null;
  language: string | null;
  available: boolean | null;
  page: number;
  pageSize: number;
  sort: CatalogSort;
  direction: SortDirection;
}

export const DEFAULT_CATALOG_QUERY: CatalogQuery = {
  query: null,
  categoryId: null,
  genre: null,
  mediaType: null,
  language: null,
  available: null,
  page: 1,
  pageSize: 20,
  sort: 'createdAt',
  direction: 'desc'
};
