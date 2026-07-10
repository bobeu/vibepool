// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @title SharedErrors
/// @notice Custom errors used across all Vibepool foundation contracts
interface SharedErrors {
    error UnsupportedAsset();
    error Unauthorized();
    error InvalidAmount();
    error InvalidAddress();
    error InsufficientBalance();
    error NoSpinRemaining();
    error AlreadyPaused();
    error NotPaused();
    error RewardFailed();
    error TransferFailed();
    error InvalidReceiver();
    error ZeroAddress();
    error DuplicateRequestId();
    error AssetDisabled();
    error AssetNotFound();
    error AssetAlreadyExists();
    error InvalidInput();
}
