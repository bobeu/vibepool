/** Placeholder used in local env templates — not valid on WalletConnect Cloud. */
export const WALLETCONNECT_PLACEHOLDER_ID = "444e8c9b1c9d0a1e5f2b2c3d4e5f6a7";

export function resolveWalletConnectProjectId(): string {
  const fromEnv = process.env.NEXT_PUBLIC_WALLETCONNECT_ID?.trim();
  if (fromEnv && fromEnv !== WALLETCONNECT_PLACEHOLDER_ID) {
    return fromEnv;
  }
  return WALLETCONNECT_PLACEHOLDER_ID;
}

export function isWalletConnectConfigured(): boolean {
  const fromEnv = process.env.NEXT_PUBLIC_WALLETCONNECT_ID?.trim();
  return Boolean(fromEnv && fromEnv !== WALLETCONNECT_PLACEHOLDER_ID);
}
