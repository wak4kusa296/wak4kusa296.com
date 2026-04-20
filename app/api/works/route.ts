import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const WORKS_PATH = path.join(process.cwd(), "data", "works.json");

async function readWorks() {
  const raw = await fs.readFile(WORKS_PATH, "utf-8");
  return JSON.parse(raw);
}

async function writeWorks(works: unknown[]) {
  await fs.writeFile(WORKS_PATH, JSON.stringify(works, null, 2));
}

function normalizeSrcs(body: Record<string, unknown>, fallbackSrc: string) {
  return {
    monotone: typeof body.srcMonotone === "string" ? body.srcMonotone : fallbackSrc,
    flat: typeof body.srcFlat === "string" ? body.srcFlat : fallbackSrc,
    shading: typeof body.srcShading === "string" ? body.srcShading : fallbackSrc,
  };
}

export async function GET() {
  const works = await readWorks();
  return NextResponse.json(works);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
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
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const works = await readWorks();
  const filtered = works.filter((w: { id: string }) => w.id !== id);
  await writeWorks(filtered);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
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
}
