// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Test } from "forge-std/Test.sol";
import { PointsManager } from "../contracts/PointsManager.sol";

contract PointsManagerFuzzTest is Test {
  PointsManager pointsManager;

  function setUp() public {
    pointsManager = new PointsManager(address(0), address(0));
  }

  function testFuzz_GrantXP(uint256 amount) public {
    bytes32 requestId = keccak256(abi.encodePacked(block.timestamp, msg.sender, amount));
    vm.prank(address(this));
    pointsManager.grantXP(msg.sender, amount, requestId);
  }

  function testFuzz_GrantPoints(uint256 amount) public {
    bytes32 requestId = keccak256(abi.encodePacked(block.timestamp, msg.sender, amount));
    vm.prank(address(this));
    pointsManager.grantPoints(msg.sender, amount, requestId);
  }
}
