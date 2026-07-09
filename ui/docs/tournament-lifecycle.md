# Tournament Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Upcoming: createTournament
    Upcoming --> Open: startTournament
    Open --> Locked: lockTournament
    Locked --> Evaluating: evaluateTournament
    Evaluating --> Completed: completeTournament
    Completed --> Archived: archiveTournament
    Evaluating --> Failed: Evaluation Error
    Failed --> Evaluating: Retry Evaluation
```

## State Descriptions

- **Upcoming**: Tournament created but not yet open for predictions
- **Open**: Accepting predictions from users
- **Locked**: Prediction window closed, awaiting evaluation
- **Evaluating**: Results being calculated, leaderboard generated
- **Completed**: Rewards distributed, tournament finalized
- **Archived**: Historical record, not active
