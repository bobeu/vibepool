// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { SafeERC20, IERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { SharedErrors } from "./SharedErrors.sol";
import { SharedEvents } from "./SharedEvents.sol";
import { TransferHelper } from "./libraries/TransferHelper.sol";
import { IRewardTreasury } from "./interfaces/IRewardTreasury.sol";

/// @title RewardTreasury
/// @notice Central vault for all Vibepool reward funds. Supports CELO and ERC20 assets.
/// @dev Follows Checks-Effects-Interactions pattern with ReentrancyGuard and Pausable.
contract RewardTreasury is IRewardTreasury, AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    bytes32 public constant TREASURY_MANAGER_ROLE = keccak256("TREASURY_MANAGER_ROLE");
    bytes32 public constant REWARD_MANAGER_ROLE = keccak256("REWARD_MANAGER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /// @notice Mapping of asset address to asset info
    mapping(address => AssetInfo) public assets;
    /// @notice Ordered list of supported asset addresses
    address[] public supportedAssetList;
    /// @notice Mapping of asset address to per-asset statistics
    mapping(address => AssetStatistics) public assetStats;
    /// @notice Mapping of request ID to processed status for replay protection
    mapping(bytes32 => bool) private processedRequestIds;

    /// @notice Overall treasury statistics
    TreasuryStatistics public treasuryStats;

    /// @notice Native asset address (CELO)
    address public immutable nativeAsset;

    /// @notice Reverts if amount is zero
    modifier onlyNonZeroAmount(uint256 amount) {
        if (amount == 0) revert SharedErrors.InvalidAmount();
        _;
    }

    /// @notice Reverts if asset is not supported
    modifier onlySupportedAsset(address asset) {
        if (!_isSupportedAsset(asset)) revert SharedErrors.UnsupportedAsset();
        _;
    }

    /// @notice Reverts if asset is not enabled
    modifier onlyEnabledAsset(address asset) {
        if (!assets[asset].enabled) revert SharedErrors.AssetDisabled();
        _;
    }

    /// @notice Initializes the treasury with CELO as the default supported asset
    /// @param _nativeAsset The native asset address (CELO, typically address(0))
    constructor(address _nativeAsset) {
        nativeAsset = _nativeAsset;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(TREASURY_MANAGER_ROLE, msg.sender);
        _grantRole(REWARD_MANAGER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);

        assets[nativeAsset] = AssetInfo({
            assetAddress: nativeAsset,
            symbol: "CELO",
            decimals: 18,
            enabled: true
        });
        supportedAssetList.push(nativeAsset);
    }

    /// @notice Deposits native asset (CELO) into the treasury
    function deposit() external payable whenNotPaused onlyNonZeroAmount(msg.value) onlyEnabledAsset(nativeAsset) {
        _depositNative(msg.value);
    }

    /// @notice Deposits ERC20 asset into the treasury
    function depositERC20(address asset, uint256 amount)
        external
        whenNotPaused
        onlyNonZeroAmount(amount)
        onlySupportedAsset(asset)
        onlyEnabledAsset(asset)
        nonReentrant
    {
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);

        AssetStatistics storage stats = assetStats[asset];
        stats.totalDeposited += amount;
        stats.balance += amount;

        treasuryStats.totalDeposits += amount;

        emit SharedEvents.TreasuryDeposit(asset, amount, uint64(block.timestamp));
    }

    /// @notice Withdraws assets from the treasury
    function withdraw(address asset, address to, uint256 amount)
        external
        whenNotPaused
        nonReentrant
        onlyRole(TREASURY_MANAGER_ROLE)
        onlySupportedAsset(asset)
        onlyNonZeroAmount(amount)
    {
        if (to == address(0)) revert SharedErrors.InvalidAddress();

        AssetStatistics storage stats = assetStats[asset];
        if (stats.balance < amount) revert SharedErrors.InsufficientBalance();

        stats.balance -= amount;

        treasuryStats.totalWithdrawals += amount;

        if (asset == nativeAsset) {
            TransferHelper.transferNative(to, amount);
        } else {
            IERC20(asset).safeTransfer(to, amount);
        }

        emit SharedEvents.TreasuryWithdrawal(asset, amount, to, uint64(block.timestamp));
    }

    /// @notice Executes a reward payout to a recipient
    function payout(address recipient, address asset, uint256 amount, bytes32 requestId)
        external
        whenNotPaused
        nonReentrant
        onlyRole(REWARD_MANAGER_ROLE)
        onlySupportedAsset(asset)
        onlyEnabledAsset(asset)
        onlyNonZeroAmount(amount)
    {
        if (recipient == address(0)) revert SharedErrors.InvalidAddress();
        if (processedRequestIds[requestId]) revert SharedErrors.DuplicateRequestId();

        processedRequestIds[requestId] = true;

        AssetStatistics storage stats = assetStats[asset];
        if (stats.balance < amount) revert SharedErrors.InsufficientBalance();

        stats.balance -= amount;
        stats.totalPaid += amount;

        treasuryStats.totalRewards += amount;
        treasuryStats.rewardCount += 1;
        if (amount > treasuryStats.largestReward) {
            treasuryStats.largestReward = amount;
        }

        if (asset == nativeAsset) {
            TransferHelper.transferNative(recipient, amount);
        } else {
            IERC20(asset).safeTransfer(recipient, amount);
        }

        emit SharedEvents.RewardPaid(recipient, asset, amount, requestId, uint64(block.timestamp));
    }

    /// @notice Returns the total native asset balance held by the treasury
    function treasuryBalance() external view returns (uint256) {
        return assetStats[nativeAsset].balance;
    }

    /// @notice Returns the balance of a specific asset held by the treasury
    function assetBalance(address asset) external view returns (uint256) {
        if (!_isSupportedAsset(asset)) revert SharedErrors.UnsupportedAsset();
        return assetStats[asset].balance;
    }

    /// @notice Checks if an asset is supported
    function isSupportedAsset(address asset) external view returns (bool) {
        return _isSupportedAsset(asset);
    }

    /// @notice Returns all supported assets
    function getSupportedAssets() external view returns (AssetInfo[] memory) {
        AssetInfo[] memory result = new AssetInfo[](supportedAssetList.length);
        for (uint256 i = 0; i < supportedAssetList.length; i++) {
            result[i] = assets[supportedAssetList[i]];
        }
        return result;
    }

    /// @notice Enables a new asset for deposits and payouts
    function enableAsset(address asset, string calldata symbol, uint8 decimals) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (asset == address(0)) revert SharedErrors.InvalidAddress();
        if (assets[asset].assetAddress != address(0)) revert SharedErrors.AssetAlreadyExists();

        assets[asset] = AssetInfo({
            assetAddress: asset,
            symbol: symbol,
            decimals: decimals,
            enabled: true
        });
        supportedAssetList.push(asset);

        emit SharedEvents.AssetEnabled(asset, symbol);
    }

    /// @notice Disables an asset
    function disableAsset(address asset) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (assets[asset].assetAddress == address(0)) revert SharedErrors.AssetNotFound();

        assets[asset].enabled = false;
        emit SharedEvents.AssetDisabled(asset, assets[asset].symbol);
    }

    /// @notice Returns statistics for a specific asset
    function assetStatistics(address asset) external view returns (AssetStatistics memory) {
        if (!_isSupportedAsset(asset)) revert SharedErrors.UnsupportedAsset();
        return assetStats[asset];
    }

    /// @notice Returns overall treasury statistics
    function treasuryStatistics() external view returns (TreasuryStatistics memory) {
        return treasuryStats;
    }

    /// @notice Pauses all state-changing operations
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
        emit SharedEvents.Paused();
    }

    /// @notice Unpauses all state-changing operations
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
        emit SharedEvents.Unpaused();
    }

    /// @notice Internal check for supported asset
    function _isSupportedAsset(address asset) internal view returns (bool) {
        return asset == nativeAsset || assets[asset].assetAddress != address(0);
    }

    /// @notice Accepts native asset deposits
    receive() external payable whenNotPaused {
        if (msg.value == 0) revert SharedErrors.InvalidAmount();
        _depositNative(msg.value);
    }

    function _depositNative(uint256 amount) private {
        address asset = nativeAsset;
        AssetStatistics storage stats = assetStats[asset];
        stats.totalDeposited += amount;
        stats.balance += amount;
        treasuryStats.totalDeposits += amount;
        emit SharedEvents.TreasuryDeposit(asset, amount, uint64(block.timestamp));
    }
}
