// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Script, console } from "forge-std/Script.sol";
import { RewardTreasury } from "../contracts/RewardTreasury.sol";
import { ActivityRegistry } from "../contracts/ActivityRegistry.sol";
import { SpinRewardManager } from "../contracts/SpinRewardManager.sol";
import { PointsManager } from "../contracts/PointsManager.sol";

contract DeployVibepool is Script {
  function run() external {
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY_CROSS_0xD7c");
    vm.startBroadcast(deployerPrivateKey);

    RewardTreasury treasury = new RewardTreasury(address(0));
    ActivityRegistry activity = new ActivityRegistry();
    SpinRewardManager spin = new SpinRewardManager();
    PointsManager points = new PointsManager(address(activity), address(spin));

    vm.stopBroadcast();

    console.log("RewardTreasury:", address(treasury));
    console.log("ActivityRegistry:", address(activity));
    console.log("SpinRewardManager:", address(spin));
    console.log("PointsManager:", address(points));
  }
}
