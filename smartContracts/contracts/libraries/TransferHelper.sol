// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title TransferHelper
/// @notice Library for safe native and ERC20 transfers
library TransferHelper {
    error NativeTransferFailed();
    error ERC20TransferFailed();

    /// @notice Transfers native asset (CELO) to a recipient
    /// @param to The recipient address
    /// @param amount The amount to transfer
    function transferNative(address to, uint256 amount) internal {
        (bool success,) = to.call{value: amount}("");
        if (!success) revert NativeTransferFailed();
    }

    /// @notice Transfers ERC20 tokens to a recipient
    /// @param token The ERC20 token contract
    /// @param to The recipient address
    /// @param amount The amount to transfer
    function transferERC20(IERC20 token, address to, uint256 amount) internal {
        if (!token.transfer(to, amount)) revert ERC20TransferFailed();
    }
}
