# Vibepool 2.0 — Backend Foundation

## Architecture

- Next.js Route Handlers as the API layer
- Prisma + PostgreSQL for persistence
- Viem for blockchain interactions
- Zod for request validation
- Centralized logging and error handling

## Service Layer

All services implement interfaces and throw stubs until Prompt 4.

- PredictionService
- MissionService
- TournamentService
- RewardService
- ActivityService
- SpinService
- LeaderboardService
- NotificationService
- ProfileService
- SettingsService
- BlockchainSyncService

## Authentication

Wallet signature verification scaffold in place. Full viem verifyMessage integration deferred to Prompt 4.

## Validation

Zod schemas validate all incoming requests. Prisma is never exposed directly to the API layer.

## Logging

Development: pretty console logs. Production: structured JSON logs.

## Error Handling

Centralized AppError hierarchy: ValidationError, AuthenticationError, BlockchainError, DatabaseError.

## Database

Prisma schema defines all entities with UUID primary keys, indexes, unique constraints, and cascade rules.

## Synchronization

BlockchainSyncService listens to contract events and updates local caches. Blockchain remains the source of truth.
