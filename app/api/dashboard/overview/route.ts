import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/session";

function formatDay(date: Date): string {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as { id: string; role?: string };

    const isAdmin = user.role === "ADMIN";

    const scopeWhere = {};

    // ---------- BASIC KPIs ----------
    const [totalFeedback, totalNew, totalAcknowledged, totalActioned] =
      await Promise.all([
        prisma.feedbackItem.count({ where: scopeWhere }),
        prisma.feedbackItem.count({
          where: { ...scopeWhere, status: "NEW" },
        }),
        prisma.feedbackItem.count({
          where: { ...scopeWhere, status: "ACKNOWLEDGED" },
        }),
        prisma.feedbackItem.count({
          where: { ...scopeWhere, status: "ACTIONED" },
        }),
      ]);

    // ---------- SOURCE BREAKDOWN  ----------
    const feedbackBySource = await prisma.feedbackItem.groupBy({
      by: ["source"],
      where: scopeWhere,
      _count: { source: true },
    });

    // ---------- RECENT FEEDBACK ----------
    const recentFeedbackRaw = await prisma.feedbackItem.findMany({
      where: scopeWhere,
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        source: true,
        rawContent: true,
        createdAt: true,
        user: { select: { email: true } },
      },
    });

    // ---------- SIGNALS SNAPSHOT ----------
    const [positive, neutral, negative] = await Promise.all([
      prisma.feedbackItem.count({
        where: { ...scopeWhere, sentiment: "POSITIVE" },
      }),
      prisma.feedbackItem.count({
        where: { ...scopeWhere, sentiment: "NEUTRAL" },
      }),
      prisma.feedbackItem.count({
        where: { ...scopeWhere, sentiment: "NEGATIVE" },
      }),
    ]);

    const severityCounts: Record<number, number> = {};
    for (let s = 1; s <= 5; s++) {
      severityCounts[s] = await prisma.feedbackItem.count({
        where: { ...scopeWhere, severity: s },
      });
    }

    // ---------- LAST 7 DAYS WINDOW ----------
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6); // today + previous 6 days

    const last7 = await prisma.feedbackItem.findMany({
      where: {
        ...scopeWhere,
        createdAt: { gte: sevenDaysAgo },
      },
      select: {
        createdAt: true,
        sentiment: true,
        severity: true,
        topics: true,
      },
    });

    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(sevenDaysAgo.getDate() + i);
      days.push(formatDay(d));
    }

    // ---------- FEEDBACK TREND (count / day) ----------
    const trendMap: Record<string, number> = {};
    for (const item of last7) {
      const day = formatDay(item.createdAt);
      trendMap[day] = (trendMap[day] ?? 0) + 1;
    }
    const trendLast7Days = days.map((day) => ({
      date: day,
      count: trendMap[day] ?? 0,
    }));

    // ---------- SENTIMENT TREND (P / N / N per day) ----------
    const sentimentMap: Record<
      string,
      { positive: number; neutral: number; negative: number }
    > = {};

    for (const item of last7) {
      const day = formatDay(item.createdAt);
      if (!sentimentMap[day]) {
        sentimentMap[day] = { positive: 0, neutral: 0, negative: 0 };
      }
      if (item.sentiment === "POSITIVE") sentimentMap[day].positive += 1;
      else if (item.sentiment === "NEGATIVE") sentimentMap[day].negative += 1;
      else if (item.sentiment === "NEUTRAL") sentimentMap[day].neutral += 1;
    }

    const sentimentTrend = days.map((day) => ({
      date: day,
      positive: sentimentMap[day]?.positive ?? 0,
      neutral: sentimentMap[day]?.neutral ?? 0,
      negative: sentimentMap[day]?.negative ?? 0,
    }));

    // ---------- TOPIC DISTRIBUTION (top topics in last 7 days) ----------
    const topicCountMap: Record<string, number> = {};
    for (const item of last7) {
      if (!Array.isArray(item.topics)) continue;
      for (const raw of item.topics) {
        const topic = String(raw).trim().toLowerCase();
        if (!topic) continue;
        topicCountMap[topic] = (topicCountMap[topic] ?? 0) + 1;
      }
    }

    const topicDistribution = Object.entries(topicCountMap)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // ---------- HIGH-SEVERITY QUEUE (S >= 4, last 7 days, admin/global scope) ----------
    const highSeverityRaw = await prisma.feedbackItem.findMany({
      where: {
        severity: { gte: 4 },
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        rawContent: true,
        createdAt: true,
        severity: true,
        sentiment: true,
        user: { select: { email: true } },
      },
    });

    // ---------- INTEGRATIONS STATUS ----------
    const slackConnected = !!process.env.SLACK_WEBHOOK_URL;

    return NextResponse.json({
      totalFeedback,
      totalNew,
      totalAcknowledged,
      totalActioned,
      feedbackBySource,
      recentFeedback: recentFeedbackRaw.map((f) => ({
        id: f.id,
        source: f.source,
        rawContent: f.rawContent,
        createdAt: f.createdAt.toISOString(),
        userEmail: f.user?.email ?? null,
      })),
      sentimentCounts: { positive, neutral, negative },
      severityCounts,
      trendLast7Days,
      sentimentTrend,
      topicDistribution,
      highSeverityRecent: highSeverityRaw.map((f) => ({
        id: f.id,
        rawContent: f.rawContent,
        createdAt: f.createdAt.toISOString(),
        severity: f.severity,
        sentiment: f.sentiment,
        userEmail: f.user?.email ?? null,
      })),
      admin: isAdmin ? { slackConnected } : undefined,
    });
  } catch (e) {
    console.error("GET /api/dashboard/overview failed:", e);
    return NextResponse.json(
      { error: "Failed to load dashboard overview" },
      { status: 500 }
    );
  }
}
