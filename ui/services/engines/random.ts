export interface IRandomProvider {
  next(): Promise<number>;
  range(min: number, max: number): Promise<number>;
  shuffle<T>(items: T[]): Promise<T[]>;
}
