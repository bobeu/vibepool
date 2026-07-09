import { z } from "zod";

export const walletSchema = z.object({
  wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
});

export const predictionSchema = z.object({
  tournamentId: z.string().uuid(),
  predictionValue: z.number().int().positive(),
  higher: z.boolean().optional(),
});

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
