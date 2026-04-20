import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import worksJson from "@/data/works.json";

const WORKS_PATH = path.join(process.cwd(), "data", "works.json");
const isVercelRuntime = process.env.VERCEL === "1" || process.env.VERCEL === "true";

function normalizeServiceDomain(input?: string) {
  if (!input) return "";
  return input
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "")
    .replace(/\.microcms\.io$/, "");
}

const microcmsServiceDomain = normalizeServiceDomain(process.env.MICROCMS_SERVICE_DOMAIN);
const microcmsApiKey = process.env.MICROCMS_API_KEY;

function canUseMicrocms() {
  return Boolean(microcmsServiceDomain && microcmsApiKey);
}

async function fetchMicrocms(pathname: string, init?: RequestInit) {
  const endpoint = `https://${microcmsServiceDomain}.microcms.io/api/v1/${pathname}`;
  const res = await fetch(endpoint, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-MICROCMS-API-KEY": microcmsApiKey as string,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`microCMS API failed: ${res.status} ${text}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

async function readWorks() {
  if (canUseMicrocms()) {
    const data = (await fetchMicrocms("works?limit=100")) as { contents?: unknown[] };
    return data.contents ?? [];
  }

  try {
    const raw = await fs.readFile(WORKS_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return worksJson as unknown[];
  }
}

async function writeWorks(works: unknown[]) {
  if (isVercelRuntime) {
    throw new Error(
      "Write API is unavailable on Vercel without microCMS env vars."
    );
  }

  await fs.writeFile(WORKS_PATH, JSON.stringify(works, null, 2));
}

function normalizeSrcs(body: Record<string, unknown>, fallbackSrc: string) {
  return {
    monotone: typeof body.srcMonotone === "string" ? body.srcMonotone : fallbackSrc,
    flat: typeof body.srcFlat === "string" ? body.srcFlat : fallbackSrc,
    spia: typeof body.srcSpia === "string" ? body.srcSpia : fallbackSrc,
    shading: typeof body.srcShading === "string" ? body.srcShading : fallbackSrc,
  };
}

export async function GET() {
  const works = await readWorks();
  return NextResponse.json(works);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (canUseMicrocms()) {
      const created = await fetchMicrocms("works", {
        method: "POST",
        body: JSON.stringify(body),
      });
      return NextResponse.json(created, { status: 201 });
    }

    const works = await readWorks();

    const newWork = {
      id: String(Date.now()),
      title: body.title ?? "",
      category: body.category ?? "illustration",
      src: body.src ?? "/images/placeholder-square.svg",
      srcs: normalizeSrcs(body, body.src ?? "/images/placeholder-square.svg"),
      year: body.year ?? new Date().getFullYear(),
      colSpan: Number(body.colSpan ?? 1),
      rowSpan: Number(body.rowSpan ?? 1),
    };

    works.push(newWork);
    await writeWorks(works);
    return NextResponse.json(newWork, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create work", detail: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (canUseMicrocms()) {
      await fetchMicrocms(`works/${id}`, { method: "DELETE" });
      return NextResponse.json({ ok: true });
    }

    const works = await readWorks();
    const filtered = works.filter((w: { id: string }) => w.id !== id);
    await writeWorks(filtered);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete work", detail: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body?.id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    if (canUseMicrocms()) {
      const { id, ...payload } = body as Record<string, unknown>;
      const updated = await fetchMicrocms(`works/${id as string}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      return NextResponse.json(updated);
    }

    const works = await readWorks();
    const idx = works.findIndex((w: { id: string }) => w.id === body.id);
    if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const fallbackSrc =
      typeof body.src === "string"
        ? body.src
        : (works[idx] as { src?: string }).src ?? "/images/placeholder-square.svg";
    works[idx] = {
      ...works[idx],
      ...body,
      src: fallbackSrc,
      srcs: normalizeSrcs(body, fallbackSrc),
    };
    await writeWorks(works);
    return NextResponse.json(works[idx]);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update work", detail: (error as Error).message },
      { status: 500 }
    );
  }
}
