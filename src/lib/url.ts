const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/**
 * Encode a URL path so that spaces and special characters in file names
 * (e.g. "ChatGPT Image May 26, 2026, 10_37_06 PM.png") become valid URL
 * segments while preserving path separators (/), dots, and already-encoded
 * percent sequences.
 */
function encodeUrlPath(path: string): string {
  // Split on '/' to keep path separators intact, encode each segment
  // separately.  encodeURIComponent handles spaces, commas, parens, etc.
  // while leaving dots and other safe characters alone.
  return path
    .split('/')
    .map((segment) => {
      // Skip already-encoded segments to avoid double-encoding.
      const decoded = decodeURIComponent(segment);
      return encodeURIComponent(decoded);
    })
    .join('/');
}

export function url(path: string): string {
  if (!path || path.startsWith('http') || path.startsWith('//') || path.startsWith('#')) return path;
  const normalised = path.startsWith('/') ? path : `/${path}`;
  return base + encodeUrlPath(normalised);
}
