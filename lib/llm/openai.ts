import { AnalysisResult, AnalysisResultSchema } from "./schema";
import { systemPrompt, userPrompt } from "./prompt";

type OpenAIResponse = { choices: { message: { content?: string } }[] };

export async function analyzeWithOpenAI(rawContent: string): Promise<AnalysisResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt() },
        { role: "user", content: userPrompt(rawContent) },
      ],
      response_format: { type: "json_object" }, 
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenAI error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as OpenAIResponse;
  const content = data.choices?.[0]?.message?.content ?? "{}";

  const parsed = AnalysisResultSchema.safeParse(JSON.parse(content));
  if (!parsed.success) {
    throw new Error("LLM returned invalid JSON: " + parsed.error.message);
  }

  return parsed.data;
}
