// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { IPointsManager } from "./interfaces/IPointsManager.sol";

contract PointsManager is IPointsManager {
    function pointsOf(address) external pure returns (uint256) {
        return 0;
    }

    function awardPoints(address, uint256, string calldata) external pure {}
}
