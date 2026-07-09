# Event Catalog

## SharedEvents

### XPGranted
- **Signature:** `XPGranted(address indexed player, uint256 amount, uint256 newTotalXP, bytes32 indexed requestId)`
- **Contract:** `PointsManager`
- **Trigger:** XP is granted to a player

### PointsGranted
- **Signature:** `PointsGranted(address indexed player, uint256 amount, uint256 newTotalPoints, bytes32 indexed requestId)`
- **Contract:** `PointsManager`
- **Trigger:** Points are granted to a player

### PointsDeducted
- **Signature:** `PointsDeducted(address indexed player, uint256 amount, uint256 newTotalPoints, bytes32 indexed requestId)`
- **Contract:** `PointsManager`
- **Trigger:** Points are deducted from a player

### LevelUp
- **Signature:** `LevelUp(address indexed player, uint256 newLevel, uint256 totalXP)`
- **Contract:** `PointsManager`
- **Trigger:** Player's level increases

### SpinGranted
- **Signature:** `SpinGranted(address indexed player, uint256 amount, uint256 newAvailableSpins, bytes32 indexed requestId)`
- **Contract:** `PointsManager`, `SpinRewardManager`
- **Trigger:** Spin tickets are granted

### SpinConsumed
- **Signature:** `SpinConsumed(address indexed player, uint256 newAvailableSpins, bytes32 indexed requestId)`
- **Contract:** `SpinRewardManager`
- **Trigger:** A spin ticket is consumed

### RewardRecorded
- **Signature:** `RewardRecorded(address indexed player, uint256 amount, bytes32 indexed requestId)`
- **Contract:** `SpinRewardManager`
- **Trigger:** A spin reward is recorded

### RewardPaid
- **Signature:** `RewardPaid(address indexed recipient, address indexed asset, uint256 amount, bytes32 indexed requestId, uint256 timestamp)`
- **Contract:** `RewardTreasury`
- **Trigger:** A reward payout is executed

### RewardClaimed
- **Signature:** `RewardClaimed(address indexed player, uint256 rewardId, bytes32 indexed requestId)`
- **Contract:** `PointsManager`
- **Trigger:** A reward claim is recorded

### ActivityRecorded
- **Signature:** `ActivityRecorded(address indexed player, uint256 streak, uint256 longestStreak, uint256 activityCount)`
- **Contract:** `ActivityRegistry`
- **Trigger:** Player activity is recorded and streak is updated

### StreakUpdated
- **Signature:** `StreakUpdated(address indexed player, uint256 streak, uint256 longestStreak)`
- **Contract:** `ActivityRegistry`
- **Trigger:** Player streak is updated

### AssetEnabled
- **Signature:** `AssetEnabled(address indexed asset, string symbol)`
- **Contract:** `RewardTreasury`
- **Trigger:** An asset is enabled for deposits and payouts

### AssetDisabled
- **Signature:** `AssetDisabled(address indexed asset, string symbol)`
- **Contract:** `RewardTreasury`
- **Trigger:** An asset is disabled

### TreasuryDeposit
- **Signature:** `TreasuryDeposit(address indexed asset, uint256 amount, uint256 timestamp)`
- **Contract:** `RewardTreasury`
- **Trigger:** An asset is deposited into the treasury

### TreasuryWithdrawal
- **Signature:** `TreasuryWithdrawal(address indexed asset, uint256 amount, address indexed to, uint256 timestamp)`
- **Contract:** `RewardTreasury`
- **Trigger:** Funds are withdrawn from the treasury

### ProfileUpdated
- **Signature:** `ProfileUpdated(address indexed player)`
- **Contract:** `PointsManager`
- **Trigger:** Any profile field changes

### Paused / Unpaused
- **Signature:** `Paused()` / `Unpaused()`
- **Contract:** `RewardTreasury`
- **Trigger:** Contract is paused or unpaused
