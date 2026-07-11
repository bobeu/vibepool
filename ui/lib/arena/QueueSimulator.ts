/** Matchmaking queue simulator for tuning pairing at scale. */

export type SimulatedPlayer = {
  id: string;
  rating: number;
  joinedAt: number;
};

export type SimulationResult = {
  playerCount: number;
  paired: number;
  avgQueueTimeMs: number;
  avgRatingDiff: number;
  unpaired: number;
};

export class QueueSimulator {
  private window: number;

  constructor(ratingWindow = 150) {
    this.window = ratingWindow;
  }

  simulate(count: number, arrivalSpreadMs = 5000): SimulationResult {
    const now = Date.now();
    const players: SimulatedPlayer[] = Array.from({ length: count }, (_, i) => ({
      id: `p-${i}`,
      rating: 900 + Math.floor(Math.random() * 400),
      joinedAt: now + Math.floor(Math.random() * arrivalSpreadMs),
    }));

    players.sort((a, b) => a.joinedAt - b.joinedAt);

    const waiting: SimulatedPlayer[] = [];
    let paired = 0;
    let totalQueueTime = 0;
    let totalRatingDiff = 0;

    for (const player of players) {
      const idx = waiting.findIndex(
        (w) => Math.abs(w.rating - player.rating) <= this.window
      );
      if (idx >= 0) {
        const opponent = waiting.splice(idx, 1)[0];
        paired++;
        totalQueueTime += player.joinedAt - opponent.joinedAt;
        totalRatingDiff += Math.abs(player.rating - opponent.rating);
      } else {
        waiting.push(player);
      }
    }

    return {
      playerCount: count,
      paired,
      avgQueueTimeMs: paired > 0 ? totalQueueTime / paired : 0,
      avgRatingDiff: paired > 0 ? totalRatingDiff / paired : 0,
      unpaired: waiting.length,
    };
  }

  runBenchmark(): Record<string, SimulationResult> {
    return {
      "10": this.simulate(10),
      "100": this.simulate(100),
      "1000": this.simulate(1000),
      "10000": this.simulate(10000, 30000),
    };
  }
}
