// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/BountyPlatform.sol";
import "../src/Leaderboard.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        BountyPlatform bounty = new BountyPlatform();
        Leaderboard leaderboard = new Leaderboard();

        vm.stopBroadcast();

        console.log("BountyPlatform deployed at:", address(bounty));
        console.log("Leaderboard deployed at:", address(leaderboard));
    }
}
