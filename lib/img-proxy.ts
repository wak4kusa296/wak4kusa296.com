/** Notion S3 の画像 URL を同一オリジンのプロキシ経由に変換する */

const NOTION_S3_HOSTS = [
  "prod-files-secure.s3.us-west-2.amazonaws.com",
  "prod-files-secure.s3.amazonaws.com",
];

function isNotionS3(src: string): boolean {
  try {
    const host = new URL(src).hostname;
    return NOTION_S3_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

/**
 * Notion S3 URL であれば /api/img プロキシ経由の URL に変換する。
 * @param src - 元の画像 URL
 * @param displayWidth - 表示幅(px)。指定するとサーバー側で Sharp リサイズ。
 *   DPR 2x まで考慮するなら表示幅の 2 倍を渡す。
 */
export function proxyNotionImage(src: string, displayWidth?: number): string {
  if (!src || !isNotionS3(src)) return src;
  const params = new URLSearchParams({ url: src });
  if (displayWidth && displayWidth > 0) {
    params.set("w", String(Math.round(displayWidth)));
  }
  return `/api/img?${params.toString()}`;
}
