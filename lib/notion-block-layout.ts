import type { EmbedLayout } from "@/lib/embed-layout";

type NotionBlockFormat = {
  block_width?: number;
  block_height?: number;
  block_full_width?: boolean;
  block_page_width?: boolean;
  block_aspect_ratio?: number;
  block_preserve_scale?: boolean;
};

/** Notion ブロックの format からレイアウトを抽出（公式 API では通常未提供） */
export function extractNotionBlockLayout(block: unknown): EmbedLayout | undefined {
  const format = (block as { format?: NotionBlockFormat })?.format;
  if (!format) return undefined;

  const width = typeof format.block_width === "number" ? format.block_width : undefined;
  const height = typeof format.block_height === "number" ? format.block_height : undefined;
  const aspectRatio =
    typeof format.block_aspect_ratio === "number"
      ? format.block_aspect_ratio
      : width && height
        ? width / height
        : undefined;

  if (!width && !height && !format.block_full_width && !format.block_page_width && !aspectRatio) {
    return undefined;
  }

  return {
    width,
    height,
    aspectRatio,
    fullWidth: Boolean(format.block_full_width),
    pageWidth: Boolean(format.block_page_width),
  };
}

export async function resolveBlockEmbedLayout(block: unknown, url: string): Promise<EmbedLayout> {
  const { resolveEmbedLayout } = await import("@/lib/embed-layout");
  const fromBlock = extractNotionBlockLayout(block);
  if (fromBlock) return fromBlock;
  return resolveEmbedLayout(url);
}
