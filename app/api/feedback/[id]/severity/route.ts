import { NextResponse } from "next/server";
import { auth } from "@/lib/session";
import prisma from "@/lib/prisma";

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
    const raw = (body as { severity?: unknown } | null)?.severity;

    const sev = raw === null ? null : Number(raw);
    const valid = sev === null || (Number.isInteger(sev) && sev >= 1 && sev <= 5);
    if (!valid) {
      return NextResponse.json(
        { error: "Severity must be an integer 1–5 or null" },
        { status: 400 }
      );
    }

    await prisma.feedbackItem.update({
      where: { id },
      data: { severity: sev },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown server error";
    console.error("PATCH /api/feedback/[id]/severity failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}



