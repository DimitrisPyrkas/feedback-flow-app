"use client";

import { FilterChip } from "./filter-chip";

export function StatusFilter() {
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
        Status
      </span>
      <FilterChip label="All" param="status" isDefault />
      <FilterChip label="New" param="status" value="NEW" />
      <FilterChip label="Ack" param="status" value="ACKNOWLEDGED" />
      <FilterChip label="Actioned" param="status" value="ACTIONED" />
    </div>
  );
}
