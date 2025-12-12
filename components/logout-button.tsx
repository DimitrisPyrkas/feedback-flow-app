"use client";

import { useTransition } from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => signOut({ callbackUrl: '/login' }))}
      disabled={isPending}
      className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition disabled:opacity-50"
    >
      <LogOut size={16} />
      <span>{isPending ? "Signing out..." : "Logout"}</span>
    </button>
  );
}
