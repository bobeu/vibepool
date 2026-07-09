# Smart Contract Architecture

## Overview

Vibepool 2.0 uses a modular smart contract architecture where the blockchain serves as a trusted settlement layer for rewards, treasury management, and player statistics. Game logic remains off-chain.

## Contracts

### RewardTreasury
- Central vault for all reward funds
- Supports CELO and ERC20 assets (USDm, USDC, USDT)
- Role-based access control for deposits, withdrawals, and payouts
- Replay protection via `requestId`
- Per-asset and global treasury statistics

### PointsManager
- Permanent player profile store
- Tracks XP, level, points, spins, streaks, reward claims
- Auto-calculates level (1 level per 1000 XP)
- Backend-authorized only
- Batch operations for efficiency
- Replay protection via `requestId`

### ActivityRegistry
- Minimal activity history
- Streak calculation (consecutive days)
- No historical arrays, only aggregates
- Backend-authorized only
- Replay protection via `requestId`

### SpinRewardManager
- Spin ticket accounting
- Tracks available, earned, used spins and lifetime rewards
- Wheel logic remains off-chain
- Backend-authorized only
- Replay protection via `requestId`

## Libraries

- `AssetValidation` — Asset enablement checks
- `LevelMath` — XP to level conversion
- `TransferHelper` — Safe native and ERC20 transfers
