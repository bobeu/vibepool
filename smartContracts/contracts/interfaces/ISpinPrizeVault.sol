// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface ISpinPrizeVault {
    event VaultFunded(address indexed asset, uint256 amount, address indexed from);
    event RewardCredited(
        address indexed user,
        address indexed asset,
        uint256 amount,
        bytes32 indexed requestId
    );
    event RewardWithdrawn(
        address indexed user,
        address indexed asset,
        uint256 amount,
        bytes32 indexed requestId
    );

    function fund(address asset, uint256 amount) external payable;

    function creditReward(address user, address asset, uint256 amount, bytes32 requestId) external;

    function withdraw(address asset, uint256 amount) external;

    function claimable(address user, address asset) external view returns (uint256);

    function liquidBalance(address asset) external view returns (uint256);

    function canWithdraw(address user, address asset, uint256 amount) external view returns (bool);
}
