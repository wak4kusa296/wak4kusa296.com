import type { EmbedLayout } from "@/lib/embed-layout";
import { escapeHtml } from "@/lib/notion-media-html";

const EMBED_PREFIX = "journal-embed:";

export type EmbedPayload = {
  url: string;
  layout?: EmbedLayout;
};

export function embedMarkdownToken(url: string, layout?: EmbedLayout): string {
  return encodeURIComponent(JSON.stringify({ url, layout }));
}

export function parseEmbedMarkdownToken(href: string | undefined): string | null {
  if (!href?.startsWith(EMBED_PREFIX)) return null;
  try {
    return decodeURIComponent(href.slice(EMBED_PREFIX.length));
  } catch {
    return null;
  }
}

export function embedMarkdown(url: string, layout?: EmbedLayout): string {
  const encoded = escapeHtml(embedMarkdownToken(url, layout));
  return `\n\n<div data-journal-embed="${encoded}"></div>\n\n`;
}

const LEGACY_EMBED_HTML =
  /<figure class="journal-media journal-media--embed">[\s\S]*?<iframe[^>]*\ssrc="([^"]+)"[^>]*>[\s\S]*?<\/figure>/gi;

const LEGACY_VIDEO_EMBED_HTML =
  /<figure class="journal-media journal-media--video">[\s\S]*?<video[^>]*\ssrc="([^"]+)"[^>]*>[\s\S]*?<\/figure>/gi;

function decodeHtmlAttr(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function parseEmbedPayload(encoded: string): EmbedPayload | null {
  try {
    const decoded = decodeURIComponent(encoded);
    if (decoded.startsWith("{")) {
      const json = JSON.parse(decoded) as EmbedPayload;
      if (json?.url) return json;
    }
    if (decoded.startsWith("http://") || decoded.startsWith("https://")) {
      return { url: decoded };
    }
  } catch {
    // legacy token
  }
  return null;
}

export function normalizeJournalEmbeds(content: string): string {
  let normalized = content.replace(LEGACY_EMBED_HTML, (_, src) => embedMarkdown(decodeHtmlAttr(src)));

  normalized = normalized.replace(LEGACY_VIDEO_EMBED_HTML, (match, src) => {
    const url = decodeHtmlAttr(src);
    return isEmbeddableMediaUrl(url) ? embedMarkdown(url) : match;
  });

  normalized = normalized.replace(
    /\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/gi,
    (match, _label, url) => (isEmbeddableMediaUrl(url) ? embedMarkdown(url) : match)
  );

  return normalized;
}

export function isEmbeddableMediaUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com" ||
      host === "youtube-nocookie.com" ||
      host === "youtu.be" ||
      host === "vimeo.com" ||
      host === "player.vimeo.com" ||
      host === "open.spotify.com" ||
      host === "soundcloud.com" ||
      host === "w.soundcloud.com"
    );
  } catch {
    return false;
  }
}
