# Vibepool 2.0 — Smart Contract Foundation

Hardhat-based smart contract suite for Vibepool 2.0 on Celo.

## Contracts

- `RewardTreasury.sol` — Central vault for reward funds (CELO + ERC20)
- `PointsManager.sol` — On-chain player profile, XP, points, spins
- `ActivityRegistry.sol` — Minimal activity history with streak tracking
- `SpinRewardManager.sol` — Spin ticket accounting and reward recording

## Libraries

- `libraries/AssetValidation.sol` — Asset enablement checks
- `libraries/LevelMath.sol` — XP to level conversion
- `libraries/TransferHelper.sol` — Safe native and ERC20 transfers

## Getting Started

```bash
npm install
cp .env.example .env
npx hardhat compile
npx hardhat test
```

## Deployment

```bash
npx hardhat deploy --network celo
node scripts/sync-data.js
```

## Testing

```bash
npx hardhat test
REPORT_GAS=true npx hardhat test
```
