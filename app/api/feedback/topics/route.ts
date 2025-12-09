import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/session";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const items = await prisma.feedbackItem.findMany({
      select: {
        topics: true,
      },
    });

    const counts = new Map<string, number>();

    for (const item of items) {
      if (!Array.isArray(item.topics)) continue;

      for (const raw of item.topics) {
        const topic = (raw ?? "").toString().trim();
        if (!topic) continue;

        counts.set(topic, (counts.get(topic) ?? 0) + 1);
      }
    }

    const topics = Array.from(counts.entries())
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count) // highest first
      .slice(0, 8); // top 8

    return NextResponse.json({ topics });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("GET /api/feedback/topics failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
