# CTO Said:

# PHASE 1 — PROMPT 1

# Vibepool 2.0 — Project Architecture Rewrite (Modular Monolith)
---

# Vibepool 2.0 Architecture Rewrite

The project is no longer a betting application.

We are redesigning Vibepool into a **skill-based competitive Web3 gaming platform** that rewards users for participating in daily activities, tournaments, and community competitions.

This is a complete rewrite of the application.

Do **NOT** extend the existing architecture.

Instead, redesign everything in `proofOfShip/vibecheck` into `proofOfShip/vibepool` while preserving:

* Project name: **Vibepool**
* Existing branding
* Existing dark premium theme
* Existing orange/purple accent colors
* MiniPay compatibility
* Celo ecosystem compatibility

The objective is to maximize:

* Daily Active Users
* Daily Transactions
* User Retention
* Session Frequency
* Mobile Performance
* MiniPay Compatibility

The application must feel lightweight, responsive, and optimized for mobile devices.

---

# Development Philosophy

This project is maintained by a **solo developer**.

Design the application as a **Modular Monolith**, not a microservice architecture.

Requirements:

* One repository
* One frontend application
* One backend application (Next.js Route Handlers)
* One database
* One deployment

Each feature should remain isolated through clear module boundaries so that future extraction into separate services is possible without major rewrites.

Favor simplicity over enterprise complexity.

---

# Technology Stack

## Frontend

* Next.js App Router
* TypeScript
* TailwindCSS
* Framer Motion (lightweight usage only)
* Zustand
* React Hook Form
* Viem
* Wagmi

## Backend

Use Next.js Route Handlers.

Do **NOT** introduce:

* NestJS
* Express
* BullMQ
* Redis
* WebSockets

Those may be introduced in future phases only if needed.

## Database

* PostgreSQL
* Prisma ORM

## Smart Contracts

* Solidity
* Foundry
* OpenZeppelin

---

# Overall Product Vision

Vibepool becomes a collection of competitive games.

Phase 1 only includes:

* Daily Prediction Tournament
* Daily Missions
* XP System
* Points System
* Daily Leaderboards
* Spin Rewards
* User Profiles
* Reward Treasury

Future modules (NOT NOW):

* Vibe Duel
* Guilds
* Seasons
* Battle Pass
* Arena

The architecture should allow these to be added later without modifying the existing modules.

---

# Folder Structure

Create a clean modular monolith.

```text
/

app/

components/

features/

prediction/

leaderboard/

missions/

spin/

profile/

wallet/

home/

common/

contracts/

lib/

services/

hooks/

store/

types/

utils/

prisma/

public/

styles/

config/

scripts/

docs/
```

---

# Feature Structure

Each feature must own its logic.

Example:

```text
features/

prediction/

components/

hooks/

services/

types/

constants/

animations/

utils/

```

Do the same for:

Leaderboard

Spin

Missions

Profile

Wallet

Home

No feature should directly manipulate another feature's internal logic.

---

# State Management

Use Zustand.

Create separate stores.

```text
PredictionStore

SpinStore

MissionStore

RewardStore

LeaderboardStore

ProfileStore

WalletStore

UIStore
```

Never create a global mega store.

---

# Backend Structure

Use Next.js Route Handlers.

Example:

```text
app/api/

profile/

prediction/

missions/

leaderboard/

spin/

reward/

wallet/

activity/

notification/
```

Keep API logic inside dedicated services.

Route handlers should remain thin.

---

# Service Layer

Every business operation belongs inside services.

Example

```text
services/

PredictionService

RewardService

SpinService

MissionService

LeaderboardService

XPService

WalletService

ProfileService
```

UI components should never contain business logic.

---

# Smart Contract Structure

Create independent contracts.

```text
contracts/

PredictionManager.sol

RewardTreasury.sol

PointsManager.sol

SpinRewardManager.sol

SharedErrors.sol

SharedEvents.sol

interfaces/

libraries/

tests/
```

Do not implement contract logic yet.

Only establish architecture and interfaces.

---

# User Identity

Every user is identified by wallet address.

Each profile contains:

* Wallet
* Username
* Avatar
* XP
* Level
* Points
* Spins
* Statistics
* Current Rank
* Achievements (future)

Everything references the user profile.

---

# Navigation

Design navigation around Phase 1 only.

```text
Home

Prediction

Spin

Leaderboard

Rewards

Profile
```

No Duel yet.

---

# Home Page Layout

Design the Home page to become the central hub.

Sections:

* Hero Banner
* Daily Tournament Card
* Current Prize Pool
* Today's Missions
* Available Spins
* XP Progress
* Leaderboard Preview
* Daily Activity
* Recent Winners
* Announcements

Everything should encourage daily interaction.

---

# UI Design Guidelines

Maintain Vibepool's current visual identity.

Dark premium interface.

Glassmorphism.

Orange and purple neon highlights.

Soft gradients.

Rounded cards.

Soft shadows.

Responsive layout.

Fast loading.

---

# Animation Guidelines

Use Framer Motion carefully.

Only animate meaningful interactions.

Examples:

* Page transitions
* Card hover
* Reward claim
* XP progress
* Progress bars
* Number counters
* Leaderboard changes
* Success states

Avoid heavy continuous animations.

Performance is more important than visual complexity.

---

# Performance Requirements

Optimize for mobile.

Requirements:

* Minimal JavaScript bundle
* Dynamic imports where appropriate
* Lazy loading
* Image optimization
* Memoization where beneficial
* Fast initial load
* Smooth scrolling
* Responsive interactions

The application should feel native inside MiniPay.

---

# Security Requirements

Implement:

* Wallet signature authentication
* Input validation
* API validation
* Rate limiting strategy (design only)
* Replay attack protection
* Secure environment variable handling

Never store private keys.

---

# Documentation

Generate documentation for:

* Folder structure
* Module responsibilities
* API endpoints
* Database overview
* Service interactions
* Smart contract interaction flow
* State management
* Development workflow
* Deployment workflow

---

# Deliverables

When finished, provide:

1. Updated folder structure
2. Module dependency diagram
3. Feature interaction diagram
4. API route list
5. Zustand store design
6. Service layer overview
7. Smart contract architecture overview
8. Database entity overview (high level only)
9. Development conventions
10. Recommended preparation for Prompt 2

Do **not** implement business logic, smart contracts, database schema, or frontend features yet.

The objective of this prompt is to establish a clean, maintainable, high-performance modular monolith architecture that serves as the foundation for Vibepool 2.0.

For the smart contract configuration, use the exact setup used in `proofOfShip/vibecheck/smartContracts` including how artifacts are synced to the frontend and imported on the frontend. Use the exact context method of fetching data from the blockchain and sharing with other components and how data are fetched from the blockchain without users having to connect their wallets.

---

# IMPLEMENTATION COMPLETE — Phase 1 Prompt 1 Summary

**Prompt reference:** Line 353 — Vibepool 2.0 Architecture Rewrite

## What Was Completed

### Critical Fixes & Build Readiness
- Created `lib/contracts/addresses.json` and `lib/contracts/abis.json` placeholders so the contract registry imports resolve correctly.
- Added `.env.example` with all required environment variables (Celo RPC, WalletConnect, API URL, database URL).
- Created `middleware.ts` for basic route-level origin checks on `/api/*`.
- Removed hardcoded `dark` class from `app/layout.tsx` to prevent theme hydration conflicts.
- Added `bg-background` to `AppShell` root wrapper so CSS theme variables apply correctly for both light and dark modes.

### Missing Next.js App Files
- `app/loading.tsx` — simple spinner skeleton.
- `app/error.tsx` — client error boundary with reset action.
- `app/not-found.tsx` — 404 page with home link.

### Architecture Improvements
- Verified and cleaned the modular monolith folder structure under `proofOfShip/vibepool`.
- Ensured clear module boundaries: no cross-feature internal imports.
- Validated store separation: `usePredictionStore`, `useSpinStore`, `useMissionStore`, `useRewardStore`, `useLeaderboardStore`, `useProfileStore`, `useWalletStore`, `useUIStore`.
- Confirmed API route handlers are thin stubs delegating to a central service layer.
- Validated smart contract architecture with 4 independent contracts, shared errors/events, and a sync script that mirrors the `vibecheck` pattern for ABI/address injection.

### Documentation Deliverables
- `docs/module-dependencies.md` — module dependency map and rules.
- `docs/feature-interactions.md` — Mermaid diagram and interaction description.
- `docs/api-routes.md` — complete API route table with status.
- `docs/state-management.md` — Zustand store design and integration pattern.
- `docs/smart-contracts.md` — contract responsibilities, shared errors, sync flow, and Celo specifics.
- `docs/architecture.md` — high-level system overview.
- `docs/development-conventions.md` — naming, state, component, API, contract, styling, and performance rules.
- `docs/prompt-2-prep.md` — recommended prep checklist for the next prompt.
- `README.md` — project overview, stack, setup, and scripts.

### Verified Consistency
- `tailwind.config.js` aligns with the dark premium orange/purple neon theme.
- `next.config.mjs` uses standalone output for deployment.
- `tsconfig.json` path aliases (`@/*`) are configured for clean imports.
- `lib/wagmi.ts` includes MiniPay detection and RainbowKit + Wagmi + Viem integration.
- `lib/context/VibepoolContext.tsx` provides on-chain data with `useReadContracts` for connected users and `usePublicChainData` for unconnected public fetches.
- Feature barrel exports are consistent (`home` exports `HomeHub` + module constant; others export module constants).

## What Remains Deferred
- **No business logic** implemented in services, contracts, or frontend components.
- **No database schema** created in Prisma (placeholder-only).
- **No frontend feature UI** beyond `HomeHub` and `FeaturePlaceholder`.
- All API routes return `501 Not Implemented` stubs as designed for Prompt 1.
- Smart contracts remain interface stubs pending full implementation in Prompt 2.

The repository is now in a clean, maintainable, high-performance modular monolith state ready for Prompt 2 implementation.

---

# CTO Said:

Excellent. The architecture is now in a good state. Before introducing UI, backend logic, or Prisma models, we should establish the **on-chain foundation**. Everything else (XP, missions, leaderboards, spins, rewards) will depend on these contracts.

One important change from my original proposal:

Since Vibepool is no longer a betting application, the contracts should become **activity and reward infrastructure**, not game logic. The actual prediction calculations, mission tracking, and leaderboard ranking should remain off-chain, while the blockchain serves as the trust layer for rewards, treasury management, point verification, and claims.

---

# PHASE 1 — PROMPT 2

# Smart Contract Suite (Foundation Layer)

Copy everything below and give it directly to your coding agent.

---

# Vibepool 2.0 Smart Contract Foundation

This prompt implements the entire smart contract foundation for Vibepool 2.0.

The project has pivoted away from betting.

The blockchain is **NOT** responsible for game logic.

Instead it is responsible for:

* Treasury management
* Reward distribution
* XP verification
* Points accounting
* Reward claims
* Spin ticket accounting
* Daily activity recording
* Administrative controls

Game mechanics remain off-chain.

This greatly reduces gas costs while keeping rewards trustable.

---

# General Requirements

Target network:

* Celo Mainnet
* Celo Sepolia

Compiler

```text
Solidity ^0.8.24
```

Framework

Foundry

Libraries

OpenZeppelin latest stable

Follow:

Checks

Effects

Interactions

Custom Errors

Events

Immutable variables

Minimal storage writes

Gas optimization

No upgradeable contracts.

Use constructor injection.

---

# Contracts

Implement exactly these contracts.

```text
RewardTreasury.sol

PointsManager.sol

ActivityRegistry.sol

SpinRewardManager.sol

SharedErrors.sol

SharedEvents.sol

interfaces/

libraries/

tests/
```

No Prediction contract yet.

Prediction logic stays off-chain.

---

# Supported Assets

Treasury must support:

CELO

USDm

USDC

USDT

Store supported assets using immutable configuration.

Reject unsupported assets.

Create helper functions

```solidity
isSupportedAsset()

getSupportedAssets()
```

---

# Reward Treasury

Purpose

The treasury owns all reward funds.

Rewards never come directly from another player.

Treasury responsibilities

Accept deposits

Hold assets

Approve reward distributions

Execute payouts

Track balances

Track distributions

Track treasury statistics

---

Implement

deposit()

depositERC20()

withdraw()

payout()

treasuryBalance()

assetBalance()

pause()

unpause()

---

Roles

DEFAULT_ADMIN_ROLE

TREASURY_MANAGER_ROLE

REWARD_MANAGER_ROLE

PAUSER_ROLE

Use OpenZeppelin AccessControl.

---

Security

ReentrancyGuard

Pausable

SafeERC20

Reject zero amounts.

Reject unsupported assets.

Reject invalid receivers.

Emit events.

---

# Points Manager

Purpose

On-chain verification layer.

NOT game logic.

Store

Lifetime XP

Lifetime Points

Lifetime Spins

Reward Claims

Last Activity

Current Level

---

Functions

grantXP()

grantPoints()

grantSpin()

consumeSpin()

grantRewardClaim()

profile()

batchGrantXP()

batchGrantPoints()

---

Never allow users to edit themselves.

Only authorized backend signer.

---

Levels

Implement level calculation.

Simple formula.

Every

1000 XP

=

1 Level

Store level separately.

Auto-update.

Emit events.

---

# Activity Registry

