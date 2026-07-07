// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IPointsManager {
    function pointsOf(address user) external view returns (uint256);
    function awardPoints(address user, uint256 amount, string calldata reason) external;
}
