// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @title LevelMath
/// @notice Library for calculating player level from XP
library LevelMath {
    /// @notice Calculates level from total XP (1 level per 1000 XP)
    /// @param xp The total experience points
    /// @return The calculated level
    function calculateLevel(uint256 xp) internal pure returns (uint256) {
        return xp / 1000;
    }
}
