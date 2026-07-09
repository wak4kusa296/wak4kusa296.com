import { NextRequest, NextResponse } from "next/server";
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

/** キャッシュ: Notion の revalidate(3600s) に合わせて 1h キャッシュ */
const CACHE_CONTROL = "public, max-age=3600, stale-while-revalidate=86400";

/** リサイズ上限（誤用防止） */
const MAX_WIDTH = 1600;

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

  // ?w=<px> が指定された場合はリサイズ（2x DPR 分まで許容）
  const wParam = req.nextUrl.searchParams.get("w");
  const targetWidth = wParam
    ? Math.min(Math.max(1, parseInt(wParam, 10)), MAX_WIDTH)
    : null;

  let upstream: Response;
  try {
    upstream = await fetch(target.toString(), {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Vercel proxy)" },
      cache: "no-store",
    });
  } catch (err) {
    console.error("[img-proxy] fetch error", err);
    return new NextResponse("Upstream fetch failed", { status: 502 });
  }

  if (!upstream.ok) {
    return new NextResponse(`Upstream error: ${upstream.status}`, {
      status: upstream.status,
    });
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  const isImage = contentType.startsWith("image/") && !contentType.includes("svg");

  // 画像 + 幅指定がある場合は Sharp でリサイズ
  if (isImage && targetWidth) {
    try {
      const buf = Buffer.from(await upstream.arrayBuffer());
      const resized = await sharp(buf)
        .resize({ width: targetWidth, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      return new NextResponse(resized, {
        status: 200,
        headers: {
          "Content-Type": "image/webp",
          "Cache-Control": CACHE_CONTROL,
          "Access-Control-Allow-Origin": "*",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch (err) {
      // リサイズ失敗時はオリジナルをそのまま返す（フォールバック）
      console.error("[img-proxy] sharp error, falling back to original", err);
    }
  }

  // リサイズなし or 動画 / SVG はそのままストリーム
  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": contentType || "application/octet-stream",
      "Cache-Control": CACHE_CONTROL,
      "Access-Control-Allow-Origin": "*",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
