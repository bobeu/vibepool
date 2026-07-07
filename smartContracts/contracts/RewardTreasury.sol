// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { IRewardTreasury } from "./interfaces/IRewardTreasury.sol";

contract RewardTreasury is IRewardTreasury {
    function treasuryBalance() external pure returns (uint256) {
        return 0;
    }

    function claimReward(address, uint256) external pure returns (uint256) {
        return 0;
    }
}
