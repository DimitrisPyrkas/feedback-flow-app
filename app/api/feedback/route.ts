import { NextResponse } from "next/server";
import { auth } from "@/lib/session";
import prisma from "@/lib/prisma";
import { Prisma, Status } from "@prisma/client";

function toStatus(value?: string): Status | undefined {
  if (!value) return undefined;
  const v = value.toUpperCase();
  return v === "NEW" || v === "ACKNOWLEDGED" || v === "ACTIONED"
    ? (v as Status)
    : undefined;
}

// POST : Create feedback
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as Record<string, unknown>;

    const rawContent =
      typeof body.rawContent === "string" ? body.rawContent.trim() : "";

    const source =
      typeof body.source === "string" && body.source.trim()
        ? body.source.trim()
        : "manual";

    const externalId =
      typeof body.externalId === "string" && body.externalId.trim().length > 0
        ? body.externalId.trim()
        : `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    let initialTopics: string[] = [];
    if (Array.isArray(body.topics)) {
      initialTopics = (body.topics as unknown[])
        .map((t) => String(t || "").trim().toLocaleLowerCase())
        .filter((t) => t.length > 0);
    }

    if (!rawContent) {
      return NextResponse.json(
        { error: "rawContent is required" },
        { status: 400 }
      );
    }

    const feedback = await prisma.feedbackItem.create({
      data: {
        source,
        externalId,
        rawContent,
        originalTimestamp: new Date(),
        userId: session.user.id,
        sentiment: null,
        severity: null,
        topics: initialTopics,
      },
    });

    return NextResponse.json(
      { ok: true, feedbackId: feedback.id },
      { status: 201 }
    );
  } catch (err) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        {
          error: "Feedback already ingested for this source/externalId",
          code: "DUPLICATE_FEEDBACK",
        },
        { status: 409 }
      );
    }

    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("POST /api/feedback failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET : list feedback items with filters
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const search = (searchParams.get("search") || "").trim();
    const status = toStatus(searchParams.get("status") || undefined);
    const source = (searchParams.get("source") || "").trim() || undefined;
    const topic = (searchParams.get("topic") || "").trim();

    const skip = (page - 1) * limit;
    const where: Prisma.FeedbackItemWhereInput = {};

    if (status) where.status = status;
    if (source) where.source = source;
    if (search) where.rawContent = { contains: search, mode: "insensitive" };

    // --- SIMPLE SEARCH ---
    // Since DB only has "next.js", we just search for "next.js"
    if (topic) {
      where.topics = { hasSome: [topic.toLowerCase()] };
    }
    // ---------------------

    const [items, total] = await Promise.all([
      prisma.feedbackItem.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true, source: true, rawContent: true, status: true,
          createdAt: true, sentiment: true, severity: true, topics: true,
        },
      }),
      prisma.feedbackItem.count({ where }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    console.error("GET /api/feedback failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
