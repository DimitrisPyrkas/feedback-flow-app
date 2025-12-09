"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BarChart2, Brain, ListChecks } from "lucide-react";
import { AlertTriangle } from "lucide-react";

type Analysis = {
  id: string;
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  severityScore: number;
  summary: string;
  topics: unknown;
};

type Props = {
  feedbackId: string;
  rawContent: string;
  analysisVersion: number; // used to trigger refetch after new analysis
};

export function FeedbackDrawerTabs({
  feedbackId,
  rawContent,
  analysisVersion,
}: Props) {
  const [tab, setTab] = useState("details");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/feedback/${feedbackId}/analysis`, {
          cache: "no-store",
        });

        if (!res.ok) {
          if (!cancelled && res.status !== 404) {
            const text = await res.text().catch(() => "");
            console.error("Failed to load analysis:", res.status, text);
            setError("Failed to load AI analysis");
          }
          if (!cancelled) setAnalysis(null);
        } else {
          const json = (await res.json()) as { analysis: Analysis | null };
          if (!cancelled) setAnalysis(json.analysis);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("Failed to load AI analysis");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [feedbackId, analysisVersion]);

  // ----- derive display values -----

  const sentimentLabel =
    analysis?.sentiment === "POSITIVE"
      ? "Positive"
      : analysis?.sentiment === "NEGATIVE"
      ? "Negative"
      : analysis?.sentiment === "NEUTRAL"
      ? "Neutral"
      : "Not scored";

  const severityValue =
    typeof analysis?.severityScore === "number" ? analysis.severityScore : null;

  const severityLabel =
    severityValue !== null
      ? `S${severityValue} · ${
          severityValue >= 4 ? "High" : severityValue === 3 ? "Medium" : "Low"
        }`
      : "Not scored";

  const topics: string[] =
    analysis && Array.isArray(analysis.topics)
      ? (analysis.topics as string[])
      : analysis &&
        typeof analysis.topics === "object" &&
        analysis.topics !== null
      ? Object.keys(analysis.topics as Record<string, unknown>)
      : [];

  const isHighSeverity =
    typeof severityValue === "number" &&
    !Number.isNaN(severityValue) &&
    severityValue >= 4;

  // ----- UI -----
  return (
    <Tabs value={tab} onValueChange={setTab} className="mt-4">
      {/* always show when analysis exists */}
      {analysis && !loading && !error && (
        <div className="mb-2 rounded-md border border-emerald-700/40 bg-emerald-900/30 text-emerald-100 px-3 py-2 text-xs">
          ✅ AI analysis completed and saved for this feedback.
        </div>
      )}
      {/* High severity banner – visible for ANY user if severity >= 4 */}
      {isHighSeverity && (
        <div
          role="alert"
          className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-[2px] h-4 w-4 flex-shrink-0" />

            <div>
              <p className="font-semibold">
                High severity detected (S{severityValue}).
              </p>

              <p className="mt-1">
                A Slack alert was sent to{" "}
                {process.env.NEXT_PUBLIC_SLACK_CHANNEL_URL ? (
                  <a
                    href={process.env.NEXT_PUBLIC_SLACK_CHANNEL_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2 font-medium"
                  >
                    #alerts
                  </a>
                ) : (
                  <span className="font-medium">#alerts</span>
                )}{" "}
                channel.
              </p>
            </div>
          </div>
        </div>
      )}

      <TabsList className="grid grid-cols-3 w-full">
        <TabsTrigger value="details">
          <BarChart2 className="mr-1 h-3 w-3" />
          Details
        </TabsTrigger>
        <TabsTrigger value="analytics">
          <ListChecks className="mr-1 h-3 w-3" />
          Signals
        </TabsTrigger>
        <TabsTrigger value="ai">
          <Brain className="mr-1 h-3 w-3" />
          AI Analysis
        </TabsTrigger>
      </TabsList>

      {/* DETAILS */}
      <TabsContent value="details" className="pt-4">
        <p className="text-sm whitespace-pre-wrap text-foreground">
          {rawContent}
        </p>
      </TabsContent>

      {/* SIGNALS */}
      <TabsContent value="analytics" className="pt-4">
        {loading && (
          <p className="text-xs text-muted-foreground">Loading signals…</p>
        )}
        {error && <p className="text-xs text-red-500">{error}</p>}

        {!loading && !error && (
          <div className="space-y-2 text-sm text-muted-foreground">
            <div>
              <span className="font-medium text-foreground">Sentiment:</span>{" "}
              {sentimentLabel}
            </div>
            <div>
              <span className="font-medium text-foreground">Severity:</span>{" "}
              {severityLabel}
            </div>
            <div>
              <span className="font-medium text-foreground">Topics:</span>{" "}
              {topics.length ? topics.join(", ") : "No topics extracted yet"}
            </div>
          </div>
        )}
      </TabsContent>

      {/* AI ANALYSIS */}
      <TabsContent value="ai" className="pt-4">
        {loading && (
          <p className="text-xs text-muted-foreground">Loading AI analysis…</p>
        )}
        {error && <p className="text-xs text-red-500">{error}</p>}

        {!loading && !error && !analysis && (
          <p className="text-xs text-muted-foreground">
            No AI analysis yet. Use <strong>“Run AI Analysis”</strong> in this
            drawer or batch analyze from the dashboard.
          </p>
        )}

        {analysis && (
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-semibold text-foreground">Summary:</span>
              <p className="mt-1 text-muted-foreground">{analysis.summary}</p>
            </div>

            {topics.length > 0 && (
              <div>
                <span className="font-semibold text-foreground">Topics:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {topics.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Sentiment: {sentimentLabel} · Severity: {severityLabel}
            </div>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
