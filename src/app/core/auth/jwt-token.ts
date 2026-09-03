export function getTokenExpiration(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '=');
    const exp = JSON.parse(atob(normalized)).exp;
    return typeof exp === 'number' && Number.isFinite(exp) ? exp : null;
  } catch { return null; }
}

export function isTokenExpired(token: string, nowSeconds = Math.floor(Date.now() / 1000)): boolean {
  const expiration = getTokenExpiration(token);
  return expiration === null || expiration <= nowSeconds;
}
