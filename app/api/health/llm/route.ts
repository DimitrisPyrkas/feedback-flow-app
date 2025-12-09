import { NextResponse } from "next/server";

export async function GET() {
  const provider = process.env.LLM_PROVIDER || "openai";
  const openaiKey = process.env.OPENAI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const model =
    process.env.OPENAI_MODEL ||
    process.env.GROQ_MODEL ||
    "gpt-4.1-mini";

  return NextResponse.json({
    provider,
    hasOpenAIKey: Boolean(openaiKey),
    hasGroqKey: Boolean(groqKey),
    model,
  });
}
