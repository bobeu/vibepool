import { http } from "wagmi";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { celo } from "wagmi/chains";
import {
  isWalletConnectConfigured,
  resolveWalletConnectProjectId,
} from "@/lib/walletConnectProject";

export const isMiniPay = (): boolean => {
  if (typeof window === "undefined") return false;
  return !!(window as Window & { ethereum?: { isMiniPay?: boolean } }).ethereum?.isMiniPay;
};

/** MiniPay + Nexora run on Celo mainnet only. */
export const wagmiConfig = getDefaultConfig({
  appName: "Nexora",
  projectId: resolveWalletConnectProjectId(),
  appDescription: "Skill-based competitive Web3 gaming on Celo",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001",
  appIcon: "/logo.png",
  chains: [celo],
  ssr: true,
  multiInjectedProviderDiscovery: true,
  pollingInterval: 10_000,
  syncConnectedChain: true,
  transports: {
    [celo.id]: http(process.env.NEXT_PUBLIC_ALCHEMY_CELO_MAINNET_API || "https://forno.celo.org"),
  },
});

export { isWalletConnectConfigured };

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
