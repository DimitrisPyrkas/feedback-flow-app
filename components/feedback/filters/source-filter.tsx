"use client";

import { useEffect, useState } from "react";
import { FilterChip } from "./filter-chip";

type SourceStat = {
  source: string;
  count: number;
};

type SourcesResponse = {
  sources: SourceStat[];
};

function prettySourceName(source: string): string {
  const s = source.toLowerCase();
  if (s === "github") return "GitHub";
  if (s === "manual") return "Manual";
  if (s === "slack") return "Slack";
  if (s === "g2") return "G2";
  if (s === "capterra") return "Capterra";
  
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function SourceFilter() {
  const [sources, setSources] = useState<SourceStat[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSources() {
      try {
        setLoading(true);
        const res = await fetch("/api/feedback/sources");
        if (!res.ok) {
          console.error("Failed to load sources", res.status);
          return;
        }

        const json = (await res.json()) as SourcesResponse;
        if (!cancelled && Array.isArray(json.sources)) {
          setSources(json.sources);
        }
      } catch (err) {
        console.error("Error loading sources", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSources();
    return () => {
      cancelled = true;
    };
  }, []);

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
        Source
      </span>

      {/* "All" chip (no source param: show everything) */}
      <FilterChip label="All" param="source" isDefault />

      {/* Dynamic chips from real data */}
      {!loading &&
        sources.map((sourceStat: SourceStat) => (
          <FilterChip
            key={sourceStat.source}
            label={`${prettySourceName(sourceStat.source)} (${
              sourceStat.count
            })`}
            param="source"
            value={sourceStat.source}
          />
        ))}
    </div>
  );
}
