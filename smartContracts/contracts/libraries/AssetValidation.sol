// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @title AssetValidation
/// @notice Reusable library for validating supported assets in the treasury
library AssetValidation {
    error AssetNotEnabled();
    error ZeroAssetAddress();

    struct AssetInfo {
        address assetAddress;
        string symbol;
        uint8 decimals;
        bool enabled;
    }

    /// @notice Reverts if the asset is not enabled
    /// @param asset The asset info to validate
    function validateEnabled(AssetInfo memory asset) internal pure {
        if (!asset.enabled) revert AssetNotEnabled();
    }

    /// @notice Reverts if the asset address is zero
    /// @param assetAddress The address to validate
    function validateAddress(address assetAddress) internal pure {
        if (assetAddress == address(0)) revert ZeroAssetAddress();
    }
}
