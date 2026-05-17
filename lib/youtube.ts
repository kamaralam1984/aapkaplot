/**
 * YouTube channel RSS reader — free, no API key.
 *
 * YouTube exposes a public Atom feed at:
 *   https://www.youtube.com/feeds/videos.xml?channel_id=<UC...>
 *
 * Returns up to 15 most recent uploads. In-memory cached for 1 hour so we
 * don't hammer YouTube on every home-page render.
 */

export interface YouTubeVideo {
  id: string;            // 11-char video id
  title: string;
  url: string;
  publishedAt: string;   // ISO
  thumbnailUrl: string;  // hq image
  channelName: string;
}

export const YOUTUBE_CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || "UCFFYOHviTmLTgFgME-Ft0PQ";
export const YOUTUBE_CHANNEL_URL = "https://www.youtube.com/@aapkaplot";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
let cache: { at: number; data: YouTubeVideo[] } | null = null;

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function pick(xml: string, tag: string, after = 0): { value: string; end: number } | null {
  const open = xml.indexOf(`<${tag}`, after);
  if (open < 0) return null;
  const gt = xml.indexOf(">", open);
  if (gt < 0) return null;
  const close = xml.indexOf(`</${tag}>`, gt);
  if (close < 0) return null;
  return { value: decode(xml.slice(gt + 1, close).trim()), end: close + tag.length + 3 };
}

function pickAttr(xml: string, tag: string, attr: string, after = 0): string | null {
  const re = new RegExp(`<${tag}\\b[^>]*\\b${attr}="([^"]+)"`, "g");
  re.lastIndex = after;
  const m = re.exec(xml);
  return m ? m[1] : null;
}

export async function fetchChannelVideos(limit = 8): Promise<YouTubeVideo[]> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.data.slice(0, limit);
  }

  try {
    const res = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(YOUTUBE_CHANNEL_ID)}`,
      {
        // Atom XML — cache at edge level too.
        next: { revalidate: 3600 },
        headers: { "User-Agent": "AapKaPlot/1.0 (channel-feed)" },
        signal: AbortSignal.timeout(8_000),
      }
    );
    if (!res.ok) return cache?.data ?? [];
    const xml = await res.text();

    // Top-level channel name (first <title> before any <entry>).
    const firstEntry = xml.indexOf("<entry>");
    const channelHead = firstEntry > 0 ? xml.slice(0, firstEntry) : xml;
    const channelName = pick(channelHead, "title")?.value ?? "AapKaPlot";

    const videos: YouTubeVideo[] = [];
    let cursor = firstEntry < 0 ? xml.length : firstEntry;
    while (cursor < xml.length && videos.length < 15) {
      const start = xml.indexOf("<entry>", cursor);
      if (start < 0) break;
      const end = xml.indexOf("</entry>", start);
      if (end < 0) break;
      const block = xml.slice(start, end);
      cursor = end + 8;

      const id = pick(block, "yt:videoId")?.value;
      const title = pick(block, "title")?.value;
      const published = pick(block, "published")?.value;
      const thumb = pickAttr(block, "media:thumbnail", "url");
      if (!id || !title) continue;

      videos.push({
        id,
        title,
        url: `https://www.youtube.com/watch?v=${id}`,
        publishedAt: published ?? new Date().toISOString(),
        thumbnailUrl: thumb ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        channelName,
      });
    }

    cache = { at: Date.now(), data: videos };
    return videos.slice(0, limit);
  } catch (err) {
    console.warn("[youtube] fetch_failed", (err as Error).message);
    return cache?.data ?? [];
  }
}
