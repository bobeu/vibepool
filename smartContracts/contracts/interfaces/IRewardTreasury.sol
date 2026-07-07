// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IRewardTreasury {
    function treasuryBalance() external view returns (uint256);
    function claimReward(address user, uint256 roundId) external returns (uint256);
}
