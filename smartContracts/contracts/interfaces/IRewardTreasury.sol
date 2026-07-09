// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title IRewardTreasury
/// @notice Interface for the RewardTreasury contract
interface IRewardTreasury {
    /// @notice Asset information stored in the registry
    struct AssetInfo {
        address assetAddress;
        string symbol;
        uint8 decimals;
        bool enabled;
    }

    /// @notice Per-asset accounting statistics
    struct AssetStatistics {
        uint256 totalDeposited;
        uint256 totalPaid;
        uint256 balance;
    }

    /// @notice Overall treasury statistics
    struct TreasuryStatistics {
        uint256 totalDeposits;
        uint256 totalRewards;
        uint256 totalWithdrawals;
        uint256 rewardCount;
        uint256 largestReward;
    }

    /// @notice Deposits native asset into the treasury
    function deposit() external payable;

    /// @notice Deposits ERC20 asset into the treasury
    /// @param asset The ERC20 token address
    /// @param amount The amount to deposit
    function depositERC20(address asset, uint256 amount) external;

    /// @notice Withdraws assets from the treasury
    /// @param asset The asset address to withdraw
    /// @param to The recipient address
    /// @param amount The amount to withdraw
    function withdraw(address asset, address to, uint256 amount) external;

    /// @notice Executes a reward payout to a recipient
    /// @param recipient The reward recipient
    /// @param asset The asset to pay out
    /// @param amount The payout amount
    /// @param requestId Unique request ID for replay protection
    function payout(address recipient, address asset, uint256 amount, bytes32 requestId) external;

    /// @notice Returns the total native asset balance held by the treasury
    function treasuryBalance() external view returns (uint256);

    /// @notice Returns the balance of a specific asset held by the treasury
    /// @param asset The asset address
    function assetBalance(address asset) external view returns (uint256);

    /// @notice Checks if an asset is supported
    /// @param asset The asset address
    function isSupportedAsset(address asset) external view returns (bool);

    /// @notice Returns all supported assets
    function getSupportedAssets() external view returns (AssetInfo[] memory);

    /// @notice Enables a new asset for deposits and payouts
    /// @param asset The ERC20 asset address
    /// @param symbol The asset symbol
    /// @param decimals The asset decimals
    function enableAsset(address asset, string calldata symbol, uint8 decimals) external;

    /// @notice Disables an asset
    /// @param asset The asset address to disable
    function disableAsset(address asset) external;

    /// @notice Returns statistics for a specific asset
    /// @param asset The asset address
    function assetStatistics(address asset) external view returns (AssetStatistics memory);

    /// @notice Returns overall treasury statistics
    function treasuryStatistics() external view returns (TreasuryStatistics memory);
}
