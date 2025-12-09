"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
} from "@tanstack/react-table";
import { useRouter, useSearchParams } from "next/navigation";
import { FeedbackDrawer } from "./feedback-drawer";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type FeedbackItem = {
  id: string;
  source: string;
  rawContent: string;
  status: "NEW" | "ACKNOWLEDGED" | "ACTIONED" | string;
  createdAt: string;
  sentiment?: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  severity?: number;
  topics?: string[];
};

type Props = {
  data: FeedbackItem[];
  currentPage: number;
  totalPages: number;
  search: string;
  sortKey: string;
  sortDir: "asc" | "desc";
  isAdmin: boolean;
};

export default function FeedbackTable({
  data,
  currentPage,
  totalPages,
  search,
  sortKey,
  sortDir,
  isAdmin,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openId = searchParams.get("id");

  const setSort = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());

    const currentKey = params.get("sort") || "createdAt";
    const currentDir = params.get("dir") === "asc" ? "asc" : "desc";

    let nextDir: "asc" | "desc" = "desc";

    if (currentKey === key) {
      nextDir = currentDir === "desc" ? "asc" : "desc";
    }

    params.set("sort", key);
    params.set("dir", nextDir);

    const qs = params.toString();
    router.push(qs ? `/feedback?${qs}` : "/feedback");
  };

  const renderSortIcon = (key: string) => {
    if (sortKey !== key) return null;
    return (
      <span className="ml-1 text-[10px]">{sortDir === "asc" ? "↑" : "↓"}</span>
    );
  };

  const columns: ColumnDef<FeedbackItem>[] = [
    {
      header: "Source",
      accessorKey: "source",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.source}</span>
      ),
    },
    {
      header: () => (
        <button
          type="button"
          onClick={() => setSort("status")}
          className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide"
        >
          Status
          {renderSortIcon("status")}
        </button>
      ),
      accessorKey: "status",
      cell: ({ row }) => {
        const st = row.original.status;
        const cls =
          st === "ACTIONED"
            ? "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/60 dark:text-emerald-300 dark:border-emerald-700"
            : st === "ACKNOWLEDGED"
            ? "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/60 dark:text-blue-300 dark:border-blue-700"
            : "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800/70 dark:text-slate-300 dark:border-slate-700";
        return (
          <Badge
            className={cn(
              "px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              cls
            )}
          >
            {st}
          </Badge>
        );
      },
    },
    // --- Sentiment column ---
    {
      header: () => (
        <button
          type="button"
          onClick={() => setSort("sentiment")}
          className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide"
        >
          Sentiment
          {renderSortIcon("sentiment")}
        </button>
      ),
      id: "sentiment",
      cell: ({ row }) => {
        const s = row.original.sentiment;

        if (!s) {
          return <span className="text-xs text-muted-foreground">—</span>;
        }

        const label =
          s === "POSITIVE" ? "Pos" : s === "NEGATIVE" ? "Neg" : "Neu";

        const cls =
          s === "POSITIVE"
            ? "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700"
            : s === "NEGATIVE"
            ? "bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700"
            : "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800/70 dark:text-slate-300 dark:border-slate-700";

        return (
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
              cls
            )}
          >
            {label}
          </span>
        );
      },
    },

    // --- Severity column ---
    {
      header: () => (
        <button
          type="button"
          onClick={() => setSort("severity")}
          className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide"
        >
          Severity
          {renderSortIcon("severity")}
        </button>
      ),
      id: "severity",
      cell: ({ row }) => {
        const sev = row.original.severity;

        if (typeof sev !== "number") {
          return <span className="text-xs text-muted-foreground">—</span>;
        }

        const cls =
          sev >= 4
            ? "bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700"
            : sev === 3
            ? "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700"
            : "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800/70 dark:text-slate-300 dark:border-slate-700";

        return (
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
              cls
            )}
          >
            S{sev}
          </span>
        );
      },
    },

    {
      header: "Topics",
      accessorKey: "topics",
      cell: ({ row }) => {
        const topics = row.original.topics ?? [];
        if (!topics.length) {
          return <span className="text-xs text-muted-foreground">—</span>;
        }

        const visible = topics.slice(0, 3);

        return (
          <div className="flex flex-wrap gap-1">
            {visible.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
              >
                {t}
              </span>
            ))}
            {topics.length > 3 && (
              <span className="text-[10px] text-muted-foreground">
                +{topics.length - 3}
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: "Content",
      accessorKey: "rawContent",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.rawContent.slice(0, 80)}
          {row.original.rawContent.length > 80 ? "…" : ""}
        </span>
      ),
    },
    {
      header: () => (
        <button
          type="button"
          onClick={() => setSort("createdAt")}
          className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide"
        >
          Created
          {renderSortIcon("createdAt")}
        </button>
      ),
      accessorKey: "createdAt",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleString()}
        </span>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const active = openId ? data.find((d) => d.id === openId) : undefined;

  return (
    <>
      {/* Search bar */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <form className="flex-1">
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search feedback..."
            className="w-full rounded-md border border-border px-3 py-2 text-sm bg-background"
          />
        </form>

        {search && (
          <button
            type="button"
            onClick={() => router.push("/feedback")}
            className="text-xs text-muted-foreground hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card/60 backdrop-blur overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className="px-4 py-2 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wide"
                  >
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((r) => {
              const isActive = openId === r.original.id;
              return (
                <tr
                  key={r.original.id}
                  data-state={isActive ? "selected" : undefined}
                  className={cn(
                    "cursor-pointer hover:bg-muted/50 transition-colors",
                    isActive &&
                      "bg-accent/60 border-l-4 border-primary font-medium"
                  )}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.set("id", r.original.id);
                    router.push(`/feedback?${params.toString()}`);
                  }}
                >
                  {r.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-2 border-b">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4 text-sm">
        {(() => {
          const goToPage = (target: number) => {
            const params = new URLSearchParams(searchParams.toString());

            if (target <= 1) {
              params.delete("page");
            } else {
              params.set("page", String(target));
            }

            const qs = params.toString();
            router.push(qs ? `/feedback?${qs}` : "/feedback");
          };

          return (
            <>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => goToPage(1)}
                  className="px-3 py-1 rounded border disabled:opacity-40"
                >
                  « First
                </button>
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => goToPage(currentPage - 1)}
                  className="px-3 py-1 rounded border disabled:opacity-40"
                >
                  ← Previous
                </button>
              </div>

              <p className="text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => goToPage(currentPage + 1)}
                  className="px-3 py-1 rounded border disabled:opacity-40"
                >
                  Next →
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => goToPage(totalPages)}
                  className="px-3 py-1 rounded border disabled:opacity-40"
                >
                  Last »
                </button>
              </div>
            </>
          );
        })()}
      </div>

      {/* Drawer */}
      {active && <FeedbackDrawer feedback={active} isAdmin={isAdmin} />}
    </>
  );
}
