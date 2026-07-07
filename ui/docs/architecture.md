# Vibepool 2.0 — Architecture Overview

## System Shape
- Modular monolith: single repo, single frontend, single backend (Next.js Route Handlers), single database.
- Smart contracts deployed on Celo mainnet; frontend syncs ABIs and addresses via `scripts/sync-data.js`.

## Core Modules
1. **Home** — central hub with live chain data, prize pool summary, and navigation cards.
2. **Prediction** — daily price prediction tournament.
3. **Spin** — reward wheel driven by gameplay points.
4. **Missions** — daily challenges for XP and points.
5. **Leaderboard** — daily / weekly rankings by XP and points.
6. **Rewards** — points redemption and treasury visibility.
7. **Profile** — wallet-linked identity, stats, and settings.
8. **Wallet** — MiniPay-aware auth and balance tracking.

## Data Flow
- Public on-chain data is fetched via `usePublicChainData` using a viem public client (no wallet required).
- Wallet-gated data uses RainbowKit + Wagmi.
- Zustand stores hold feature state client-side.
- Server state is fetched through API routes → services → contracts/database.

## Frontend Stack
- Next.js 15 App Router (standalone output)
- TypeScript strict mode
- TailwindCSS with CSS variables for dark/light theming
- Framer Motion for lightweight transitions
- RainbowKit + Wagmi + Viem for Celo wallet interactions

## Backend Stack
- Next.js Route Handlers (thin layer)
- Prisma + PostgreSQL (schema deferred to Prompt 2)
- In-memory rate limiting stub (production: Redis or similar in future)

## Smart Contracts
- `PredictionManager` — tournament round state
- `RewardTreasury` — prize pool custody and claims
- `PointsManager` — off-chain-synced points ledger
- `SpinRewardManager` — spin claims and availability
- Shared errors and events in `SharedErrors.sol` / `SharedEvents.sol`

## State Management
- Separate Zustand store per domain: `usePredictionStore`, `useSpinStore`, `useMissionStore`, `useRewardStore`, `useLeaderboardStore`, `useProfileStore`, `useWalletStore`, `useUIStore`.
