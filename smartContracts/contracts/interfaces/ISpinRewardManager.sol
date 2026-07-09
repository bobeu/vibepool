// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title ISpinRewardManager
/// @notice Interface for the SpinRewardManager contract
interface ISpinRewardManager {
    /// @notice Spin profile for a player
    struct SpinProfile {
        uint64 availableSpins;
        uint64 lifetimeSpinsEarned;
        uint64 lifetimeSpinsUsed;
        uint256 lifetimeRewards;
    }

    /// @notice Aggregated spin statistics
    struct SpinStatistics {
        uint256 totalSpinsGranted;
        uint256 totalSpinsConsumed;
        uint256 totalRewardsRecorded;
    }

    /// @notice Grants spin tickets to a player
    /// @param player The player address
    /// @param amount The number of spins to grant
    /// @param requestId Unique request ID
    function grantSpin(address player, uint256 amount, bytes32 requestId) external;

    /// @notice Consumes one spin ticket from a player
    /// @param player The player address
    /// @param requestId Unique request ID
    function consumeSpin(address player, bytes32 requestId) external;

    /// @notice Records a reward won from a spin
    /// @param player The player address
    /// @param amount The reward amount
    /// @param requestId Unique request ID
    function recordReward(address player, uint256 amount, bytes32 requestId) external;

    /// @notice Returns a player's spin profile
    /// @param player The player address
    function profile(address player) external view returns (SpinProfile memory);

    /// @notice Returns aggregated spin statistics
    function spinStatistics() external view returns (SpinStatistics memory);
}
