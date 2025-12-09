import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: get a single feedback item
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const feedback = await prisma.feedbackItem.findFirst({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, role: true },
        },
      },
    });

    if (!feedback) {
      return NextResponse.json(
        { error: "Feedback not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(feedback);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("GET /api/feedback/[id] failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
