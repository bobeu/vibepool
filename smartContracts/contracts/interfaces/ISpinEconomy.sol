// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface ISpinEconomy {
    event EntryPaid(
        address indexed user,
        address indexed asset,
        uint256 amount,
        uint256 treasuryShare,
        uint256 vaultShare,
        bytes32 indexed sessionRef
    );

    event ItemPurchased(
        address indexed user,
        bytes32 indexed itemId,
        address indexed asset,
        uint256 amount,
        uint256 treasuryShare,
        uint256 vaultShare
    );

    event SplitUpdated(uint16 treasuryBps);
    event TreasuryUpdated(address treasury);
    event VaultUpdated(address vault);

    function payEntry(address asset, uint256 amount, bytes32 sessionRef) external payable;

    function purchaseItem(bytes32 itemId, address asset, uint256 amount) external payable;

    function treasuryBps() external view returns (uint16);
}
