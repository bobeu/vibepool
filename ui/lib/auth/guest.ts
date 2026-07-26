/** Guest wallets are tagged with a fixed 0xeeeeeeee prefix for free-play sessions. */
export function isGuestWallet(wallet: string): boolean {
  return wallet.toLowerCase().startsWith("0xeeeeeeee");
}

export function createGuestWallet(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  bytes[0] = 0xee;
  bytes[1] = 0xee;
  bytes[2] = 0xee;
  bytes[3] = 0xee;
  return (
    "0x" +
    Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
  );
}
