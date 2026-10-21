export function copyUrl(id: string, origin: string): string {
  if (!/^[a-f0-9]{24}$/.test(id)) throw new Error('Invalid copy identifier');
  return new URL('/librarian/copies/' + id, origin).href;
}
export function parseCopyInput(value: string, origin: string): { kind: 'id' | 'code'; value: string } | null {
  const input = value.trim();
  if (/^[a-zA-Z0-9-]{3,64}$/.test(input)) return { kind: 'code', value: input.toUpperCase() };
  try {
    const url = new URL(input);
    if (url.origin !== new URL(origin).origin || url.username || url.password || url.search || url.hash) return null;
    const match = /^\/librarian\/copies\/([a-f0-9]{24})$/.exec(url.pathname);
    return match ? { kind: 'id', value: match[1] } : null;
  } catch { return null; }
}