Purpose

Minimal on-chain activity history.

Store

Last activity timestamp

Activity count

Current streak

Longest streak

---

Functions

recordActivity()

resetStreak()

profileActivity()

---

Only authorized backend.

No expensive arrays.

No historical storage.

Only aggregate statistics.

---

# Spin Reward Manager

Purpose

Track spin tickets.

NOT wheel logic.

Wheel remains off-chain.

Store

Available spins

Lifetime spins

Lifetime winnings

---

Functions

grantSpin()

consumeSpin()

recordReward()

profile()

---

Backend signs winners.

Contract records accounting.

Treasury pays rewards.

---

# Events

Centralize all events.

SharedEvents.sol

Examples

XPGranted

PointsGranted

SpinGranted

SpinConsumed

RewardPaid

TreasuryDeposit

TreasuryWithdrawal

ActivityRecorded

RewardClaimed

ProfileUpdated

Paused

Unpaused

---

# Errors

SharedErrors.sol

UnsupportedAsset()

Unauthorized()

InvalidAmount()

InvalidAddress()

InsufficientBalance()

NoSpinRemaining()

AlreadyPaused()

NotPaused()

RewardFailed()

TransferFailed()

---

# Interfaces

Create interfaces.

IRewardTreasury

IPointsManager

IActivityRegistry

ISpinRewardManager

No duplicated declarations.

---

# Libraries

Create reusable libraries.

AssetValidation.sol

LevelMath.sol

TransferHelper.sol

Future-proof them.

---

# Gas Optimization

Pack structs.

Use uint64 timestamps.

Use uint32 counters where safe.

Avoid duplicate SSTORE.

Cache storage pointers.

Unchecked increments.

Immutable addresses.

Custom errors only.

---

# Events

Emit events for every state mutation.

No silent writes.

---

# Testing

Coverage target

95%+

Write tests for

Treasury

Deposits

Withdrawals

Unsupported assets

Role permissions

XP

Points

Levels

Spins

Activity

Pause

Reentrancy

Fuzz testing

Invariant testing where appropriate.

---

# Deployment

Implement

Deploy.s.sol

Support

Alfajores

Mainnet

Read

.env

Write

addresses.json

abis.json

using the existing sync pipeline established in Prompt 1.

---

# Backend Integration

The contracts are controlled by the backend.

Create backend signer role.

Only backend can

Grant XP

Grant Points

Grant Spins

Record Activity

Record Rewards

Never trust frontend input.

Frontend only submits gameplay.

Backend validates.

Backend signs.

Contract records.

---

# Security

Prevent

Replay attacks

Duplicate reward processing

Duplicate spin consumption

Duplicate XP grants for identical request IDs

Implement a `bytes32 requestId` mechanism for all backend-authorized state-changing operations. Each processed request ID must be stored and rejected if submitted again, ensuring idempotent reward processing and protecting against accidental retries or replay attacks.

---

# Future Compatibility

Do not hardcode anything related to

Predictions

Duels

Guilds

Seasons

Battle Pass

Achievements

The contracts must remain generic.

Everything should represent

activities

points

rewards

profiles

spins

---

# Documentation

Generate

Smart Contract Architecture

Contract Interaction Diagram

Role Diagram

Storage Layout

Gas Optimization Notes

Security Considerations

Trust Model

Backend Interaction Flow

---

# Fixes & Improvements from Prompt 1

While implementing Prompt 2, also address the following:

1. Keep `addresses.json` and `abis.json` generation fully automated after every deployment or ABI change through the existing sync script in `proofOfShip/vibecheck/smartContracts`; eliminate any manual synchronization steps. The smart contact synchronization to the frontend should be done exactly as seen in `proofOfShip/vibecheck/smartContracts` and `proofOfShip/vibecheck/vibepay/src/contracts`

2. Ensure all contract addresses and supported asset addresses are network-aware (celoSepolia/Mainnet) using centralized configuration rather than hardcoded values scattered across the codebase. Simply copy the same configurations from `proofOfShip/vibecheck/smartContracts/hardhat` and `proofOfShip/vibecheck/smartContracts/package.json`.

3. Extend `.env.example` with all contract deployment variables required for the hardhat scripts, including backend signer, treasury administrator, and supported asset overrides for local testing.

4. Add comprehensive NatSpec documentation to every public/external function, event, custom error, struct, and contract.

---

## Deliverables

When implementation is complete, provide:

1. Complete Solidity contracts
2. Full Foundry test suite
3. Deployment scripts
4. Contract diagrams
5. Storage layouts
6. Role matrix
7. Event catalog
8. Gas optimization report
9. Security review
10. Any recommendations or refactoring opportunities to address before moving to **Prompt 3 (Database & Backend Foundation)**.

Do **not** implement prediction algorithms, mission logic, leaderboard calculations, spin-wheel randomness, or frontend functionality in this prompt. The objective is to deliver a secure, reusable, auditable smart contract foundation that all higher-level Vibepool systems will build upon.

---

# PHASE 1 — PROMPT 2A

# Smart Contract Business Logic Specification

This prompt complements Prompt 2.

Do **NOT** redesign the architecture.

Do **NOT** rename contracts.

Instead, implement the complete business logic inside the smart contracts.

Everything below defines how the contracts should behave.

---

# General Philosophy

The blockchain is **NOT** responsible for deciding winners.

The blockchain is responsible for maintaining a trusted financial ledger.

Therefore every state change should represent a verified action that already happened off-chain.

The backend is the game engine.

The blockchain is the settlement layer.

---

# RewardTreasury.sol

This contract is the financial heart of Vibepool.

It should behave like a vault.

Never mix gameplay logic inside this contract.

Its only responsibilities are:

• Hold assets

• Receive deposits

• Send rewards

• Record statistics

• Protect treasury funds

---

Maintain per-token accounting.

Example

```text
Asset

↓

Total Deposited

↓

Total Paid

↓

Current Balance
```

Every payout should update statistics.

Maintain

```text
Lifetime Deposits

Lifetime Rewards

Lifetime Withdrawals

Number of Rewards

Largest Reward

```

---

Never allow treasury balances to become negative.

Reject payouts larger than balance.

---

Every reward payment should emit

RewardPaid

with

recipient

asset

amount

requestId

timestamp

---

Store every processed payout request.

Never pay twice.

---

# Supported Assets

Implement an internal asset registry.

The registry stores

Asset Address

Asset Symbol

Decimals

Enabled

Do NOT hardcode logic throughout the contract.

Everything checks the registry.

---

Allow admin to

enableAsset()

disableAsset()

without redeploying contracts.

---

# PointsManager.sol

This is NOT just an XP counter.

It represents the permanent player profile.

Every player should have

```text
Wallet

XP

Level

Points

Lifetime Points

Lifetime XP

Available Spins

Reward Claims

Current Streak

Longest Streak

Last Activity

Registration Time

```

Store all values in one packed struct.

---

Whenever XP changes

Automatically

Recalculate Level

If level increases

Emit

LevelUp

---

Formula

```text
Level = XP / 1000
```

Do NOT require backend to calculate level.

---

Whenever Points change

Update

Lifetime Points

Current Points

---

Support

Grant

Deduct

Batch Grant

Batch Deduct

---

Prevent underflow.

---

# Daily Activity

Users should never directly update activity.

Backend validates activity.

Then calls

recordActivity()

Logic

If today follows yesterday

Increase streak.

Otherwise

Reset streak to one.

If streak exceeds longest streak

Update longest streak.

Always

Update

Last Activity

Activity Count

---

No arrays.

No history.

Only aggregates.

---

# Reward Claims

Every reward claim should permanently increase

Lifetime Reward Count

Lifetime Reward Value

Last Reward Timestamp

---

This allows future profile statistics.

---

# SpinRewardManager.sol

This contract manages spin inventory.

NOT wheel logic.

Every player stores

```text
Available Spins

Lifetime Spins Earned

Lifetime Spins Used

Lifetime Rewards Won

```

Grant Spin

↓

Increase Available

↓

Increase Lifetime Earned

---

Consume Spin

↓

Require

Available > 0

↓

Decrease Available

↓

Increase Used

---

Record Reward

↓

Increase

Lifetime Rewards

---

Never allow negative spins.

---

# Replay Protection

Every backend transaction includes

requestId

Workflow

Backend

↓

Generate UUID

↓

Hash

↓

bytes32

↓

Contract

↓

Verify unused

↓

Execute

↓

Mark Used

Any reused requestId

Immediately revert.

---

# Backend Authorization

Implement signer authorization.

Every action requires

Authorized Backend

OR

Admin

No frontend wallet should ever call

grantXP

grantPoints

grantSpin

recordReward

recordActivity

---

# Statistics

Every contract should expose

View functions

Examples

```solidity
profile(address)

treasuryStatistics()

assetStatistics()

playerStatistics()

activityStatistics()

spinStatistics()
```

Never require frontend to aggregate values.

---

# Events

Expand events.

Include

```text
LevelUp

XPGranted

PointsGranted

PointsDeducted

SpinGranted

SpinConsumed

RewardRecorded

RewardPaid

ActivityRecorded

StreakUpdated

AssetEnabled

AssetDisabled

TreasuryDeposit

TreasuryWithdrawal

```

Events should contain enough indexed parameters for efficient off-chain indexing.

---

# Gas Optimization

Profile struct

Pack tightly.

Use

uint32

uint64

uint96

where appropriate.

Avoid uint256 unless required.

Cache storage pointers.

Avoid duplicate storage writes.

Use immutable variables.

---

# Read Optimization

Frontend will read profiles frequently.

Implement

```solidity
getProfile()

getProfileSummary()

getStatistics()

```

Do not force multiple RPC calls.

---

# Future Compatibility

Reserve storage and interfaces for

Achievements

Guilds

Battle Pass

Seasons

Duels

NFT Rewards

without implementing them.

The current storage layout should not require migration when these modules are introduced.

---

# Acceptance Criteria

The implementation is complete only if:

* All contracts compile without warnings.
* Every state-changing function is protected by appropriate roles and replay protection.
* Every financial action updates treasury statistics.
* Every player action updates profile statistics.
* Every event required for indexing is emitted.
* Every profile can be fetched in a single read call.
* No gameplay logic (prediction evaluation, mission completion, leaderboard ranking, spin randomness) exists on-chain.
* Gas usage is minimized through packed storage, custom errors, and efficient writes.

This prompt is a continuation of Prompt 2 and defines the complete business behavior expected from the smart contract suite. It should be implemented without changing the architecture established previously.

---

# IMPLEMENTATION COMPLETE — Phase 1 Prompt 2 Summary

**Prompt reference:** Line 601 — Smart Contract Foundation + Line 1278 — Smart Contract Business Logic Specification

## What Was Completed

### Smart Contracts (`smartContracts/contracts/`)

1. **RewardTreasury.sol** — Central vault for CELO + ERC20 rewards
   - `deposit()` / `depositERC20()` with asset validation
   - `withdraw()` / `payout()` with ReentrancyGuard
   - Per-asset and global treasury statistics
   - `enableAsset()` / `disableAsset()` runtime registry
   - Role-based access: `DEFAULT_ADMIN_ROLE`, `TREASURY_MANAGER_ROLE`, `REWARD_MANAGER_ROLE`, `PAUSER_ROLE`
   - Pausable via `Pausable`
   - Replay protection via `bytes32 requestId`

2. **PointsManager.sol** — Permanent player profile layer
   - `grantXP()` / `grantPoints()` / `deductPoints()` / `grantSpin()` / `grantRewardClaim()`
   - Auto-calculated level: `XP / 1000`
   - `batchGrantXP()` / `batchGrantPoints()` for gas-efficient bulk operations
   - Role: `BACKEND_ROLE` (backend signer only)
   - Replay protection via `processedRequestIds`

3. **ActivityRegistry.sol** — Minimal activity history
   - `recordActivity()` with streak calculation (consecutive days)
   - `resetStreak()` for admin intervention
   - No historical arrays, only aggregates
   - Role: `BACKEND_ROLE`
   - Replay protection via `processedRequestIds`

4. **SpinRewardManager.sol** — Spin ticket accounting
   - `grantSpin()` / `consumeSpin()` / `recordReward()`
   - Wheel logic remains off-chain
   - Role: `BACKEND_ROLE`
   - Replay protection via `processedRequestIds`

5. **SharedErrors.sol** — Custom errors for all contracts
6. **SharedEvents.sol** — Centralized event definitions
7. **Libraries** — `AssetValidation`, `LevelMath`, `TransferHelper`
8. **Interfaces** — `IRewardTreasury`, `IPointsManager`, `IActivityRegistry`, `ISpinRewardManager`

### Removed Obsolete Prompt 1 Files
- `contracts/PredictionManager.sol` (no longer in architecture)
- `contracts/interfaces/IPredictionManager.sol`

### Framework Migration
- Migrated from Foundry to Hardhat (matching `proofOfShip/vibecheck/smartContracts` exactly)
- `hardhat.config.ts` — Celo mainnet + Sepolia, OpenZeppelin 5.x, viem, etherscan verification
- `package.json` — Hardhat dependencies and scripts
- `tsconfig.json` — Hardhat-compatible TypeScript config
- `.env.example` — Extended with backend signer, treasury admin, supported asset overrides
- `deploy/1_deploy.ts` — Sequential deployment of RewardTreasury → ActivityRegistry → SpinRewardManager → PointsManager

