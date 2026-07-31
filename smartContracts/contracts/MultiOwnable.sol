// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { SharedErrors } from "./SharedErrors.sol";

contract MultiOwnable {
    mapping(address => bool) public isOwner;
    uint256 public ownerCount;

    event OwnerAdded(address indexed owner);
    event OwnerRemoved(address indexed owner);

    modifier onlyOwner() {
        if (!isOwner[msg.sender]) revert SharedErrors.Unauthorized();
        _;
    }

    constructor(address[] memory initialOwners) {
        if (initialOwners.length == 0) revert SharedErrors.InvalidInput();
        for (uint256 i = 0; i < initialOwners.length; i++) {
            address ownerAddr = initialOwners[i];
            if (ownerAddr == address(0)) revert SharedErrors.InvalidAddress();
            if (!isOwner[ownerAddr]) {
                isOwner[ownerAddr] = true;
                ownerCount++;
                emit OwnerAdded(ownerAddr);
            }
        }
    }

    function addOwner(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert SharedErrors.InvalidAddress();
        if (isOwner[newOwner]) revert SharedErrors.InvalidInput();
        isOwner[newOwner] = true;
        ownerCount++;
        emit OwnerAdded(newOwner);
    }

    function removeOwner(address ownerToRemove) external onlyOwner {
        if (!isOwner[ownerToRemove]) revert SharedErrors.InvalidInput();
        if (ownerCount <= 1) revert SharedErrors.InvalidInput();
        isOwner[ownerToRemove] = false;
        ownerCount--;
        emit OwnerRemoved(ownerToRemove);
    }

    function renounceOwnership() external onlyOwner {
        if (ownerCount <= 1) revert SharedErrors.InvalidInput();
        isOwner[msg.sender] = false;
        ownerCount--;
        emit OwnerRemoved(msg.sender);
    }
}
