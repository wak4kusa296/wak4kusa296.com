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
 * それ以外はそのまま返す。
 */
export function proxyNotionImage(src: string): string {
  if (!src || !isNotionS3(src)) return src;
  return `/api/img?url=${encodeURIComponent(src)}`;
}
