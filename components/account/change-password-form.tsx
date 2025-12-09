"use client";

import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ChangePasswordForm() {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirm) {
      setError("New passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };

      if (!res.ok || !data.ok) {
        setError(data.error || "Unable to change password.");
        return;
      }

      toast.success("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
      setOpen(false);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-2">
      {/* Row label + toggle button */}
      <div className="flex items-center justify-between">
        <span>Password</span>
       <Button
  type="button"
  onClick={() => setOpen((v) => !v)}
  className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors
    ${
      open
        ? "bg-rose-600 text-white border-rose-700 hover:bg-rose-700"
        : "bg-primary/90 text-primary-foreground hover:bg-primary hover:shadow-md"
    }
  `}
>
  {open ? "Cancel" : "Change"}
</Button>

      </div>

      {/* Form */}
      {open && (
        <form onSubmit={onSubmit} className="mt-2 space-y-2">
          <input
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm bg-background"
            required
          />
          <input
            type="password"
            placeholder="New password (min 8 chars)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm bg-background"
            required
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm bg-background"
            required
          />

          {error && (
            <p className="text-xs text-red-500 leading-snug">{error}</p>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={submitting}
              className="px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save password"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
