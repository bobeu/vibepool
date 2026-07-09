# Storage Layout

## RewardTreasury

| Slot | Variable | Type | Description |
|------|----------|------|-------------|
| 0 | assets (mapping) | mapping(address => AssetInfo) | Asset registry |
| 1 | supportedAssetList | address[] | Ordered list of supported assets |
| 2 | assetStats (mapping) | mapping(address => AssetStatistics) | Per-asset statistics |
| 3 | processedRequestIds (mapping) | mapping(bytes32 => bool) | Replay protection |
| 4 | treasuryStats | TreasuryStatistics | Global treasury stats |
| 5 | nativeAsset | address | Native asset address (immutable) |

### Packed Structs

`AssetInfo` is packed into a single storage slot:
- `assetAddress` (20 bytes)
- `symbol` (dynamic)
- `decimals` (1 byte)
- `enabled` (1 byte)

## PointsManager

| Slot | Variable | Type | Description |
|------|----------|------|-------------|
| 0 | profiles (mapping) | mapping(address => Profile) | Player profiles |
| 1 | processedRequestIds (mapping) | mapping(bytes32 => bool) | Replay protection |
| 2 | playerStats | PlayerStatistics | Aggregated stats |
| 3 | activityRegistry | address | Immutable reference |
| 4 | spinRewardManager | address | Immutable reference |

### Packed Structs

`Profile` uses `uint64` for timestamps to reduce slot usage:
- `xp`, `level`, `points`, `lifetimePoints`, `lifetimeXP`, `availableSpins`, `rewardClaims` (7 x 32 bytes)
- `currentStreak`, `longestStreak`, `lastActivity`, `registrationTime` (4 x 8 bytes, packed)

## ActivityRegistry

| Slot | Variable | Type | Description |
|------|----------|------|-------------|
| 0 | activityProfiles (mapping) | mapping(address => ActivityProfile) | Player activity profiles |
| 1 | processedRequestIds (mapping) | mapping(bytes32 => bool) | Replay protection |
| 2 | activityStats | ActivityStatistics | Aggregated stats |

## SpinRewardManager

| Slot | Variable | Type | Description |
|------|----------|------|-------------|
| 0 | spinProfiles (mapping) | mapping(address => SpinProfile) | Player spin profiles |
| 1 | processedRequestIds (mapping) | mapping(bytes32 => bool) | Replay protection |
| 2 | spinStats | SpinStatistics | Aggregated stats |
