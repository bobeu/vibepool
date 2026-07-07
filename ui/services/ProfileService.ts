export class ProfileService {
  static async getByWallet(_wallet: string) {
    throw new Error("ProfileService.getByWallet — Prompt 2");
  }

  static async upsert(_wallet: string, _data: { username?: string; avatar?: string }) {
    throw new Error("ProfileService.upsert — Prompt 2");
  }
}
