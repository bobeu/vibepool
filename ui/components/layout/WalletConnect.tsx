"use client";

import React, { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { useBalance } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

function detectMiniPay(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as any).ethereum?.isMiniPay;
}

export const WalletConnect: React.FC = () => {
  const {
    address,
    isConnected,
    isConnecting,
  } = useWallet();

  // Fetch native CELO balance
  const { data: balanceData, isLoading: balanceLoading } = useBalance({
    address: address,
    query: { enabled: !!address },
  });

  const balance = balanceData?.formatted || '0';
  const symbol = balanceData?.symbol || 'CELO';

  // MiniPay detection inside useMemo (safe, client-only)
  const isInMinipay = useMemo(() => detectMiniPay(), []);
  const hideConnectBtn = isInMinipay;

  if (!isConnected) {
    if (hideConnectBtn) {
      if (isConnecting) {
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase border-[2px] border-black bg-white text-black shadow-[2px_2px_0_#000]">
            <Loader2 className="h-3 w-3 animate-spin" />
            Connecting...
          </div>
        );
      }
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase border-[2px] border-black bg-white text-black shadow-[2px_2px_0_#000]">
          MiniPay
        </div>
      );
    }

    return (
      <ConnectButton
        accountStatus="avatar"
        chainStatus="none"
        showBalance={false}
        label="Connect"
      />
    );
  }

  return (
    <div className="flex items-center gap-2">
      {isInMinipay ? (
        balanceLoading ? (
          <div className="h-6 w-16 bg-muted animate-pulse border-[2px] border-black shadow-[2px_2px_0_#000]" />
        ) : (
          <div className="inline-flex items-center px-2.5 py-1 text-[10px] font-black uppercase border-[2px] border-black bg-secondary text-black shadow-[2px_2px_0_#000] max-w-[140px] truncate">
            {parseFloat(balance).toFixed(3)} {symbol}
          </div>
        )
      ) : (
        <ConnectButton
          accountStatus="avatar"
          showBalance={false}
          chainStatus="none"
          label="Connect"
        />
      )}
    </div>
  );
};

export default WalletConnect;
