import { NextResponse } from "next/server";
import { auth } from "@/lib/session";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

type ChangePasswordBody = {
  currentPassword?: string;
  newPassword?: string;
};

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id as string | undefined;

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body: ChangePasswordBody = await req
      .json()
      .catch(() => ({}) as ChangePasswordBody);

    const currentPassword = body.currentPassword?.trim() ?? "";
    const newPassword = body.newPassword?.trim() ?? "";

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { ok: false, error: "Current and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { ok: false, error: "New password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { ok: false, error: "User not found or password not set." },
        { status: 400 }
      );
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { ok: false, error: "Current password is incorrect." },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashed },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/account/change-password error", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
