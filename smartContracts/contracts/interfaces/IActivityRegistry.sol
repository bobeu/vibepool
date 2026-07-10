// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @title IActivityRegistry
/// @notice Interface for the ActivityRegistry contract
interface IActivityRegistry {
    /// @notice Activity profile for a player
    struct ActivityProfile {
        uint64 lastActivityTimestamp;
        uint64 activityCount;
        uint64 currentStreak;
        uint64 longestStreak;
    }

    /// @notice Aggregated activity statistics
    struct ActivityStatistics {
        uint256 totalActivities;
        uint256 totalUniquePlayers;
    }

    /// @notice Records activity for a player
    /// @param player The player address
    /// @param requestId Unique request ID
    function recordActivity(address player, bytes32 requestId) external;

    /// @notice Resets a player's streak to zero
    /// @param player The player address
    function resetStreak(address player) external;

    /// @notice Returns a player's activity profile
    /// @param player The player address
    function profileActivity(address player) external view returns (ActivityProfile memory);

    /// @notice Returns aggregated activity statistics
    function activityStatistics() external view returns (ActivityStatistics memory);
}
