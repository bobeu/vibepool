/**
 * PredictionService — business logic for daily prediction tournaments.
 * Implementation deferred to Prompt 2.
 */
export class PredictionService {
  static async getCurrentRound(_wallet?: string) {
    throw new Error("PredictionService.getCurrentRound — Prompt 2");
  }

  static async submitPrediction(_wallet: string, _higher: boolean, _amount: bigint) {
    throw new Error("PredictionService.submitPrediction — Prompt 2");
  }
}