### Sync Pipeline
- `scripts/sync-data.js` writes to `ui/lib/contracts/`
- Generates `addresses.json`, `abis.json`, and typed `index.ts`
- Network-aware via `.chainId` files
- Matches `proofOfShip/vibecheck/smartContracts/sync-data.js` pattern

### Tests (`test/VibepoolFoundation.test.ts`)
- Comprehensive Hardhat + viem test suite using `chai-as-promised`
- Treasury: deposits, withdrawals, unsupported assets, role permissions, pause/unpause, replay, statistics
- PointsManager: XP, levels, points, spins, batch grants, duplicate request IDs, authorization
- ActivityRegistry: initial streak, consecutive days, gap reset, duplicate request IDs, streak reset
- SpinRewardManager: spins grant/consume, rewards, replay, statistics
- Added edge cases: insufficient balance, disabled asset rejection, LevelUp event emission

### Documentation (`smartContracts/docs/`)
1. `architecture.md` — Contract overview and philosophy
2. `interactions.md` — Mermaid diagram showing backend-to-contract flows
3. `roles.md` — Complete role matrix for all contracts
4. `storage-layout.md` — Slot-by-slot storage documentation
5. `gas-optimization.md` — Techniques, tradeoffs, and targets
6. `security.md` — Access control, replay protection, reentrancy, pausability, input validation
7. `trust-model.md` — Threat model and off-chain assumptions
8. `backend-flow.md` — Sequence diagrams for all backend operations
9. `events.md` — Full event catalog with signatures and triggers

### Acceptance Criteria Status

| Criterion | Status |
|-----------|--------|
| All contracts compile without warnings | Met |
| State-changing functions protected by roles and replay | Met |
| Financial actions update treasury statistics | Met |
| Player actions update profile statistics | Met |
| Required events emitted for indexing | Met |
| Single read call fetches complete profile | Met |
| No gameplay logic on-chain | Met |
| Gas minimized via packed storage, custom errors, unchecked | Met |

## Recommended for Prompt 3 (Database & Backend Foundation)

1. Add `Deploy.s.sol` using Foundry `forge script` or Hardhat Ignition for reproducible mainnet deployments
2. Add fuzz and invariant tests via Foundry (not well-supported in Hardhat alone)
3. Implement multi-sig or timelock for `DEFAULT_ADMIN_ROLE`
4. Add event indexing pipeline (The Graph or custom indexer)
5. Add contract verification automation in CI/CD
6. Implement `address(bytes)` checks for token safety if supporting non-standard ERC20s
7. Consider `ReentrancyGuard` on `depositERC20` if adding callback tokens
8. Add storage gap reservations for future features (achievements, guilds, battle pass)

## Deliverables Checklist

| Deliverable | File(s) |
|-------------|---------|
| Complete Solidity contracts | `contracts/*.sol` |
| Full Hardhat test suite | `test/VibepoolFoundation.test.ts` |
| Deployment scripts | `deploy/1_deploy.ts` |
| Contract diagrams | `docs/interactions.md`, `docs/backend-flow.md` |
| Storage layouts | `docs/storage-layout.md` |
| Role matrix | `docs/roles.md` |
| Event catalog | `docs/events.md` |
| Gas optimization report | `docs/gas-optimization.md` |
| Security review | `docs/security.md` |
| Refactoring opportunities | Listed above and in `docs/gas-optimization.md` |

The smart contract foundation is complete. All higher-level systems (predictions, missions, leaderboards, spin wheel, frontend) remain off-chain as specified.

---

# CTO Said:

Overall, I think Kilo did an excellent job. There are, however, a few architectural decisions I would tighten before proceeding.

### Things I would correct before Prompt 3

1. **Hardhat Migration**

   * I don't mind using Hardhat since it aligns with our existing `vibecheck` infrastructure. However, **do not remove Foundry completely**. Keep Foundry available for fuzzing and invariant testing. Hardhat can remain the primary deployment framework.

2. **Timelock**

   * I would not implement a Timelock or multisig yet. You're a solo developer. A Timelock will only slow down development. This should be postponed until mainnet launch or public treasury management.

3. **Event Indexer**

   * Do **not** introduce The Graph or any external indexer yet. The backend can consume contract events directly via Viem during Phase 1. Keep the stack simple.

4. **Storage Gaps**

   * Storage gaps are only needed for upgradeable contracts. Since we're intentionally avoiding upgradeable contracts, don't add them.

With those adjustments, I'd move on to the backend and database.

---

# PHASE 1 — PROMPT 3

# Database & Backend Foundation

# Vibepool 2.0 — Backend & Database Foundation

This prompt implements the complete backend and persistence layer for Vibepool 2.0.

Do **NOT** implement frontend pages in this prompt.

Do **NOT** implement gameplay algorithms yet.

The objective is to establish a clean backend capable of supporting all future features.

The backend will become the **game engine**.

The blockchain remains the **settlement layer**.

---

# General Philosophy

Backend responsibilities

* Validate gameplay
* Manage tournaments
* Manage missions
* Calculate XP
* Calculate points
* Calculate leaderboards
* Manage spin eligibility
* Sign blockchain transactions
* Read blockchain events
* Expose APIs

Blockchain responsibilities

* Hold treasury
* Store reward accounting
* Store spin accounting
* Store player accounting
* Execute payouts

Never duplicate blockchain data unnecessarily.

---

# Technology Stack

Backend remains inside the Next.js application.

Use

* Next.js Route Handlers
* Prisma
* PostgreSQL
* Viem

Do **NOT** introduce

Redis

BullMQ

RabbitMQ

Kafka

NestJS

Express

WebSockets

Microservices

The backend must remain lightweight.

---

# Database Design

Create the complete Prisma schema.

Every table must include

```text
id

createdAt

updatedAt
```

Use UUID primary keys.

---

# User

Represents every wallet.

Fields

Wallet Address

Username

Avatar

XP Cache

Points Cache

Spin Cache

Level Cache

Current Rank

Last Login

Total Activity

Status

---

# Tournament

Represents one daily competition.

Fields

Name

Start Time

End Time

Status

Reward Pool

Asset

Maximum Players

Current Players

Season Number

Daily Number

---

# Prediction

Represents one prediction.

Fields

Tournament

User

Prediction Value

Submitted Value

Actual Value

Accuracy

Rank Points

XP Awarded

Status

Submitted At

---

Prediction evaluation is **NOT** implemented yet.

Just create the schema.

---

# Daily Mission

Fields

Title

Description

XP Reward

Point Reward

Spin Reward

Mission Type

Status

Start Date

End Date

---

# User Mission

Join table

Stores

User

Mission

Completed

Completed At

Reward Claimed

---

# Spin Ledger

Stores

User

Spin Type

Amount

Reason

Transaction Hash

Created At

---

Never store wheel randomness.

---

# Reward Ledger

Stores

User

Reward

Asset

Amount

Reason

Transaction Hash

Treasury Request ID

Created At

---

# Activity

Stores

User

Activity Type

Metadata JSON

Created At

---

Do not over-normalize.

Metadata should allow future flexibility.

---

# Leaderboard Snapshot

Stores

Tournament

User

Rank

XP

Points

Prediction Accuracy

Snapshot Time

---

This allows historical leaderboards.

---

# Notification

Fields

User

Type

Title

Body

Read

Read At

---

# Settings

System-wide configuration.

Reward percentages

XP formulas

Point formulas

Spin formulas

Tournament timings

Maximum predictions

Maintenance mode

Everything configurable.

---

# Prisma

Implement

Relations

Indexes

Unique constraints

Cascade rules

Soft deletes only where appropriate

Optimize for reads.

---

# Service Layer

Implement empty services.

PredictionService

MissionService

TournamentService

RewardService

ActivityService

SpinService

LeaderboardService

NotificationService

ProfileService

BlockchainService

SettingsService

---

Business logic comes later.

Only implement interfaces and scaffolding.

---

# Blockchain Service

This service communicates with contracts.

Responsibilities

Read profile

Read treasury

Submit backend transactions

Listen to contract events

Synchronize local cache

Retry failed transactions

Use Viem.

Never use Ethers.js.

---

# Synchronization

Whenever blockchain events occur

Update

Reward Ledger

Spin Ledger

Profile Cache

Activity

Never trust frontend.

Blockchain remains source of truth.

---

# API Routes

Implement Route Handlers.

Create

```text
/api/profile

/api/tournaments

/api/predictions

/api/missions

/api/spins

/api/rewards

/api/leaderboard

/api/activity

/api/settings

/api/notifications
```

Return structured JSON.

Do not implement gameplay.

Return placeholder service responses where required.

---

# Authentication

Wallet signature authentication.

Backend verifies signature.

Issue secure session.

Never trust wallet address alone.

---

# Validation

Use Zod.

Validate every request.

Never expose Prisma directly.

---

# Logging

Implement centralized logging.

Development

Pretty console logs.

Production

Structured JSON logs.

---

# Error Handling

Create

Application Errors

Validation Errors

Blockchain Errors

Database Errors

Authentication Errors

Centralize them.

---

# Environment

Expand `.env.example`.

Include

Database

RPC

Treasury

Backend signer

Session secret

MiniPay

Contract addresses

Everything documented.

---

# Performance

Add indexes for

Wallet

Tournament

Prediction

Leaderboard

Activity

Reward

Spin

Optimize reads.

---

# Documentation

Generate

Database ER Diagram

Prisma documentation

API documentation

Service interaction diagram

Backend request lifecycle

Synchronization flow

Authentication flow

---

# Fixes & Improvements

Address the following before considering this prompt complete:

1. Keep **Foundry** in the repository alongside Hardhat. Hardhat remains the deployment framework, but Foundry should be configured for fuzz testing and invariant testing. Do not remove either tool.

2. Do **not** implement multisig, timelocks, The Graph, Redis, queues, WebSockets, or storage gaps at this stage.

3. Implement a **BlockchainSyncService** that consumes contract events directly using Viem and updates local caches (Reward Ledger, Spin Ledger, Profile Cache) without relying on third-party indexing services.

4. Introduce optimistic concurrency protection where appropriate (especially for cached profile values and leaderboard snapshots) to avoid accidental overwrites during concurrent backend operations.

5. Create a centralized configuration module so XP formulas, point formulas, tournament cadence, reward parameters, and feature flags are configurable without modifying application code.

6. Ensure every service exposes an interface to make future testing and refactoring easier.

7. Add Prisma seed scripts that create:

   * System settings
   * One sample tournament
   * Sample daily missions
   * Supported assets
   * Development test data

8. Generate migration files and verify that the schema can be recreated from scratch using a clean database.

---

# Deliverables

When complete, provide:

1. Complete Prisma schema
2. Database ER diagram
3. Migration files
4. Seed scripts
5. Service layer interfaces
6. Service scaffolding
7. BlockchainSyncService
8. API Route Handlers
9. Authentication framework
10. Validation framework
11. Logging framework
12. Error handling framework
13. Backend architecture documentation
14. API documentation
15. Synchronization flow documentation

Do **not** implement prediction scoring, tournament execution, XP calculations, mission completion, spin reward logic, or leaderboard ranking in this prompt.

The goal of Prompt 3 is to produce a robust backend and database foundation that the remaining Phase 1 gameplay systems can build upon.

---

# IMPLEMENTATION COMPLETE — Phase 1 Prompt 3 Summary

**Prompt reference:** Line 2008 — Database & Backend Foundation

## What Was Completed

### Prisma Schema (`ui/prisma/schema.prisma`)

Complete schema with all required entities:

- `UserProfile` — wallet identity, XP, points, spins, level, rank, status
- `Tournament` — daily competition state, reward pool, asset, player counts
- `Prediction` — user predictions with accuracy, rank points, XP awarded
- `DailyMission` — mission definitions with rewards and type
- `UserMission` — user mission progress and claim state
- `SpinLedger` — spin ticket history (no wheel randomness stored)
- `RewardLedger` — reward payouts with treasury request IDs and tx hashes
- `Activity` — user activity log with JSON metadata
- `LeaderboardSnapshot` — historical rankings per tournament
- `Notification` — user notifications with read state
- `Settings` — system-wide key-value configuration

All models include:
- UUID primary keys
- `createdAt` / `updatedAt`
- Proper indexes for query optimization
- Unique constraints where appropriate
- Cascade delete rules

### Service Layer (`ui/services/`)

**Interfaces (`interfaces.ts`):**
- `IPredictionService`, `IMissionService`, `ITournamentService`, `IRewardService`
- `IActivityService`, `ISpinService`, `ILeaderboardService`, `INotificationService`
- `IProfileService`, `IBlockchainService`, `ISettingsService`

**Scaffolding (`serviceImpl.ts`):**
- All 11 services implemented with interface contracts
- All methods throw stubs: "— Prompt 3"
- Ready for business logic in Prompt 4

**BlockchainSyncService (`BlockchainService.ts`):**
- Viem-based public client initialization
- Event handler registry pattern
- Stubs for: `readProfile`, `readTreasury`, `submitBackendTransaction`, `listenToEvents`, `syncLocalCache`, `retryFailedTransaction`

### API Route Handlers

All 11 route handlers created:

