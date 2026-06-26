import type { Client } from "@notionhq/client";
import type { NotionToMarkdown } from "notion-to-md";
import {
  audioFigureHtml,
  fileLinkMarkdown,
  imageFigureHtml,
  isAudioFileUrl,
  notionCaption,
  notionFileUrl,
  videoFigureHtml,
} from "@/lib/notion-media-html";
import { embedMarkdown, isEmbeddableMediaUrl } from "@/lib/journal-embed-markdown";
import { resolveBlockEmbedLayout } from "@/lib/notion-block-layout";
import { renderNotionTableHtml } from "@/lib/notion-table-html";

type NotionMediaBlock = {
  image?: Parameters<typeof notionFileUrl>[0];
  video?: Parameters<typeof notionFileUrl>[0];
  audio?: Parameters<typeof notionFileUrl>[0];
  file?: Parameters<typeof notionFileUrl>[0];
  embed?: Parameters<typeof notionFileUrl>[0] & { url?: string };
};

function fileTitle(content: Parameters<typeof notionFileUrl>[0], link: string, fallback: string): string {
  const caption = notionCaption(content);
  if (caption) return caption;
  const matches = link.match(/[^/\\&?]+\.\w{3,4}(?=([?&].*$|$))/);
  return matches?.[0] ?? fallback;
}

export function configureJournalNotionToMarkdown(n2m: NotionToMarkdown, notion: Client) {
  n2m.setCustomTransformer("image", async (block) => {
    const content = (block as NotionMediaBlock).image;
    if (!content) return "";
    const src = notionFileUrl(content);
    if (!src) return "";

    const caption = notionCaption(content);
    let alt = "image";
    if (caption) {
      alt = caption;
    } else {
      const matches = src.match(/[^/\\&?]+\.\w{3,4}(?=([?&].*$|$))/);
      alt = matches?.[0] ?? alt;
    }

    return `\n\n${imageFigureHtml(src, alt, caption || undefined)}\n\n`;
  });

  n2m.setCustomTransformer("video", async (block) => {
    const content = (block as NotionMediaBlock).video;
    if (!content) return "";
    const src = notionFileUrl(content);
    if (!src) return "";
    if (isEmbeddableMediaUrl(src)) {
      const layout = await resolveBlockEmbedLayout(block, src);
      return embedMarkdown(src, layout);
    }
    return `\n\n${videoFigureHtml(src, notionCaption(content) || undefined)}\n\n`;
  });

  n2m.setCustomTransformer("audio", async (block) => {
    const content = (block as NotionMediaBlock).audio;
    if (!content) return "";
    const src = notionFileUrl(content);
    if (!src) return "";
    return `\n\n${audioFigureHtml(src, notionCaption(content) || undefined)}\n\n`;
  });

  n2m.setCustomTransformer("embed", async (block) => {
    const embed = (block as NotionMediaBlock).embed;
    const url = embed?.url ?? "";
    if (!url) return "";
    const layout = await resolveBlockEmbedLayout(block, url);
    return embedMarkdown(url, layout);
  });

  n2m.setCustomTransformer("file", async (block) => {
    const content = (block as NotionMediaBlock).file;
    if (!content) return "";
    const src = notionFileUrl(content);
    if (!src) return "";

    if (isAudioFileUrl(src)) {
      return `\n\n${audioFigureHtml(src, notionCaption(content) || undefined)}\n\n`;
    }

    return fileLinkMarkdown(fileTitle(content, src, "file"), src);
  });

  n2m.setCustomTransformer("table", async (block) => {
    return renderNotionTableHtml(block as { id: string; table?: { has_column_header?: boolean; has_row_header?: boolean } }, notion);
  });

  return n2m;
}
