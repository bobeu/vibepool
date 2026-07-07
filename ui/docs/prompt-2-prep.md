# Recommended Preparation for Prompt 2

## Database
Run `npx prisma init` and create `prisma/schema.prisma` with entities:
- `UserProfile`
- `MissionProgress`
- `LeaderboardSnapshot`
- `ActivityLog`
- `SpinHistory`

Define relations, unique constraints, and indexes before implementing services.

## Smart Contracts
1. Implement full logic in `PredictionManager`, `RewardTreasury`, `PointsManager`, `SpinRewardManager`.
2. Write tests in `smartContracts/test/`.
3. Deploy to Celo mainnet or testnet.
4. Run `node scripts/sync-data.js` from `smartContracts/` to sync ABIs and addresses to `ui/lib/contracts/`.

## Frontend Features
1. Replace `FeaturePlaceholder` pages with actual feature UI.
2. Implement prediction submission flow with wagmi/viem.
3. Implement spin wheel interaction and claim flow.
4. Implement mission completion tracking.
5. Implement leaderboard with sorting/filtering.
6. Implement profile editing (username, avatar).
7. Connect wallet auth flow using `validateWalletAuth`.

## API Implementation
1. Replace `notImplemented` stubs with real handlers.
2. Connect route handlers to service layer.
3. Add database queries via Prisma.
4. Add JWT or session-based authentication if needed.

## Testing
1. Add Vitest or Jest for React components.
2. Add contract tests via Hardhat.
3. Add integration tests for API routes.

## Monitoring
1. Add error tracking (Sentry or similar).
2. Add analytics for feature usage.
3. Monitor contract event ingestion latency.

## Deployment
1. Configure Vercel / Railway / Render environment variables.
2. Set up database migrations.
3. Configure Celery / cron for daily round resets if needed.
4. Set up contract verification on Celoscan.
