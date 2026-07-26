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

    /// @notice EIP-2612: signature + pull in one user transaction (no prior approve tx).
    function payEntryWithPermit(
        address asset,
        uint256 amount,
        bytes32 sessionRef,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;

    /// @notice EIP-2612: signature + pull in one user transaction (no prior approve tx).
    function purchaseItemWithPermit(
        bytes32 itemId,
        address asset,
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;

    function treasuryBps() external view returns (uint16);
}
