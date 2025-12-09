"use client";

import { FilterChip } from "./filter-chip";

export function SentimentFilter() {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full 
                    bg-muted/70 dark:bg-slate-800/80 
                    px-3 py-2 border border-border/60 shadow-sm"
    >
      <span
        className="px-2 py-0.5 rounded-full text-[10px] font-semibold 
                   uppercase tracking-wide
                   bg-slate-100 text-slate-700
                   dark:bg-slate-950 dark:text-slate-100"
      >
        Sentiment
      </span>
      <FilterChip label="All" param="sentiment" isDefault />
      <FilterChip label="😊 Pos" param="sentiment" value="POSITIVE" />
      <FilterChip label="😐 Neu" param="sentiment" value="NEUTRAL" />
      <FilterChip label="😡 Neg" param="sentiment" value="NEGATIVE" />
    </div>
  );
}
