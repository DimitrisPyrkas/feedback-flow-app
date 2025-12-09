export async function notifyHighSeverity(input: {
  feedbackId: string;
  severity: number;
  summary?: string;
  source?: string;
}) {
  try {
    console.log("🚨 notifyHighSeverity triggered:", input); 

    if (!process.env.SLACK_WEBHOOK_URL) {
      console.log(
        "[notifyHighSeverity] (no SLACK_WEBHOOK_URL set)",
        JSON.stringify(input)
      );
      return;
    }

    const text =
      `🚨 High severity feedback detected\n` +
      `• ID: ${input.feedbackId}\n` +
      `• Source: ${input.source ?? "unknown"}\n` +
      `• Severity: ${input.severity}\n` +
      (input.summary ? `• Summary: ${input.summary}\n` : "");

    const res = await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      console.error(
        "[notifyHighSeverity] Slack webhook failed",
        res.status,
        await res.text().catch(() => "")
      );
    }
  } catch (err) {
    console.error("[notifyHighSeverity] Unexpected error", err);
  }
}
