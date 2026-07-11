import { gzipSync, gunzipSync } from "zlib";

export type ReplayPayload = {
  timeline: unknown[];
  statistics?: Record<string, unknown>;
  result?: Record<string, unknown>;
};

export type CompressedReplay = {
  compressed: boolean;
  compressionFormat: string | null;
  timeline: unknown;
  statistics?: Record<string, unknown>;
  result?: Record<string, unknown>;
  checkpoints?: Array<{ index: number; snapshot: unknown }>;
};

const CHECKPOINT_INTERVAL = 10;

export function compressReplay(payload: ReplayPayload): CompressedReplay {
  const timeline = payload.timeline ?? [];
  const checkpoints = timeline
    .map((entry, index) => (index % CHECKPOINT_INTERVAL === 0 ? { index, snapshot: entry } : null))
    .filter(Boolean) as Array<{ index: number; snapshot: unknown }>;

  const serialized = JSON.stringify(timeline);
  const compressed = gzipSync(Buffer.from(serialized, "utf8")).toString("base64");

  return {
    compressed: true,
    compressionFormat: "gzip+base64",
    timeline: compressed,
    statistics: payload.statistics,
    result: payload.result,
    checkpoints,
  };
}

export function decompressReplay(replay: CompressedReplay): ReplayPayload {
  if (!replay.compressed || !replay.compressionFormat?.startsWith("gzip")) {
    return {
      timeline: Array.isArray(replay.timeline) ? replay.timeline : [],
      statistics: replay.statistics,
      result: replay.result,
    };
  }

  const raw = gunzipSync(Buffer.from(String(replay.timeline), "base64")).toString("utf8");
  return {
    timeline: JSON.parse(raw) as unknown[],
    statistics: replay.statistics,
    result: replay.result,
  };
}

export function deltaEncodeTimeline(timeline: unknown[]): unknown[] {
  if (timeline.length <= 1) return timeline;
  const encoded: unknown[] = [timeline[0]];
  for (let i = 1; i < timeline.length; i++) {
    encoded.push({ delta: true, index: i, prev: i - 1, event: timeline[i] });
  }
  return encoded;
}
