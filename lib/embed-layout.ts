/** Notion ページ本文の基準幅（px） */
export const NOTION_PAGE_CONTENT_WIDTH = 708;

export type EmbedLayout = {
  width?: number;
  height?: number;
  aspectRatio?: number;
  fullWidth?: boolean;
  pageWidth?: boolean;
};

type NoembedResponse = {
  width?: number;
  height?: number;
  error?: string;
};

async function fetchNoembed(url: string): Promise<NoembedResponse | null> {
  try {
    const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as NoembedResponse;
    if (data.error || !data.width || !data.height) return null;
    return data;
  } catch {
    return null;
  }
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export async function resolveEmbedLayout(url: string): Promise<EmbedLayout> {
  const host = hostOf(url);

  if (host.includes("youtube.com") || host === "youtu.be" || host === "youtube-nocookie.com") {
    return { pageWidth: true, aspectRatio: 16 / 9 };
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    return { pageWidth: true, aspectRatio: 16 / 9 };
  }
  if (host === "open.spotify.com") {
    return { pageWidth: true, height: 152 };
  }
  if (host === "soundcloud.com" || host === "w.soundcloud.com") {
    return { pageWidth: true, height: 166 };
  }

  const oembed = await fetchNoembed(url);
  if (oembed?.width && oembed?.height && oembed.height >= 120) {
    return {
      pageWidth: true,
      width: oembed.width,
      height: oembed.height,
      aspectRatio: oembed.width / oembed.height,
    };
  }

  // 汎用 iframe（Notion のデフォルトに近い高さ）
  return { pageWidth: true, height: 800 };
}

export function embedFigureWidth(layout?: EmbedLayout): string | undefined {
  if (!layout?.width || layout.fullWidth || layout.pageWidth) return undefined;
  const ratio = Math.min(1, layout.width / NOTION_PAGE_CONTENT_WIDTH);
  return `${Math.round(ratio * 1000) / 10}%`;
}