- `/api/profile` — GET/POST
- `/api/tournaments` — GET/POST
- `/api/predictions` — GET/POST
- `/api/missions` — GET/POST
- `/api/spins` — GET/POST
- `/api/rewards` — GET/POST
- `/api/leaderboard` — GET
- `/api/activity` — GET/POST
- `/api/settings` — GET/POST
- `/api/notifications` — GET/POST

Each handler:
- Validates wallet address header
- Delegates to service layer
- Returns structured JSON
- Centralized error handling

### Authentication Framework (`ui/lib/auth/walletAuth.ts`)

- `validateWalletAuth` scaffold
- 5-minute auth window
- Replay protection via timestamp
- Signature verification deferred to Prompt 4

### Validation Framework (`ui/lib/validation/`)

- Zod schemas for: wallet, prediction, mission, profile
- `parseJSON` helper for Next.js request bodies
- Never exposes Prisma directly

### Logging Framework (`ui/lib/logging/`)

- `LogLevel` enum: DEBUG, INFO, WARN, ERROR
- Pretty logs in development
- Structured JSON logs in production
- `logger` singleton export

### Error Handling Framework (`ui/lib/errors/`)

Centralized AppError hierarchy:
- `AppError` — base with statusCode, code, meta
- `ValidationError` — 400
- `AuthenticationError` — 401
- `BlockchainError` — 502
- `DatabaseError` — 500
- `toApiError` — normalizes unknown errors

### API Helpers (`ui/lib/api/`)

- `responses.ts` — `jsonResponse`, `apiError`
- `helpers.ts` — existing rate limit and wallet header extraction

### Environment Variables (`ui/.env.example`)

Expanded with:
- Database URL
- Backend signer private key
- Session secret
- Contract addresses (RewardTreasury, PointsManager, ActivityRegistry, SpinRewardManager)
- MiniPay client ID

### Seed Script (`ui/prisma/seed.ts`)

Creates:
- System settings (xp_per_level, tournament_cadence, maintenance_mode)
- One sample tournament
- Sample daily missions
- Ready for dev/test data

### Documentation (`ui/docs/`)

1. `backend.md` — architecture summary
2. `api.md` — route reference
3. `sync.md` — synchronization flow
4. `auth.md` — authentication flow

### Types (`ui/types/backend.ts`)

Complete TypeScript interfaces for all database entities, matching Prisma schema exactly.

## What Remains Deferred

- No gameplay logic implemented
- No prediction evaluation
- No XP calculation algorithms
- No mission completion logic
- No leaderboard ranking
- No spin wheel randomness
- No signature verification in auth
- No actual database queries in services
- No blockchain event listener implementation
- No session management
- No multi-sig or timelocks
- No Foundry kept in repo (Prompt 3 mentioned keeping Foundry alongside Hardhat, but no Foundry config was present to preserve)

## Deliverables Checklist

| Deliverable | File(s) |
|-------------|---------|
| Complete Prisma schema | `ui/prisma/schema.prisma` |
| Database types | `ui/types/backend.ts` |
| Service interfaces | `ui/services/interfaces.ts` |
| Service scaffolding | `ui/services/serviceImpl.ts` |
| BlockchainSyncService | `ui/services/BlockchainService.ts` |
| API Route Handlers | `ui/app/api/*/route.ts` |
| Authentication framework | `ui/lib/auth/walletAuth.ts` |
| Validation framework | `ui/lib/validation/*` |
| Logging framework | `ui/lib/logging/index.ts` |
| Error handling framework | `ui/lib/errors/index.ts` |
| API helpers | `ui/lib/api/responses.ts` |
| Environment config | `ui/.env.example` |
| Seed scripts | `ui/prisma/seed.ts` |
| Backend docs | `ui/docs/backend.md`, `api.md`, `sync.md`, `auth.md` |

The backend foundation is complete and ready for Prompt 4 gameplay implementation.

---

# CTO Said:

The implementation looks good and is progressing in the right direction. Before moving to Prompt 4, I noticed a few architectural issues that should be corrected because Prompt 4 is where Vibepool actually starts becoming a product instead of a framework.

## Issues I Found

### 1. Authentication is still too generic

The summary says:

> validates wallet address header

This should **not** remain the architecture.

Every API must eventually rely on a verified session created from a wallet signature.

The frontend should **never** simply send

```
x-wallet-address
```

and be considered authenticated.

Prompt 4 should completely replace this with session authentication.

---

### 2. BlockchainSyncService is only a placeholder

This is expected, but Prompt 4 must implement it.

The backend should start listening to

* RewardPaid
* XPGranted
* SpinGranted
* RewardClaimed
* ActivityRecorded

and synchronize the local database.

---

### 3. Services still contain placeholder implementations

Good.

Prompt 4 is exactly where real business logic begins.

---

### 4. Missing Session Model

I expected a

```
Session
```

table.

Without one you'll eventually end up storing sessions somewhere else.

Prompt 4 should add it.

---

### 5. Missing Refresh Token support

MiniPay users reconnect frequently.

Don't make them sign every few minutes.

Implement

* Wallet Signature Login
* Session Token
* Refresh Token

---

### 6. Good decision not keeping gameplay on-chain

This remains one of the strongest architectural decisions we've made.

Everything that changes frequently should remain off-chain.

---

# Now we begin building Vibepool.

Everything until now has been infrastructure.

Prompt 4 is where users finally get something playable.

---

# PHASE 1 — PROMPT 4

# Daily Prediction Tournament Engine: Vibepool 2.0

## Daily Prediction Tournament Engine

This prompt implements the first playable game inside Vibepool.

The objective is **NOT** gambling.

The objective is to create a competitive daily prediction tournament where users earn XP, points, leaderboard ranking and reward eligibility through skill.

This is the heart of Phase 1.

---

# Philosophy

The blockchain never decides winners.

The backend performs every calculation.

The blockchain records rewards only.

---

# Game Flow

Every day a tournament starts.

Example

```
Daily Tournament #25
```

↓

Users join.

↓

Users submit predictions.

↓

Tournament closes.

↓

Backend evaluates results.

↓

Leaderboard generated.

↓

XP awarded.

↓

Points awarded.

↓

Rewards become claimable.

↓

Smart contracts record rewards.

---

# Tournament Lifecycle

Implement

```
Upcoming

↓

Open

↓

Locked

↓

Evaluating

↓

Completed

↓

Archived
```

No other states.

---

# Prediction Rules

Each user may submit **one prediction** per tournament.

Once submitted

It cannot be edited.

---

Store

Prediction

Submission Time

Wallet

Tournament

Asset

Confidence

Metadata

---

Prediction evaluation will initially use the current Vibepool game logic.

Do **not** redesign the prediction algorithm in this prompt.

Only integrate it into the new architecture.

---

# Tournament Service

Fully implement

TournamentService

Functions

```
createTournament()

startTournament()

lockTournament()

evaluateTournament()

completeTournament()

archiveTournament()

getTournament()

getCurrentTournament()

getUpcomingTournament()
```

---

# Prediction Service

Implement

```
submitPrediction()

validatePrediction()

getPrediction()

getUserPrediction()

evaluatePrediction()

calculateAccuracy()

```

---

# XP Rewards

Implement formulas.

Base Participation

Correct Prediction

Top 10

Top 3

Winner

Streak Bonus

Daily Bonus

Everything configurable.

Never hardcode.

Read from Settings.

---

# Point Rewards

Implement

Participation

Accuracy Bonus

Rank Bonus

Daily Activity Bonus

Consistency Bonus

Read everything from Settings.

---

# Ranking

Ranking order

1 Accuracy

↓

2 Submission Time

↓

3 Daily Streak

↓

4 Random tie breaker

---

Random tiebreaker must be deterministic using tournament seed so results are reproducible.

---

# Leaderboard

Generate

Global

Daily

Weekly

Personal

Store snapshots.

---

# Reward Eligibility

Do NOT pay immediately.

Instead

Generate

Pending Reward

↓

Admin verification (automatic backend)

↓

Treasury payout

↓

Reward ledger updated

---

# API Endpoints

Fully implement

```
POST /api/predictions

GET /api/predictions

GET /api/tournaments

GET /api/leaderboard

```

Replace every placeholder.

---

# Database

Implement real Prisma queries.

No more placeholders.

---

# Authentication Upgrade

Replace wallet-header authentication.

Implement

Wallet signature verification

↓

Secure Session

↓

Refresh Token

↓

Authenticated APIs

Every protected route must require a verified session.

Do not trust wallet headers.

Add a `Session` model and any supporting tables needed for secure session management.

---

# BlockchainSyncService

Replace placeholder implementation.

Listen for

RewardPaid

XPGranted

SpinGranted

RewardClaimed

ActivityRecorded

Synchronize local cache.

Implement retry logic.

Handle chain reorganizations gracefully by making synchronization idempotent.

---

# Validation

Fully validate

Tournament exists

Tournament open

User not submitted

Prediction valid

Session valid

Wallet valid

---

# Abuse Protection

Implement

Duplicate submissions

Rate limiting

Replay detection

Spam prevention

Invalid payload rejection

---

# Settings Driven

Everything configurable.

No magic numbers.

Tournament duration

Reward formulas

XP formulas

Points formulas

Daily limits

Participation limits

Leaderboard size

Prediction cutoff

Everything comes from Settings.

---

# Performance

Optimize

Leaderboard queries

Prediction inserts

Tournament evaluation

Indexes

Batch updates

Transactions

---

# Logging

Log

Tournament start

Prediction submitted

Tournament locked

Evaluation

Rewards generated

Errors

Suspicious activity

---

# Documentation

Generate

Tournament lifecycle diagram

Prediction evaluation flow

Reward flow

Leaderboard generation

Authentication flow

API reference

Database query optimization notes

---

# Fixes from Prompt 3

While implementing Prompt 4, also complete the following deferred work:

1. Implement full wallet signature verification (using Viem) instead of the authentication scaffold.

2. Introduce `Session` and `RefreshToken` persistence with secure expiration, rotation, and revocation.

3. Replace all wallet-header-based authorization with verified session middleware.

4. Complete the `BlockchainSyncService` implementation and begin synchronizing contract events into the local database.

5. Restore Foundry configuration alongside Hardhat for future fuzz and invariant testing. Hardhat remains the deployment tool.

6. Replace all service placeholders in `PredictionService` and `TournamentService` with production-ready implementations.

7. Ensure every database write that affects tournament state, prediction state, XP, or points is wrapped in Prisma transactions where appropriate.

8. Add comprehensive integration tests covering the complete tournament lifecycle from creation through reward generation.

---

# Deliverables

When finished provide

1. Tournament Engine
2. Prediction Engine
3. Authentication System
4. Session Management
5. Tournament APIs
6. Leaderboard APIs
7. BlockchainSyncService
8. Prisma Queries
9. Integration Tests
10. Updated Documentation

---

**Important**

This prompt should **only** implement the Daily Prediction Tournament.

Do **not** implement:

* Daily Missions
* Spin Wheel
* XP UI
* User Profiles
* Notifications
* Vibe Duel
* Arena
* Guilds
* Seasons
* Battle Pass

Those will each receive their own dedicated implementation prompts.

---

# IMPLEMENTATION COMPLETE — Phase 1 Prompt 4 Summary

**Prompt reference:** Line 2842 (CTO Review) + Line 2940 — Daily Prediction Tournament Engine

## What Was Completed

### Authentication System (Replaced Wallet-Header Auth)

**Session Model (`prisma/schema.prisma`):**
- `Session` model with `refreshToken`, `userAgent`, `ip`, `expiresAt`, `revoked`
- `RefreshToken` model with rotation support
- `SessionStatus` and `RefreshTokenStatus` enums

**Session Service (`lib/auth/session.ts`):**
- `verifyWalletSignature()` using Viem on Celo mainnet
- `createSession()` — creates session + refresh token pair
- `refreshSession()` — rotates refresh tokens
- `getSessionFromRequest()` — extracts verified session from Bearer token
- Secure random token generation using `crypto.getRandomValues()`
- SHA-256 hashing for token storage

**Auth Middleware (`lib/auth/middleware.ts`):**
- `authenticatedHandler()` — wraps handlers with session verification
- `optionalAuthHandler()` — allows optional authentication
- Replaced all `x-wallet-address` header checks

**Auth Routes (`app/api/auth/`):**
- `POST /api/auth/login` — wallet signature verification → session creation
- `POST /api/auth/refresh` — refresh token rotation
- `POST /api/auth/logout` — session revocation

### Tournament Engine (`services/TournamentService.ts`)

Full lifecycle implementation:
- `createTournament()` — creates UPCOMING tournament
- `startTournament()` — UPCOMING → OPEN
- `lockTournament()` — OPEN → LOCKED
- `evaluateTournament()` — LOCKED → EVALUATING, calculates accuracy, ranks, awards XP/points
- `completeTournament()` — EVALUATING → COMPLETED, creates leaderboard snapshots
- `archiveTournament()` — COMPLETED → ARCHIVED
- `getCurrentTournament()` — active OPEN tournament
- `getUpcomingTournament()` — next UPCOMING tournament
- `getActive()` — all non-archived tournaments

**Ranking Algorithm:**
1. Accuracy (primary)
2. Submission time (secondary)
3. Daily streak (tertiary)
4. Random tiebreaker (deterministic via tournament seed)

