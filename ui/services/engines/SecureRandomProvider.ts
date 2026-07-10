import type { IRandomProvider } from "./random";

export class SecureRandomProvider implements IRandomProvider {
  name = "SecureRandomProvider";

  async next(): Promise<number> {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] / (0xffffffff + 1);
  }

  async range(min: number, max: number): Promise<number> {
    const value = await this.next();
    return Math.floor(value * (max - min + 1)) + min;
  }

  async shuffle<T>(items: T[]): Promise<T[]> {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(await this.next() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}
