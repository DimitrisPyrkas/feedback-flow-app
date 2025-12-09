"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function BatchAnalyzeButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick(): Promise<void> {
    setLoading(true);
    try {
      const res = await fetch("/api/llm/batch", { method: "POST" });
      const data: { ok?: boolean; processed?: number; error?: string } = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Batch analysis failed");
      }

      toast.success(`✅ AI analyzed ${data.processed ?? 0} feedback items`);
      router.refresh(); // Refresh the table after analysis
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      className="rounded-full bg-indigo-600 text-white hover:bg-indigo-500"
    >
      {loading ? "Running…" : "Run AI Batch"}
    </Button>
  );
}
