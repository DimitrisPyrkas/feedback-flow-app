"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type SentimentTrendPoint = {
  date: string;
  positive: number;
  neutral: number;
  negative: number;
};

type TopicBucket = {
  topic: string;
  count: number;
};

type FeedbackBySource = {
  source: string;
  _count: { source: number };
};

type DashboardOverview = {
  sentimentTrend?: SentimentTrendPoint[];
  topicDistribution?: TopicBucket[];
  feedbackBySource?: FeedbackBySource[];
};

const SOURCE_COLORS = ["#6366F1", "#F97316", "#22C55E", "#EC4899", "#0EA5E9"];

export default function AnalyticsSection() {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/dashboard/overview", {
          cache: "no-store",
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          console.error("Failed to load analytics overview:", res.status, text);
          if (!cancelled) setError("Failed to load analytics.");
          return;
        }
        const json = (await res.json()) as DashboardOverview;
        if (!cancelled) setData(json);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("Failed to load analytics.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const sentimentTrend = data?.sentimentTrend ?? [];
  const topicDistribution = data?.topicDistribution ?? [];
  const feedbackBySource = data?.feedbackBySource ?? [];

  // Feedback Trend (total count per day)
  const feedbackTrendData = sentimentTrend.map((d) => ({
    date: d.date.slice(5), // show MM-DD
    total: d.positive + d.neutral + d.negative,
  }));

  const sentimentTrendChartData = sentimentTrend.map((d) => ({
    ...d,
    label: d.date.slice(5), // "MM-DD"
  }));

  const sourcePieData = feedbackBySource.map((s) => ({
    name: s.source,
    value: s._count.source,
  }));

  if (loading) {
    return (
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-4 shadow-sm h-64 animate-pulse" />
        <div className="rounded-2xl border bg-card p-4 shadow-sm h-64 animate-pulse" />
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">{error ?? "No data."}</p>
      </section>
    );
  }

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      {/* Feedback Trend (Last 7 Days) */}
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-medium text-muted-foreground mb-3">
          Feedback Trend (Last 7 Days)
        </h2>
        <div className="h-64 w-full">
          <ResponsiveContainer>
            <LineChart data={feedbackTrendData}>
              <CartesianGrid
                stroke="rgba(148, 163, 184, 0.25)"
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "currentColor" }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "currentColor" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--background)",
                  color: "var(--foreground)",
                  border: "1px solid hsl(var(--border))",
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#6366F1"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Feedback Source Breakdown */}
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-medium text-muted-foreground mb-3">
          Feedback Source Breakdown
        </h2>
        <div className="h-64 w-full flex items-center justify-center">
          {sourcePieData.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No feedback sources yet.
            </p>
          ) : (
            <ResponsiveContainer>
              <PieChart>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    border: "1px solid hsl(var(--border))",
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "var(--foreground)" }}
                  itemStyle={{ color: "var(--foreground)" }}
                />

                <Pie
                  data={sourcePieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {sourcePieData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={
                        SOURCE_COLORS[index % SOURCE_COLORS.length] ??
                        SOURCE_COLORS[0]
                      }
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Sentiment Trend (Last 7 Days) */}
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-medium text-muted-foreground mb-3">
          Sentiment Trend (Last 7 Days)
        </h2>
        <div className="h-64 w-full">
          <ResponsiveContainer>
            <LineChart data={sentimentTrendChartData}>
              <CartesianGrid
                stroke="rgba(148, 163, 184, 0.35)"
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "currentColor" }}
                tickMargin={8}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "currentColor" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--background)",
                  color: "var(--foreground)",
                  border: "1px solid hsl(var(--border))",
                  fontSize: 12,
                }}
              />
              <Legend
                wrapperStyle={{
                  fontSize: 11,
                  color: "var(--foreground)",
                }}
              />
              <Line
                type="monotone"
                dataKey="positive"
                name="Positive"
                stroke="#22C55E"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="neutral"
                name="Neutral"
                stroke="#0EA5E9"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="negative"
                name="Negative"
                stroke="#EF4444"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Topics */}
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-medium text-muted-foreground mb-3">
          Top Topics (Last 7 Days)
        </h2>
        <div className="h-64 w-full">
          {topicDistribution.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No topics extracted yet.
            </p>
          ) : (
            <ResponsiveContainer>
              <BarChart
                data={topicDistribution}
                layout="vertical"
                margin={{ left: 60, right: 16 }}
              >
                {/* gradient definition, nothing else changed */}
                <defs>
                  <linearGradient
                    id="topicGradient"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                  >
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.9} />
                    <stop
                      offset="100%"
                      stopColor="#a855f7"
                      stopOpacity={0.95}
                    />
                  </linearGradient>
                </defs>

                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "currentColor" }}
                />
                <YAxis
                  type="category"
                  dataKey="topic"
                  tick={{ fontSize: 11, fill: "currentColor" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    border: "1px solid hsl(var(--border))",
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "var(--foreground)" }}
                  itemStyle={{ color: "var(--foreground)" }}
                />

                {/* CHANGED: radius & fill only */}
                <Bar
                  dataKey="count"
                  radius={[8, 8, 8, 8]}
                  fill="url(#topicGradient)"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </section>
  );
}
