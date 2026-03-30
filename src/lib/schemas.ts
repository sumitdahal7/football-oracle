import { z } from "zod";

export const PredictionSchema = z.object({
  winner: z.string(),
  scoreline: z.string(),
  winProbability: z.object({
    home: z.number().min(0).max(100),
    away: z.number().min(0).max(100),
    draw: z.number().min(0).max(100),
  }),
  tacticalBreakdown: z.string(),
});

export type Prediction = z.infer<typeof PredictionSchema>;
