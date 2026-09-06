import { ParamMap, Params } from '@angular/router';
import { CatalogQuery, CatalogSort, DEFAULT_CATALOG_QUERY, SortDirection } from './catalog-query';

const SORTS = new Set<CatalogSort>(['createdAt', 'title', 'publishedDate', 'reservationCount']);

export function parseCatalogQuery(params: ParamMap): CatalogQuery {
  const mediaType = params.get('mediaType');
  const query = clean(params.get('query'));
  const parsedMedia = mediaType === 'physical' || mediaType === 'digital' ? mediaType : null;
  const sort = params.get('sort');
  const direction = params.get('direction');
  return {
    query: query && query.length >= 2 ? query : null,
    genre: clean(params.get('genre')),
    mediaType: parsedMedia,
    language: clean(params.get('language')),
    available: parsedMedia === 'digital' ? null : parseBoolean(params.get('available')),
    page: positiveInteger(params.get('page'), 1, 1, Number.MAX_SAFE_INTEGER),
    pageSize: positiveInteger(params.get('pageSize'), 20, 1, 100),
    sort: SORTS.has(sort as CatalogSort) ? sort as CatalogSort : 'createdAt',
    direction: direction === 'asc' || direction === 'desc' ? direction as SortDirection : 'desc'
  };
}

export function serializeCatalogQuery(query: CatalogQuery): Params {
  const params: Params = {};
  if (query.query) params['query'] = query.query;
  if (query.genre) params['genre'] = query.genre;
  if (query.mediaType) params['mediaType'] = query.mediaType;
  if (query.language) params['language'] = query.language;
  if (query.available !== null && query.mediaType !== 'digital') params['available'] = query.available;
  if (query.page !== DEFAULT_CATALOG_QUERY.page) params['page'] = query.page;
  if (query.pageSize !== DEFAULT_CATALOG_QUERY.pageSize) params['pageSize'] = query.pageSize;
  if (query.sort !== DEFAULT_CATALOG_QUERY.sort) params['sort'] = query.sort;
  if (query.direction !== DEFAULT_CATALOG_QUERY.direction) params['direction'] = query.direction;
  return params;
}

const clean = (value: string | null): string | null => value?.trim() || null;

function parseBoolean(value: string | null): boolean | null {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
}

function positiveInteger(value: string | null, fallback: number, minimum: number, maximum: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= minimum && parsed <= maximum ? parsed : fallback;
}
