/** Store CELO prices as integer micros (1e6) in Prediction.predictionValue. */
export const PRICE_MICROS = 1_000_000;

/** Convert a UI price / direction into a positive int for Prisma. */
export function toPredictionValue(
  raw: number,
  options?: { higher?: boolean; startPrice?: number }
): number {
  if (options?.higher === true) {
    const base = options.startPrice ?? 0.07;
    return Math.max(1, Math.round(base * 1.05 * PRICE_MICROS));
  }
  if (options?.higher === false) {
    const base = options.startPrice ?? 0.07;
    return Math.max(1, Math.round(base * 0.95 * PRICE_MICROS));
  }

  if (!Number.isFinite(raw)) return 0;
  // Values below 100 are treated as dollar prices (e.g. 0.075).
  if (Math.abs(raw) < 100) {
    return Math.max(1, Math.round(raw * PRICE_MICROS));
  }
  return Math.max(1, Math.round(raw));
}
