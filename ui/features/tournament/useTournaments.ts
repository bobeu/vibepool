import { useQuery } from "@tanstack/react-query";
import { prisma } from "@/lib/auth/session";

export function useTournaments() {
  return useQuery({
    queryKey: ["tournaments"],
    queryFn: async () => {
      const res = await fetch("/api/tournaments");
      if (!res.ok) throw new Error("Failed to fetch tournaments");
      const json = await res.json();
      return json.tournaments as Array<{
        id: string;
        name: string;
        status: string;
        startTime: Date | string;
        endTime: Date | string;
        rewardPool: number;
        asset: string;
        currentPlayers: number;
        maxPlayers: number;
      }>;
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}
