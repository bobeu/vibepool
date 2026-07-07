// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { IPredictionManager } from "./interfaces/IPredictionManager.sol";

/// @title PredictionManager
/// @notice Architecture stub — logic implemented in Prompt 2
contract PredictionManager is IPredictionManager {
    function getRoundData() external pure returns (RoundData memory) {
        return RoundData(0, 0, 0, 0, 0, false);
    }

    function owner() external pure returns (address) {
        return address(0);
    }
}
