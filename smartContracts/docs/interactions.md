# Contract Interaction Diagram

```mermaid
graph TD
    Backend[Backend Service] -->|grantXP/grantPoints| PointsManager
    Backend -->|recordActivity| ActivityRegistry
    Backend -->|grantSpin/consumeSpin/recordReward| SpinRewardManager
    Backend -->|payout| RewardTreasury

    Admin[Admin/Owner] -->|enableAsset/disableAsset| RewardTreasury
    TreasuryManager[Treasury Manager] -->|withdraw| RewardTreasury
    RewardManager[Reward Manager] -->|payout| RewardTreasury
    Pauser[Pauser] -->|pause/unpause| RewardTreasury

    PointsManager -.->|reads| ActivityRegistry
    PointsManager -.->|reads| SpinRewardManager

    User[End User] -->|deposit| RewardTreasury
```

## Interaction Notes

- Backend is the only entity that can modify player state (XP, points, spins, activity).
- Admin manages asset registry and treasury roles.
- Treasury Manager handles fund withdrawals.
- Reward Manager executes payouts.
- Pauser can pause/unpause all state-changing operations.
- PointsManager reads from ActivityRegistry and SpinRewardManager for profile completeness.
