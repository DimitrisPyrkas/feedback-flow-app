import { NextResponse } from "next/server";
import { auth } from "@/lib/session";
import prisma from "@/lib/prisma";
import type { Status as PrismaStatus } from "@/app/generated/prisma";

type Status = PrismaStatus;

function toStatus(value: unknown): Status | undefined {
  if (typeof value !== "string") return undefined;
  const v = value.toUpperCase();
  if (v === "NEW" || v === "ACKNOWLEDGED" || v === "ACTIONED") {
    return v as Status;
  }
  return undefined;
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

type StatusBody = {
  status?: string;
  note?: string;
};

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const feedbackId = id;

    const role = (session.user as { role?: string }).role ?? "MEMBER";
    const userId = session.user.id;

    const body = (await req.json().catch(() => null)) as StatusBody | null;
    const newStatus = toStatus(body?.status);

    if (!newStatus) {
      return NextResponse.json(
        { error: "Invalid or missing status" },
        { status: 400 }
      );
    }

    const note =
      typeof body?.note === "string" && body.note.trim().length > 0
        ? body.note.trim()
        : null;

    const feedback = await prisma.feedbackItem.findUnique({
      where: { id: feedbackId },
      select: { id: true, userId: true, status: true },
    });

    if (!feedback) {
      return NextResponse.json(
        { error: "Feedback not found" },
        { status: 404 }
      );
    }

    const isAdmin = role === "ADMIN";
    const isOwner = feedback.userId === userId;
    const isSystemItem = feedback.userId === null;

    if (!isSystemItem && !isAdmin && !isOwner) {
      return NextResponse.json(
        { error: "Forbidden: cannot update this feedback" },
        { status: 403 }
      );
    }

    const fromStatus: Status = feedback.status ?? "NEW";

    if (fromStatus === newStatus) {
      return NextResponse.json(
        {
          ok: true,
          feedback: { id: feedback.id, status: fromStatus },
          skipped: "Status unchanged",
        },
        { status: 200 }
      );
    }

    //Update FeedbackItem status
    const updated = await prisma.feedbackItem.update({
      where: { id: feedbackId },
      data: { status: newStatus },
      select: { id: true, status: true },
    });

    //Log triage action
    await prisma.triageAction.create({
      data: {
        feedbackItemId: updated.id,
        userId,
        fromStatus,
        toStatus: newStatus,
        note,
      },
    });

    return NextResponse.json({ ok: true, feedback: updated }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("PATCH /api/feedback/[id]/status failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
