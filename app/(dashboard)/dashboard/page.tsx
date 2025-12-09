import { auth } from "@/lib/session";
import { cookies, headers } from "next/headers";
import AnalyticsSection from "@/components/dashboard/analytics-section";
import Link from "next/link";

type FeedbackBySource = {
  source: string;
  _count: { source: number };
};

type RecentFeedback = {
  id: string;
  source: string;
  rawContent: string;
  createdAt: string;
  userEmail?: string | null;
};

type SentimentCounts = {
  positive: number;
  neutral: number;
  negative: number;
};

type SeverityCounts = {
  [key: number]: number;
};

type HighSeverityItem = {
  id: string;
  rawContent: string;
  createdAt: string;
  severity: number | null;
  sentiment: string | null;
  userEmail?: string | null;
};

type DashboardOverview = {
  totalFeedback: number;
  totalNew: number;
  totalAcknowledged: number;
  totalActioned: number;
  feedbackBySource: FeedbackBySource[];
  recentFeedback: RecentFeedback[];
  sentimentCounts?: SentimentCounts;
  severityCounts?: SeverityCounts;
  highSeverityRecent?: HighSeverityItem[];
  admin?: {
    slackConnected: boolean;
  };
};

type DigestPreview = {
  from: string;
  to: string;
  totalNew: number;
  highSeverity: number;
  sentiment: {
    POSITIVE: number;
    NEUTRAL: number;
    NEGATIVE: number;
  };
  topTopics: { topic: string; count: number }[];
};

