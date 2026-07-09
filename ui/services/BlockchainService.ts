import { createPublicClient, http, type PublicClient } from "viem";
import { celo } from "wagmi/chains";
import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import type { IBlockchainService } from "./interfaces";

type EventHandler = (event: Record<string, unknown>) => Promise<void>;

export class BlockchainSyncService implements IBlockchainService {
  name = "BlockchainSyncService";
  private client: PublicClient;
  private handlers: Map<string, EventHandler[]> = new Map();
  private running = false;

  constructor() {
    this.client = createPublicClient({
      chain: celo,
      transport: http(process.env.NEXT_PUBLIC_ALCHEMY_CELO_MAINNET_API || "https://forno.celo.org"),
    });
  }

  async readProfile(wallet: string): Promise<Record<string, unknown> | null> {
    try {
      const pointsManager = await this.client.getContract({
        address: process.env.NEXT_PUBLIC_POINTS_MANAGER_ADDRESS as `0x${string}`,
        abi: this.getPointsManagerAbi(),
        functionName: "profile",
        args: [wallet],
      });

      const profile = {
        xp: Number(pointsManager.xp),
        level: Number(pointsManager.level),
        points: Number(pointsManager.points),
        availableSpins: Number(pointsManager.availableSpins),
        currentStreak: Number(pointsManager.currentStreak),
      };

      return profile;
    } catch (error) {
      logger.error("Failed to read profile from blockchain", { wallet, error: String(error) });
      return null;
    }
  }

  async readTreasury(): Promise<Record<string, unknown> | null> {
    try {
      const treasury = await this.client.getContract({
        address: process.env.NEXT_PUBLIC_REWARD_TREASURY_ADDRESS as `0x${string}`,
        abi: this.getRewardTreasuryAbi(),
        functionName: "treasuryBalance",
      });

      return {
        balance: Number(treasury),
        asset: "CELO",
      };
    } catch (error) {
      logger.error("Failed to read treasury from blockchain", { error: String(error) });
      return null;
    }
  }

  async submitBackendTransaction(tx: Record<string, unknown>): Promise<string> {
    try {
      const hash = await this.client.sendTransaction({
        to: tx.to as `0x${string}`,
        data: tx.data as `0x${string}`,
        value: tx.value ? BigInt(tx.value as string | number | bigint) : undefined,
        account: process.env.BACKEND_SIGNER_ADDRESS as `0x${string}`,
      });

      const receipt = await this.client.waitForTransactionReceipt({ hash });
      logger.info("Transaction confirmed", { hash, status: receipt.status });
      return hash;
    } catch (error) {
      logger.error("Transaction failed", { error: String(error), tx });
      throw error;
    }
  }

  async listenToEvents(): Promise<void> {
    if (this.running) {
      logger.warn("BlockchainSyncService already running");
      return;
    }

    this.running = true;
    logger.info("Starting blockchain event listener");

    try {
      await this.subscribeToEvents();
    } catch (error) {
      logger.error("Event listener failed", { error: String(error) });
      this.running = false;
      await this.syncLocalCache();
    }
  }

  async syncLocalCache(): Promise<void> {
    logger.info("Syncing local cache from blockchain");

    try {
      const pointsManagerAddress = process.env.NEXT_PUBLIC_POINTS_MANAGER_ADDRESS as `0x${string}`;
      if (!pointsManagerAddress) {
        logger.warn("PointsManager address not configured");
        return;
      }

      const logs = await this.client.getContractEvents({
        address: pointsManagerAddress,
        abi: this.getPointsManagerAbi(),
        eventName: "XPGranted",
        fromBlock: "earliest",
      });

      for (const log of logs) {
        await this.handleXPGranted(log);
      }

      logger.info("Local cache sync completed", { events: logs.length });
    } catch (error) {
      logger.error("Local cache sync failed", { error: String(error) });
    }
  }

  async retryFailedTransaction(txHash: string): Promise<string> {
    logger.info("Retrying transaction", { txHash });

    try {
      const receipt = await this.client.waitForTransactionReceipt({ hash: txHash as `0x${string}` });
      
      if (receipt.status === "success") {
        logger.info("Transaction succeeded on retry", { txHash });
        return txHash;
      } else {
        throw new Error("Transaction reverted on retry");
      }
    } catch (error) {
      logger.error("Transaction retry failed", { txHash, error: String(error) });
      throw error;
    }
  }