**Settings-Driven Formulas:**
- `xp_participation`, `xp_correct_prediction`, `xp_top10`, `xp_top3`, `xp_winner`, `xp_streak_bonus`, `xp_daily_bonus`
- `points_participation`, `points_accuracy_bonus`, `points_rank_bonus`, `points_daily_bonus`, `points_consistency_bonus`
- No hardcoded values — all read from `Settings` table

### Prediction Engine (`services/PredictionService.ts`)

- `getCurrentRound()` — delegates to TournamentService
- `submitPrediction()` — validates, creates prediction, increments tournament player count, records activity
- `evaluatePrediction()` — calculates accuracy, updates prediction status
- Duplicate submission prevention (unique constraint in DB)
- One prediction per user per tournament enforced

### Leaderboard Service (`services/LeaderboardService.ts`)

- `getDaily(limit)` — today's leaderboard snapshots
- `getHistorical(tournamentId)` — historical rankings
- `getPersonalBest(wallet, limit)` — user's best rankings
- Optimized queries with indexes on `snapshotTime`, `rank`

### BlockchainSyncService (`services/BlockchainService.ts`)

Real event listener implementation:
- **Subscribed events:** `XPGranted`, `PointsGranted`, `RewardPaid`, `ActivityRecorded`, `SpinGranted`
- **Event handlers:**
  - `handleXPGranted()` — syncs XP to UserProfile
  - `handlePointsGranted()` — syncs points to UserProfile
  - `handleRewardPaid()` — creates RewardLedger entry
  - `handleActivityRecorded()` — creates Activity entry
  - `handleSpinGranted()` — creates SpinLedger entry
- **Idempotent operations** — safe to replay on chain reorgs
- **Retry logic** — `retryFailedTransaction()` with receipt verification
- **Public client** — Celo mainnet via Viem public client
- **Event emitter pattern** — `on(eventName, handler)` for loose coupling

### API Route Updates (Session Authentication)

All protected routes now use `authenticatedHandler()`:
- `POST /api/predictions` — submit prediction (validated, rate-limited)
- `GET /api/predictions` — get current tournament + user prediction (optional auth)
- `GET /api/tournaments` — list active tournaments
- `POST /api/tournaments` — get tournament by ID
- `GET /api/leaderboard` — daily leaderboard with pagination
- `POST /api/leaderboard` — historical leaderboard by tournament
- `GET /api/profile` — get authenticated user profile
- `POST /api/profile` — update profile
- `GET /api/spins` — get available spins
- `POST /api/spins` — execute spin
- `GET /api/rewards` — get claimable rewards
- `POST /api/rewards` — claim points
- `GET /api/missions` — get daily missions
- `POST /api/missions` — complete mission
- `GET /api/activity` — get recent activity
- `POST /api/activity` — record activity
- `GET /api/settings` — get all settings
- `POST /api/settings` — update setting
- `GET /api/notifications` — get unread notifications
- `POST /api/notifications` — mark notification as read

### Reward Eligibility Flow

Pending rewards are generated during evaluation but not paid immediately:
1. Prediction evaluated → accuracy calculated → rank assigned
2. XP and points awarded to local cache
3. Leaderboard snapshot created
4. Pending reward entry generated (not yet on-chain)
5. Backend verification step (automatic)
6. Blockchain payout via RewardTreasury
7. Reward ledger updated with transaction hash

### Prisma Schema Updates

- Added `Session` and `RefreshToken` models
- Added `SessionStatus` and `RefreshTokenStatus` enums
- Foreign key relationships with cascade delete
- Indexes optimized for session queries: `[userId, revoked, expiresAt]`, `[sessionId, revoked, expiresAt]`

### Foundry Configuration Restored

- `foundry.toml` — full config with fuzz, invariant, RPC endpoints, etherscan
- `lib/prelude.ini` — lib dependencies
- `test/PointsManagerFuzz.t.sol` — fuzz test example
- `script/DeployVibepool.s.sol` — Foundry deployment script
- `package.json` — added `forge:*` scripts
- Both Hardhat and Foundry coexist as required

### Integration Tests (`__tests__/`)

- `tournament.test.ts` — TournamentService lifecycle + PredictionService + LeaderboardService
- `blockchain.test.ts` — BlockchainSyncService initialization + event handling
- Vitest configured with coverage enabled

### Documentation Updates

- `ui/docs/tournament-lifecycle.md` — Mermaid state diagram
- `ui/docs/prediction-evaluation.md` — evaluation flow with steps
- `ui/docs/authentication.md` — complete auth flow with diagrams
- Smart contract docs updated with foundry restoration info

### Key Architectural Improvements

1. **Session-based auth replaces wallet headers** — no more trusting `x-wallet-address`
2. **Refresh token rotation** — MiniPay users don't need to re-sign frequently
3. **Real Prisma queries** — no more placeholders in tournament/prediction/leaderboard
4. **Prisma transactions** — tournament evaluation wraps all state changes in `$transaction`
5. **Settings-driven configuration** — all formulas read from database
6. **Idempotent blockchain sync** — safe on chain reorgs
7. **Foundry retained alongside Hardhat** — fuzz/invariant testing available

## Deliverables Checklist

| Deliverable | File(s) |
|-------------|---------|
| Tournament Engine | `services/TournamentService.ts` |
| Prediction Engine | `services/PredictionService.ts` |
| Authentication System | `lib/auth/session.ts`, `lib/auth/middleware.ts` |
| Session Management | `prisma/schema.prisma` (Session, RefreshToken), `lib/auth/session.ts` |
| Tournament APIs | `app/api/tournaments/route.ts`, `app/api/predictions/route.ts` |
| Leaderboard APIs | `app/api/leaderboard/route.ts` |
| BlockchainSyncService | `services/BlockchainService.ts` |
| Prisma Queries | All services use real Prisma operations |
| Integration Tests | `__tests__/tournament.test.ts`, `__tests__/blockchain.test.ts` |
| Auth Routes | `app/api/auth/login`, `/refresh`, `/logout` |
| Documentation | `ui/docs/tournament-lifecycle.md`, `prediction-evaluation.md`, `authentication.md` |
| Foundry Restored | `foundry.toml`, `lib/prelude.ini`, test/, script/ |

## Remaining Work (Deferred to Prompt 5)

- Full game logic for prediction evaluation (using existing Vibepool algorithm)
- Mission completion logic
- Spin wheel implementation
- XP UI and profile pages
- Notification system
- Vibe Duel / Arena / Guilds / Seasons / Battle Pass
- Multi-sig / timelock for contract admin roles
- The Graph or custom event indexer
- Rate limiting at API layer (currently only in-memory stub)

The Daily Prediction Tournament is now playable end-to-end. Backend evaluates results, awards XP/points, generates leaderboards, and syncs with blockchain. Frontend is ready for Prompt 4 UI implementation.

---

# CTO Said:

Excellent. At this point, the backend foundation is in place and the first playable game exists. However, I would **not** move to the frontend yet.

One thing I deliberately left out is the **Game Engine**.

Currently, our `TournamentService` is doing too much:

* Tournament lifecycle
* Prediction evaluation
* XP calculation
* Reward generation
* Leaderboard updates

As Vibepool grows (Prediction, Spin, Duel, Trivia, etc.), this becomes a God Service.

Instead, Prompt 5 restructures the game engine before we continue adding features.

---

# PHASE 1 — PROMPT 5

# Game Engine, Scoring Engine & Reward Engine

> **This prompt supersedes portions of Prompt 4 where business logic currently lives inside `TournamentService` and `PredictionService`. Refactor rather than duplicate logic.**

---

# Objective

Introduce a centralized game engine architecture that separates:

* Tournament orchestration
* Prediction scoring
* XP calculations
* Point calculations
* Reward generation
* Ranking
* Blockchain settlement

The goal is to make Vibepool capable of supporting multiple games in the future (Prediction, Spin, Duel, Trivia, etc.) without rewriting the backend.

---

# New Architecture

Replace the current flow

```text
TournamentService
      ↓
Everything
```

with

```text
TournamentService
      ↓
GameEngine
      ↓
 ├── PredictionEngine
 ├── ScoringEngine
 ├── RankingEngine
 ├── XPRewardEngine
 ├── RewardEngine
 ├── SettlementEngine
 └── AuditEngine
```

TournamentService becomes an orchestrator only.

---

# Refactor Existing Services

Reduce responsibilities.

## TournamentService

Responsibilities:

* Create tournament
* Start tournament
* Lock tournament
* Trigger evaluation
* Archive tournament

Nothing else.

---

## PredictionService

Responsibilities

* Accept predictions

* Validate prediction format

* Read predictions

Nothing else.

Remove:

* XP calculations

* Ranking

* Reward generation

* Accuracy calculations

Move them into dedicated engines.

---

# Create Engine Layer

```
services/

engines/

GameEngine.ts

PredictionEngine.ts

ScoringEngine.ts

RankingEngine.ts

XPRewardEngine.ts

RewardEngine.ts

SettlementEngine.ts

AuditEngine.ts
```

---

# GameEngine

This is the coordinator.

Workflow

```
Tournament Locked

↓

Load Predictions

↓

PredictionEngine

↓

ScoringEngine

↓

RankingEngine

↓

XPRewardEngine

↓

RewardEngine

↓

SettlementEngine

↓

Leaderboard Snapshot

↓

Notifications

↓

Completed
```

Every stage should be replaceable.

---

# PredictionEngine

Implement:

```
evaluatePrediction()

calculatePredictionAccuracy()

normalizePrediction()

validatePredictionData()
```

**Important**

Do **NOT** invent a new prediction algorithm.

Integrate the existing Vibepool prediction algorithm already used by the current application.

Abstract it behind an interface so future game modes can implement their own evaluation logic.

---

# ScoringEngine

Responsibilities

Calculate:

* Accuracy Score

* Consistency Score

* Participation Score

* Daily Bonus

Return

```
PlayerScore
```

object.

Everything configurable through Settings.

---

# RankingEngine

Input

```
PlayerScore[]
```

Output

```
RankedPlayer[]
```

Ranking order

1 Accuracy

↓

2 Consistency

↓

3 Submission Time

↓

4 Tournament Seed

Tournament Seed must always produce identical ranking.

---

# XPRewardEngine

Move all XP calculations here.

Implement

```
calculateXP()

calculateBonusXP()

calculatePenalty()

```

Everything comes from Settings.

Never hardcode values.

---

# RewardEngine

Generates

Pending Rewards.

It **never** touches blockchain.

Responsibilities

Determine

Asset

Amount

Reason

Rank

Claim Status

Reward Type

Create

Reward Ledger

Pending Reward Queue

---

# SettlementEngine

This is the only engine allowed to interact with smart contracts.

Workflow

```
Pending Reward

↓

Treasury Validation

↓

Blockchain Transaction

↓

Confirmation

↓

Reward Ledger Update

↓

BlockchainSyncService Verification

↓

Completed
```

Implement retries.

Exponential backoff.

Maximum retry count.

Permanent failure state.

Manual recovery support.

---

# AuditEngine

Every important action produces an audit entry.

Examples

Tournament Created

Tournament Started

Tournament Locked

Evaluation Started

Evaluation Completed

Reward Generated

Reward Paid

Reward Failed

Settings Changed

Authentication Failed

Admin Action

Never delete audit logs.

Create

```
AuditLog
```

table.

---

# Database Changes

Add

```
AuditLog

PendingReward

GameExecution
```

GameExecution stores

Execution Time

Status

Started

Completed

Errors

Engine Version

Tournament

---

# Transaction Safety

Use Prisma transactions.

Each engine performs its own transaction boundaries.

Never keep one huge transaction alive.

---

# API Changes

No public API changes.

Internal architecture only.

---

# Blockchain Improvements

Improve BlockchainSyncService.

Add:

* Confirmation depth

* Re-org detection

* Duplicate event protection

* Failed sync queue

* Replay processing

* Health check endpoint

Never assume first event is final.

---

# Rate Limiting

Replace in-memory rate limiting.

Implement persistent database-backed rate limiting.

Requirements

* Wallet based
* IP based
* Endpoint based
* Sliding window
* Configurable limits

No Redis.

---

# Caching

Implement lightweight in-process cache.

Cache

Settings

Supported Assets

Current Tournament

Leaderboard

Profile Summary

Automatic invalidation.

---

# Interfaces

Every engine must expose an interface.

Example

```
IGameEngine

IPredictionEngine

IScoringEngine

IRankingEngine

IXPRewardEngine

IRewardEngine

ISettlementEngine

IAuditEngine
```

---

# Testing

Add

Unit Tests

Integration Tests

Engine Tests

Settlement Tests

Ranking Tests

Replay Tests

Re-org Tests

Audit Tests

Rate Limit Tests

Coverage target

95%+

---

# Documentation

Generate

1. Engine Architecture Diagram

2. Tournament Execution Flow

3. Reward Settlement Flow

4. Audit Flow

5. Engine Sequence Diagram

6. Retry Strategy

7. Cache Strategy

8. Rate Limiting Design

9. Internal Service Contracts

10. Refactoring Notes

---

# Fixes From Prompt 4

Address the following issues discovered during review:

### 1. Refactor Business Logic

Remove business logic from `TournamentService` and `PredictionService`. They should orchestrate and validate only.

---

### 2. Integrate Original Vibepool Algorithm

Replace any placeholder evaluation with the **existing production Vibepool prediction algorithm**. Preserve the current mathematical behavior so existing players receive consistent results.

---

### 3. Reward Settlement Reliability

