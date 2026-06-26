export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function toEmbedUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      const embedId = parsed.pathname.match(/^\/embed\/([^/?]+)/)?.[1];
      if (embedId) return `https://www.youtube.com/embed/${embedId}`;

      const shortsId = parsed.pathname.match(/^\/shorts\/([^/?]+)/)?.[1];
      if (shortsId) return `https://www.youtube.com/embed/${shortsId}`;

      const liveId = parsed.pathname.match(/^\/live\/([^/?]+)/)?.[1];
      if (liveId) return `https://www.youtube.com/embed/${liveId}`;

      const id = parsed.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (host === "vimeo.com") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    if (host === "open.spotify.com") {
      const path = parsed.pathname.startsWith("/embed/")
        ? parsed.pathname
        : parsed.pathname.replace(/^\//, "/embed/");
      return `https://open.spotify.com${path}`;
    }
    if (host === "soundcloud.com") {
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23222222&auto_play=false&hide_related=true&show_comments=false`;
    }

    return url;
  } catch {
    return url;
  }
}

export function isAudioFileUrl(url: string): boolean {
  const path = url.split("?")[0].toLowerCase();
  return /\.(mp3|wav|ogg|m4a|aac|flac|opus)$/.test(path);
}

type NotionFileContent = {
  type: string;
  caption?: Array<{ plain_text: string }>;
  external?: { url: string };
  file?: { url: string };
};

export function notionFileUrl(content: NotionFileContent): string {
  if (content.type === "external") return content.external?.url ?? "";
  if (content.type === "file") return content.file?.url ?? "";
  return "";
}

export function notionCaption(content: { caption?: Array<{ plain_text: string }> }): string {
  return (content.caption ?? []).map((item) => item.plain_text).join("").trim();
}

export function imageFigureHtml(src: string, alt: string, caption?: string): string {
  const cap = caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : "";
  return `<figure class="journal-media journal-media--image"><img src="${escapeHtml(src)}" alt="${escapeHtml(alt || "image")}" loading="lazy" decoding="async" />${cap}</figure>`;
}

export function videoFigureHtml(src: string, caption?: string): string {
  const cap = caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : "";
  return `<figure class="journal-media journal-media--video"><video controls playsinline preload="metadata" src="${escapeHtml(src)}"></video>${cap}</figure>`;
}

export function audioFigureHtml(src: string, caption?: string): string {
  const cap = caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : "";
  return `<figure class="journal-media journal-media--audio"><audio controls preload="metadata" src="${escapeHtml(src)}"></audio>${cap}</figure>`;
}

export function fileLinkMarkdown(title: string, href: string): string {
  return `[${title.replace(/\[/g, "\\[").replace(/\]/g, "\\]")}](${href})`;
}
