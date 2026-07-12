# EventBus Cleanup — Prompt 17

## Connected (Prompt 17)

| Event | Action |
|-------|--------|
| `MissionCompleted` | In-app notification |
| `RewardClaimed` | Beta telemetry + notification |
| `SpinCompleted` | Beta telemetry (`first_spin`) |
| `RewardSettled` | Success notification (on/off-chain) |
| `RewardSettlementFailed` | Retry notification |

## Gated via productionConfig

| Event | Flag | Status |
|-------|------|--------|
| `PresenceChanged` | `enablePresenceFeedSideEffects` | Off at launch — documented no-op subscriber |

## Documented Orphans (intentional — no silent dead paths)

| Event | Producer | Recommendation |
|-------|----------|----------------|
| `MissionAvailable` | MissionEngine | Future push campaigns |
| `MissionClaimed` | MissionEngine | Covered by RewardClaimed flow |
| `FeedItemCreated` | FeedEngine | Feed is pull-based at beta |
| `ArenaMatchAccepted` | MatchEngine | Arena UI polls match state |
| `ArenaCountdown` | MatchEngine | Client-side countdown |
| `ArenaMatchDeclined` | MatchEngine | UI handles decline |
| `ArenaPredictionSubmitted` | MatchEngine | ResultEngine handles |
| `ArenaPresenceChanged` | ArenaEngine | Presence API direct |
| `ArenaMetricRecorded` | ArenaAnalytics | Admin metrics aggregation |
| `NotificationQueued` | NotificationEngine | Internal pipeline |
| `NotificationRead` | NotificationEngine | Client marks read |

## Audit Rule

Every published event is either **subscribed**, **gated**, or **documented** above.
