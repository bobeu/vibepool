// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { SharedErrors } from "./SharedErrors.sol";
import { SharedEvents } from "./SharedEvents.sol";
import { ISpinRewardManager } from "./interfaces/ISpinRewardManager.sol";

/// @title SpinRewardManager
/// @notice On-chain accounting for spin tickets and rewards
/// @dev Backend-authorized only. Wheel logic remains off-chain.
contract SpinRewardManager is AccessControl, ISpinRewardManager {
    bytes32 public constant BACKEND_ROLE = keccak256("BACKEND_ROLE");

    /// @notice Mapping of player address to spin profile
    mapping(address => SpinProfile) public spinProfiles;
    /// @notice Mapping of request ID to processed status for replay protection
    mapping(bytes32 => bool) public processedRequestIds;

    /// @notice Aggregated spin statistics
    SpinStatistics public spinStats;

    /// @notice Reverts if sender is not authorized backend
    modifier onlyBackend() {
        if (!hasRole(BACKEND_ROLE, msg.sender)) revert SharedErrors.Unauthorized();
        _;
    }

    /// @notice Initializes the SpinRewardManager
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(BACKEND_ROLE, msg.sender);
    }

    /// @notice Grants spin tickets to a player
    /// @param player The player address
    /// @param amount The number of spins to grant
    /// @param requestId Unique request ID for replay protection
    function grantSpin(address player, uint256 amount, bytes32 requestId)
        external
        onlyBackend
    {
        if (amount == 0) revert SharedErrors.InvalidAmount();
        if (processedRequestIds[requestId]) revert SharedErrors.DuplicateRequestId();

        processedRequestIds[requestId] = true;

        SpinProfile storage spinProfile = spinProfiles[player];

        unchecked {
            spinProfile.availableSpins += uint64(amount);
            spinProfile.lifetimeSpinsEarned += uint64(amount);
        }

        spinStats.totalSpinsGranted += amount;

        emit SharedEvents.SpinGranted(player, amount, spinProfile.availableSpins, requestId);
    }

    /// @notice Consumes one spin ticket from a player
    /// @param player The player address
    /// @param requestId Unique request ID for replay protection
    function consumeSpin(address player, bytes32 requestId)
        external
        onlyBackend
    {
        if (processedRequestIds[requestId]) revert SharedErrors.DuplicateRequestId();

        SpinProfile storage spinProfile = spinProfiles[player];
        if (spinProfile.availableSpins == 0) revert SharedErrors.NoSpinRemaining();

        processedRequestIds[requestId] = true;

        unchecked {
            spinProfile.availableSpins -= 1;
            spinProfile.lifetimeSpinsUsed += 1;
        }

        spinStats.totalSpinsConsumed += 1;

        emit SharedEvents.SpinConsumed(player, spinProfile.availableSpins, requestId);
    }

    /// @notice Records a reward won from a spin
    /// @param player The player address
    /// @param amount The reward amount
    /// @param requestId Unique request ID for replay protection
    function recordReward(address player, uint256 amount, bytes32 requestId)
        external
        onlyBackend
    {
        if (amount == 0) revert SharedErrors.InvalidAmount();
        if (processedRequestIds[requestId]) revert SharedErrors.DuplicateRequestId();

        processedRequestIds[requestId] = true;

        SpinProfile storage spinProfile = spinProfiles[player];

        unchecked {
            spinProfile.lifetimeRewards += amount;
        }

        spinStats.totalRewardsRecorded += amount;

        emit SharedEvents.RewardRecorded(player, amount, requestId);
    }

    /// @notice Returns a player's spin profile
    /// @param player The player address
    /// @return The spin profile struct
    function profile(address player) external view returns (SpinProfile memory) {
        return spinProfiles[player];
    }

    /// @notice Returns aggregated spin statistics
    /// @return The spin statistics struct
    function spinStatistics() external view returns (SpinStatistics memory) {
        return spinStats;
    }
}
