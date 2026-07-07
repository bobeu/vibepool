// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IPredictionManager {
    struct RoundData {
        uint256 roundId;
        uint256 higherPool;
        uint256 lowerPool;
        uint256 startPrice;
        uint256 endPrice;
        bool isRoundActive;
    }

    function getRoundData() external view returns (RoundData memory);
    function owner() external view returns (address);
    // Implementation in Prompt 2
}
