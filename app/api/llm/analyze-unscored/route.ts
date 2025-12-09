import { NextResponse } from "next/server";
import { auth } from "@/lib/session";
import prisma from "@/lib/prisma";
import { analyzeFeedback } from "@/lib/llm/analyze";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({} as { limit?: number }));
    const limit = Math.min(Math.max(Number(body.limit) || 10, 1), 50);

    const unscored = await prisma.feedbackItem.findMany({
      where: {
        OR: [{ sentiment: null }, { severity: null }],
      },
      orderBy: { createdAt: "asc" },
      take: limit,
      select: { id: true, rawContent: true },
    });

    if (unscored.length === 0) {
      return NextResponse.json({ ok: true, processed: 0, items: [] });
    }

    const results: Array<{ id: string; ok: boolean; error?: string }> = [];

    for (const item of unscored) {
      try {
        const analysis = await analyzeFeedback(item.rawContent);

        const created = await prisma.feedbackAnalysis.create({
          data: {
            feedbackItemId: item.id,
            userId: null,
            sentiment: analysis.sentiment,
            topics: analysis.topics,
            severityScore: analysis.severity,
            summary: analysis.summary,
            status: "NEW",
          },
        });

        await prisma.feedbackItem.update({
          where: { id: item.id },
          data: {
            sentiment: created.sentiment,
            severity: created.severityScore,
          },
        });

        results.push({ id: item.id, ok: true });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        results.push({ id: item.id, ok: false, error: msg });
      }
    }

    return NextResponse.json({
      ok: true,
      processed: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok),
      items: results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("POST /api/llm/analyze-unscored failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

//admin only