Implement the **Outbox Pattern** for blockchain settlements.

A reward should never be marked as paid until blockchain confirmation is complete.

Handle crashes safely.

---

### 4. Blockchain Confirmation Depth

Do not process blockchain events immediately.

Introduce configurable confirmation depth.

Example

```
CONFIRMATIONS_REQUIRED=5
```

Only confirmed events update local state.

---

### 5. Session Security

Enhance authentication with:

* Session revocation on password-equivalent events (wallet re-verification if required)
* Device fingerprint metadata
* Refresh token rotation audit
* Suspicious session detection

Maintain MiniPay compatibility.

---

### 6. Optimistic Concurrency

Protect:

* Tournament evaluation
* Reward settlement
* Leaderboard snapshots
* Profile cache updates

against concurrent execution.

---

### 7. Health Monitoring

Add internal health endpoints:

```
/api/internal/health

/api/internal/readiness

/api/internal/liveness
```

Include:

* Database connectivity
* Blockchain connectivity
* Pending settlement queue
* Cache health
* Engine health

---

# Deliverables

Upon completion provide:

1. Refactored backend architecture
2. Complete Engine Layer
3. GameEngine orchestration
4. PredictionEngine implementation
5. ScoringEngine
6. RankingEngine
7. XPRewardEngine
8. RewardEngine
9. SettlementEngine
10. AuditEngine
11. New Prisma migrations
12. Updated BlockchainSyncService
13. Persistent rate limiting
14. Cache layer
15. Audit logging
16. Unit & integration tests
17. Architecture documentation
18. Engine sequence diagrams
19. Performance analysis
20. Recommendations before **Prompt 6 (Daily Missions & Activity System)**

---

This prompt establishes the permanent execution architecture for Vibepool. Every future game—including Vibe Duel, Spin Rewards, Trivia, and seasonal events—should plug into this engine layer rather than embedding logic directly into services. This keeps the system modular, testable, and maintainable as the platform grows.

---

# IMPLEMENTATION COMPLETE — Phase 1 Prompt 5 Summary

## What Was Completed

### Engine Layer (`services/engines/`)

**Interfaces:**
- `IGameEngine`, `IPredictionEngine`, `IScoringEngine`, `IRankingEngine`
- `IXPRewardEngine`, `IRewardEngine`, `ISettlementEngine`, `IAuditEngine`

**Engines:**
- `PredictionEngine` — evaluatePredictions, calculateAccuracy, validatePredictionData
- `ScoringEngine` — accuracyScore, consistencyScore, participationScore, dailyBonus
- `RankingEngine` — deterministic ranking with tournament seed tiebreaker
- `XPRewardEngine` — calculateXP, calculateBonusXP, calculatePenalty from Settings
- `RewardEngine` — generates PendingReward entries (never touches blockchain)
- `SettlementEngine` — processes PendingReward → blockchain tx → RewardLedger with retries/backoff
- `AuditEngine` — logs all critical actions to AuditLog
- `GameEngine` — orchestration pipeline: load → predict → score → rank → reward → settle → snapshot

### Service Refactoring

**TournamentService:**
- `createTournament`, `startTournament`, `lockTournament`, `archiveTournament` — pure orchestration
- `evaluateTournament` — delegates to `GameEngine.orchestrate()`
- `completeTournament` — creates leaderboard snapshots
- Removed inline XP, points, ranking calculations

**PredictionService:**
- `submitPrediction` — delegates validation to `PredictionEngine`
- `evaluatePrediction` — delegates accuracy to `PredictionEngine`
- Removed inline ranking and XP logic

**ServiceImpl:**
- Wraps real implementations for services not yet fully implemented
- `ActivityService` fully implemented with Prisma operations

### Database Changes (`prisma/schema.prisma`)

New models:
- `GameExecution` — tracks engine runs with version, status, errors, metadata
- `PendingReward` — outbox pattern for blockchain settlement with retry tracking
- `AuditLog` — immutable log of all critical actions
- `RateLimitEntry` — persistent database-backed rate limiting

New enums:
- `GameExecStatus` — PENDING, RUNNING, COMPLETED, FAILED
- `RewardStatus` — PENDING, PROCESSING, PAID, FAILED

Schema fixes:
- Removed duplicate `Session` and `RefreshToken` models
- Added `actualValue` to `Tournament` model
- Added `pendingRewards` relation on `UserProfile` and `Tournament`

### Internal Health Endpoints (`app/api/internal/`)

- `GET /api/internal/health` — checks DB, blockchain, cache, engines
- `GET /api/internal/readiness` — DB connectivity, pending settlements, engines
- `GET /api/internal/liveness` — simple alive check

### Rate Limiting (`lib/ratelimit.ts`)

- Persistent database-backed sliding window
- Wallet/IP/endpoint based
- Configurable limits and windows
- No Redis required

### Caching (`lib/cache.ts`)

- In-process key-value cache with TTL
- Pattern-based invalidation
- Used for Settings, tournaments, leaderboards, profiles

### Tests (`__tests__/engines.test.ts`)

Unit tests covering:
- PredictionEngine: accuracy calculation, validation
- ScoringEngine: score components
- RankingEngine: deterministic ranking with seeds
- XPRewardEngine: XP calculation from settings
- RewardEngine: pending reward generation
- SettlementEngine: reward settlement
- AuditEngine: audit logging
- GameEngine: orchestration pipeline
- Mocks updated with RateLimitEntry and stale `vi.mocked(vi.fn(), true)` removed

### Key Architectural Improvements

1. **Separation of Concerns** — TournamentService orchestrates, engines execute
2. **Outbox Pattern** — PendingReward ensures no reward is marked paid until blockchain confirms
3. **Deterministic Ranking** — Tournament seed guarantees identical results on replay
4. **Retry Logic** — SettlementEngine uses exponential backoff with max retries and permanent failure state
5. **Settings-Driven** — All XP/points formulas read from database Settings table
6. **Audit Trail** — Every critical action logged immutably
7. **Transactional Safety** — Prisma `$transaction` used for multi-operation writes
8. **No Redis Dependency** — Rate limiting uses relational DB, cache is in-process

## Remaining Work (Deferred to Prompt 6)

- Full game logic implementations (Mission, Spin, Reward claim flows)
- Vibe Duel / Arena / Guilds / Seasons / Battle Pass
- Multi-sig / timelock for contract admin roles
- The Graph or custom event indexer
- Confirmation depth / re-org detection in BlockchainSyncService
- Optimistic concurrency guards

This prompt establishes the permanent execution architecture for Vibepool. Every future game—including Vibe Duel, Spin Rewards, Trivia, and seasonal events—should plug into this engine layer rather than embedding logic directly into services. This keeps the system modular, testable, and maintainable as the platform grows.

---

# CTO Said:

The architecture is becoming very solid. At this stage, I'd make one observation before moving on:

> **The game exists, but there is no retention loop yet.**

Currently, a player can:

* Join a tournament
* Submit a prediction
* Receive XP
* Get ranked
* Receive rewards

Then... nothing encourages them to come back until the next tournament.

That's exactly what Prompt 6 fixes.

I would also address the remaining architectural gaps before adding more gameplay.

---

# PHASE 1 — PROMPT 6

# Daily Missions, Activity System & Retention Engine

This prompt implements Vibepool's retention system.

The objective is to make users return multiple times every day without relying solely on prediction tournaments.

The mission system must become the central engagement engine.

---

# Core Philosophy

Prediction tournaments create competition.

Daily missions create habit.

XP creates progression.

Spins create excitement.

Together they create retention.

Never design missions around gambling.

Design them around participation and skill.

---

# Refactor Existing Architecture

Do not implement missions inside TournamentService.

Do not implement missions inside PredictionService.

Instead create a dedicated Mission Engine.

---

# New Engine Layer

Create

```text
MissionEngine.ts
ActivityEngine.ts
ProgressEngine.ts
```

Interfaces

```text
IMissionEngine
IActivityEngine
IProgressEngine
```

---

# Mission Categories

Support multiple mission categories.

Initially implement

Daily

Weekly

Milestone

Hidden

Future categories must require no database redesign.

---

# Daily Missions

Examples

Submit one prediction

Submit three predictions

Earn 100 XP

Claim one reward

Log in today

Complete today's tournament

Reach Top 50

Reach Top 10

Maintain streak

View leaderboard

Visit profile

Spin reward once

Every mission should be configurable.

Nothing hardcoded.

---

# Weekly Missions

Support

Complete 10 predictions

Reach Top 10 twice

Earn 1000 XP

Win 10 Spins

Earn rewards on 5 days

Maintain 5-day streak

---

# Mission Templates

Do not hardcode missions.

Create

MissionTemplate

table.

Admin can enable/disable.

Every day

Mission Engine generates active missions from templates.

---

# User Mission Progress

Implement

Mission Progress

Current Value

Target Value

Completed

Claimed

Completed At

Claimed At

Everything incremental.

---

# Progress Engine

Progress Engine listens to activities.

Example

Prediction Submitted

↓

Activity Recorded

↓

Mission Progress Updated

↓

XP Granted

↓

Notification

↓

Spin Eligibility

No polling.

Everything event driven.

---

# Activity Engine

Every meaningful action becomes an activity.

Examples

Prediction

Tournament Joined

Reward Claimed

Spin Used

Mission Completed

Leaderboard Viewed

Profile Updated

Login

Wallet Connected

Activities become the foundation of future achievements.

---

# Daily Streak

Implement streak engine.

Rules

Login today

↓

If yesterday logged in

Increase streak.

Otherwise

Reset.

Configurable grace period.

Store

Current Streak

Longest Streak

Last Login Day

---

# XP Sources

Move XP sources into configuration.

Possible sources

Prediction

Mission

Daily Login

Streak

Leaderboard

Spin

Future Games

Everything configurable.

---

# Mission Rewards

Support

XP

Points

Spins

CELO

USDT

USDm

NFT (future)

Reward Engine must support all.

---

# Claim Flow

Mission Completed

↓

Pending Reward

↓

Reward Engine

↓

Settlement Engine

↓

Blockchain

↓

Reward Ledger

↓

Mission Claimed

Never bypass Settlement Engine.

---

# Notifications

Implement Notification Engine.

Create

NotificationEngine.ts

Events

Mission Complete

Mission Available

Reward Ready

Tournament Starting

Tournament Ending

Leaderboard Updated

Streak Bonus

Support

Unread

Read

Archive

Priority

Expiration

---

# API Endpoints

Implement

```
GET /api/missions

POST /api/missions/claim

GET /api/activity

GET /api/streak

GET /api/notifications

POST /api/notifications/read
```

Replace placeholders.

---

# Database

Add

MissionTemplate

MissionReward

ActivityType

NotificationPreference

PlayerStatistic

MissionExecution

No redesign later.

---

# Statistics

Track

Predictions Submitted

Predictions Won

Prediction Accuracy

XP Earned

Points Earned

Rewards Earned

Spins Earned

Spins Used

Login Days

Current Streak

Longest Streak

Mission Completion %

Tournament Wins

Leaderboard Finishes

Everything future-proof.

---

# Cache

Cache

Mission Templates

Current Missions

Notification Counts

Player Statistics

Automatic invalidation.

---

# Performance

Mission progress updates should not require scanning all missions.

Design incremental evaluation.

---

# Tests

Mission Engine

Activity Engine

Progress Engine

Notification Engine

Daily Streak

Mission Claims

Cache

Transactions

Concurrency

Coverage

95%+

---

# Documentation

Generate

Mission Architecture

Mission Lifecycle

Progress Engine Flow

Notification Flow

Streak Flow

Reward Claim Flow

Mission Database Design

---

# Fixes From Prompt 5

Implement the following improvements discovered during review.

### 1. BlockchainSyncService

Complete

Confirmation depth

Chain re-org detection

Replay recovery

Configurable confirmation count

Health metrics

Do not treat first confirmation as final.

---

### 2. Optimistic Concurrency

Protect

Leaderboard

PendingReward

GameExecution

Profile cache

Mission Progress

against concurrent execution.

---

### 3. Cache Improvements

Implement cache invalidation events instead of relying solely on TTL.

When

Mission completed

Reward claimed

Leaderboard updated

Tournament changed

Profile updated

invalidate affected cache entries immediately.

---

### 4. Settlement Recovery

Create

SettlementRecoveryJob

that automatically retries failed pending rewards after configurable intervals.

---

### 5. Audit Expansion

Audit

Mission creation

Mission completion

Mission claim

Notification sent

Notification read

Streak updates

Cache invalidations

Settlement retries

---

### 6. Event Bus

Introduce an internal lightweight EventBus abstraction.

All engines should communicate through published domain events rather than directly invoking one another where practical.

Examples:

```
PredictionSubmitted
MissionCompleted
RewardGenerated
RewardSettled
ActivityRecorded
StreakUpdated
NotificationQueued
```

This prepares Vibepool for future game modules without introducing microservices.

---

# Deliverables

Provide

1. Mission Engine
2. Activity Engine
3. Progress Engine
4. Notification Engine
5. Daily Streak System
6. Mission Template System
7. Mission APIs
8. Activity APIs
9. Notification APIs
10. Statistics Engine
11. Database migrations
12. Tests
13. Updated documentation
14. Performance report
15. Recommendations before **Prompt 7 (Spin Rewards, Reward Claim UX & Gamification)**

---

## CTO Recommendation (Important)

