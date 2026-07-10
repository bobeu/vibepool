"use client";

interface RewardCardProps {
  title: string;
  description?: string;
  amount?: number;
  asset?: string;
  status?: "pending" | "processing" | "paid" | "failed";
  onClaim?: () => void;
}

export function RewardCard({ title, description, amount, asset, status = "pending", onClaim }: RewardCardProps) {
  const statusStyles = {
    pending: "bg-yellow-500/10 text-yellow-400",
    processing: "bg-blue-500/10 text-blue-400",
    paid: "bg-green-500/10 text-green-400",
    failed: "bg-red-500/10 text-red-400",
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card/60 p-4 flex items-center justify-between gap-3">
      <div className="space-y-1">
        <p className="font-bold text-sm">{title}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        {amount !== undefined && (
          <p className="text-xs text-muted-foreground">
            {amount.toLocaleString()} {asset}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusStyles[status]}`}>
          {status}
        </span>
        {status === "pending" && onClaim && (
          <button
            type="button"
            onClick={onClaim}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wide transition-all hover:shadow-md active:scale-[0.97]"
          >
            Claim
          </button>
        )}
      </div>
    </div>
  );
}
