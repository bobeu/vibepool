// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface ISpinRewardManager {
    function availableSpins(address user) external view returns (uint256);
    function executeSpin(address user) external returns (uint256 rewardAmount);
}
