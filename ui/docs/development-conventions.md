# Vibepool 2.0 — Development Conventions

## Folder Structure
- `app/` — Next.js App Router pages and route handlers.
- `components/` — Shared UI components.
- `features/` — Feature modules. Each feature owns its components, hooks, services, and types.
- `store/` — Zustand stores. One store per domain.
- `services/` — Business logic layer.
- `lib/` — Utilities, config, auth, contract registry.
- `hooks/` — Shared React hooks.
- `types/` — Shared TypeScript types.
- `utils/` — Helper functions.
- `config/` — Constants and configuration.
- `styles/` — Global CSS.
- `contracts/` — Solidity smart contracts (Foundry).
- `prisma/` — Database ORM schema.
- `public/` — Static assets.
- `scripts/` — Build and sync scripts.
- `docs/` — Architecture and design documentation.

## Naming
- Components: PascalCase files (`AppShell.tsx`, `HomeHub.tsx`)
- Hooks: camelCase with `use` prefix (`usePublicChainData.ts`)
- Stores: camelCase with `use` prefix + `Store` suffix (`usePredictionStore.ts`)
- Services: PascalCase classes (`PredictionService.ts`)
- Types: PascalCase interfaces/aliases (`UserProfile`, `PredictionRoundSummary`)

## State Management
- Zustand only.
- One store per domain.
- No global mega store.
- Selectors preferred over full-state subscriptions in components.

## Component Rules
- UI components must not contain business logic.
- Business logic belongs in services.
- Feature components must not import another feature's internal modules.

## API Rules
- Thin route handlers.
- Business logic delegated to services.
- Rate limiting applied via shared helper.
- Errors return consistent `ApiErrorResponse` shape.

## Smart Contract Rules
- Independent contracts by responsibility.
- Shared errors/events in `SharedErrors.sol` and `SharedEvents.sol`.
- ABI and addresses are synced to frontend via `scripts/sync-data.js`.
- Frontend never hardcodes contract addresses.

## Styling
- TailwindCSS utility-first.
- Dark theme default.
- Orange / purple neon accents.
- Glassmorphism and soft borders via CSS utilities.

## Performance
- Dynamic imports for heavy components.
- Memoize expensive computations.
- Minimize bundle size.
- Avoid continuous animations.
