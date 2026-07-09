// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { SharedErrors } from "./SharedErrors.sol";
import { SharedEvents } from "./SharedEvents.sol";
import { LevelMath } from "./libraries/LevelMath.sol";
import { IPointsManager } from "./interfaces/IPointsManager.sol";

/// @title PointsManager
/// @notice On-chain verification layer for player profiles, XP, points, spins, and reward claims
/// @dev Backend-authorized only. Never allows self-editing.
contract PointsManager is AccessControl, IPointsManager {
    bytes32 public constant BACKEND_ROLE = keccak256("BACKEND_ROLE");

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

    /// @notice Mapping of player address to profile
    mapping(address => Profile) public profiles;
    /// @notice Mapping of request ID to processed status for replay protection
    mapping(bytes32 => bool) public processedRequestIds;

    /// @notice Aggregated player statistics
    PlayerStatistics public playerStats;

    /// @notice Address of the ActivityRegistry contract
    address public immutable activityRegistry;
    /// @notice Address of the SpinRewardManager contract
    address public immutable spinRewardManager;

    /// @notice Reverts if sender is not authorized backend
    modifier onlyBackend() {
        if (!hasRole(BACKEND_ROLE, msg.sender)) revert SharedErrors.Unauthorized();
        _;
    }

    /// @notice Reverts if amount is zero
    /// @param amount The amount to check
    modifier onlyNonZeroAmount(uint256 amount) {
        if (amount == 0) revert SharedErrors.InvalidAmount();
        _;
    }

    /// @notice Initializes the PointsManager with associated contracts
    /// @param _activityRegistry Address of the ActivityRegistry contract
    /// @param _spinRewardManager Address of the SpinRewardManager contract
    constructor(address _activityRegistry, address _spinRewardManager) {
        activityRegistry = _activityRegistry;
        spinRewardManager = _spinRewardManager;

        __AccessControl_init();
        _grantRole(BACKEND_ROLE, msg.sender);
    }

    /// @notice Grants XP to a player and auto-updates level
    /// @param player The player address
    /// @param amount The XP amount to grant
    /// @param requestId Unique request ID for replay protection
    function grantXP(address player, uint256 amount, bytes32 requestId)
        external
        onlyBackend
        onlyNonZeroAmount(amount)
    {
        if (processedRequestIds[requestId]) revert SharedErrors.DuplicateRequestId();
        processedRequestIds[requestId] = true;

        Profile storage profile = profiles[player];
        uint256 oldLevel = profile.level;

        unchecked {
            profile.xp += amount;
            profile.level = LevelMath.calculateLevel(profile.xp);
            profile.lifetimeXP += amount;
        }

        playerStats.totalXPGranted += amount;

        emit SharedEvents.XPGranted(player, amount, profile.xp, requestId);

        if (profile.level > oldLevel) {
            emit SharedEvents.LevelUp(player, profile.level, profile.xp);
        }

        emit SharedEvents.ProfileUpdated(player);
    }

    /// @notice Grants points to a player
    /// @param player The player address
    /// @param amount The points amount to grant
    /// @param requestId Unique request ID for replay protection
    function grantPoints(address player, uint256 amount, bytes32 requestId)
        external
        onlyBackend
        onlyNonZeroAmount(amount)
    {
        if (processedRequestIds[requestId]) revert SharedErrors.DuplicateRequestId();
        processedRequestIds[requestId] = true;

        Profile storage profile = profiles[player];

        unchecked {
            profile.points += amount;
            profile.lifetimePoints += amount;
        }

        playerStats.totalPointsGranted += amount;

        emit SharedEvents.PointsGranted(player, amount, profile.points, requestId);
        emit SharedEvents.ProfileUpdated(player);
    }

    /// @notice Deducts points from a player
    /// @param player The player address
    /// @param amount The points amount to deduct
    /// @param requestId Unique request ID for replay protection
    function deductPoints(address player, uint256 amount, bytes32 requestId)
        external
        onlyBackend
        onlyNonZeroAmount(amount)
    {
        if (processedRequestIds[requestId]) revert SharedErrors.DuplicateRequestId();
        processedRequestIds[requestId] = true;

        Profile storage profile = profiles[player];
        if (profile.points < amount) revert SharedErrors.InsufficientBalance();

        unchecked {
            profile.points -= amount;
        }

        playerStats.totalPointsDeducted += amount;

        emit SharedEvents.PointsDeducted(player, amount, profile.points, requestId);
        emit SharedEvents.ProfileUpdated(player);
    }

    /// @notice Grants spins to a player
    /// @param player The player address
    /// @param amount The spin amount to grant
    /// @param requestId Unique request ID for replay protection
    function grantSpin(address player, uint256 amount, bytes32 requestId)
        external
        onlyBackend
        onlyNonZeroAmount(amount)
    {
        if (processedRequestIds[requestId]) revert SharedErrors.DuplicateRequestId();
        processedRequestIds[requestId] = true;

        Profile storage profile = profiles[player];

        unchecked {
            profile.availableSpins += amount;
        }

        playerStats.totalSpinsGranted += amount;

        emit SharedEvents.SpinGranted(player, amount, profile.availableSpins, requestId);
        emit SharedEvents.ProfileUpdated(player);
    }

    /// @notice Records a reward claim for a player
    /// @param player The player address
    /// @param requestId Unique request ID for replay protection
    function grantRewardClaim(address player, bytes32 requestId)
        external
        onlyBackend
    {
        if (processedRequestIds[requestId]) revert SharedErrors.DuplicateRequestId();
        processedRequestIds[requestId] = true;

        Profile storage profile = profiles[player];

        unchecked {
            profile.rewardClaims += 1;
        }

        playerStats.totalRewardClaims += 1;

        emit SharedEvents.RewardClaimed(player, 0, requestId);
        emit SharedEvents.ProfileUpdated(player);
    }

    /// @notice Returns a player's profile
    /// @param player The player address
    /// @return The player profile struct
    function profile(address player) external view returns (Profile memory) {
        return profiles[player];
    }

    /// @notice Returns aggregated player statistics
    /// @return The player statistics struct
    function playerStatistics() external view returns (PlayerStatistics memory) {
        return playerStats;
    }

    /// @notice Grants XP to multiple players in a batch
    /// @param players Array of player addresses
    /// @param amounts Array of XP amounts
    /// @param requestIds Array of unique request IDs
    function batchGrantXP(address[] calldata players, uint256[] calldata amounts, bytes32[] calldata requestIds)
        external
        onlyBackend
    {
        if (players.length != amounts.length || players.length != requestIds.length) {
            revert SharedErrors.InvalidInput();
        }

        for (uint256 i = 0; i < players.length; i++) {
            if (processedRequestIds[requestIds[i]]) continue;

            processedRequestIds[requestIds[i]] = true;

            Profile storage profile = profiles[players[i]];
            uint256 oldLevel = profile.level;

            unchecked {
                profile.xp += amounts[i];
                profile.level = LevelMath.calculateLevel(profile.xp);
                profile.lifetimeXP += amounts[i];
            }

            playerStats.totalXPGranted += amounts[i];

            emit SharedEvents.XPGranted(players[i], amounts[i], profile.xp, requestIds[i]);

            if (profile.level > oldLevel) {
                emit SharedEvents.LevelUp(players[i], profile.level, profile.xp);
            }
        }
    }

    /// @notice Grants points to multiple players in a batch
    /// @param players Array of player addresses
    /// @param amounts Array of point amounts
    /// @param requestIds Array of unique request IDs
    function batchGrantPoints(address[] calldata players, uint256[] calldata amounts, bytes32[] calldata requestIds)
        external
        onlyBackend
    {
        if (players.length != amounts.length || players.length != requestIds.length) {
            revert SharedErrors.InvalidInput();
        }

        for (uint256 i = 0; i < players.length; i++) {
            if (processedRequestIds[requestIds[i]]) continue;

            processedRequestIds[requestIds[i]] = true;

            Profile storage profile = profiles[players[i]];

            unchecked {
                profile.points += amounts[i];
                profile.lifetimePoints += amounts[i];
            }

            playerStats.totalPointsGranted += amounts[i];

            emit SharedEvents.PointsGranted(players[i], amounts[i], profile.points, requestIds[i]);
        }
    }
}
