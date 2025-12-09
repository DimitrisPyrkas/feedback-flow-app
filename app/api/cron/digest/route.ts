import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type DigestHighSeverityItem = {
  id: string;
  source: string;
  status: string | null;
  severity: number;
  summary: string;
  createdAt: string;
};

type TriageChangeSummary = {
  feedbackItemId: string;
  feedbackSource: string;
  fromStatus: string;
  toStatus: string;
  userEmail: string;
  createdAt: string;
};

type DailyDigest = {
  window: {
    from: string;
    to: string;
  };
  totals: {
    analyzed: number;
    highSeverity: number;
    byStatus: Record<string, number>;
    bySeverity: Record<string, number>;
  };
  highlights: {
    highSeverityItems: DigestHighSeverityItem[];
    recentNewCount: number;
    statusChanges: TriageChangeSummary[];
  };
};

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

async function buildDailyDigest(from: Date, to: Date): Promise<DailyDigest> {
  // 1) All analyses created in the window
  const analyses = await prisma.feedbackAnalysis.findMany({
    where: {
      createdAt: {
        gte: from,
        lt: to,
      },
    },
    select: {
      id: true,
      sentiment: true,
      severityScore: true,
      summary: true,
      createdAt: true,
      feedbackItem: {
        select: {
          id: true,
          source: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });

  const analyzed = analyses.length;

  // 2) High severity analyses (S >= 4)
  const highSeverityAnalyses = analyses.filter(
    (a) => typeof a.severityScore === "number" && a.severityScore >= 4
  );

  const highSeverity = highSeverityAnalyses.length;

  // 3) Status distribution
  const byStatus: Record<string, number> = {};
  for (const a of analyses) {
    const st = a.feedbackItem?.status ?? "UNKNOWN";
    byStatus[st] = (byStatus[st] || 0) + 1;
  }

  // 4) Severity distribution (1–5)
  const bySeverity: Record<string, number> = {};
  for (const a of analyses) {
    const sev = a.severityScore;
    if (typeof sev === "number" && !Number.isNaN(sev)) {
      const key = `S${sev}`;
      bySeverity[key] = (bySeverity[key] || 0) + 1;
    }
  }

  // 5) Recent NEW feedback items created
  const recentNewCount = await prisma.feedbackItem.count({
    where: {
      createdAt: {
        gte: from,
        lt: to,
      },
      status: "NEW",
    },
  });

  // 6) High severity highlight list (top 5, unresolved first)
  const highSeverityItems: DigestHighSeverityItem[] = highSeverityAnalyses
    .sort((a, b) => {
      // unresolved (non-ACTIONED) first, then newer first
      const aResolved = a.feedbackItem?.status === "ACTIONED";
      const bResolved = b.feedbackItem?.status === "ACTIONED";
      if (aResolved !== bResolved) {
        return aResolved ? 1 : -1;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 5)
    .map((a) => ({
      id: a.feedbackItem?.id ?? "unknown",
      source: a.feedbackItem?.source ?? "unknown",
      status: a.feedbackItem?.status ?? "UNKNOWN",
      severity: a.severityScore ?? 0,
      summary: a.summary,
      createdAt: a.feedbackItem?.createdAt.toISOString(),
    }));

  // 7) Triage actions (status changes)
  const triageActions = await prisma.triageAction.findMany({
    where: {
      createdAt: {
        gte: from,
        lt: to,
      },
    },
    include: {
      user: {
        select: { email: true },
      },
      feedbackItem: {
        select: { source: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const statusChanges: TriageChangeSummary[] = triageActions
    .slice(0, 10) // limit to last 10 changes for digest
    .map((t) => ({
      feedbackItemId: t.feedbackItemId,
      feedbackSource: t.feedbackItem?.source ?? "unknown",
      fromStatus: t.fromStatus,
      toStatus: t.toStatus,
      userEmail: t.user?.email ?? "unknown",
      createdAt: t.createdAt.toISOString(),
    }));

  return {
    window: {
      from: from.toISOString(),
      to: to.toISOString(),
    },
    totals: {
      analyzed,
      highSeverity,
      byStatus,
      bySeverity,
    },
    highlights: {
      highSeverityItems,
      recentNewCount,
      statusChanges,
    },
  };
}

// Helper: send digest to Slack
async function sendSlackDigest(digest: DailyDigest): Promise<void> {
  if (!SLACK_WEBHOOK_URL) {
    console.log("SLACK_WEBHOOK_URL not set; skipping Slack digest.");
    return;
  }

  const lines: string[] = [];

  lines.push(
    `*Daily Feedback Digest* (${digest.window.from} → ${digest.window.to})`
  );
  lines.push(
    `• Analyzed: *${digest.totals.analyzed}*  |  High severity (S4–S5): *${digest.totals.highSeverity}*`
  );
  lines.push(
    `• New feedback created in window (status NEW): *${digest.highlights.recentNewCount}*`
  );

  if (digest.highlights.highSeverityItems.length > 0) {
    lines.push("");
    lines.push("*High severity items:*");
    for (const item of digest.highlights.highSeverityItems) {
      lines.push(
        `• [${item.source}] ${item.status} S${
          item.severity
        } – ${item.summary.slice(0, 80)}${item.summary.length > 80 ? "…" : ""}`
      );
    }
  }

  if (digest.highlights.statusChanges.length > 0) {
    lines.push("");
    lines.push("*Recent status changes:*");
    for (const change of digest.highlights.statusChanges) {
      lines.push(
        `• [${change.feedbackSource}] ${change.fromStatus} → ${change.toStatus} by ${change.userEmail}`
      );
    }
  }

  const text = lines.join("\n");

  try {
    const res = await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(
        "Failed to send Slack digest:",
        res.status,
        res.statusText,
        body
      );
    } else {
      console.log("Slack digest sent successfully.");
    }
  } catch (err) {
    console.error("Error sending Slack digest:", err);
  }
}

export async function POST(req: Request) {
  try {
    //Auth via shared secret
    const secret = process.env.CRON_SECRET;
    const headerSecret = req.headers.get("x-cron-secret");

    if (!secret || !headerSecret || headerSecret !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let hours = 24;
    try {
      const body = (await req.json().catch(() => null)) as {
        hours?: number;
      } | null;
      if (
        body &&
        typeof body.hours === "number" &&
        body.hours > 0 &&
        body.hours <= 168 // up to 7 days
      ) {
        hours = body.hours;
      }
    } catch {}

    const now = new Date();
    const from = new Date(now.getTime() - hours * 60 * 60 * 1000);

    const digest = await buildDailyDigest(from, now);

    console.log("===== Daily Feedback Digest =====");
    console.log(`Window: ${digest.window.from} → ${digest.window.to}`);
    console.log(
      `Analyzed: ${digest.totals.analyzed}, High severity: ${digest.totals.highSeverity}`
    );
    console.log("By status:", digest.totals.byStatus);
    console.log("By severity:", digest.totals.bySeverity);
    console.log(
      `Recent NEW feedback created in window: ${digest.highlights.recentNewCount}`
    );

    if (digest.highlights.highSeverityItems.length > 0) {
      console.log("High severity items:");
      for (const item of digest.highlights.highSeverityItems) {
        console.log(
          `- [${item.source}] ${item.status} S${
            item.severity
          } – ${item.summary.slice(0, 80)}`
        );
      }
    } else {
      console.log("No high severity items in this window.");
    }

    if (digest.highlights.statusChanges.length > 0) {
      console.log("Status changes:");
      for (const change of digest.highlights.statusChanges) {
        console.log(
          `- [${change.feedbackSource}] ${change.fromStatus} → ${change.toStatus} by ${change.userEmail}`
        );
      }
    } else {
      console.log("No status changes in this window.");
    }
    console.log("===== End of Digest =====");

    //Send to Slack (Pattern B)
    await sendSlackDigest(digest);

    //Return JSON
    return NextResponse.json(
      {
        ok: true,
        digest,
      },
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("POST /api/cron/digest failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
