"use client";

import { Badge } from "@/components/ui/badge";

type Sentiment = "POSITIVE" | "NEUTRAL" | "NEGATIVE" | undefined;
type Severity = 1 | 2 | 3 | 4 | 5 | undefined;

export function SignalChips({
  sentiment,
  severity,
}: {
  sentiment?: Sentiment;
  severity?: Severity;
}) {
  // Sentiment color
  const sClass =
    sentiment === "POSITIVE"
      ? "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700"
      : sentiment === "NEGATIVE"
      ? "bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-900/50 dark:text-rose-300 dark:border-rose-700"
      : "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800/70 dark:text-slate-300 dark:border-slate-700"; 

  // Severity color (1–5)
  const sevClass =
    severity && severity >= 5
      ? "bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-900/60 dark:text-rose-300 dark:border-rose-700"
      : severity === 4
      ? "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/60 dark:text-amber-300 dark:border-amber-700"
      : severity === 3
      ? "bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-700"
      : "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700";

 return (
  <div className="flex items-center gap-2">
    {sentiment && severity ? (
      <>
        <Badge className={`px-2 py-0.5 text-[10px] font-medium ${sClass}`}>
          {sentiment}
        </Badge>
        <Badge className={`px-2 py-0.5 text-[10px] font-medium ${sevClass}`}>
          S{severity}
        </Badge>
      </>
    ) : (
      <span className="text-xs text-muted-foreground">—</span>
    )}
  </div>
);

}
