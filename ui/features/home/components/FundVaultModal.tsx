"use client";

import { useMemo, useState } from "react";
import { parseUnits } from "viem";
import { Landmark, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppOverlay } from "@/components/layout/AppOverlay";
import { useSpinEconomyPayment } from "@/hooks/useSpinEconomyPayment";
import { CELO_ASSETS, type SpinPayAsset } from "@/lib/tokens/celoAssets";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/utils/format";

const ASSETS: SpinPayAsset[] = ["CELO", "USDm", "USDC", "USDT"];

type FundVaultModalProps = {
  open: boolean;
  onClose: () => void;
};

export function FundVaultModal({ open, onClose }: FundVaultModalProps) {
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();
  const { fundVault, busy, isConnected } = useSpinEconomyPayment();
  const [asset, setAsset] = useState<SpinPayAsset>("CELO");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const decimals = CELO_ASSETS[asset].decimals;
  const parsedAmount = useMemo(() => {
    const trimmed = amount.trim();
    if (!trimmed || Number(trimmed) <= 0) return null;
    try {
      return parseUnits(trimmed, decimals);
    } catch {
      return null;
    }
  }, [amount, decimals]);

  if (!open) return null;

  const submit = async () => {
    setError(null);
    if (!isConnected) {
      setError("Connect your wallet to fund the prize vault");
      return;
    }
    if (!parsedAmount || parsedAmount <= 0n) {
      setError("Enter a valid amount greater than zero");
      return;
    }
    try {
      await fundVault({ asset, amountWei: parsedAmount });
      showToast(`Vault funded · ${amount.trim()} ${asset}`);
      setAmount("");
      await queryClient.invalidateQueries({ queryKey: ["spin-vault-status"] });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Funding failed");
    }
  };

  return (
    <AppOverlay>
      <div className="absolute inset-0 z-[90] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center">
        <div className="w-full max-w-md overflow-hidden rounded-3xl border-4 border-black bg-zinc-950 shadow-[6px_6px_0_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-black bg-primary">
                <Landmark className="h-4 w-4 text-black" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/50">
                  Prize liquidity
                </p>
                <p className="text-sm font-black uppercase italic text-white">Fund Spin Vault</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border-2 border-white/15 bg-zinc-900 p-2 text-white/70"
              aria-label="Close"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>

          <div className="space-y-3 p-4">
            <p className="text-[11px] font-bold leading-relaxed text-white/60">
              Anyone can top up SpinPrizeVault so hunt rewards stay withdrawable. Funds stay in the
              vault contract — not a shared custody wallet.
            </p>

            <label className="block space-y-1.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-white/50">
                Currency
              </span>
              <select
                value={asset}
                onChange={(e) => setAsset(e.target.value as SpinPayAsset)}
                className="w-full rounded-2xl border-2 border-white/15 bg-zinc-900 px-3 py-3 text-sm font-black uppercase text-white outline-none focus:border-primary"
              >
                {ASSETS.map((sym) => (
                  <option key={sym} value={sym}>
                    {sym}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-white/50">
                Amount
              </span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`0.00 ${asset}`}
                className="w-full rounded-2xl border-2 border-white/15 bg-zinc-900 px-3 py-3 text-sm font-black tabular-nums text-white outline-none placeholder:text-white/30 focus:border-primary"
              />
            </label>

            {error ? (
              <p className="text-[11px] font-bold text-red-400">{error}</p>
            ) : null}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border-4 border-white/20 bg-zinc-900 py-3 text-xs font-black uppercase text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submit()}
                disabled={busy || !parsedAmount}
                className={cn(
                  "rounded-2xl border-4 border-black bg-primary py-3 text-xs font-black uppercase text-black shadow-[4px_4px_0_rgba(0,0,0,1)]",
                  "disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-white/40 disabled:shadow-none"
                )}
              >
                {busy ? "Confirming…" : "Confirm fund"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppOverlay>
  );
}
