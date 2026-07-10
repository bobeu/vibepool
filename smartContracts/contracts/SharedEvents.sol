// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @title SharedEvents
/// @notice Events emitted across all Vibepool foundation contracts
interface SharedEvents {
    event XPGranted(address indexed player, uint256 amount, uint256 newTotalXP, bytes32 indexed requestId);
    event PointsGranted(address indexed player, uint256 amount, uint256 newTotalPoints, bytes32 indexed requestId);
    event PointsDeducted(address indexed player, uint256 amount, uint256 newTotalPoints, bytes32 indexed requestId);
    event SpinGranted(address indexed player, uint256 amount, uint256 newAvailableSpins, bytes32 indexed requestId);
    event SpinConsumed(address indexed player, uint256 newAvailableSpins, bytes32 indexed requestId);
    event RewardRecorded(address indexed player, uint256 amount, bytes32 indexed requestId);
    event RewardClaimed(address indexed player, uint256 amount, bytes32 indexed requestId);
    event RewardPaid(
        address indexed recipient,
        address indexed asset,
        uint256 amount,
        bytes32 indexed requestId,
        uint256 timestamp
    );
    event ActivityRecorded(address indexed player, uint256 streak, uint256 longestStreak, uint256 activityCount);
    event StreakUpdated(address indexed player, uint256 streak, uint256 longestStreak);
    event AssetEnabled(address indexed asset, string symbol);
    event AssetDisabled(address indexed asset, string symbol);
    event TreasuryDeposit(address indexed asset, uint256 amount, uint256 timestamp);
    event TreasuryWithdrawal(address indexed asset, uint256 amount, address indexed to, uint256 timestamp);
    event LevelUp(address indexed player, uint256 newLevel, uint256 totalXP);
    event ProfileUpdated(address indexed player);
    event Paused();
    event Unpaused();
}
