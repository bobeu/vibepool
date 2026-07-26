// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Script, console } from "forge-std/Script.sol";
import { RewardTreasury } from "../contracts/RewardTreasury.sol";
import { ActivityRegistry } from "../contracts/ActivityRegistry.sol";
import { SpinRewardManager } from "../contracts/SpinRewardManager.sol";
import { PointsManager } from "../contracts/PointsManager.sol";

/// @notice Foundry deploy script for Celo mainnet.
/// @dev Does not broadcast unless you run with --broadcast. Enables USDm after deploy.
contract DeployVibepool is Script {
  /// USDm on Celo mainnet (legacy cUSD address).
  address constant USDM = 0x765DE816845861e75A25fCA122bb6898B8B1282a;

  function run() external {
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    address backendSigner = vm.envOr("BACKEND_SIGNER", address(0));

    vm.startBroadcast(deployerPrivateKey);

    RewardTreasury treasury = new RewardTreasury(address(0));
    ActivityRegistry activity = new ActivityRegistry();
    SpinRewardManager spin = new SpinRewardManager();
    PointsManager points = new PointsManager(address(activity), address(spin));

    treasury.enableAsset(USDM, "USDm", 18);

    if (backendSigner != address(0)) {
      treasury.grantRole(treasury.REWARD_MANAGER_ROLE(), backendSigner);
    }

    vm.stopBroadcast();

    console.log("RewardTreasury:", address(treasury));
    console.log("ActivityRegistry:", address(activity));
    console.log("SpinRewardManager:", address(spin));
    console.log("PointsManager:", address(points));
    console.log("USDm enabled:", USDM);
  }
}
