# Role Diagram

## RewardTreasury Roles

| Role | Key | Permissions |
|------|-----|-------------|
| DEFAULT_ADMIN_ROLE | `DEFAULT_ADMIN_ROLE` | Enable/disable assets, grant/revoke roles |
| TREASURY_MANAGER_ROLE | `TREASURY_MANAGER_ROLE` | Withdraw funds |
| REWARD_MANAGER_ROLE | `REWARD_MANAGER_ROLE` | Execute payouts |
| PAUSER_ROLE | `PAUSER_ROLE` | Pause/unpause contract |

## PointsManager Roles

| Role | Key | Permissions |
|------|-----|-------------|
| DEFAULT_ADMIN_ROLE | `DEFAULT_ADMIN_ROLE` | Grant/revoke roles |
| BACKEND_ROLE | `BACKEND_ROLE` | Grant XP, points, spins, reward claims |

## ActivityRegistry Roles

| Role | Key | Permissions |
|------|-----|-------------|
| DEFAULT_ADMIN_ROLE | `DEFAULT_ADMIN_ROLE` | Grant/revoke roles |
| BACKEND_ROLE | `BACKEND_ROLE` | Record activity, reset streaks |

## SpinRewardManager Roles

| Role | Key | Permissions |
|------|-----|-------------|
| DEFAULT_ADMIN_ROLE | `DEFAULT_ADMIN_ROLE` | Grant/revoke roles |
| BACKEND_ROLE | `BACKEND_ROLE` | Grant spins, consume spins, record rewards |

## Role Hierarchy

- DEFAULT_ADMIN_ROLE can manage all other roles.
- BACKEND_ROLE is granted by DEFAULT_ADMIN_ROLE and is the only role allowed to modify player state.
- TREASURY_MANAGER_ROLE, REWARD_MANAGER_ROLE, and PAUSER_ROLE are specific to RewardTreasury financial operations.
