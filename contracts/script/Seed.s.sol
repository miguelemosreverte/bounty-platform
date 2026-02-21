// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/BountyPlatform.sol";
import "../src/Leaderboard.sol";

/// @notice Seeds the chain with realistic initial data for E2E testing.
///         Creates 2 bounties, 1 accepted solution, and leaderboard entries.
contract Seed is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address bountyAddr = vm.envAddress("BOUNTY_CONTRACT_ADDRESS");
        address leaderAddr = vm.envAddress("LEADERBOARD_CONTRACT_ADDRESS");

        BountyPlatform bounty = BountyPlatform(payable(bountyAddr));
        Leaderboard leaderboard = Leaderboard(leaderAddr);

        address deployer = vm.addr(deployerKey);
        // Anvil account #1 — acts as a pre-existing contributor
        address contributor = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;

        vm.startBroadcast(deployerKey);

        // --- Bounty 1: seed/pioneers#100 — closed with accepted solution ---
        uint256 amount1 = 0.05 ether;
        uint256 id1 = bounty.createBounty{value: amount1}("seed", "pioneers", 100);
        bounty.updateBountyMetadata(id1, "QmSeedPRD1abc123", "QmSeedQA1xyz789", 5);
        bounty.submitSolution(id1, contributor, 10, "seedcommit1a2b3c4d");
        bounty.acceptSolution(id1, 0);
        leaderboard.recordBountyCompleted(contributor, deployer, amount1);

        // --- Bounty 2: seed/pioneers#200 — open, no solutions ---
        uint256 amount2 = 0.03 ether;
        uint256 id2 = bounty.createBounty{value: amount2}("seed", "pioneers", 200);
        bounty.updateBountyMetadata(id2, "QmSeedPRD2def456", "QmSeedQA2uvw012", 3);

        vm.stopBroadcast();

        console.log("Seed bounty 1 (closed):", id1);
        console.log("Seed bounty 2 (open):", id2);
        console.log("Contributor:", contributor);
        console.log("Maintainer:", deployer);
    }
}
