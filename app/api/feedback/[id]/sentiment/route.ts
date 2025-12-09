import { NextResponse } from "next/server";
import { auth } from "@/lib/session";
import prisma from "@/lib/prisma";

const ALLOWED = ["POSITIVE", "NEUTRAL", "NEGATIVE"] as const;
type Sentiment = (typeof ALLOWED)[number];

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const body = await req.json().catch(() => null as unknown);
    const raw = (body as { sentiment?: unknown } | null)?.sentiment;

    const value: Sentiment | null =
      raw === null || raw === "" || typeof raw === "undefined"
        ? null
        : typeof raw === "string" && (ALLOWED as readonly string[]).includes(raw)
        ? (raw as Sentiment)
        : null;

    if (raw !== null && value === null) {
      return NextResponse.json(
        { error: "Sentiment must be POSITIVE, NEUTRAL, NEGATIVE, or null" },
        { status: 400 }
      );
    }

    await prisma.feedbackItem.update({
      where: { id },
      data: { sentiment: value },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown server error";
    console.error("PATCH /api/feedback/[id]/sentiment failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
