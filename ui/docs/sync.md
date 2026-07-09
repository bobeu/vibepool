# Synchronization Flow

## Event-Driven Sync

1. BlockchainSyncService listens to contract events via Viem.
2. Events are parsed and normalized.
3. Local caches are updated:
   - Reward Ledger
   - Spin Ledger
   - Profile Cache
   - Activity
4. Frontend polls API for updated state.

## Rules

- Never trust frontend state.
- Blockchain remains source of truth.
- All sync operations are idempotent.
- Failed syncs are retried with backoff.
