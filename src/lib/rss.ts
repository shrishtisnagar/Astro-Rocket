import { XMLParser } from 'fast-xml-parser';

const FEED_URL = 'https://rss.beehiiv.com/feeds/4QLi1kVyqJ.xml';

export interface RSSPost {
  title: string;
  description: string;
  href: string;
  publishedAt: Date;
  tags: string[];
  author?: string;
  imageUrl?: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function truncate(text: string, max = 200): string {
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, '') + '…';
}

export async function fetchRSSPosts(): Promise<RSSPost[]> {
  try {
    const res = await fetch(FEED_URL);
    if (!res.ok) return [];
    const xml = await res.text();

    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
    const parsed = parser.parse(xml);
    const channel = parsed?.rss?.channel;
    if (!channel) return [];

    const items = channel.item ?? [];
    const list = Array.isArray(items) ? items : [items];

    return list.map((item: Record<string, unknown>) => {
      const rawDesc = String(item['content:encoded'] ?? item.description ?? '');
      const description = truncate(stripHtml(rawDesc));

      const mediaContent = item['media:content'] as Record<string, string> | undefined;
      const enclosure = item.enclosure as Record<string, string> | undefined;
      const imageUrl = mediaContent?.['@_url'] ?? enclosure?.['@_url'] ?? undefined;

      const rawCats = item.category ?? [];
      const tags = (Array.isArray(rawCats) ? rawCats : [rawCats]).map(String).filter(Boolean);

      return {
        title: String(item.title ?? ''),
        description,
        href: String(item.link ?? ''),
        publishedAt: new Date(String(item.pubDate ?? Date.now())),
        tags,
        author: item['dc:creator'] ? String(item['dc:creator']) : undefined,
        imageUrl,
      };
    });
  } catch {
    return [];
  }
}
