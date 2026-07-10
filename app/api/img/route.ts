import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import sharp from "sharp";

/** Notion S3 のみ許可（他ドメインへのオープンプロキシ防止） */
const ALLOWED_HOSTS = [
  "prod-files-secure.s3.us-west-2.amazonaws.com",
  "prod-files-secure.s3.amazonaws.com",
];

function isAllowed(url: URL): boolean {
  return ALLOWED_HOSTS.some(
    (h) => url.hostname === h || url.hostname.endsWith(`.${h}`)
  );
}

export const runtime = "nodejs";

/** ブラウザ/CDN 向け。署名 URL が変わっても pathname キャッシュで再利用する */
const CACHE_CONTROL = "public, max-age=86400, stale-while-revalidate=604800";

/** リサイズ上限（誤用防止） */
const MAX_WIDTH = 1600;

/** 署名付き URL が期限切れでも、一度取れた画像は pathname キーで保持 */
const IMAGE_REVALIDATE_SEC = 86400;

type CachedImage = {
  base64: string;
  contentType: string;
};

async function loadProcessedImage(
  signedUrl: string,
  objectKey: string,
  targetWidth: number | null
): Promise<CachedImage> {
  const cacheKey = ["notion-img", objectKey, targetWidth ? `w${targetWidth}` : "full"];

  return unstable_cache(
    async () => {
      const upstream = await fetch(signedUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; Vercel proxy)" },
        cache: "no-store",
      });

      if (!upstream.ok) {
        throw new Error(`Upstream ${upstream.status}`);
      }

      const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
      const buf = Buffer.from(await upstream.arrayBuffer());
      const isImage = contentType.startsWith("image/") && !contentType.includes("svg");

      if (isImage && targetWidth) {
        try {
          const resized = await sharp(buf)
            .resize({ width: targetWidth, withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();
          return {
            base64: resized.toString("base64"),
            contentType: "image/webp",
          };
        } catch (err) {
          console.error("[img-proxy] sharp error, using original", err);
        }
      }

      return {
        base64: buf.toString("base64"),
        contentType,
      };
    },
    cacheKey,
    { revalidate: IMAGE_REVALIDATE_SEC }
  )();
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url");
  if (!raw) {
    return new NextResponse("Missing url param", { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new NextResponse("Invalid url", { status: 400 });
  }

  if (!isAllowed(target)) {
    return new NextResponse("Forbidden: host not allowed", { status: 403 });
  }

  const wParam = req.nextUrl.searchParams.get("w");
  const targetWidth = wParam
    ? Math.min(Math.max(1, parseInt(wParam, 10)), MAX_WIDTH)
    : null;

  // 署名クエリを除いた pathname でキャッシュ → HTML 内の期限切れ URL でも再利用可
  const objectKey = `${target.hostname}${target.pathname}`;

  try {
    const cached = await loadProcessedImage(target.toString(), objectKey, targetWidth);
    const body = Buffer.from(cached.base64, "base64");
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": cached.contentType,
        "Cache-Control": CACHE_CONTROL,
        "Access-Control-Allow-Origin": "*",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("[img-proxy] failed", objectKey, err);
    return new NextResponse("Upstream fetch failed", { status: 502 });
  }
}
