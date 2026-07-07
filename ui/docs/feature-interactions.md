# Feature Interaction Diagram

```mermaid
graph TD
    A[User connects wallet] --> B[VibepoolProvider]
    B --> C[usePublicChainData]
    C --> D[PredictionManager contract]
    D --> E[HomeHub]
    E --> F[Prediction]
    E --> G[Spin]
    E --> H[Leaderboard]
    E --> I[Rewards]
    E --> J[Profile]

    F --> K[PredictionStore]
    G --> L[SpinStore]
    H --> M[LeaderboardStore]
    I --> N[RewardStore]
    J --> O[ProfileStore]

    K --> P[POST /api/prediction]
    L --> Q[POST /api/spin]
    M --> R[GET /api/leaderboard]
    N --> S[POST /api/reward]
    O --> T[GET /api/profile]

    P --> U[PredictionService]
    Q --> V[SpinService]
    R --> W[LeaderboardService]
    S --> X[RewardService]
    T --> Y[ProfileService]

    U --> D
    V --> Z[SpinRewardManager]
    W --> AA[PointsManager]
    X --> AB[RewardTreasury]
```

Interactions:
- Home aggregates public chain data and links to features.
- Features update their own Zustand stores.
- Stores may call API routes.
- API routes call services.
- Services call contracts or database.
