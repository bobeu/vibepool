// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { SafeERC20, IERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { SharedErrors } from "./SharedErrors.sol";
import { TransferHelper } from "./libraries/TransferHelper.sol";
import { ISpinEconomy } from "./interfaces/ISpinEconomy.sol";
import { IRewardTreasury } from "./interfaces/IRewardTreasury.sol";

/// @title SpinEconomy
/// @notice Contract-only entry fees and item purchases; splits to treasury + SpinPrizeVault.
contract SpinEconomy is ISpinEconomy, AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    address public immutable nativeAsset;
    address public treasury;
    address public prizeVault;
    uint16 public treasuryBps; // e.g. 7000 = 70%

    mapping(address => bool) public assetEnabled;
    mapping(address => uint8) public assetDecimals;
    address[] public assetList;

    modifier onlyEnabledAsset(address asset) {
        if (!assetEnabled[asset]) revert SharedErrors.AssetDisabled();
        _;
    }

    constructor(address _nativeAsset, address _treasury, address _prizeVault, uint16 _treasuryBps) {
        if (_treasury == address(0) || _prizeVault == address(0)) revert SharedErrors.InvalidAddress();
        if (_treasuryBps > 10_000) revert SharedErrors.InvalidInput();

        nativeAsset = _nativeAsset;
        treasury = _treasury;
        prizeVault = _prizeVault;
        treasuryBps = _treasuryBps;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);

        assetEnabled[_nativeAsset] = true;
        assetDecimals[_nativeAsset] = 18;
        assetList.push(_nativeAsset);
    }

    function enableAsset(address asset, uint8 decimals_) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (asset == address(0)) revert SharedErrors.InvalidAddress();
        if (assetEnabled[asset]) revert SharedErrors.AssetAlreadyExists();
        assetEnabled[asset] = true;
        assetDecimals[asset] = decimals_;
        assetList.push(asset);
    }

    function setTreasuryBps(uint16 bps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (bps > 10_000) revert SharedErrors.InvalidInput();
        treasuryBps = bps;
        emit SplitUpdated(bps);
    }

    function setTreasury(address t) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (t == address(0)) revert SharedErrors.InvalidAddress();
        treasury = t;
        emit TreasuryUpdated(t);
    }

    function setPrizeVault(address v) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (v == address(0)) revert SharedErrors.InvalidAddress();
        prizeVault = v;
        emit VaultUpdated(v);
    }

    function payEntry(address asset, uint256 amount, bytes32 sessionRef)
        external
        payable
        whenNotPaused
        nonReentrant
        onlyEnabledAsset(asset)
    {
        amount = _intake(asset, amount);
        (uint256 toTreasury, uint256 toVault) = _split(amount);
        _forward(asset, toTreasury, toVault);
        emit EntryPaid(msg.sender, asset, amount, toTreasury, toVault, sessionRef);
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
        (uint256 toTreasury, uint256 toVault) = _split(amount);
        _forward(asset, toTreasury, toVault);
        emit ItemPurchased(msg.sender, itemId, asset, amount, toTreasury, toVault);
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

    function _split(uint256 amount) private view returns (uint256 toTreasury, uint256 toVault) {
        toTreasury = (amount * treasuryBps) / 10_000;
        toVault = amount - toTreasury;
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
