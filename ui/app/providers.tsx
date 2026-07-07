"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '@/lib/wagmi';
import { VibepoolProvider } from '@/lib/context/VibepoolContext';
import { RainbowKitProvider, lightTheme, darkTheme } from '@rainbow-me/rainbowkit';
import { celo } from "wagmi/chains";

export const ThemeContext = createContext<{
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
} | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within Providers');
  }
  return context;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const rainbowKitTheme = theme === 'dark'
    ? darkTheme({
        accentColorForeground: '#ffffff',
        borderRadius: 'medium',
        fontStack: 'system',
        overlayBlur: 'small',
        accentColor: 'hsl(var(--primary))',
      })
    : lightTheme({
        accentColorForeground: '#111416',
        borderRadius: 'medium',
        fontStack: 'system',
        overlayBlur: 'small',
        accentColor: 'hsl(var(--primary))',
      });

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ThemeContext.Provider value={{ theme, setTheme }}>
          <RainbowKitProvider
            showRecentTransactions={true}
            initialChain={celo}
            theme={rainbowKitTheme}
          >
            <VibepoolProvider>
              {children}
            </VibepoolProvider>
          </RainbowKitProvider>
        </ThemeContext.Provider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
