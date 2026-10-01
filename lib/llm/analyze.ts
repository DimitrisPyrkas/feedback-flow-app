import { analyzeWithOpenAI } from "./openai";
import { analyzeWithGroq } from "./groq";
import { AnalysisResult } from "./schema";

export async function analyzeFeedback(rawContent: string): Promise<AnalysisResult> {
  const provider = process.env.LLM_PROVIDER || "openai";

  switch (provider) {
    case "groq":
      return analyzeWithGroq(rawContent);
    case "openai":
    default:
      return analyzeWithOpenAI(rawContent);
  }
}
