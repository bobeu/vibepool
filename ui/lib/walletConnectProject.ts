/** Historical local template value — still accepted if set, but often rejected by WalletConnect Cloud. */
export const WALLETCONNECT_PLACEHOLDER_ID = "444e8c9b1c9d0a1e5f2b2c3d4e5f6a7";

export function resolveWalletConnectProjectId(): string {
  const fromEnv = process.env.NEXT_PUBLIC_WALLETCONNECT_ID?.trim();
  if (fromEnv) return fromEnv;
  return WALLETCONNECT_PLACEHOLDER_ID;
}

export function isWalletConnectConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_WALLETCONNECT_ID?.trim());
}
