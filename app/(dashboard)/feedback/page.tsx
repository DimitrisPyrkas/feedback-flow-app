import prisma from "@/lib/prisma";
import { auth } from "@/lib/session";
import FeedbackTable from "@/components/feedback/feedback-table";
import { StatusFilter } from "@/components/feedback/filters/status-filter";
import { SentimentFilter } from "@/components/feedback/filters/sentiment-filter";
import { SeverityFilter } from "@/components/feedback/filters/severity-filter";
import { SourceFilter } from "@/components/feedback/filters/source-filter";
import { TopicFilter } from "@/components/feedback/filters/topic-filter";

type SearchParams = {
  page?: string;
  search?: string;
  status?: string;
  sentiment?: string;
  severity?: string;
  source?: string;
  topic?: string;
  minSeverity?: string;
  sort?: string;
  dir?: string;
};

const PAGE_SIZE = 10;

function toStatus(value?: string) {
  if (!value) return undefined;
  const v = value.toUpperCase();
  return v === "NEW" || v === "ACKNOWLEDGED" || v === "ACTIONED"
    ? (v as "NEW" | "ACKNOWLEDGED" | "ACTIONED")
    : undefined;
}

function toSentiment(value?: string) {
  if (!value) return undefined;
  const v = value.toUpperCase();
  return v === "POSITIVE" || v === "NEUTRAL" || v === "NEGATIVE"
    ? (v as "POSITIVE" | "NEUTRAL" | "NEGATIVE")
    : undefined;
}

function toSeverity(value?: string) {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : undefined;
}

export default async function FeedbackPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  const user = session?.user as { id: string; role?: string } | undefined;

  if (!user) {
    return null;
  }

  const role = (user.role ?? "MEMBER") as "ADMIN" | "MEMBER";
  const isAdmin = role === "ADMIN";

  const sp = await props.searchParams;

  const page = Math.max(1, Number(sp.page) || 1);
  const search = (sp.search || "").trim();

  const statusFilter = toStatus(sp.status);
  const sentimentFilter = toSentiment(sp.sentiment);
  const severityFilter = toSeverity(sp.severity);
  const minSeverityRaw = sp.minSeverity;
  const minSeverity =
    typeof minSeverityRaw === "string" ? Number(minSeverityRaw) : undefined;
  const minSeverityFilter =
    typeof minSeverity === "number" && minSeverity >= 1 && minSeverity <= 5
      ? minSeverity
      : undefined;

  const sourceFilter =
    sp.source && sp.source !== "all" ? sp.source.trim() : undefined;
  const topicFilter =
    sp.topic && sp.topic !== "all" ? sp.topic.trim().toLowerCase() : undefined;

  const sortKey = sp.sort || "createdAt";
  const sortDir: "asc" | "desc" = sp.dir === "asc" ? "asc" : "desc";

  const orderBy: { [key: string]: "asc" | "desc" }[] = [];

  switch (sortKey) {
    case "severity":
      orderBy.push({ severity: sortDir });
      break;
    case "sentiment":
      orderBy.push({ sentiment: sortDir });
      break;
    case "status":
      orderBy.push({ status: sortDir });
      break;
    default:
      orderBy.push({ createdAt: sortDir });
      break;
  }

  //newest first when values equal
  if (sortKey !== "createdAt") {
    orderBy.push({ createdAt: "desc" });
  }

  const where: {
    userId?: string | null;
    status?: "NEW" | "ACKNOWLEDGED" | "ACTIONED";
    sentiment?: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
    severity?: number | { gte: number };
    source?: string;
    topics?: { has: string };
    rawContent?: { contains: string; mode: "insensitive" };
    OR?: { userId: string | null }[];
  } = {};

  if (role !== "ADMIN") {
    where.OR = [{ userId: user.id }, { userId: null }];
  }

  if (statusFilter) where.status = statusFilter;
  if (sentimentFilter) where.sentiment = sentimentFilter;
  if (typeof minSeverityFilter === "number") {
    // High-severity view: S >= minSeverity
    where.severity = { gte: minSeverityFilter };
  } else if (typeof severityFilter === "number") {
    where.severity = severityFilter;
  }

  if (sourceFilter) where.source = sourceFilter;
  if (topicFilter) where.topics = { has: topicFilter };
  if (search) {
    where.rawContent = {
      contains: search,
      mode: "insensitive",
    };
  }

  const [items, total] = await Promise.all([
    prisma.feedbackItem.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        source: true,
        rawContent: true,
        status: true,
        createdAt: true,
        sentiment: true,
        severity: true,
        topics: true,
      },
    }),
    prisma.feedbackItem.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const tableData = items.map((f) => ({
    id: f.id,
    source: f.source,
    rawContent: f.rawContent,
    status: f.status,
    createdAt: f.createdAt.toISOString(),
    sentiment: f.sentiment
      ? ["POSITIVE", "NEUTRAL", "NEGATIVE"].includes(f.sentiment)
        ? (f.sentiment as "POSITIVE" | "NEUTRAL" | "NEGATIVE")
        : undefined
      : undefined,
    severity: typeof f.severity === "number" ? f.severity : undefined,
    topics: Array.isArray(f.topics)
      ? f.topics.map((t) => String(t))
      : undefined,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Feedback Inbox</h1>
          <p className="text-sm text-muted-foreground">
            Filter by status, sentiment, severity, source, topic &amp; search.
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-border bg-card/70 px-4 py-3 shadow-sm">
        <StatusFilter />
        <SentimentFilter />
        <SeverityFilter />
        <SourceFilter />
        <TopicFilter />
      </div>

      {/* Reset / Clear filters */}
      <form action="/feedback" className="ml-auto">
        <button
          type="submit"
          className="
      inline-flex items-center rounded-full 
      px-3 py-1.5 text-xs font-medium transition-colors

      /* Light mode */
      bg-slate-200 text-slate-700 border border-slate-300
      hover:bg-slate-300 hover:text-slate-900

      /* Dark mode */
      dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700
      dark:hover:bg-slate-700 dark:hover:text-white
    "
        >
          Reset Filters
        </button>
      </form>

      <FeedbackTable
        data={tableData}
        currentPage={page}
        totalPages={totalPages}
        search={search}
        sortKey={sortKey}
        sortDir={sortDir}
        isAdmin={isAdmin}
      />
    </div>
  );
}
