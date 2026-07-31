// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { SafeERC20, IERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { SharedErrors } from "./SharedErrors.sol";
import { TransferHelper } from "./libraries/TransferHelper.sol";
import { ISpinPrizeVault } from "./interfaces/ISpinPrizeVault.sol";
import { MultiOwnable } from "./MultiOwnable.sol";

/// @title SpinPrizeVault
/// @notice Holds Spin Hunt prize liquidity; DB_MANAGER credits claimable balances; users withdraw when liquid.
contract SpinPrizeVault is ISpinPrizeVault, AccessControl, ReentrancyGuard, Pausable, MultiOwnable {
    using SafeERC20 for IERC20;

    bytes32 public constant DB_MANAGER_ROLE = keccak256("DB_MANAGER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    address public immutable nativeAsset;

    mapping(address => bool) public assetEnabled;
    mapping(address => uint8) public assetDecimals;
    mapping(address => string) public assetSymbol;
    address[] public assetList;

    /// @notice User claimable balances per asset (accounting)
    mapping(address => mapping(address => uint256)) private _claimable;

    /// @notice Liquidity reserved for claimable credits (must stay <= actual holdings)
    mapping(address => uint256) public reserved;

    mapping(bytes32 => bool) private processedRequestIds;

    modifier onlyEnabledAsset(address asset) {
        if (!assetEnabled[asset]) revert SharedErrors.AssetDisabled();
        _;
    }

    constructor(address _nativeAsset, address[] memory initialOwners) MultiOwnable(initialOwners) {
        nativeAsset = _nativeAsset;

        for (uint256 i = 0; i < initialOwners.length; i++) {
            _grantRole(DEFAULT_ADMIN_ROLE, initialOwners[i]);
            _grantRole(DB_MANAGER_ROLE, initialOwners[i]);
            _grantRole(PAUSER_ROLE, initialOwners[i]);
        }

        assetEnabled[_nativeAsset] = true;
        assetDecimals[_nativeAsset] = 18;
        assetSymbol[_nativeAsset] = "CELO";
        assetList.push(_nativeAsset);
    }

    function enableAsset(address asset, string calldata symbol, uint8 decimals_)
        external
        onlyOwner
    {
        if (asset == address(0)) revert SharedErrors.InvalidAddress();
        if (assetEnabled[asset]) revert SharedErrors.AssetAlreadyExists();
        assetEnabled[asset] = true;
        assetDecimals[asset] = decimals_;
        assetSymbol[asset] = symbol;
        assetList.push(asset);
    }

    function disableAsset(address asset) external onlyOwner {
        if (!assetEnabled[asset]) revert SharedErrors.AssetNotFound();
        if (asset == nativeAsset) revert SharedErrors.InvalidInput();
        assetEnabled[asset] = false;
    }

    /// @notice Anyone can fund prize liquidity
    function fund(address asset, uint256 amount)
        external
        payable
        whenNotPaused
        nonReentrant
        onlyEnabledAsset(asset)
    {
        if (asset == nativeAsset) {
            if (msg.value == 0) revert SharedErrors.InvalidAmount();
            amount = msg.value;
        } else {
            if (amount == 0) revert SharedErrors.InvalidAmount();
            if (msg.value != 0) revert SharedErrors.InvalidInput();
            IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        }
        emit VaultFunded(asset, amount, msg.sender);
    }

    receive() external payable whenNotPaused {
        if (msg.value == 0) revert SharedErrors.InvalidAmount();
        if (!assetEnabled[nativeAsset]) revert SharedErrors.AssetDisabled();
        emit VaultFunded(nativeAsset, msg.value, msg.sender);
    }

    /// @notice Credit user claimable reward (DB_MANAGER). Does not transfer tokens.
    function creditReward(address user, address asset, uint256 amount, bytes32 requestId)
        external
        whenNotPaused
        nonReentrant
        onlyRole(DB_MANAGER_ROLE)
        onlyEnabledAsset(asset)
    {
        if (user == address(0)) revert SharedErrors.InvalidAddress();
        if (amount == 0) revert SharedErrors.InvalidAmount();
        if (processedRequestIds[requestId]) revert SharedErrors.DuplicateRequestId();

        uint256 liquid = liquidBalance(asset);
        if (liquid < amount) revert SharedErrors.InsufficientBalance();

        processedRequestIds[requestId] = true;
        _claimable[user][asset] += amount;
        reserved[asset] += amount;

        emit RewardCredited(user, asset, amount, requestId);
    }

    /// @notice User withdraws claimable amount when vault has liquidity
    function withdraw(address asset, uint256 amount)
        external
        whenNotPaused
        nonReentrant
        onlyEnabledAsset(asset)
    {
        if (amount == 0) revert SharedErrors.InvalidAmount();
        uint256 owed = _claimable[msg.sender][asset];
        if (owed < amount) revert SharedErrors.InsufficientBalance();
        if (liquidBalance(asset) < amount) revert SharedErrors.InsufficientBalance();

        _claimable[msg.sender][asset] = owed - amount;
        reserved[asset] -= amount;

        if (asset == nativeAsset) {
            TransferHelper.transferNative(msg.sender, amount);
        } else {
            IERC20(asset).safeTransfer(msg.sender, amount);
        }

        emit RewardWithdrawn(msg.sender, asset, amount, bytes32(0));
    }

    function claimable(address user, address asset) external view returns (uint256) {
        return _claimable[user][asset];
    }

    /// @notice Unreserved holdings available to back new credits / withdrawals
    function liquidBalance(address asset) public view returns (uint256) {
        uint256 held = asset == nativeAsset ? address(this).balance : IERC20(asset).balanceOf(address(this));
        uint256 res = reserved[asset];
        return held > res ? held - res : 0;
    }

    function canWithdraw(address user, address asset, uint256 amount) external view returns (bool) {
        if (amount == 0) return false;
        if (_claimable[user][asset] < amount) return false;
        // For withdraw, liquid must cover amount; reserved includes this user's claimable
        uint256 held = asset == nativeAsset ? address(this).balance : IERC20(asset).balanceOf(address(this));
        return held >= amount;
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
}
