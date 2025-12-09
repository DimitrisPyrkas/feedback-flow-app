import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { analyzeFeedback } from "@/lib/llm/analyze";
import { notifyHighSeverity } from "@/lib/webhooks";

type IngestItem = {
  source: string;
  externalId: string;
  rawContent: string;
  originalTimestamp?: string; 
};

type IngestBody = {
  items?: IngestItem[];
};

export async function POST(req: Request) {
  const startedAt = new Date();

  try {
    // 1) Auth via shared secret header
    const secret = process.env.CRON_SECRET;
    const headerSecret = req.headers.get("x-cron-secret");

    if (!secret || !headerSecret || headerSecret !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2) Parse payload
    const body = (await req.json().catch(() => null)) as IngestBody | null;
    const items = Array.isArray(body?.items) ? body!.items : [];

    if (!items.length) {
      
      return NextResponse.json(
        { ok: true, ingested: 0, analyzed: 0, message: "No items provided." },
        { status: 200 }
      );
    }

    // 3) Normalize + validate incoming items
    const cleaned = items
      .map((item) => {
        const source = (item.source ?? "").trim().toLowerCase();
        const externalId = (item.externalId ?? "").trim();
        const rawContent = (item.rawContent ?? "").trim();
        const ts = item.originalTimestamp
          ? new Date(item.originalTimestamp)
          : new Date();

        if (!source || !externalId || !rawContent) {
          return null; // drop invalid rows
        }

        return {
          source,
          externalId,
          rawContent,
          originalTimestamp: ts,
          userId: null as string | null, 
          status: "NEW" as const,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    if (!cleaned.length) {
      return NextResponse.json(
        {
          ok: true,
          ingested: 0,
          analyzed: 0,
          message: "No valid items after validation.",
        },
        { status: 200 }
      );
    }

    // 4) Bulk insert with idempotency via @@unique([source, externalId])
    const result = await prisma.feedbackItem.createMany({
      data: cleaned,
      skipDuplicates: true,
    });

    // 5) Auto-analysis (Pattern A): analyze freshly ingested (or existing) items
    const pairs = cleaned.map((c) => ({
      source: c.source,
      externalId: c.externalId,
    }));

    let analyzedCount = 0;
    let analysisFailed = 0;

    if (pairs.length > 0) {
      const toAnalyze = await prisma.feedbackItem.findMany({
        where: {
          AND: [
            { OR: pairs },
            {
              OR: [{ sentiment: null }, { severity: null }],
            },
          ],
        },
        select: {
          id: true,
          rawContent: true,
        },
      });

      for (const item of toAnalyze) {
        try {
          const analysis = await analyzeFeedback(item.rawContent);

          await prisma.feedbackAnalysis.create({
            data: {
              feedbackItemId: item.id,
              userId: null, 
              sentiment: analysis.sentiment,
              severityScore: analysis.severity,
              summary: analysis.summary,
              topics: analysis.topics,
              status: "NEW",
            },
          });

          const updatedFeedback = await prisma.feedbackItem.update({
            where: { id: item.id },
            data: {
              sentiment: analysis.sentiment,
              severity: analysis.severity,
              topics: Array.isArray(analysis.topics)
                ? analysis.topics.map((t) => String(t))
                : [],
              //Auto-ACK in Pattern A when severity is high
              ...(analysis.severity >= 4
                ? { status: "ACKNOWLEDGED" as const }
                : {}),
            },
            select: {
              id: true,
              source: true,
            },
          });

          //Send Slack alert for high severity (S4 or S5)
          if (analysis.severity >= 4) {
            await notifyHighSeverity({
              feedbackId: updatedFeedback.id,
              severity: analysis.severity,
              source: updatedFeedback.source ?? "github",
              summary: analysis.summary,
            });
          }

          analyzedCount += 1;
        } catch (err) {
          analysisFailed += 1;
          const msg =
            err instanceof Error ? err.message : "Unknown analysis error";
          console.error("Cron LLM analysis failed for feedback", item.id, msg);
          
        }
      }
    }

    // 6) IngestionLog entry (summary of this cron run)
    try {
      await prisma.ingestionLog.create({
        data: {
          source: "github", 
          runId: startedAt.toISOString(), 
          level: analysisFailed === 0 ? "INFO" : "WARN",
          message: `received=${items.length}, valid=${cleaned.length}, ingested=${result.count}, analyzed=${analyzedCount}, failed=${analysisFailed}`,
          meta: {
            received: items.length,
            valid: cleaned.length,
            ingested: result.count,
            skipped: cleaned.length - result.count,
            analyzed: analyzedCount,
            analysisFailed,
            startedAt,
            finishedAt: new Date(),
          },
        },
      });
    } catch (logErr) {
      console.error("Failed to write IngestionLog:", logErr);
    }

    const finishedAt = new Date();

    return NextResponse.json(
      {
        ok: true,
        received: items.length,
        valid: cleaned.length,
        ingested: result.count,
        skipped: cleaned.length - result.count,
        analyzed: analyzedCount,
        analysisFailed,
        startedAt,
        finishedAt,
      },
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("POST /api/cron/ingest failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


