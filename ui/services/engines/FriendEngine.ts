import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import { eventBus } from "./EventBus";
import type { IFriendEngine } from "./interfaces";

const FRIEND_LIMIT = Number(process.env.FRIEND_LIMIT ?? 500);

export class FriendEngine implements IFriendEngine {
  name = "FriendEngine";

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  private async resolveId(wallet: string): Promise<string | null> {
    const user = await prisma().userProfile.findUnique({
      where: { wallet },
      select: { id: true },
    });
    return user?.id ?? null;
  }

  async getFriends(wallet: string): Promise<Record<string, unknown>[]> {
    const userId = await this.resolveId(wallet);
    if (!userId) return [];

    const friendships = await prisma().friendship.findMany({
      where: { userId },
      include: { friend: { select: { id: true, wallet: true, username: true, xp: true, level: true } } },
      orderBy: { createdAt: "desc" },
    });

    return friendships.map((f) => ({
      id: f.id,
      wallet: f.friend.wallet,
      username: f.friend.username,
      level: f.friend.level,
      xp: f.friend.xp,
    }));
  }

  async getPending(wallet: string): Promise<Record<string, unknown>> {
    const userId = await this.resolveId(wallet);
    if (!userId) return { incoming: [], outgoing: [] };

    const incoming = await prisma().friendRequest.findMany({
      where: { receiverId: userId, status: "PENDING" },
      include: { sender: { select: { wallet: true, username: true } } },
      orderBy: { createdAt: "desc" },
    });

    const outgoing = await prisma().friendRequest.findMany({
      where: { senderId: userId, status: "PENDING" },
      include: { receiver: { select: { wallet: true, username: true } } },
      orderBy: { createdAt: "desc" },
    });

    return {
      incoming: incoming.map((r) => ({
        id: r.id,
        wallet: r.sender.wallet,
        username: r.sender.username,
        message: r.message,
        createdAt: r.createdAt,
      })),
      outgoing: outgoing.map((r) => ({
        id: r.id,
        wallet: r.receiver.wallet,
        username: r.receiver.username,
        createdAt: r.createdAt,
      })),
    };
  }

  async sendRequest(wallet: string, receiverWallet: string, message?: string): Promise<Record<string, unknown>> {
    const senderId = await this.resolveId(wallet);
    const receiverId = await this.resolveId(receiverWallet);
    if (!senderId || !receiverId) throw new Error("User not found");
    if (senderId === receiverId) throw new Error("Cannot friend yourself");

    const existingFriendship = await prisma().friendship.findFirst({
      where: { userId: senderId, friendId: receiverId },
    });
    if (existingFriendship) throw new Error("Already friends");

    const blocked = await prisma().playerRelationship.findFirst({
      where: { userId: receiverId, relatedId: senderId, type: "BLOCKED" },
    });
    if (blocked) throw new Error("Request blocked by recipient");

    const { SocialSettingsEngine } = await import("./SocialSettingsEngine");
    const socialSettings = new SocialSettingsEngine();
    const acceptsRequests = await socialSettings.acceptsFriendRequests(receiverId);
    if (!acceptsRequests) throw new Error("User is not accepting friend requests");

    const friendCount = await prisma().friendship.count({ where: { userId: senderId } });
    if (friendCount >= FRIEND_LIMIT) throw new Error("Friend limit reached");

    const request = await prisma().friendRequest.upsert({
      where: { senderId_receiverId: { senderId, receiverId } },
      update: { status: "PENDING", message: message ?? null, respondedAt: null },
      create: { senderId, receiverId, message: message ?? null, status: "PENDING" },
    });

    eventBus.publish({
      event: "FriendRequestSent",
      userId: senderId,
      aggregateId: request.id,
      aggregateType: "FriendRequest",
      receiverId,
      requestId: request.id,
    });

    logger.info("Friend request sent", { senderId, receiverId });
    return { id: request.id, status: request.status };
  }

  async respond(wallet: string, requestId: string, accept: boolean): Promise<Record<string, unknown>> {
    const userId = await this.resolveId(wallet);
    if (!userId) throw new Error("User not found");

    const request = await prisma().friendRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new Error("Request not found");
    if (request.receiverId !== userId) throw new Error("Not authorized");

    const status = accept ? "ACCEPTED" : "REJECTED";
    const updated = await prisma().friendRequest.update({
      where: { id: requestId },
      data: { status, respondedAt: new Date() },
    });

    if (accept) {
      await prisma().friendship.createMany({
        data: [
          { userId: request.senderId, friendId: request.receiverId },
          { userId: request.receiverId, friendId: request.senderId },
        ],
        skipDuplicates: true,
      });

      eventBus.publish({
        event: "FriendAccepted",
        userId: request.receiverId,
        aggregateId: request.id,
        aggregateType: "FriendRequest",
        friendId: request.senderId,
        requestId: request.id,
      });
    }

    return { id: updated.id, status };
  }

  async removeFriend(wallet: string, friendWallet: string): Promise<Record<string, unknown>> {
    const userId = await this.resolveId(wallet);
    const friendId = await this.resolveId(friendWallet);
    if (!userId || !friendId) throw new Error("User not found");

    await prisma().friendship.deleteMany({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId },
        ],
      },
    });

    logger.info("Friend removed", { userId, friendId });
    return { removed: true };
  }

  async block(wallet: string, targetWallet: string): Promise<Record<string, unknown>> {
    const userId = await this.resolveId(wallet);
    const targetId = await this.resolveId(targetWallet);
    if (!userId || !targetId) throw new Error("User not found");
    if (userId === targetId) throw new Error("Cannot block yourself");

    await prisma().playerRelationship.upsert({
      where: { userId_relatedId_type: { userId, relatedId: targetId, type: "BLOCKED" } },
      update: {},
      create: { userId, relatedId: targetId, type: "BLOCKED" },
    });

    await prisma().friendship.deleteMany({
      where: {
        OR: [
          { userId, friendId: targetId },
          { userId: targetId, friendId: userId },
        ],
      },
    });

    return { blocked: true };
  }

  async unblock(wallet: string, targetWallet: string): Promise<Record<string, unknown>> {
    const userId = await this.resolveId(wallet);
    const targetId = await this.resolveId(targetWallet);
    if (!userId || !targetId) throw new Error("User not found");

    await prisma().playerRelationship.deleteMany({
      where: { userId, relatedId: targetId, type: "BLOCKED" },
    });

    return { unblocked: true };
  }
}
