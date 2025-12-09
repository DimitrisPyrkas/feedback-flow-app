import { NextResponse } from "next/server";
import { auth } from "@/lib/session";
import prisma from "@/lib/prisma";
import { analyzeFeedback } from "@/lib/llm/analyze";

type AnalyzeResult = {
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  severity: number;
  summary: string;
  topics: string[];
};

type BodyShape = {
  feedbackId?: string;
};

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as { role?: string }).role ?? "MEMBER";
    const userId = session.user.id;

    //Manual analysis is ADMIN-only
    if (role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: only admins can run manual analysis" },
        { status: 403 }
      );
    }

    const body = (await req.json().catch(() => null)) as BodyShape | null;
    const feedbackId = body?.feedbackId?.trim();

    if (!feedbackId) {
      return NextResponse.json(
        { error: "feedbackId is required" },
        { status: 400 }
      );
    }

    const feedback = await prisma.feedbackItem.findUnique({
      where: { id: feedbackId },
      select: {
        id: true,
        rawContent: true,
      },
    });

    if (!feedback) {
      return NextResponse.json(
        { error: "Feedback not found" },
        { status: 404 }
      );
    }

    // Call LLM
    const analysisResult: AnalyzeResult = await analyzeFeedback(
      feedback.rawContent
    );

    // Normalize topics as clean string[]
    const topicsArray = Array.isArray(analysisResult.topics)
      ? analysisResult.topics.map((t) => String(t).trim()).filter(Boolean)
      : [];

    // Store analysis + update snapshot on FeedbackItem
    const created = await prisma.$transaction(async (tx) => {
      const analysis = await tx.feedbackAnalysis.create({
        data: {
          feedbackItemId: feedback.id,
          //manual analysis is attributed to the admin user
          userId,
          sentiment: analysisResult.sentiment,
          severityScore: analysisResult.severity,
          summary: analysisResult.summary,
          topics: topicsArray,
          status: "NEW",
        },
      });

      await tx.feedbackItem.update({
        where: { id: feedback.id },
        data: {
          sentiment: analysisResult.sentiment,
          severity: analysisResult.severity,
          topics: topicsArray,
        },
      });

      return analysis;
    });

    return NextResponse.json(
      {
        ok: true,
        analysis: {
          id: created.id,
          sentiment: created.sentiment,
          severityScore: created.severityScore,
          summary: created.summary,
          topics: created.topics,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("POST /api/llm/analyze failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
