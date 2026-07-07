# Module Dependency Map

```
Home
  ├── PredictionStore → GET /api/prediction
  ├── SpinStore → GET /api/spin
  ├── MissionStore → GET /api/missions
  ├── RewardStore → GET /api/reward
  ├── LeaderboardStore → GET /api/leaderboard
  ├── ProfileStore → GET /api/profile
  └── WalletStore → POST /api/wallet

Prediction
  ├── PredictionStore
  ├── PredictionService → PredictionManager contract
  └── API: /api/prediction

Spin
  ├── SpinStore
  ├── SpinService → SpinRewardManager contract
  └── API: /api/spin

Leaderboard
  ├── LeaderboardStore
  ├── LeaderboardService → PointsManager contract
  └── API: /api/leaderboard

Missions
  ├── MissionStore
  ├── MissionService → RewardTreasury / PointsManager
  └── API: /api/missions

Profile
  ├── ProfileStore
  ├── ProfileService → API: /api/profile
  └── Wallet auth → /api/wallet

Rewards
  ├── RewardStore
  ├── RewardService → RewardTreasury contract
  └── API: /api/reward
```

Rules:
- No feature imports another feature's internal logic directly.
- Inter-feature communication happens through API routes or shared stores only.
