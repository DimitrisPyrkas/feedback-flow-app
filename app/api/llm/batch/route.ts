import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/session";
import { analyzeFeedback } from "@/lib/llm/analyze";
import { notifyHighSeverity } from "@/lib/webhooks";

type AnalyzeResult = {
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  severity: number;
  summary: string;
  topics: string[];
};

type RequestBody = {
  limit?: number;
};

export async function POST(req: Request) {
  try {
    //Auth: only logged-in ADMIN can run batch
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body: RequestBody = await req.json().catch(() => ({}));
    const rawLimit =
      typeof body.limit === "number"
        ? body.limit
        : Number.isFinite(Number(body.limit))
        ? Number(body.limit)
        : NaN;

    const limit = Math.min(Math.max(rawLimit || 10, 1), 50);

    //Pick feedback items that still need AI analysis
    //(no sentiment OR no severity OR no topics)
    const unscored = await prisma.feedbackItem.findMany({
      where: {
        OR: [
          { sentiment: null },
          { severity: null },
          { topics: { equals: [] } },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: limit,
      select: {
        id: true,
        rawContent: true,
        source: true,
      },
    });

    if (unscored.length === 0) {
      return NextResponse.json({
        ok: true,
        processed: 0,
        message: "All feedback already analyzed.",
      });
    }

    let processed = 0;
    const failed: { id: string; error: string }[] = [];

    //Analyze each pending feedback item
    for (const item of unscored) {
      try {
        const result: AnalyzeResult = await analyzeFeedback(item.rawContent);

        //Store a new FeedbackAnalysis + update FeedbackItem snapshot
        await prisma.$transaction([
          prisma.feedbackAnalysis.create({
            data: {
              feedbackItemId: item.id,
              userId: null,
              sentiment: result.sentiment,
              severityScore: result.severity,
              summary: result.summary,
              topics: result.topics,
              status: "NEW",
            },
          }),
          prisma.feedbackItem.update({
            where: { id: item.id },
            data: {
              sentiment: result.sentiment,
              severity: result.severity,
              topics: result.topics,
              //Auto-ACK as part of triage in Pattern A
              ...(result.severity >= 4
                ? { status: "ACKNOWLEDGED" as const }
                : {}),
            },
          }),
        ]);

        //high severity notification
        if (result.severity >= 4) {
          await notifyHighSeverity({
            feedbackId: item.id,
            severity: result.severity,
            summary: result.summary,
            source: item.source,
          });
        }

        processed += 1;
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Unknown error during analysis";
        failed.push({ id: item.id, error: message });
      }
    }

    return NextResponse.json({
      ok: true,
      processed,
      failed,
      total: unscored.length,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("POST /api/llm/batch failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
