import { NextResponse } from "next/server";
import { auth } from "@/lib/session";

export default async function middleware(req: Request) {
  const session = await auth();

  const url = new URL(req.url);
  const isAuthRoute =
    url.pathname.startsWith("/login") ||
    url.pathname.startsWith("/register") ||
    url.pathname === "/";

  if (!session?.user && !isAuthRoute) {
    // user not logged in → redirect to login
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (session?.user && isAuthRoute && url.pathname !== "/dashboard") {
    // logged in but visiting /login or /register → redirect to dashboard
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};


