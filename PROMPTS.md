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

