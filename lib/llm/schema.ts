import { z } from "zod";

export const SentimentEnum = z.enum(["POSITIVE", "NEUTRAL", "NEGATIVE"]);

export const AnalysisResultSchema = z.object({
  sentiment: SentimentEnum,         
  severity: z.number().int().min(1).max(5), 
  topics: z.array(z.string()).max(10).default([]),
  summary: z.string().min(5).max(500),
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
