import { prisma } from "@/lib/auth/session";

const DEFAULT_WINDOW_SECONDS = 60;
const DEFAULT_MAX_REQUESTS = 120;

export type RateLimitOptions = {
  identifier: string;
  endpoint: string;
  windowSeconds?: number;
  maxRequests?: number;
};

export async function checkRateLimit(options: RateLimitOptions): Promise<{ allowed: boolean; remaining: number }> {
  const windowMs = (options.windowSeconds ?? DEFAULT_WINDOW_SECONDS) * 1000;
  const maxRequests = options.maxRequests ?? DEFAULT_MAX_REQUESTS;
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);

  const existing = await prisma().rateLimitEntry.findFirst({
    where: {
      identifier: options.identifier,
      endpoint: options.endpoint,
      createdAt: { gte: windowStart },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!existing) {
    await prisma().rateLimitEntry.create({
      data: {
        identifier: options.identifier,
        endpoint: options.endpoint,
        count: 1,
        windowStart,
        expiresAt: new Date(now.getTime() + windowMs),
      },
    });

    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (existing.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  await prisma().rateLimitEntry.update({
    where: { id: existing.id },
    data: { count: { increment: 1 } },
  });

  return { allowed: true, remaining: maxRequests - existing.count - 1 };
}
