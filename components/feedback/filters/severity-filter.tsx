"use client";

import { FilterChip } from "./filter-chip";

export function SeverityFilter() {
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
        Severity
      </span>
      <FilterChip label="All" param="severity" isDefault />
      <FilterChip label="S1" param="severity" value="1" />
      <FilterChip label="S2" param="severity" value="2" />
      <FilterChip label="S3" param="severity" value="3" />
      <FilterChip label="S4" param="severity" value="4" />
      <FilterChip label="S5" param="severity" value="5" />
    </div>
  );
}
