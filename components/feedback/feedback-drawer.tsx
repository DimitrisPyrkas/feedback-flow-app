"use client";

import { useMemo, useTransition, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { FeedbackDrawerTabs } from "./feedback-drawer-tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type DrawerFeedback = {
  id: string;
  source: string;
  rawContent: string;
  status: "NEW" | "ACKNOWLEDGED" | "ACTIONED" | string;
  createdAt: string;
};

export function FeedbackDrawer({
  feedback,
  isAdmin = false,
}: {
  feedback: DrawerFeedback;
  isAdmin?: boolean;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [analysisVersion, setAnalysisVersion] = useState(0);

  //note for this status change
  const [note, setNote] = useState("");

  const open = useMemo(
    () => searchParams.get("id") === feedback.id,
    [searchParams, feedback.id]
  );

  const onOpenChange = (next: boolean) => {
    if (!next) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("id");
      const qs = params.toString();
      router.replace(qs ? `/feedback?${qs}` : "/feedback");
    }
  };

  async function updateStatus(newStatus: "NEW" | "ACKNOWLEDGED" | "ACTIONED") {
    try {
      const res = await fetch(`/api/feedback/${feedback.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          note: note.trim().length ? note.trim() : undefined,
        }),
      });

      if (!res.ok) {
        toast.error("Failed to update status");
        return;
      }

      const msg =
        newStatus === "NEW"
          ? "Status reset to NEW"
          : newStatus === "ACKNOWLEDGED"
          ? "Feedback acknowledged"
          : "Feedback marked as actioned";

      toast.success(msg);
      setNote("");
      router.refresh();
    } catch {
      toast.error("Something went wrong while updating status");
    }
  }

  async function runAnalysis() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/llm/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ feedbackId: feedback.id }),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          console.error("AI analyze failed:", res.status, text);

          if (res.status === 403) {
            toast.error("Only admins can run manual AI analysis.");
          } else if (res.status === 401) {
            toast.error("Please sign in again.");
          } else {
            toast.error("AI analysis failed");
          }
          return;
        }

        const json: { ok?: boolean; analysis?: { severityScore?: number } } =
          await res.json().catch(() => ({}));

        const sev = json.analysis?.severityScore;

        //show this toast after AI analysis completed
        toast.success("AI analysis completed");

        //If high severity, show a second toast slightly later
        if (typeof sev === "number" && sev >= 4) {
          setTimeout(() => {
            toast.warning(
              `High severity feedback detected (S${sev}). Check your Slack alerts.`
            );
          }, 300);
        }

        setAnalysisVersion((v) => v + 1);
        router.refresh();
      } catch (err) {
        console.error("AI analysis error:", err);
        toast.error("Something went wrong while running AI analysis");
      }
    });
  }

  const statusColor =
    feedback.status === "ACTIONED"
      ? "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/60 dark:text-emerald-300 dark:border-emerald-700"
      : feedback.status === "ACKNOWLEDGED"
      ? "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/60 dark:text-blue-300 dark:border-blue-700"
      : "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800/70 dark:text-slate-300 dark:border-slate-700";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl border-l bg-background p-0"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b space-y-3">
            <SheetHeader>
              <SheetTitle className="text-lg font-semibold">
                Feedback Detail Review
              </SheetTitle>
            </SheetHeader>

            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium text-muted-foreground">
                  Source:
                </span>
                <Badge>{feedback.source}</Badge>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium text-muted-foreground">
                  Status:
                </span>
                <Badge
                  className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusColor}`}
                >
                  {feedback.status}
                </Badge>
              </div>

              <div className="text-xs text-muted-foreground">
                Created: {new Date(feedback.createdAt).toLocaleString()}
              </div>
            </div>

            {/* Triage + AI Actions */}
            <div className="flex flex-wrap gap-2 pt-1">
              {feedback.status === "NEW" && (
                <button
                  onClick={() =>
                    startTransition(() => updateStatus("ACKNOWLEDGED"))
                  }
                  disabled={isPending}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold",
                    "bg-blue-500 text-white hover:bg-blue-600",
                    "transition-all duration-200",
                    "hover:shadow-[0_0_10px_-2px_rgba(59,130,246,0.35)]",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  ✅ Mark as Acknowledged
                </button>
              )}

              {feedback.status === "ACKNOWLEDGED" && (
                <button
                  onClick={() =>
                    startTransition(() => updateStatus("ACTIONED"))
                  }
                  disabled={isPending}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold",
                    "bg-emerald-500 text-white hover:bg-emerald-600",
                    "transition-all duration-200",
                    "hover:shadow-[0_0_10px_-2px_rgba(16,185,129,0.35)]",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  🚀 Mark as Actioned
                </button>
              )}

              {/* Only admins can run manual AI analysis */}
              {isAdmin && (
                <button
                  onClick={runAnalysis}
                  disabled={isPending}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium",
                    "text-muted-foreground hover:text-foreground bg-background/60 hover:bg-muted/80",
                    "transition-all duration-200",
                    "hover:shadow-[0_0_10px_-2px_rgba(59,130,246,0.25)] dark:hover:shadow-[0_0_10px_-2px_rgba(59,130,246,0.18)]",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  ⚙️ Run AI Analysis
                </button>
              )}
            </div>

            {/*Optional note for this status change */}
            <div className="pt-2">
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                Triage note (optional)
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Write a short note about this status change..."
                className={cn(
                  "w-full rounded-md border bg-background px-3 py-2 text-xs",
                  "text-foreground placeholder:text-muted-foreground",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  "resize-none"
                )}
              />
            </div>
          </div>

          {/* Body / Tabs */}
          <div className="p-6 overflow-y-auto text-sm leading-6 flex-1">
            <FeedbackDrawerTabs
              feedbackId={feedback.id}
              rawContent={feedback.rawContent}
              analysisVersion={analysisVersion}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
