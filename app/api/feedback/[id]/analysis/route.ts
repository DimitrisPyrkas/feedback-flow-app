import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/session";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(req: Request, { params }: RouteParams) {
  try {
    // Ensure user is logged in (member or admin)
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const feedbackId = id?.trim();
    if (!feedbackId) {
      return NextResponse.json(
        { error: "feedbackId is required" },
        { status: 400 }
      );
    }

    // Always return the *latest* analysis for this feedback item
    const analysis = await prisma.feedbackAnalysis.findFirst({
      where: { feedbackItemId: feedbackId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        sentiment: true,
        severityScore: true,
        summary: true,
        topics: true,
        createdAt: true,
        status: true,
      },
    });

    if (!analysis) {
      return NextResponse.json({ analysis: null }, { status: 200 });
    }

    return NextResponse.json({ analysis });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("GET /api/feedback/[id]/analysis failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
