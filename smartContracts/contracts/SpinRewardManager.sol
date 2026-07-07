// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { ISpinRewardManager } from "./interfaces/ISpinRewardManager.sol";

contract SpinRewardManager is ISpinRewardManager {
    function availableSpins(address) external pure returns (uint256) {
        return 0;
    }

    function executeSpin(address) external pure returns (uint256) {
        return 0;
    }
}