  on(eventName: string, handler: EventHandler): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }
    this.handlers.get(eventName)!.push(handler);
  }

  private async subscribeToEvents(): Promise<void> {
    const pointsManagerAddress = process.env.NEXT_PUBLIC_POINTS_MANAGER_ADDRESS as `0x${string}`;
    const rewardTreasuryAddress = process.env.NEXT_PUBLIC_REWARD_TREASURY_ADDRESS as `0x${string}`;
    const activityRegistryAddress = process.env.NEXT_PUBLIC_ACTIVITY_REGISTRY_ADDRESS as `0x${string}`;
    const spinRewardManagerAddress = process.env.NEXT_PUBLIC_SPIN_REWARD_MANAGER_ADDRESS as `0x${string}`;

    if (pointsManagerAddress) {
      await this.client.watchContractEvent({
        address: pointsManagerAddress,
        abi: this.getPointsManagerAbi(),
        eventName: "XPGranted",
        onLogs: (logs) => this.handleXPGranted(logs[0]),
      });

      await this.client.watchContractEvent({
        address: pointsManagerAddress,
        abi: this.getPointsManagerAbi(),
        eventName: "PointsGranted",
        onLogs: (logs) => this.handlePointsGranted(logs[0]),
      });
    }

    if (rewardTreasuryAddress) {
      await this.client.watchContractEvent({
        address: rewardTreasuryAddress,
        abi: this.getRewardTreasuryAbi(),
        eventName: "RewardPaid",
        onLogs: (logs) => this.handleRewardPaid(logs[0]),
      });
    }

    if (activityRegistryAddress) {
      await this.client.watchContractEvent({
        address: activityRegistryAddress,
        abi: this.getActivityRegistryAbi(),
        eventName: "ActivityRecorded",
        onLogs: (logs) => this.handleActivityRecorded(logs[0]),
      });
    }

    if (spinRewardManagerAddress) {
      await this.client.watchContractEvent({
        address: spinRewardManagerAddress,
        abi: this.getSpinRewardManagerAbi(),
        eventName: "SpinGranted",
        onLogs: (logs) => this.handleSpinGranted(logs[0]),
      });
    }

    logger.info("Subscribed to blockchain events");
  }

  private async handleXPGranted(log: unknown): Promise<void> {
    const event = log as { args: { player: string; amount: bigint; newTotalXP: bigint } };
    const player = event.args.player;
    const amount = Number(event.args.amount);

    try {
      await prisma().userProfile.upsert({
        where: { wallet: player },
        update: { xp: { increment: amount } },
        create: { wallet: player, xp: amount, points: 0, spins: 0, level: 0, totalActivity: 0, status: "ACTIVE" },
      });

      logger.info("Synced XPGranted", { player, amount });
      this.emit("XPGranted", { player, amount });
    } catch (error) {
      logger.error("Failed to sync XPGranted", { player, error: String(error) });
    }
  }

  private async handlePointsGranted(log: unknown): Promise<void> {
    const event = log as { args: { player: string; amount: bigint; newTotalPoints: bigint } };
    const player = event.args.player;
    const amount = Number(event.args.amount);

    try {
      await prisma().userProfile.upsert({
        where: { wallet: player },
        update: { points: { increment: amount } },
        create: { wallet: player, xp: 0, points: amount, spins: 0, level: 0, totalActivity: 0, status: "ACTIVE" },
      });

      logger.info("Synced PointsGranted", { player, amount });
      this.emit("PointsGranted", { player, amount });
    } catch (error) {
      logger.error("Failed to sync PointsGranted", { player, error: String(error) });
    }
  }

  private async handleRewardPaid(log: unknown): Promise<void> {
    const event = log as { args: { recipient: string; asset: string; amount: bigint; requestId: string } };
    const recipient = event.args.recipient;
    const amount = Number(event.args.amount);
    const requestId = event.args.requestId;

    try {
      await prisma().rewardLedger.create({
        data: {
          userId: recipient,
          reward: "Payout",
          asset: event.args.asset,
          amount,
          treasuryRequestId: requestId,
        },
      });

      logger.info("Synced RewardPaid", { recipient, amount, requestId });
      this.emit("RewardPaid", { recipient, amount, requestId });
    } catch (error) {
      logger.error("Failed to sync RewardPaid", { recipient, error: String(error) });
    }
  }

  private async handleActivityRecorded(log: unknown): Promise<void> {
    const event = log as { args: { player: string; streak: bigint; longestStreak: bigint } };
    const player = event.args.player;

    try {
      await prisma().activity.create({
        data: {
          userId: player,
          type: "LOGIN",
          metadata: { streak: Number(event.args.streak), longestStreak: Number(event.args.longestStreak) },
        },
      });

      logger.info("Synced ActivityRecorded", { player });
      this.emit("ActivityRecorded", { player });
    } catch (error) {
      logger.error("Failed to sync ActivityRecorded", { player, error: String(error) });
    }
  }

  private async handleSpinGranted(log: unknown): Promise<void> {
    const event = log as { args: { player: string; amount: bigint; newAvailableSpins: bigint } };
    const player = event.args.player;
    const amount = Number(event.args.amount);

    try {
      await prisma().spinLedger.create({
        data: {
          userId: player,
          spinType: "DAILY",
          amount,
          reason: "Blockchain sync",
        },
      });

      logger.info("Synced SpinGranted", { player, amount });
      this.emit("SpinGranted", { player, amount });
    } catch (error) {
      logger.error("Failed to sync SpinGranted", { player, error: String(error) });
    }
  }

  private emit(eventName: string, data: Record<string, unknown>): void {
    const handlers = this.handlers.get(eventName) || [];
    handlers.forEach(handler => handler(data));
  }

  private getPointsManagerAbi() {
    return [
      "event XPGranted(address indexed player, uint256 amount, uint256 newTotalXP, bytes32 indexed requestId)",
      "event PointsGranted(address indexed player, uint256 amount, uint256 newTotalPoints, bytes32 indexed requestId)",
    ] as const;
  }

  private getRewardTreasuryAbi() {
    return [
      "event RewardPaid(address indexed recipient, address indexed asset, uint256 amount, bytes32 indexed requestId, uint256 timestamp)",
    ] as const;
  }

  private getActivityRegistryAbi() {
    return [
      "event ActivityRecorded(address indexed player, uint256 streak, uint256 longestStreak, uint256 activityCount)",
    ] as const;
  }

  private getSpinRewardManagerAbi() {
    return [
      "event SpinGranted(address indexed player, uint256 amount, uint256 newAvailableSpins, bytes32 indexed requestId)",
    ] as const;
  }
}
