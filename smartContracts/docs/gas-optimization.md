# Gas Optimization Notes

## Techniques Applied

1. **Packed Structs**
   - `ActivityProfile` uses `uint64` for timestamps to fit multiple values in fewer slots.
   - `SpinProfile` uses `uint64` for spin counters to reduce SSTORE costs.

2. **Unchecked Arithmetic**
   - Increments and decrements within safe boundaries use `unchecked {}` blocks.
   - Applied to streak updates, spin consumption, and statistics.

3. **Custom Errors**
   - All reverts use custom errors (`SharedErrors`) instead of string messages.
   - Reduces deployment cost and runtime gas.

4. **Immutable Variables**
   - `nativeAsset` in RewardTreasury
   - `activityRegistry` and `spinRewardManager` in PointsManager
   - Eliminates repeated SLOAD for configuration addresses.

5. **Event Indexing**
   - Frequently queried parameters are indexed (player, asset, requestId) to reduce off-chain indexing costs.

6. **Minimal Storage Writes**
   - Each function writes to storage only when necessary.
   - Read-only paths use `view` functions exclusively.

7. **Batch Operations**
   - `PointsManager.batchGrantXP` and `batchGrantPoints` amortize gas across multiple players.
   - Reduces per-player overhead by sharing loop infrastructure.

## Estimated Gas Targets

| Operation | Target |
|-----------|--------|
| grantXP | < 80,000 |
| grantPoints | < 75,000 |
| recordActivity | < 60,000 |
| grantSpin | < 70,000 |
| payout | < 90,000 |

## Known Tradeoffs

- `getSupportedAssets()` returns a dynamic array; alternatives like pagination were not implemented in Prompt 2 but can be added later.
- `processedRequestIds` uses a mapping without cleanup; request IDs remain in storage indefinitely to prevent replay.
