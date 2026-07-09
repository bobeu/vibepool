// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title IPointsManager
/// @notice Interface for the PointsManager contract
interface IPointsManager {
    /// @notice Player profile data
    struct Profile {
        uint256 xp;
        uint256 level;
        uint256 points;
        uint256 lifetimePoints;
        uint256 lifetimeXP;
        uint256 availableSpins;
        uint256 rewardClaims;
        uint64 currentStreak;
        uint64 longestStreak;
        uint64 lastActivity;
        uint64 registrationTime;
    }

    /// @notice Aggregated player statistics
    struct PlayerStatistics {
        uint256 totalXPGranted;
        uint256 totalPointsGranted;
        uint256 totalPointsDeducted;
        uint256 totalSpinsGranted;
        uint256 totalRewardClaims;
    }

    /// @notice Grants XP to a player
    /// @param player The player address
    /// @param amount The XP amount
    /// @param requestId Unique request ID
    function grantXP(address player, uint256 amount, bytes32 requestId) external;

    /// @notice Grants points to a player
    /// @param player The player address
    /// @param amount The points amount
    /// @param requestId Unique request ID
    function grantPoints(address player, uint256 amount, bytes32 requestId) external;

    /// @notice Deducts points from a player
    /// @param player The player address
    /// @param amount The points amount
    /// @param requestId Unique request ID
    function deductPoints(address player, uint256 amount, bytes32 requestId) external;

    /// @notice Grants spins to a player
    /// @param player The player address
    /// @param amount The spin amount
    /// @param requestId Unique request ID
    function grantSpin(address player, uint256 amount, bytes32 requestId) external;

    /// @notice Records a reward claim for a player
    /// @param player The player address
    /// @param requestId Unique request ID
    function grantRewardClaim(address player, bytes32 requestId) external;

    /// @notice Returns a player's profile
    /// @param player The player address
    function profile(address player) external view returns (Profile memory);

    /// @notice Returns aggregated player statistics
    function playerStatistics() external view returns (PlayerStatistics memory);

    /// @notice Grants XP to multiple players in a batch
    /// @param players Array of player addresses
    /// @param amounts Array of XP amounts
    /// @param requestIds Array of unique request IDs
    function batchGrantXP(address[] calldata players, uint256[] calldata amounts, bytes32[] calldata requestIds) external;

    /// @notice Grants points to multiple players in a batch
    /// @param players Array of player addresses
    /// @param amounts Array of point amounts
    /// @param requestIds Array of unique request IDs
    function batchGrantPoints(address[] calldata players, uint256[] calldata amounts, bytes32[] calldata requestIds) external;
}
