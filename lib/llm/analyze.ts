import { analyzeWithOpenAI } from "./openai";
import { AnalysisResult } from "./schema";

export async function analyzeFeedback(rawContent: string): Promise<AnalysisResult> {
  return analyzeWithOpenAI(rawContent);
}
