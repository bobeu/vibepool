import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import { eventBus } from "./EventBus";
import type { IInviteEngine } from "./interfaces";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://nexora.app";
const MINIPAY_URL = process.env.NEXT_PUBLIC_MINIPAY_URL ?? "https://minipay.opera.com";

function generateCode(length = 8): string {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += charset[Math.floor(Math.random() * charset.length)];
  }
  return code;
}

export class InviteEngine implements IInviteEngine {
  name = "InviteEngine";

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

  private buildLinks(code: string, type: string): { url: string; deepLink: string } {
    const deepLink = `${BASE_URL}/?ref=${code}`;
    switch (type) {
      case "MINIPAY":
        return { url: `${MINIPAY_URL}/dapp?url=${encodeURIComponent(deepLink)}`, deepLink };
      case "QR":
        return { url: `${BASE_URL}/api/invites/qr?code=${code}`, deepLink };
      case "DEEP_LINK":
        return { url: deepLink, deepLink };
      default:
        return { url: deepLink, deepLink };
    }
  }

  async generate(wallet: string, type: string): Promise<Record<string, unknown>> {
    const ownerId = await this.resolveId(wallet);
    if (!ownerId) throw new Error("User not found");

    const code = generateCode();
    const inviteType = (type as any) ?? "INVITE_CODE";
    const { url, deepLink } = this.buildLinks(code, inviteType);

    const invite = await prisma().inviteCode.create({
      data: {
        ownerId,
        code,
        type: inviteType,
        url,
        deepLink,
      },
    });

    logger.info("Invite generated", { ownerId, type: inviteType });
    return {
      id: invite.id,
      code: invite.code,
      type: invite.type,
      url: invite.url,
      deepLink: invite.deepLink,
    };
  }

  async getInvites(wallet: string): Promise<Record<string, unknown>[]> {
    const ownerId = await this.resolveId(wallet);
    if (!ownerId) return [];

    const invites = await prisma().inviteCode.findMany({
      where: { ownerId },
      orderBy: { createdAt: "desc" },
    });

    return invites.map((i) => ({
      id: i.id,
      code: i.code,
      type: i.type,
      url: i.url,
      uses: i.uses,
      usedBy: i.usedBy,
      createdAt: i.createdAt,
    }));
  }

  async redeem(code: string, referredWallet: string): Promise<Record<string, unknown>> {
    const referredId = await this.resolveId(referredWallet);
    if (!referredId) throw new Error("User not found");

    const existingReferral = await prisma().referral.findUnique({ where: { referredId } });
    if (existingReferral) {
      return { alreadyReferred: true, referralId: existingReferral.id };
    }

    const invite = await prisma().inviteCode.findFirst({ where: { code } });
    if (!invite) throw new Error("Invalid invite code");
    if (invite.ownerId === referredId) throw new Error("Cannot redeem your own invite");

    const referral = await prisma().referral.create({
      data: {
        referrerId: invite.ownerId,
        referredId,
        code: invite.code,
        status: "PENDING",
      },
    });

    await prisma().inviteCode.update({
      where: { id: invite.id },
      data: {
        uses: { increment: 1 },
        usedBy: referredId,
      },
    });

    eventBus.publish({
      event: "ReferralRegistered",
      userId: invite.ownerId,
      aggregateId: referral.id,
      aggregateType: "Referral",
      referredId,
      code,
    });

    logger.info("Invite redeemed", { referralId: referral.id, code });
    return { referralId: referral.id, referrerId: invite.ownerId };
  }
}
