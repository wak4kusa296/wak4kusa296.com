import { NextRequest, NextResponse } from "next/server";
import { canUseCommissionNotion, createCommissionRequest } from "@/lib/notion";

const VALID_TYPES = new Set([
  "outsourcing",
  "event",
  "lecture",
  "creative-advisor",
  "interview",
  "other",
]);

export async function POST(req: NextRequest) {
  try {
    if (!canUseCommissionNotion()) {
      return NextResponse.json(
        { error: "Commission form is not configured" },
        { status: 503 }
      );
    }

    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const type = String(body.type ?? "").trim();
    const budget = String(body.budget ?? "").trim();
    const deadline = String(body.deadline ?? "").trim();
    const detail = String(body.detail ?? "").trim();

    if (!name || !email || !type || !detail) {
      return NextResponse.json({ error: "Required fields are missing" }, { status: 400 });
    }

    if (!VALID_TYPES.has(type)) {
      return NextResponse.json({ error: "Invalid commission type" }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const result = await createCommissionRequest({
      name,
      email,
      type,
      budget,
      deadline,
      detail,
    });

    return NextResponse.json({ ok: true, id: result.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to submit commission request", detail: (error as Error).message },
      { status: 500 }
    );
  }
}
