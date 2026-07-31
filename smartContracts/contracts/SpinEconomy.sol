// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { SafeERC20, IERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IERC20Permit } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import { SharedErrors } from "./SharedErrors.sol";
import { ISpinEconomy } from "./interfaces/ISpinEconomy.sol";
import { IRewardTreasury } from "./interfaces/IRewardTreasury.sol";
import { IPointsManager } from "./interfaces/IPointsManager.sol";
import { MultiOwnable } from "./MultiOwnable.sol";

/// @title SpinEconomy
/// @notice Contract-only entry fees and item purchases; forwards 100% to treasury.
/// @dev ERC20 users can call *WithPermit (OpenZeppelin IERC20Permit / EIP-2612) for a single tx.
contract SpinEconomy is ISpinEconomy, AccessControl, ReentrancyGuard, Pausable, MultiOwnable {
    using SafeERC20 for IERC20;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    address public immutable nativeAsset;
    address public treasury;
    address public prizeVault;
    uint16 public treasuryBps; // preserved for interface compatibility, set to 10_000 internally

    address public pointsManager;
    uint256 public pointsReward; // Amount of XP & Points awarded per item purchase

    mapping(address => bool) public assetEnabled;
    mapping(address => uint8) public assetDecimals;
    address[] public assetList;

    modifier onlyEnabledAsset(address asset) {
        if (!assetEnabled[asset]) revert SharedErrors.AssetDisabled();
        _;
    }

    constructor(
        address _nativeAsset,
        address _treasury,
        address _prizeVault,
        uint16 _treasuryBps,
        address _pointsManager,
        address[] memory initialOwners
    ) MultiOwnable(initialOwners) {
        if (_treasury == address(0) || _prizeVault == address(0)) revert SharedErrors.InvalidAddress();
        if (_treasuryBps > 10_000) revert SharedErrors.InvalidInput();

        nativeAsset = _nativeAsset;
        treasury = _treasury;
        prizeVault = _prizeVault;
        treasuryBps = 10_000; // Force 100% to treasury
        pointsManager = _pointsManager;

        for (uint256 i = 0; i < initialOwners.length; i++) {
            _grantRole(DEFAULT_ADMIN_ROLE, initialOwners[i]);
            _grantRole(PAUSER_ROLE, initialOwners[i]);
        }

        assetEnabled[_nativeAsset] = true;
        assetDecimals[_nativeAsset] = 18;
        assetList.push(_nativeAsset);
    }

    function enableAsset(address asset, uint8 decimals_) external onlyOwner {
        if (asset == address(0)) revert SharedErrors.InvalidAddress();
        if (assetEnabled[asset]) revert SharedErrors.AssetAlreadyExists();
        assetEnabled[asset] = true;
        assetDecimals[asset] = decimals_;
        assetList.push(asset);
    }

    function setTreasuryBps(uint16 bps) external onlyOwner {
        if (bps > 10_000) revert SharedErrors.InvalidInput();
        treasuryBps = bps;
        emit SplitUpdated(bps);
    }

    function setTreasury(address t) external onlyOwner {
        if (t == address(0)) revert SharedErrors.InvalidAddress();
        treasury = t;
        emit TreasuryUpdated(t);
    }

    function setPrizeVault(address v) external onlyOwner {
        if (v == address(0)) revert SharedErrors.InvalidAddress();
        prizeVault = v;
        emit VaultUpdated(v);
    }

    function setPointsReward(uint256 _pointsReward) external onlyOwner {
        pointsReward = _pointsReward;
    }

    function setPointsManager(address _pointsManager) external onlyOwner {
        pointsManager = _pointsManager;
    }

    function payEntry(address asset, uint256 amount, bytes32 sessionRef)
        external
        payable
        whenNotPaused
        nonReentrant
        onlyEnabledAsset(asset)
    {
        amount = _intake(asset, amount);
        _forward(asset, amount, 0);
        emit EntryPaid(msg.sender, asset, amount, amount, 0, sessionRef);
    }

    function purchaseItem(bytes32 itemId, address asset, uint256 amount)
        external
        payable
        whenNotPaused
        nonReentrant
        onlyEnabledAsset(asset)
    {
        if (itemId == bytes32(0)) revert SharedErrors.InvalidInput();
        amount = _intake(asset, amount);
        _forward(asset, amount, 0);

        if (pointsManager != address(0) && pointsReward > 0) {
            bytes32 xpReq = keccak256(abi.encodePacked(msg.sender, itemId, block.timestamp, "XP"));
            bytes32 ptsReq = keccak256(abi.encodePacked(msg.sender, itemId, block.timestamp, "PTS"));
            IPointsManager(pointsManager).grantXP(msg.sender, pointsReward, xpReq);
            IPointsManager(pointsManager).grantPoints(msg.sender, pointsReward, ptsReq);
        }

        emit ItemPurchased(msg.sender, itemId, asset, amount, amount, 0);
    }

    /// @inheritdoc ISpinEconomy
    function payEntryWithPermit(
        address asset,
        uint256 amount,
        bytes32 sessionRef,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external whenNotPaused nonReentrant onlyEnabledAsset(asset) {
        if (asset == nativeAsset) revert SharedErrors.InvalidInput();
        if (amount == 0) revert SharedErrors.InvalidAmount();
        _permit(asset, amount, deadline, v, r, s);
        amount = _intake(asset, amount);
        _forward(asset, amount, 0);
        emit EntryPaid(msg.sender, asset, amount, amount, 0, sessionRef);
    }

    /// @inheritdoc ISpinEconomy
    function purchaseItemWithPermit(
        bytes32 itemId,
        address asset,
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external whenNotPaused nonReentrant onlyEnabledAsset(asset) {
        if (itemId == bytes32(0)) revert SharedErrors.InvalidInput();
        if (asset == nativeAsset) revert SharedErrors.InvalidInput();
        if (amount == 0) revert SharedErrors.InvalidAmount();
        _permit(asset, amount, deadline, v, r, s);
        amount = _intake(asset, amount);
        _forward(asset, amount, 0);

        if (pointsManager != address(0) && pointsReward > 0) {
            bytes32 xpReq = keccak256(abi.encodePacked(msg.sender, itemId, block.timestamp, "XP"));
            bytes32 ptsReq = keccak256(abi.encodePacked(msg.sender, itemId, block.timestamp, "PTS"));
            IPointsManager(pointsManager).grantXP(msg.sender, pointsReward, xpReq);
            IPointsManager(pointsManager).grantPoints(msg.sender, pointsReward, ptsReq);
        }

        emit ItemPurchased(msg.sender, itemId, asset, amount, amount, 0);
    }

    function _permit(address asset, uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s) private {
        IERC20Permit(asset).permit(msg.sender, address(this), amount, deadline, v, r, s);
    }

    function _intake(address asset, uint256 amount) private returns (uint256) {
        if (asset == nativeAsset) {
            if (msg.value == 0) revert SharedErrors.InvalidAmount();
            return msg.value;
        }
        if (amount == 0) revert SharedErrors.InvalidAmount();
        if (msg.value != 0) revert SharedErrors.InvalidInput();
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        return amount;
    }

    function _forward(address asset, uint256 toTreasury, uint256 toVault) private {
        if (asset == nativeAsset) {
            if (toTreasury > 0) {
                IRewardTreasury(treasury).deposit{ value: toTreasury }();
            }
            if (toVault > 0) {
                (bool ok,) = prizeVault.call{ value: toVault }("");
                if (!ok) revert SharedErrors.TransferFailed();
            }
        } else {
            if (toTreasury > 0) {
                IERC20(asset).forceApprove(treasury, toTreasury);
                IRewardTreasury(treasury).depositERC20(asset, toTreasury);
            }
            if (toVault > 0) {
                IERC20(asset).safeTransfer(prizeVault, toVault);
            }
        }
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
}
