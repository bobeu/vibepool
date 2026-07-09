// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { SharedErrors } from "./SharedErrors.sol";
import { SharedEvents } from "./SharedEvents.sol";
import { IActivityRegistry } from "./interfaces/IActivityRegistry.sol";

/// @title ActivityRegistry
/// @notice Minimal on-chain activity history with streak tracking
/// @dev Backend-authorized only. No historical arrays, only aggregate statistics.
contract ActivityRegistry is AccessControl, IActivityRegistry {
    bytes32 public constant BACKEND_ROLE = keccak256("BACKEND_ROLE");

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

    /// @notice Mapping of player address to activity profile
    mapping(address => ActivityProfile) public activityProfiles;
    /// @notice Mapping of request ID to processed status for replay protection
    mapping(bytes32 => bool) public processedRequestIds;

    /// @notice Aggregated activity statistics
    ActivityStatistics public activityStats;

    /// @notice Reverts if sender is not authorized backend
    modifier onlyBackend() {
        if (!hasRole(BACKEND_ROLE, msg.sender)) revert SharedErrors.Unauthorized();
        _;
    }

    /// @notice Initializes the ActivityRegistry
    constructor() {
        __AccessControl_init();
        _grantRole(BACKEND_ROLE, msg.sender);
    }

    /// @notice Records activity for a player and updates streak
    /// @param player The player address
    /// @param requestId Unique request ID for replay protection
    function recordActivity(address player, bytes32 requestId)
        external
        onlyBackend
    {
        if (processedRequestIds[requestId]) revert SharedErrors.DuplicateRequestId();
        processedRequestIds[requestId] = true;

        ActivityProfile storage profile = activityProfiles[player];
        uint256 today = block.timestamp / 1 days;
        uint256 lastDay = profile.lastActivityTimestamp / 1 days;

        unchecked {
            profile.activityCount += 1;
            activityStats.totalActivities += 1;

            if (profile.lastActivityTimestamp == 0) {
                profile.currentStreak = 1;
                activityStats.totalUniquePlayers += 1;
            } else if (today == lastDay + 1) {
                profile.currentStreak += 1;
                if (profile.currentStreak > profile.longestStreak) {
                    profile.longestStreak = profile.currentStreak;
                }
            } else if (today > lastDay + 1) {
                profile.currentStreak = 1;
            }

            profile.lastActivityTimestamp = uint64(block.timestamp);
        }

        emit SharedEvents.ActivityRecorded(player, profile.currentStreak, profile.longestStreak, profile.activityCount);
        emit SharedEvents.StreakUpdated(player, profile.currentStreak, profile.longestStreak);
    }

    /// @notice Resets a player's streak to zero
    /// @param player The player address
    function resetStreak(address player) external onlyBackend {
        ActivityProfile storage profile = activityProfiles[player];
        profile.currentStreak = 0;

        emit SharedEvents.StreakUpdated(player, 0, profile.longestStreak);
    }

    /// @notice Returns a player's activity profile
    /// @param player The player address
    /// @return The activity profile struct
    function profileActivity(address player) external view returns (ActivityProfile memory) {
        return activityProfiles[player];
    }

    /// @notice Returns aggregated activity statistics
    /// @return The activity statistics struct
    function activityStatistics() external view returns (ActivityStatistics memory) {
        return activityStats;
    }
}
