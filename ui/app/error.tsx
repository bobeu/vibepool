"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <h2 className="text-xl font-black uppercase tracking-tight">Something went wrong</h2>
      <p className="max-w-md text-sm text-muted-foreground">{error?.message ?? "Unexpected error — please try again."}</p>
      <Button onClick={reset} className="neobrutal-card">
        Try again
      </Button>
    </div>
  );
}
