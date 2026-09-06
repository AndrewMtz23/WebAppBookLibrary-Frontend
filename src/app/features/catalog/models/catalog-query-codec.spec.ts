import { convertToParamMap } from '@angular/router';
import { DEFAULT_CATALOG_QUERY } from './catalog-query';
import { parseCatalogQuery, serializeCatalogQuery } from './catalog-query-codec';

describe('catalog query codec', () => {
  it('normalizes malformed and incompatible URL values', () => {
    const result = parseCatalogQuery(convertToParamMap({
      query: ' x ', page: '-2', pageSize: '999', mediaType: 'digital',
      available: 'true', sort: 'unknown', direction: 'sideways'
    }));

    expect(result).toEqual({ ...DEFAULT_CATALOG_QUERY, mediaType: 'digital' });
  });

  it('serializes non-default state into shareable parameters', () => {
    const params = serializeCatalogQuery({
      ...DEFAULT_CATALOG_QUERY,
      query: 'Umberto Eco', genre: 'Historia', page: 3,
      sort: 'title', direction: 'asc'
    });

    expect(params).toEqual({ query: 'Umberto Eco', genre: 'Historia', page: 3, sort: 'title', direction: 'asc' });
    expect(parseCatalogQuery(convertToParamMap(params))).toEqual({
      ...DEFAULT_CATALOG_QUERY,
      query: 'Umberto Eco', genre: 'Historia', page: 3,
      sort: 'title', direction: 'asc'
    });
  });
});
