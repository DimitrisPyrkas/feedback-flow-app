import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

// --------------- helper types ---------------
interface CredentialsType {
  email: string;
  password: string;
}

interface JWTPayload {
  id?: string;
  role?: string;
}

const AUTH_SECRET_VALUE =
  process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

if (!AUTH_SECRET_VALUE) {
  
  throw new Error(
    "AUTH_SECRET / NEXTAUTH_SECRET is not set. Please configure it in the environment."
  );
}

// --------------- config ---------------------
export const authConfig: NextAuthConfig = {
  secret: AUTH_SECRET_VALUE,

  trustHost: true,

  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Explicitly type & validate credentials
        const creds = credentials as CredentialsType | undefined;
        if (!creds?.email || !creds?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: creds.email },
        });
        if (!user) return null;

        const isValid = await bcrypt.compare(
          creds.password,
          user.passwordHash
        );
        if (!isValid) return null;

        return { id: user.id, email: user.email, role: user.role };
      },
    }),
  ],

  session: { strategy: "jwt" },
  pages: { signIn: "/login" },

  callbacks: {
    async jwt({ token, user }) {
      const t = token as JWTPayload;
      if (user) {
        t.id = (user as JWTPayload).id;
        t.role = (user as JWTPayload).role;
      }
      return token;
    },

    async session({ session, token }) {
      const t = token as JWTPayload;
      if (session.user) {
        (session.user as JWTPayload).id = t.id;
        (session.user as JWTPayload).role = t.role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;



