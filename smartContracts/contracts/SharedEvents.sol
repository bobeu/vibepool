// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

event RoundStarted(uint256 indexed roundId, uint256 startPrice, uint256 timestamp);
event RoundEnded(uint256 indexed roundId, uint256 endPrice, uint256 timestamp);
event PredictionPlaced(address indexed user, uint256 indexed roundId, bool higher, uint256 amount);
event RewardClaimed(address indexed user, uint256 indexed roundId, uint256 amount);
event PointsAwarded(address indexed user, uint256 amount, string reason);
event SpinExecuted(address indexed user, uint256 rewardAmount);
