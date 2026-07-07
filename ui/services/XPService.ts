export class XPService {
  static calculateLevel(xp: number): number {
    return Math.floor(xp / 1000) + 1;
  }

  static async awardXP(_wallet: string, _amount: number, _reason: string) {
    throw new Error("XPService.awardXP — Prompt 2");
  }
}