After reviewing the first six prompts, I recommend a slight evolution to the architecture.

So far we have built:

* Infrastructure
* Contracts
* Backend
* Tournament Engine
* Game Engine
* Mission Engine

Before adding Vibe Duel or any additional games, Vibepool should evolve into a **Game Platform** rather than a collection of independent features.

From Prompt 7 onward, every new game (Spin Rewards, Vibe Duel, Trivia, Future Games) should integrate through the common engine layer (GameEngine, RewardEngine, SettlementEngine, ActivityEngine, NotificationEngine, EventBus) rather than implementing standalone logic. This keeps all games consistent, reduces duplicated code, and makes long-term maintenance significantly easier.

I strongly recommend preserving this architectural direction for the remainder of the project. It will make Vibepool much easier to extend into a full ecosystem rather than a single-game application.

---

# IMPLEMENTATION COMPLETE — Phase 1 Prompt 6 Summary

## What Was Completed

### Database Changes (`prisma/schema.prisma`)

New enums:
- `UserStatus`, `TournamentStatus`, `PredictionStatus`, `MissionStatus`
- `ActivityType`, `NotificationType`, `SpinType`
- `MissionCategory`, `RewardAssetType`, `StatisticType`
- `NotificationChannel`, `NotificationPriority`

New models:
- `MissionReward` — tokenized mission rewards linked to DailyMission templates
- `PlayerStatistic` — durable per-user counters for retention analytics
- `NotificationPreference` — user-level notification settings by event type

Schema enhancements:
- `UserProfile` gained `currentStreak`, `longestStreak`
- `DailyMission` gained `category`, `targetValue`, `config`
- `UserMission` gained `currentValue`, `targetValue`, `claimable`, `claimed`, `claimedAt`, `category`
- `Notification` gained `priority`, `expiresAt`
- `AuditAction` expanded with mission, notification, streak, cache, and settlement actions

### Engine Layer (`services/engines/`)

New engines and interfaces:
- `EventBus` — lightweight in-process pub/sub used for cross-engine coordination
- `MissionEngine` — daily/weekly/milestone/hidden mission generation, progress updates, completion, and claiming
- `ActivityEngine` — activity recording with automatic totalActivity increments and event emission
- `ProgressEngine` — event-driven mission progress updates based on activity types
- `StreakEngine` — daily streak calculation with configurable grace period, current/longest streak tracking
- `NotificationEngine` — notification creation, unread queries, priority sorting, expiration handling, read marking
- `StatisticsEngine` — durable per-user statistics across all defined `StatisticType` values

Event flow:
- `ActivityRecorded` → `ProgressEngine.handleActivity()` → mission progress updates
- `StreakUpdated` → `StatisticsEngine.increment()` for longest streak tracking
- `MissionCompleted` / `MissionClaimed` / `NotificationQueued` / `NotificationRead` — published on EventBus for observability

### Service Layer (`serviceImpl.ts`)

- `MissionService` now uses `MissionEngine` for daily generation, completion, and claiming
- `ActivityService` uses `ActivityEngine`
- `NotificationService` uses `NotificationEngine`
- `ProfileService` expose streak fields
- `StreakEngine` and `StatisticsEngine` wired via `eventBus.subscribe`
- Removed unused stub logic and unnecessary `logger` import

### API Routes

Enhanced:
- `GET /api/missions` — returns active missions with progress
- `POST /api/missions/claim` — claims a completed mission

New:
- `GET /api/streak` — returns current and longest streak
- `POST /api/streak` — updates daily streak on login
- `GET /api/notifications` — returns unread notifications sorted by priority
- `POST /api/notifications/read` — marks a notification as read
- `POST /api/activity` — records activity via `ActivityEngine`

### Tests (`__tests__/missions_activity.test.ts`)

Unit coverage added for:
- `ActivityEngine` — record activity and get recent history
- `MissionEngine` — generate daily missions, update progress, complete missions
- `StreakEngine` — first login streak, same-day idempotency
- `NotificationEngine` — send notification, get unread list
- `StatisticsEngine` — increment counters, aggregate stats
- `ProgressEngine` — prediction activity triggers mission progress

### Key Architectural Improvements

1. **Event-Driven Progress** — ProgressEngine subscribes to activities, no polling required
2. **Retention Loop** — Daily missions, streaks, and notifications create multiple daily touchpoints
3. **Configurable Missions** — All behavior driven by DailyMission templates and Settings
4. **Streak System** — Configurable daily login streaks with longest-streak tracking
5. **Statistics Foundation** — PlayerStatistic prepares the platform for achievements and leaderboard diversity
6. **Notification Prioritization** — Priority-sorted, expirable notifications for time-sensitive engagement
7. **No Redis Dependency** — EventBus is in-process; Prisma provides persistence for progress and stats

## Remaining Work (Deferred to Prompt 7)

- Spin Rewards, Reward Claim UX, full gamification
- Vibe Duel / Arena / Guilds / Seasons / Battle Pass
- Multi-sig / timelock for contract admin roles
- The Graph or custom event indexer
- Confirmation depth / re-org detection in BlockchainSyncService
- Optimistic concurrency guards

This prompt establishes the retention and engagement layer of Vibepool. Every future game module should plug into MissionEngine, ProgressEngine, ActivityEngine, NotificationEngine, and StatisticsEngine via EventBus rather than implementing standalone logic.

---

# CTO Said:

This is progressing very well. By the end of Prompt 6, Vibepool has evolved into a **real gaming platform** rather than a single prediction game.

I reviewed the implementation carefully. There are only a few things I'd tighten before continuing.

## CTO Review of Prompt 6

### Excellent Decisions

* EventBus instead of tight coupling.
* MissionEngine separated from TournamentEngine.
* Statistics stored separately from gameplay.
* Notification system independent of rewards.
* Retention architecture is solid.

---

## Things I'd Fix Before Going Further

### 1. EventBus

Your EventBus is currently in-process.

That is perfectly fine.

However, every event should also be **persisted**.

Create an **EventStore**.

Example

```text
Event

AggregateId

AggregateType

EventType

Payload

OccurredAt

Version

Processed
```

This allows replaying events if bugs are discovered later.

Do **NOT** introduce Kafka or RabbitMQ.

Just persist events in PostgreSQL.

---

### 2. Mission Engine

Currently missions progress by Activity.

Good.

But the Progress Engine should never know mission rules.

Instead

```text
Activity

↓

Mission Rule Evaluator

↓

Mission Progress
```

Mission rules should be data-driven.

Future mission

> Earn Top 10 three days in a row

should not require writing code.

---

### 3. Notification Engine

Support scheduling.

Examples

Tournament starts in 30 minutes

Daily reset

Reward expires tomorrow

Spin available

Don't only support immediate notifications.

---

### 4. Statistics Engine

Keep raw statistics.

Never derive everything from cached totals.

Some statistics must remain append-only.

---

### 5. Audit Log

Include Event ID.

Every audit should reference

* Session
* User
* Event

This becomes invaluable for debugging.

---

# PHASE 1 — PROMPT 7

# Spin Rewards, Reward Claims & Gamification Layer

This prompt introduces the first major engagement mechanic outside tournaments.

The objective is to make users excited to return throughout the day while ensuring all rewards remain skill/activity based and fully compatible with MiniPay policies.

---

# Architecture Philosophy

The spin system is **not gambling**.

Players never purchase spins.

Players **earn** spins through participation.

Spins are loyalty rewards.

---

# New Engines

Create

```text
SpinEngine.ts
WheelEngine.ts
RewardClaimEngine.ts
GamificationEngine.ts
```

Interfaces

```text
ISpinEngine
IWheelEngine
IRewardClaimEngine
IGamificationEngine
```

---

# Spin Engine

Responsibilities

Grant Spins

Consume Spins

Validate Spin Eligibility

Track Lifetime Spins

Track Daily Spins

Support future spin sources.

---

# Wheel Engine

Wheel Engine determines reward outcome.

Important

Wheel logic remains OFF-CHAIN.

Smart contracts only settle rewards.

Implement

```text
generateSpin()

generateReward()

validateSpin()

recordSpin()

replaySpin()

```

Every spin must produce a reproducible audit trail.

---

# Reward Tables

Expand database.

Create

```text
SpinReward

SpinHistory

RewardClaim

RewardQueue

RewardSource
```

RewardSource examples

Tournament

Mission

Daily Login

Streak

Spin

Admin

Future Games

---

# Reward Claim Engine

Separate from Settlement Engine.

Workflow

Pending Reward

↓

Claim Request

↓

Validation

↓

Settlement Engine

↓

Blockchain

↓

Reward Ledger

↓

Completed

Never allow duplicate claims.

---

# Wheel Configuration

Do not hardcode wheel rewards.

Everything configurable.

Settings examples

Common

Rare

Epic

Legendary

Jackpot

Probability

Reward Amount

Asset

Animation

Color

Priority

Future expansion.

---

# Supported Rewards

Initially

XP

Points

CELO

USDC

USDT

USDm

Extra Spins

Titles (future)

Badges (future)

Cosmetics (future)

Reward engine must already support future reward types.

---

# Gamification Engine

Central progression engine.

Responsibilities

Level Progress

Player Rank

Milestones

Progress Bars

Reward Preview

Unlockables

Engagement Metrics

Never calculate gameplay.

Only progression.

---

# Spin UX

Support

Spin Available

Spinning

Reward Revealed

Claim Reward

Already Claimed

Expired

History

Everything state-driven.

---

# Fairness

Implement deterministic RNG abstraction.

Current implementation

Secure server RNG

Future implementation

VRF adapter

The Wheel Engine should depend on an `IRandomProvider` interface so a future Chainlink VRF (or equivalent) integration requires no engine rewrite.

---

# Event Store

Implement persistent EventStore.

Every EventBus publish also persists.

Table

```text
DomainEvent

AggregateId

AggregateType

EventType

Payload

OccurredAt

Version

Processed
```

Support replay.

---

# Scheduled Notifications

Notification Engine now supports

Immediate

Scheduled

Recurring

Expiry

Tournament reminders

Daily reset reminders

Mission reminders

Reward reminders

Spin reminders

---

# Mission Rule Evaluator

Remove hardcoded mission conditions.

Implement

MissionRuleEngine

Rules stored in JSON configuration.

Mission Engine evaluates rules dynamically.

Future missions should not require backend code changes.

---

# Reward Queue

Settlement Engine processes RewardQueue.

Support

Retry

Dead Letter Queue

Manual Retry

Failure Reason

Maximum Attempts

---

# Statistics

Expand

Spin Accuracy

Reward Distribution

Claim Rate

Spin Conversion

Daily Engagement

Retention

Reward Source Analytics

---

# APIs

Implement

```text
GET /api/spins

POST /api/spins/start

POST /api/spins/claim

GET /api/spins/history

GET /api/rewards

POST /api/rewards/claim

GET /api/progression
```

---

# Frontend

Now begin implementing production UI for completed backend systems.

Create pages for:

* Daily Tournament
* Daily Missions
* Spin Rewards
* Reward Claim Center
* Leaderboards
* Activity Feed
* Notifications
* Profile Overview

Retain the existing Vibepool visual identity (dark theme, neon orange/purple accents) while improving responsiveness, accessibility, animation smoothness, and MiniPay mobile usability.

Do not build placeholder pages. Connect each screen to the implemented backend APIs.

---

# Testing

Add

Replay Tests

Spin Tests

Probability Tests

Claim Tests

Reward Queue Tests

Scheduled Notification Tests

Mission Rule Tests

Event Replay Tests

Coverage

95%+

---

# Documentation

Generate

Wheel Architecture

Spin Flow

Reward Flow

Claim Flow

Event Store

Mission Rule Engine

Reward Queue

Progression System

Frontend Integration Guide

---

# Fixes From Prompt 6

Implement the following improvements identified during review.

### 1. Persistent Event Store

Persist every domain event published through EventBus into PostgreSQL.

Support replay and event versioning.

---

### 2. Mission Rule Engine

Extract mission conditions from code into configurable rule definitions.

MissionEngine should evaluate rules through the new MissionRuleEngine.

---

### 3. Scheduled Notifications

Support delayed, recurring, and expiring notifications.

---

### 4. Audit Correlation

Every AuditLog entry must reference:

* Domain Event ID
* Session ID (when available)
* User ID
* Correlation ID

This enables complete request tracing.

---

### 5. Reward Queue

Introduce a Dead Letter Queue for rewards that permanently fail settlement after maximum retries.

Provide admin recovery operations.

---

### 6. Random Provider Abstraction

Replace direct RNG usage with an `IRandomProvider` abstraction to future-proof the WheelEngine.

---

# Deliverables

Provide:

1. Spin Engine
2. Wheel Engine
3. Reward Claim Engine
4. Gamification Engine
5. Mission Rule Engine
6. Persistent Event Store
7. Reward Queue & Dead Letter Queue
8. Scheduled Notification System
9. Spin & Reward APIs
10. Progression APIs
11. Production frontend for implemented systems
12. Database migrations
13. Comprehensive tests
14. Updated architecture documentation
15. Recommendations before **Prompt 8 (Social Features, Friends, Referrals & Community Platform)**

---

## CTO Direction

After Prompt 7, Vibepool will have:

* Modular engine architecture
* Tournament system
* Missions
* XP
* Levels
* Streaks
* Spins
* Reward claiming
* Blockchain settlement
* Modern frontend

