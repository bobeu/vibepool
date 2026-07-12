"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { authFetch } from "@/lib/auth/client";
import { useAuth } from "@/lib/auth/useAuth";

export default function PredictionPage() {
  const { session, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["predictions"],
    queryFn: async () => {
      const res = await authFetch("/api/predictions");
      if (!res.ok) throw new Error("Failed to load prediction round");
      return res.json();
    },
    enabled: Boolean(session),
  });

  const submitMutation = useMutation({
    mutationFn: async (predictionValue: number) => {
      const res = await authFetch("/api/predictions", {
        method: "POST",
        body: JSON.stringify({ predictionValue }),
      });
      if (!res.ok) throw new Error("Failed to submit prediction");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["predictions"] }),
  });

  if (authLoading || isLoading) {
    return (
      <AppShell activeNav="prediction">
        <div className="h-40 rounded-2xl bg-muted/50 animate-pulse" />
      </AppShell>
    );
  }

  if (!session) {
    return (
      <AppShell activeNav="prediction">
        <p className="text-sm text-muted-foreground text-center py-16">Connect your wallet to submit a prediction.</p>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell activeNav="prediction">
        <p className="text-destructive text-sm text-center py-16">Failed to load prediction data.</p>
      </AppShell>
    );
  }

  const tournament = data?.tournament;
  const submitted = Boolean(data?.userPrediction);

  return (
    <AppShell activeNav="prediction">
      <div className="space-y-4">
        <h1 className="text-xl font-black uppercase tracking-tight">Daily Prediction</h1>
        {!tournament && (
          <p className="text-sm text-muted-foreground text-center py-10">No open tournament right now.</p>
        )}
        {tournament && (
          <div className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-4">
            <div>
              <p className="font-bold">{tournament.name as string}</p>
              <p className="text-xs text-muted-foreground">Status: {String(tournament.status)}</p>
            </div>
            {submitted ? (
              <p className="text-sm text-green-400 font-medium">Prediction submitted — good luck!</p>
            ) : (
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const value = Number((form.elements.namedItem("value") as HTMLInputElement).value);
                  if (!Number.isNaN(value)) submitMutation.mutate(value);
                }}
              >
                <input
                  name="value"
                  type="number"
                  required
                  placeholder="Your prediction"
                  className="flex-1 rounded-lg border border-border bg-muted px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-bold"
                >
                  Submit
                </button>
              </form>
            )}
            {submitMutation.isError && (
              <p className="text-xs text-destructive">Could not submit. You may have already predicted.</p>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
