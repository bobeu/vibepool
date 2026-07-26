import { z } from "zod";

export const walletSchema = z.object({
  wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
});

export const predictionSchema = z.object({
  tournamentId: z.string().uuid().optional(),
  // Accept price floats or ints; API normalizes to positive int micros.
  predictionValue: z.number().finite().optional(),
  higher: z.boolean().optional(),
}).refine(
  (data) => data.predictionValue != null || typeof data.higher === "boolean",
  { message: "predictionValue or higher is required" }
);

export const missionSchema = z.object({
  missionId: z.string().uuid(),
});

export const profileSchema = z.object({
  username: z.string().max(64).optional(),
  avatar: z.string().optional(),
});

export type WalletInput = z.infer<typeof walletSchema>;
export type PredictionInput = z.infer<typeof predictionSchema>;
export type MissionInput = z.infer<typeof missionSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
