"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '@/lib/wagmi';
import { VibepoolProvider } from '@/lib/context/VibepoolContext';
import { AuthProvider } from '@/lib/auth/useAuth';
import { WalletSessionSync } from '@/lib/auth/WalletSessionSync';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { celo } from "wagmi/chains";

// ─── Dark-only Theme Context (no light mode) ──────────────────────────────────

export const ThemeContext = createContext<{
  theme: 'dark';
  setTheme: (theme: 'dark') => void;
} | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within Providers');
  }
  return context;
}

const rainbowKitDarkTheme = darkTheme({
  accentColorForeground: '#ffffff',
  borderRadius: 'medium',
  fontStack: 'system',
  overlayBlur: 'small',
  accentColor: 'hsl(187 100% 68%)',
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    // Force dark mode always — no light mode
    document.documentElement.classList.add('dark');
    setMounted(true);
  }, []);

  const setTheme = (_t: 'dark') => {
    // No-op: only dark mode supported
  };

  if (!mounted) {
    return null;
  }

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ThemeContext.Provider value={{ theme: 'dark', setTheme }}>
          <RainbowKitProvider
            showRecentTransactions={true}
            initialChain={celo}
            theme={rainbowKitDarkTheme}
          >
            <VibepoolProvider>
              <AuthProvider>
                <WalletSessionSync />
                {children}
              </AuthProvider>
            </VibepoolProvider>
          </RainbowKitProvider>
        </ThemeContext.Provider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
