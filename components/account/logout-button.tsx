"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <Button
      className="w-full rounded-md bg-red-600 text-white py-2 text-sm font-medium hover:bg-red-700"
      onClick={() => signOut({ callbackUrl: '/login' })}
    >
      Logout
    </Button>
  );
}
