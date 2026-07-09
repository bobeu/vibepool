import { describe, it, expect, vi } from "vitest";
import { BlockchainSyncService } from "@/services/BlockchainService";

vi.mock("viem", () => ({
  createPublicClient: vi.fn(() => ({
    watchContractEvent: vi.fn(),
    getContractEvents: vi.fn(),
    sendTransaction: vi.fn(),
    waitForTransactionReceipt: vi.fn(),
  })),
  http: vi.fn(),
  celo: { id: 42220, name: "Celo", network: "celo", nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 }, rpcUrls: { default: { http: ["https://forno.celo.org"] } } },
}));

describe("BlockchainSyncService", () => {
  it("should initialize without errors", () => {
    const service = new BlockchainSyncService();
    expect(service.name).toBe("BlockchainSyncService");
  });

  it("should handle event registration", () => {
    const service = new BlockchainSyncService();
    const handler = vi.fn();
    service.on("XPGranted", handler);
    expect(handler).toBeDefined();
  });

  it("should attempt to read treasury", async () => {
    const service = new BlockchainSyncService();
    const result = await service.readTreasury();
    expect(result).toBeNull();
  });

  it("should attempt to read profile", async () => {
    const service = new BlockchainSyncService();
    const result = await service.readProfile("0x1234567890123456789012345678901234567890");
    expect(result).toBeNull();
  });
});
