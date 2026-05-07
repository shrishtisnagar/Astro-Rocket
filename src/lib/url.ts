const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export function url(path: string): string {
  if (!path || path.startsWith('http') || path.startsWith('//') || path.startsWith('#')) return path;
  return base + (path.startsWith('/') ? path : `/${path}`);
}
