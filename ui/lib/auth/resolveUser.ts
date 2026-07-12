import { prisma } from "@/lib/auth/session";

export async function resolveUserId(wallet: string): Promise<string> {
  const normalized = wallet.toLowerCase();
  const user = await prisma().userProfile.findUnique({
    where: { wallet: normalized },
    select: { id: true },
  });
  if (!user) throw new Error("User not found");
  return user.id;
}

export async function resolveUser(wallet: string): Promise<{ id: string; wallet: string }> {
  const normalized = wallet.toLowerCase();
  const user = await prisma().userProfile.findUnique({
    where: { wallet: normalized },
    select: { id: true, wallet: true },
  });
  if (!user) throw new Error("User not found");
  return user;
}