export default async function DashboardPage() {
  const session = await auth();
  const user = session?.user as { email?: string; role?: string } | undefined;

  if (!user) {
    return null;
  }

  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const res = await fetch(`${baseUrl}/api/dashboard/overview`, {
    cache: "no-store",
    headers: {
      cookie: cookieHeader,
    },
  });

  let data: DashboardOverview = {
    totalFeedback: 0,
    totalNew: 0,
    totalAcknowledged: 0,
    totalActioned: 0,
    feedbackBySource: [],
    recentFeedback: [],
  };

  if (res.ok) {
    data = (await res.json()) as DashboardOverview;
  } else {
    console.error(
      "Failed to load dashboard overview:",
      res.status,
      await res.text().catch(() => "")
    );
  }

  let digest: DigestPreview | null = null;

  if (user.role === "ADMIN") {
    try {
      const digestRes = await fetch(`${baseUrl}/api/admin/digest/preview`, {
        cache: "no-store",
        headers: { cookie: cookieHeader },
      });

      if (digestRes.ok) {
        digest = (await digestRes.json()) as DigestPreview;
      } else {
        console.error(
          "Failed to load digest preview:",
          digestRes.status,
          await digestRes.text().catch(() => "")
        );
      }
    } catch (e) {
      console.error("Digest preview fetch crashed:", e);
    }
  }

  const {
    totalFeedback,
    totalNew,
    totalAcknowledged,
    totalActioned,
    recentFeedback,
    sentimentCounts,
    severityCounts,
    highSeverityRecent,
    admin,
  } = data;

  const isAdmin = user.role === "ADMIN";

  return (
    <main className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome,{" "}
            <span className="font-medium text-foreground">
              {user.email ?? "user"}
            </span>{" "}
            ({user.role ?? "MEMBER"})
          </p>
        </div>

        {process.env.NODE_ENV === "development"}
      </div>

      {/* KPI cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Total Feedback
          </p>
          <p className="mt-2 text-3xl font-semibold">{totalFeedback ?? 0}</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">New</p>
          <p className="mt-2 text-2xl font-semibold text-sky-400">
            {totalNew ?? 0}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Acknowledged
          </p>
          <p className="mt-2 text-2xl font-semibold text-blue-400">
            {totalAcknowledged ?? 0}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Actioned</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-400">
            {totalActioned ?? 0}
          </p>
        </div>
      </section>

      {/* Recent + right-hand column (signals, high severity, integrations) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Feedback */}
        <div className="rounded-2xl border bg-card p-4 shadow-sm lg:col-span-2">
          <h2 className="text-muted-foreground text-sm">Recent Feedback</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {recentFeedback?.length ? (
              recentFeedback.map((f) => (
                <li
                  key={f.id}
                  className="flex items-start justify-between gap-3 border-b border-border/40 pb-2 last:border-b-0 last:pb-0"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] uppercase text-muted-foreground">
                      {f.source}
                      {isAdmin && f.userEmail ? ` · ${f.userEmail}` : ""}
                    </span>
                    <p
                      className="mt-0.5 text-xs text-foreground break-words overflow-hidden"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2, //max 2 lines
                        WebkitBoxOrient: "vertical",
                       
                      }}
                    >
                      {f.rawContent}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] text-muted-foreground whitespace-nowrap">
                    {new Date(f.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))
            ) : (
              <li className="text-xs text-muted-foreground">
                No recent feedback yet.
              </li>
            )}
          </ul>
        </div>

        {/* Right-hand column */}
        <div className="space-y-4">
          {/* Signals Snapshot (sentiment + severity) */}
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              Signals Snapshot
            </h2>

            <div className="space-y-3 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Sentiment</span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-[10px]">
                    Pos: {sentimentCounts?.positive ?? 0}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200 text-[10px]">
                    Neu: {sentimentCounts?.neutral ?? 0}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 text-[10px]">
                    Neg: {sentimentCounts?.negative ?? 0}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span>Severity</span>
                <div className="flex flex-wrap gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 rounded-full border text-[10px] sm:text-[11px] text-muted-foreground"
                    >
                      S{s}: {severityCounts?.[s] ?? 0}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* High Severity queue – admin only */}
          {isAdmin && (
            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-medium text-muted-foreground">
                  High Severity (7 days)
                </h2>
                <Link
                  href="/feedback?minSeverity=4"
                  className="text-[11px] text-primary hover:underline"
                >
                  View all
                </Link>
              </div>

              {highSeverityRecent && highSeverityRecent.length > 0 ? (
                <ul className="space-y-2 text-xs text-muted-foreground">
                  {highSeverityRecent.map((item) => (
                    <li
                      key={item.id}
                      className="border-b border-border/40 pb-2 last:border-0 last:pb-0"
                    >
                      <p className="truncate text-foreground">
                        {item.rawContent}
                      </p>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className="text-[10px]">
                          S{item.severity ?? "?"} · {item.sentiment ?? "N/A"}
                        </span>
                        {item.userEmail && (
                          <span className="text-[10px] text-muted-foreground">
                            {item.userEmail}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No severity ≥ 4 in the last 7 days.
                </p>
              )}
            </div>
          )}

          {/* Integrations – admin only */}
          {isAdmin && (
            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <h2 className="text-sm font-medium text-muted-foreground mb-3">
                Integrations
              </h2>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span>Slack</span>
                <span
                  className={
                    admin?.slackConnected
                      ? "px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-[10px] uppercase tracking-wide"
                      : "px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 text-[10px] uppercase tracking-wide"
                  }
                >
                  {admin?.slackConnected ? "Connected" : "Not configured"}
                </span>
              </div>
            </div>
          )}

          {/* Daily digest preview – admin only */}
          {user.role === "ADMIN" && digest && (
            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <h2 className="text-sm font-medium text-muted-foreground mb-1">
                Daily Digest (Preview)
              </h2>
              <p className="text-[11px] text-muted-foreground mb-3">
                Last 24 hours across all sources.
              </p>

              {digest.totalNew === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No new feedback in the last 24 hours.
                </p>
              ) : (
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>New feedback</span>
                    <span className="font-semibold text-foreground">
                      {digest.totalNew}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>High severity (S≥4)</span>
                    <span className="font-semibold text-red-400">
                      {digest.highSeverity}
                    </span>
                  </div>

                  <div className="mt-2">
                    <p className="font-medium text-foreground mb-1">
                      Sentiment
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-[12px]">
                        Pos: {digest.sentiment.POSITIVE}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200 text-[12px]">
                        Neu: {digest.sentiment.NEUTRAL}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 text-[12px]">
                        Neg: {digest.sentiment.NEGATIVE}
                      </span>
                    </div>
                  </div>

                  {digest.topTopics.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium text-foreground mb-1">
                        Top topics
                      </p>
                      <ul className="space-y-1">
                        {digest.topTopics.slice(0, 4).map((t) => (
                          <li
                            key={t.topic}
                            className="flex items-center justify-between"
                          >
                            <span className="truncate max-w-[140px]">
                              {t.topic}
                            </span>
                            <span className="text-muted-foreground">
                              {t.count}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Charts (FeedbackTrend, SentimentTrend, SourceBreakdown, TopTopics) */}
      <AnalyticsSection />
    </main>
  );
}
