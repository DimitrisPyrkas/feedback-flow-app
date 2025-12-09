"use client";

import { useEffect, useState } from "react";
import { FilterChip } from "./filter-chip";

type TopicOption = {
  topic: string;
  count: number;
};

export function TopicFilter() {
  const [topics, setTopics] = useState<TopicOption[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/feedback/topics", {
          cache: "no-store",
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          console.error("Failed to load topics:", res.status, text);
          if (!cancelled) {
            setError("Failed to load topics");
            setTopics([]);
          }
          return;
        }

        const json = (await res.json()) as { topics?: TopicOption[] };
        if (!cancelled) {
          setTopics(Array.isArray(json.topics) ? json.topics : []);
        }
      } catch (e) {
        console.error("Error loading topics:", e);
        if (!cancelled) {
          setError("Failed to load topics");
          setTopics([]);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (topics === null && !error) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-muted/60 px-2 py-1">
        <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/90">
          Topic
        </span>
        <span className="text-[10px] text-muted-foreground/70">Loading…</span>
      </div>
    );
  }

  if (!topics || topics.length === 0) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-muted/60 px-2 py-1">
        <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/90">
          Topic
        </span>
        <FilterChip label="All" param="topic" isDefault />
      </div>
    );
  }

  //Top 8 topics from API
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
        Topic
      </span>

      <FilterChip label="All" param="topic" isDefault />

      {topics.map((t) => (
        <FilterChip
          key={t.topic}
          label={`${t.topic} (${t.count})`}
          param="topic"
          value={t.topic}
        />
      ))}
    </div>
  );
}
