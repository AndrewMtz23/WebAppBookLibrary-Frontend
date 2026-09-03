import { isTokenExpired } from './jwt-token';
const token = (payload: object) => `x.${btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')}.x`;
describe('JWT token utilities', () => {
  it('treats past tokens as expired', () => expect(isTokenExpired(token({ exp: 100 }), 101)).toBeTrue());
  it('accepts future tokens', () => expect(isTokenExpired(token({ exp: 101 }), 100)).toBeFalse());
  it('rejects malformed tokens', () => expect(isTokenExpired('not-a-jwt', 100)).toBeTrue());
});
