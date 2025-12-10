import { NextResponse } from "next/server";

export async function GET() {
  const authSecret = process.env.AUTH_SECRET;
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;

  return NextResponse.json({
    hasAuthSecret: !!authSecret,
    hasNextAuthSecret: !!nextAuthSecret,
    authSecretLength: authSecret?.length ?? 0,
    nextAuthSecretLength: nextAuthSecret?.length ?? 0,
    // just to see what keys exist, but not their values
    envKeys: Object.keys(process.env).filter((k) =>
      ["AUTH", "NEXTAUTH"].some((prefix) => k.toUpperCase().startsWith(prefix))
    ),
  });
}
