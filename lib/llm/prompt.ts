export function systemPrompt() {
  return [
    "You are a product feedback analyst.",
    "Return STRICT JSON with keys: sentiment, severity, topics, summary.",
    "sentiment ∈ {POSITIVE, NEUTRAL, NEGATIVE}",
    "severity is integer 1..5 (5 = most severe).",
    "topics is an array of short keywords.",
    "summary is 1–2 sentences.",
    "Do NOT include any extra keys or text outside JSON.",
  ].join(" ");
}

export function userPrompt(raw: string) {
  return [
    "Analyze the following feedback and return strict JSON:",
    "",
    raw,
  ].join("\n");
}
