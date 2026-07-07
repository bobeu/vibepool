# Vibepool 2.0

Skill-based competitive Web3 gaming on Celo. Built for MiniPay and daily mobile play.

## Tech Stack

- **Frontend (ui/):** Next.js 15, TypeScript, TailwindCSS, Framer Motion, Zustand, RainbowKit, Wagmi, Viem
- **Backend (ui/):** Next.js Route Handlers, Prisma, PostgreSQL
- **Contracts:** Solidity, Hardhat, OpenZeppelin

## Getting Started

1. Install dependencies:
   ```bash
   cd ui
   npm install
   # or
   bun install
   ```

2. Copy `.env.example` to `.env.local` inside `ui/` and fill in values.

3. Run database migrations (Prompt 2):
   ```bash
   cd ui
   npm run db:generate
   npm run db:push
   ```

4. Start dev server:
   ```bash
   cd ui
   npm run dev
   ```

5. Open http://localhost:3001

## Project Structure

```
vibepool/
  smartContracts/ — Solidity contracts, Hardhat config, tests, deployments
  ui/             — Next.js application, API routes, components, styles
    app/          — App Router pages and route handlers
    components/   — Shared UI components
    features/     — Feature modules (home, prediction, spin, leaderboard, missions, rewards, profile, wallet)
    store/        — Zustand stores
    services/     — Business logic layer
    lib/          — Utilities, config, contract registry
    hooks/        — Shared React hooks
    types/        — TypeScript types
    utils/        — Helper functions
    config/       — Constants and configuration
    styles/       — Global CSS
    prisma/       — Database ORM schema
    public/       — Static assets
    scripts/      — Build and sync scripts
    docs/         — Architecture documentation
```

## Scripts

Run these from inside `ui/` unless noted otherwise.

- `npm run dev` — Start dev server on port 3001
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run typecheck` — TypeScript check
- `npm run lint` — ESLint
- `npm run db:generate` — Generate Prisma client
- `npm run db:push` — Push schema to DB
- `npm run db:migrate` — Run migrations
- `npm run db:studio` — Open Prisma Studio

From `smartContracts/`:
- `npm run compile` — Compile contracts
- `npm run test` — Run tests
- `npm run sync` — Sync contract ABIs and addresses to `ui/lib/contracts`

## Status

Phase 1 Prompt 1 — Architecture scaffold complete. Business logic, smart contract implementation, and full frontend features are deferred to Prompt 2.

## License

MIT
