export const runtime = "nodejs";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = registerSchema.safeParse(json);

    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message || "Invalid input data";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { email, password } = parsed.data;

    // check if user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // create as MEMBER by default (admins are promoted manually)
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "MEMBER",
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("POST /api/auth/register failed:", message);
    return NextResponse.json(
      { error: "Failed to register user." },
      { status: 500 }
    );
  }
}