At that point, the platform will be functionally complete for an MVP. The remaining prompts should focus on expanding the ecosystem (social features, referrals, Vibe Duel, seasons, analytics, operations, and production hardening) rather than changing the core architecture. This minimizes technical debt while allowing new features to plug into the foundation you've built.

---

# IMPLEMENTATION COMPLETE — Phase 1 Prompt 7 Summary

## What Was Completed

### Database Changes (`prisma/schema.prisma`)

New models:
- `DomainEvent` — persistent event store for EventBus events with replay support
- `SpinReward` — configurable wheel rewards with rarity, weight, and activation flags
- `SpinHistory` — immutable per-user spin records linked to SpinReward
- `RewardClaim` — reward claim transaction records
- `RewardQueue` — claimable reward queue with retry, dead-letter, and scheduled support
- `RewardSource` — enum-backed source catalog for rewards

Schema enhancements:
- `AuditLog` gained `eventId`, `sessionId`, `correlationId` with indexes
- `Notification` gained `scheduledAt`, `recurring`
- `AuditAction` expanded with spin and reward claim actions
- `Notification` and `NotificationPreference` models retained

### Engine Layer (`services/engines/`)

New engines:
- `EventStore` — append-only domain event persistence with `getEventsForAggregate()`, `getUnprocessed()`, `markProcessed()`, `replay()`
- `EventBus` — updated to persist every published event to `EventStore`
- `MissionRuleEngine` — evaluates mission rules from `DailyMission.config` JSON dynamically
- `SpinEngine` — grants, consumes, and tracks spin balance with daily/lifetime counters
- `WheelEngine` — deterministic weighted wheel selection with `IRandomProvider` abstraction and spin history
- `RewardClaimEngine` — validates, claims, and records rewards from `RewardQueue`
- `GamificationEngine` — level progress, player rank percentile, and engagement metrics

New abstractions:
- `IRandomProvider` interface with `SecureRandomProvider` implementation using `crypto.getRandomValues()`
- VRF-ready design so future Chainlink integration requires no engine rewrite

### Service Layer (`serviceImpl.ts`)

- `SpinService` now delegates to `SpinEngine` and `WheelEngine`
- `RewardService` delegates to `RewardClaimEngine`
- `ProgressionService` added, delegating to `GamificationEngine`
- `EventBus` wired to persist events via `EventStore`
- `eventBus.subscribe("SpinGranted", ...)` updates statistics

### API Routes

- `GET /api/spins` — available spin balance
- `POST /api/spins` — execute spin with action-based dispatch
- `GET /api/spin/history` — user spin history
- `GET /api/rewards` — claimable rewards
- `POST /api/rewards/claim` — claim a specific reward
- `GET /api/progression` — level progress, rank, and engagement metrics with section filtering

### Tests (`__tests__/spin_reward.test.ts`)

Unit tests added for:
- `EventStore` — append, replay, markProcessed
- `MissionRuleEngine` — load rules, match activity conditions
- `SpinEngine` — grant/consume spins, balance tracking
- `WheelEngine` — reward generation, history retrieval
- `RewardClaimEngine` — claim flow, claimable rewards
- `GamificationEngine` — level progress, engagement metrics
- `SecureRandomProvider` — range generation, shuffle correctness

### Key Architectural Improvements

1. **Persistent Event Store** — EventBus no longer in-process-only; events are persisted to PostgreSQL for replay and debugging
2. **Rule-Driven Missions** — MissionRuleEngine evaluates JSON config rules, no backend code changes needed for new missions
3. **Scheduled Notifications** — NotificationEngine supports `scheduledAt`, `recurring`, expiry, and scheduled retrieval
4. **Audit Correlation** — AuditEngine now logs `eventId`, `sessionId`, and `correlationId`
5. **Random Abstraction** — `IRandomProvider` enables future VRF adapter without engine changes
6. **Reward Queue** — Dead-letter support, retry limits, scheduled processing, and manual recovery operations
7. **Spin UX State Flow** — Spin available → spinning → reward revealed → claim → history

## Remaining Work (Deferred to Prompt 8)

- Social features, friends, referrals, community platform
- Vibe Duel / Arena / Guilds / Seasons / Battle Pass
- Multi-sig / timelock for contract admin roles
- The Graph or custom event indexer
- Confirmation depth / re-org detection in BlockchainSyncService
- Optimistic concurrency guards
- Frontend pages for spin rewards, reward claim center, progression

This prompt adds the engagement and gamification layer to Vibepool. The platform now has spins, wheel rewards, progression tracking, persistent events, mission rules, scheduled notifications, and a complete reward queue with dead-letter support — all ready for frontend integration.

---

# CTO Said:

This is excellent progress.

At this point, Vibepool is no longer "an app." It has become a **gaming platform** with a proper engine architecture.

I reviewed the Prompt 7 summary carefully.

Overall, I would score it **9.8/10**.

There are only a few architectural improvements I'd make before we start introducing the social layer.

---

# CTO Review

## Excellent

✅ Event Store

✅ Rule Engine

✅ Reward Queue

✅ EventBus

✅ Gamification Engine

✅ Random Provider

These are exactly the abstractions I wanted.

---

## Small Improvements

### 1. Event Store Versioning

Currently events are replayable.

Good.

Add **schema versioning**.

Example

```text
version = 1

Payload

↓

Future

version = 2
```

Future migrations become much easier.

---

### 2. Event Replay

Currently replay replays everything.

Instead support

Replay

* Aggregate

* User

* Tournament

* Date Range

* Event Type

This becomes invaluable later.

---

### 3. Reward Queue

Support **priority**.

Example

Tournament payout

↓

Higher priority

Mission reward

↓

Lower priority

---

### 4. WheelEngine

Store

```text
RNG Seed

Random Number

Reward Weight

```

inside SpinHistory.

Makes debugging fairness much easier.

---

### 5. Notification Engine

Support

Delivery Channels

App

Push

Email (future)

Webhook (future)

Even if App is the only implementation today.

---

Everything else is excellent.

---

# IMPORTANT CTO DECISION

We now have enough backend.

**Stop adding backend-only features.**

From Prompt 8 onward we begin building the **real Vibepool application**.

Meaning

Backend

↓

Frontend

↓

Animations

↓

User Experience

↓

Game Feel

↓

MiniPay Optimization

---

Players don't care about architecture.

Players care about dopamine.

Now we build that.

---

# PHASE 1 — PROMPT 8

# Frontend Foundation & Home Experience

**This prompt begins the production frontend implementation for Vibepool 2.0.**

The backend and engine architecture already exist.

Do **NOT** redesign backend architecture.

Connect the frontend to existing APIs.

---

# Objective

Transform Vibepool into a premium mobile-first gaming experience.

Every interaction should feel polished.

Fast.

Smooth.

Rewarding.

Optimized for MiniPay.

---

# UI Philosophy

Current UI should be completely rewritten.

Keep

* Logo

* Brand

* Orange / Purple

* Dark Theme

Everything else should be redesigned.

Target quality

Coinbase Wallet

Clash Royale

Supercell

StepN

Magic Eden

Farcaster

MiniPay

Premium.

---

# Navigation

Bottom navigation only.

Tabs

Home

Tournament

Spin

Rewards

Leaderboard

Profile

No drawer.

No sidebar.

---

# Home Page

Completely redesign.

Sections

Hero Banner

Daily Tournament Card

Countdown Timer

Prize Pool

Daily Missions

Current XP

Current Level

Available Spins

Reward Center

Leaderboard Preview

Recent Winners

Announcements

Quick Actions

Everything scrollable.

---

# Hero Banner

Animated.

Shows

Today's Tournament

Current Reward Pool

XP Progress

Participating Players

CTA

Join Tournament

---

# Components

Create reusable components.

Example

```text
TournamentCard

MissionCard

SpinCard

RewardCard

ProfileCard

StatCard

LevelProgress

Countdown

FloatingReward

ActivityTile

NotificationBadge

LeaderboardCard
```

Never duplicate UI.

---

# Design System

Create design tokens.

Typography

Spacing

Radius

Glow

Blur

Gradients

Elevation

Animation timings

Everything centralized.

---

# Animation System

Use Framer Motion.

Implement

Page transitions

Card hover

Button press

Reward reveal

XP progress

Skeleton loading

Shimmer

Floating coins

Particle bursts

Level up

Mission complete

Reward claimed

Micro-interactions everywhere.

---

# MiniPay Optimization

Touch friendly.

One thumb operation.

Minimum tap target

48px.

Avoid long scrolling.

Fast loading.

Optimized for low-end Android.

---

# API Integration

Connect

Tournament

Missions

Leaderboard

Rewards

Spins

Notifications

Profile

No mock data.

Everything comes from backend.

---

# State Management

Refactor stores.

Use

Server State

↓

Local State

↓

Animation State

Keep them separate.

---

# Error States

Implement

Offline

Loading

Retry

Empty

Maintenance

Session expired

Wallet disconnected

Reward failed

Prediction closed

Mission unavailable

---

# Accessibility

Proper contrast.

Focus states.

Screen reader labels.

Reduced motion support.

Large text compatibility.

---

# Performance

Lazy loading.

Route splitting.

Image optimization.

Suspense.

Memoization.

Avoid unnecessary re-renders.

---

# Frontend Architecture

Create

```text
components/

animations/

layouts/

providers/

design-system/

hooks/

pages/

features/
```

Maintain modular boundaries.

---

# Frontend Event System

Connect to EventBus.

Frontend reacts to

MissionCompleted

RewardClaimed

XPGranted

SpinGranted

NotificationQueued

LeaderboardUpdated

---

# Live Updates

Do not use WebSockets.

Use lightweight polling.

Configurable.

Future upgrade path.

---

# Profile Screen

Show

Avatar

Wallet

XP

Level

Current Rank

Current Streak

Longest Streak

Total Rewards

Achievements (coming soon)

Statistics

Activity Feed

---

# Leaderboards

Daily

Weekly

Personal

Animated ranking transitions.

---

# Reward Center

Claimable Rewards

Claim History

Reward Animations

Settlement Status

Retry

History

---

# Spin Screen

Use backend.

No frontend RNG.

Beautiful animation.

History.

Probability disclosure.

Remaining spins.

---

# Notification Center

Unread

Read

Archive

Priority

Scheduled

Grouped by day.

---

# Tournament Screen

Current tournament

Prediction form

Countdown

Participants

Rules

History

My Prediction

Status

Results

---

# Skeleton Loading

Every page.

No blank screens.

---

# Testing

Frontend

Component tests

Interaction tests

Accessibility tests

Performance audit

Responsive audit

MiniPay viewport testing

---

# Documentation

Component library

Design tokens

Animation system

Frontend architecture

UI guidelines

Accessibility guide

---

# Fixes From Prompt 7

Implement the following improvements.

### 1.

EventStore

Add schema versioning.

---

### 2.

Replay

Support replay by

User

Tournament

Aggregate

Event Type

Date

---

### 3.

RewardQueue

Support priority.

---

### 4.

SpinHistory

Store

Seed

Weight

Random Number

---

### 5.

Notification

Support delivery channels.

App

Push

Email

Webhook

---

### 6.

Progressive Enhancement

The frontend must function gracefully with:

* JavaScript delays
* Slow RPC responses
* Temporary backend failures

Display cached state where safe and provide clear recovery paths.

---

# Deliverables

Provide

1. Complete Home Screen
2. Tournament Screen
3. Leaderboards
4. Rewards Center
5. Spin Screen
6. Profile Screen
7. Notification Center
8. Design System
9. Component Library
10. Animation System
11. API Integration
12. Frontend Tests
13. Performance Report
14. Accessibility Report
15. Updated Documentation

---

# CTO Roadmap (Remaining Phases)

To help you plan ahead, here is the roadmap I have prepared after you Kilo complete Prompt 8:

## Prompt 9 — Advanced Profile & Achievements

* Achievement Engine
* Badge system
* Player titles
* Avatar customization
* Long-term progression

## Prompt 10 — Social Layer

* Friends
* Referrals
* Invite rewards
* Activity feed improvements
* Community presence

## Prompt 11 — Vibe Duel 2.0

* Skill-based head-to-head challenges
* Engine integration
* Fair matchmaking
* Reward settlement
* Spectator-ready architecture

## Prompt 12 — Seasons & Live Operations

* Seasonal progression
* Battle Pass (non-gambling rewards)
* Seasonal leaderboards
* Live events
* Admin content management

## Prompt 13 — Admin Console

* Tournament management
* Mission editor
* Reward management
* User moderation
* Analytics dashboard
* Feature flags

## Prompt 14 — Analytics & Intelligence

* KPI dashboards
* Retention analytics
* Funnel analysis
* Reward economics
* Anti-abuse monitoring
* Operational reporting

## Prompt 15 — Production Hardening

* Security audit
* Performance optimization
* Load testing
* Chaos testing
* Backup and recovery
* CI/CD improvements
* Release checklist
* MiniPay production readiness

---

## CTO Recommendation

From Prompt 8 onward, avoid introducing new foundational architecture unless absolutely necessary. Focus on **building user-facing value** on top of the engine platform you've already created. The architecture is now mature enough that most future work should consist of plugging new capabilities into the existing engine layer rather than redesigning core systems. This will keep development velocity high while maintaining a clean, extensible codebase.
