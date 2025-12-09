import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/session";

type DigestPreview = {
  from: string;
  to: string;
  totalNew: number;
  highSeverity: number;
  sentiment: {
    POSITIVE: number;
    NEUTRAL: number;
    NEGATIVE: number;
  };
  topTopics: { topic: string; count: number }[];
};

export async function GET() {
  try {
    const session = await auth();
    const user = session?.user as { id: string; role?: string } | undefined;

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Last 24 hours
    const now = new Date();
    const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    
    const rows = await prisma.feedbackItem.findMany({
      where: {
        createdAt: { gte: since },
      },
      select: {
        status: true,
        severity: true,
        sentiment: true,
        topics: true,
      },
    });

    // counts
    let totalNew = 0;
    let highSeverity = 0;

    const sentimentCounts: Record<"POSITIVE" | "NEUTRAL" | "NEGATIVE", number> =
      {
        POSITIVE: 0,
        NEUTRAL: 0,
        NEGATIVE: 0,
      };

    const topicMap = new Map<string, number>();

    for (const row of rows) {
      // status
      if (row.status === "NEW") {
        totalNew += 1;
      }

      // severity >= 4
      if (typeof row.severity === "number" && row.severity >= 4) {
        highSeverity += 1;
      }

      // sentiment
      if (
        row.sentiment === "POSITIVE" ||
        row.sentiment === "NEUTRAL" ||
        row.sentiment === "NEGATIVE"
      ) {
        sentimentCounts[row.sentiment] += 1;
      }

      // topics (string[])
      if (Array.isArray(row.topics)) {
        for (const t of row.topics) {
          const key = String(t).trim();
          if (!key) continue;
          topicMap.set(key, (topicMap.get(key) ?? 0) + 1);
        }
      }
    }

    const topTopics = Array.from(topicMap.entries())
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const payload: DigestPreview = {
      from: since.toISOString(),
      to: now.toISOString(),
      totalNew,
      highSeverity,
      sentiment: {
        POSITIVE: sentimentCounts.POSITIVE,
        NEUTRAL: sentimentCounts.NEUTRAL,
        NEGATIVE: sentimentCounts.NEGATIVE,
      },
      topTopics,
    };

    return NextResponse.json(payload);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("GET /api/admin/digest/preview failed:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
