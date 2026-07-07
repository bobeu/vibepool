import type { WalletAuthPayload } from "@/types";

const AUTH_WINDOW_MS = 5 * 60 * 1000;

/**
 * Wallet signature authentication — validation scaffold.
 * Full viem verifyMessage integration in Prompt 2.
 */
export function validateWalletAuth(payload: WalletAuthPayload): {
  valid: boolean;
  reason?: string;
} {
  if (!payload.address || !payload.signature || !payload.message) {
    return { valid: false, reason: "Missing auth fields" };
  }

  const age = Date.now() - payload.timestamp;
  if (age > AUTH_WINDOW_MS || age < 0) {
    return { valid: false, reason: "Auth message expired (replay protection)" };
  }

  if (!payload.message.includes(payload.address.toLowerCase())) {
    return { valid: false, reason: "Message must include wallet address" };
  }

  // Signature verification deferred to Prompt 2
  return { valid: true };
}
