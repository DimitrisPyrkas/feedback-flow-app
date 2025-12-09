import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/session";

type SourceStat = {
  source: string;
  count: number;
};

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const grouped = await prisma.feedbackItem.groupBy({
      by: ["source"],
      _count: { _all: true },
    });

    const sources: SourceStat[] = grouped
      .map((g) => ({
        source: g.source,
        count: g._count._all,
      }))

      .filter((s) => s.source && s.source.trim().length > 0)
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({ sources });
  } catch (err) {
    console.error("GET /api/feedback/sources failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
