# Smart Contract Architecture — Vibepool 2.0

## Philosophy
- One contract per bounded responsibility.
- Shared errors and events to reduce bytecode duplication and keep UX consistent.
- Frontend never hardcodes addresses; everything flows from `scripts/sync-data.js`.

## Contracts

### PredictionManager
- Responsibility: current daily round data and tournament lifecycle.
- Key reads: `getRoundData()`, `owner()`
- Key events: `RoundStarted`, `RoundEnded`, `PredictionPlaced`

### RewardTreasury
- Responsibility: prize pool custody and reward claims.
- Key reads: `treasuryBalance()`
- Key actions: `claimReward(user, roundId)`
- Key events: `RewardClaimed`

### PointsManager
- Responsibility: points ledger for gameplay-adjacent rewards.
- Key reads: `pointsOf(user)`
- Key actions: `awardPoints(user, amount, reason)`
- Key events: `PointsAwarded`

### SpinRewardManager
- Responsibility: spin eligibility and spin execution.
- Key reads: `availableSpins(user)`
- Key actions: `executeSpin(user)`
- Key events: `SpinExecuted`

## Shared Errors
- `Unauthorized()`
- `InvalidInput()`
- `InsufficientBalance()`
- `RoundNotActive()`
- `RoundStillActive()`
- `AlreadyClaimed()`
- `ReplayDetected()`

## Sync Flow
1. Deploy contracts via Hardhat.
2. Run `node scripts/sync-data.js` from `smartContracts/`.
3. Script writes `ui/lib/contracts/addresses.json`, `abis.json`, and `index.ts`.
4. Frontend imports `CONTRACTS` from `@/lib/contracts`.

## Celo Specifics
- Chain ID: 42220
- RPC: configured via `NEXT_PUBLIC_ALCHEMY_CELO_MAINNET_API`
- Explorer: Celoscan
- MiniPay compatibility: wallet connection via injected provider
