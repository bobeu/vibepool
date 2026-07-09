# Prediction Evaluation Flow

```mermaid
sequenceDiagram
    participant User
    participant API
    participant TournamentService
    participant PredictionService
    participant BlockchainSyncService
    participant Database

    User->>API: POST /api/predictions
    API->>API: Validate session
    API->>TournamentService: getCurrentTournament
    TournamentService->>Database: Find active tournament
    Database-->>TournamentService: Tournament
    TournamentService-->>API: Tournament data
    
    API->>PredictionService: submitPrediction
    PredictionService->>PredictionService: validatePrediction
    PredictionService->>Database: Create prediction
    Database-->>PredictionService: Prediction
    PredictionService-->>API: Prediction created
    
    Note over API,Database: Tournament closes

    TournamentService->>PredictionService: evaluatePrediction
    PredictionService->>Database: Update all predictions
    TournamentService->>Database: Award XP and points
    TournamentService->>Database: Create leaderboard snapshot
    
    BlockchainSyncService->>Blockchain: Read events
    BlockchainSyncService->>Database: Sync profile cache
```

## Evaluation Steps

1. Tournament transitions to EVALUATING
2. All PENDING predictions are loaded
3. Actual value is applied
4. Accuracy is calculated for each prediction
5. Rankings are determined by accuracy, time, streak, random seed
6. XP and points are awarded based on settings
7. Leaderboard snapshot is created
8. Tournament transitions to COMPLETED
9. Reward eligibility is calculated
