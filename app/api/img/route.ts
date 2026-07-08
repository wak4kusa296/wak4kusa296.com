import { NextRequest, NextResponse } from "next/server";

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

  let upstream: Response;
  try {
    upstream = await fetch(target.toString(), {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Vercel proxy)" },
      // Next.js fetch cache: Notion URL はすでに 1h で revalidate されているので no-store
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

  const contentType =
    upstream.headers.get("content-type") ?? "application/octet-stream";

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": CACHE_CONTROL,
      "Access-Control-Allow-Origin": "*",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
