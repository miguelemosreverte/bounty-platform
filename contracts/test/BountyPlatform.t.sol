// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/BountyPlatform.sol";
import "../src/Leaderboard.sol";

contract BountyPlatformTest is Test {
    BountyPlatform public platform;
    Leaderboard public leaderboard;

    address oracle = address(this);
    address maintainer = address(0x1);
    address contributorA = address(0x2);
    address contributorB = address(0x3);

    function setUp() public {
        platform = new BountyPlatform();
        leaderboard = new Leaderboard();
        vm.deal(maintainer, 10 ether);
        vm.deal(contributorA, 1 ether);
        vm.deal(contributorB, 1 ether);
    }

    function testCreateBounty() public {
        vm.prank(maintainer);
        uint256 id = platform.createBounty{value: 1 ether}("miguelemosreverte", "playground-01", 1);
        assertEq(id, 1);

        (
            uint256 bid,
            address m,
            , , ,
            , ,
            uint256 amount,
            ,
            BountyPlatform.BountyStatus status,
            ,
        ) = platform.bounties(id);

        assertEq(bid, 1);
        assertEq(m, maintainer);
        assertEq(amount, 1 ether);
        assertEq(uint8(status), uint8(BountyPlatform.BountyStatus.Open));
        assertEq(address(platform).balance, 1 ether);
    }

    function testCreateBountyRequiresFunding() public {
        vm.prank(maintainer);
        vm.expectRevert("Must fund bounty");
        platform.createBounty{value: 0}("owner", "repo", 1);
    }

    function testDuplicateBountyReverts() public {
        vm.prank(maintainer);
        platform.createBounty{value: 1 ether}("owner", "repo", 1);

        vm.prank(maintainer);
        vm.expectRevert("Bounty exists");
        platform.createBounty{value: 1 ether}("owner", "repo", 1);
    }

    function testSubmitSolution() public {
        vm.prank(maintainer);
        platform.createBounty{value: 1 ether}("owner", "repo", 1);

        uint256 sid = platform.submitSolution(1, contributorA, 10, "abc123");
        assertEq(sid, 1);
        assertEq(platform.solutionCount(1), 1);

        BountyPlatform.Solution memory s = platform.getSolution(1, 0);
        assertEq(s.contributor, contributorA);
        assertEq(s.prNumber, 10);
        assertEq(uint8(s.status), uint8(BountyPlatform.SolutionStatus.Submitted));
    }

    function testOnlyOwnerCanSubmitSolution() public {
        vm.prank(maintainer);
        platform.createBounty{value: 1 ether}("owner", "repo", 1);

        vm.prank(contributorA);
        vm.expectRevert("Not oracle");
        platform.submitSolution(1, contributorA, 10, "abc123");
    }

    function testAcceptSolution() public {
        vm.prank(maintainer);
        platform.createBounty{value: 1 ether}("owner", "repo", 1);

        platform.submitSolution(1, contributorA, 10, "abc123");

        uint256 balBefore = contributorA.balance;
        platform.acceptSolution(1, 0);
        uint256 balAfter = contributorA.balance;

        assertEq(balAfter - balBefore, 1 ether);

        (, , , , , , , uint256 amount, , BountyPlatform.BountyStatus status, , ) = platform.bounties(1);
        assertEq(amount, 0);
        assertEq(uint8(status), uint8(BountyPlatform.BountyStatus.Closed));

        BountyPlatform.Solution memory s = platform.getSolution(1, 0);
        assertEq(uint8(s.status), uint8(BountyPlatform.SolutionStatus.Accepted));
    }

    function testCancelBounty() public {
        vm.prank(maintainer);
        platform.createBounty{value: 1 ether}("owner", "repo", 1);

        uint256 balBefore = maintainer.balance;
        vm.prank(maintainer);
        platform.cancelBounty(1);
        uint256 balAfter = maintainer.balance;

        assertEq(balAfter - balBefore, 1 ether);

        (, , , , , , , uint256 amount, , BountyPlatform.BountyStatus status, , ) = platform.bounties(1);
        assertEq(amount, 0);
        assertEq(uint8(status), uint8(BountyPlatform.BountyStatus.Cancelled));
    }

    function testUpdateMetadata() public {
        vm.prank(maintainer);
        platform.createBounty{value: 1 ether}("owner", "repo", 1);

        platform.updateBountyMetadata(1, "prd-hash-123", "qa-hash-456", 7);

        (, , , , , string memory prd, string memory qa, , uint256 complexity, , , ) = platform.bounties(1);
        assertEq(prd, "prd-hash-123");
        assertEq(qa, "qa-hash-456");
        assertEq(complexity, 7);
    }

    function testFullLifecycle() public {
        // 1. Maintainer creates bounty
        vm.prank(maintainer);
        uint256 bountyId = platform.createBounty{value: 2 ether}("miguelemosreverte", "playground-01", 42);

        // 2. Oracle updates metadata (after agents run)
        platform.updateBountyMetadata(bountyId, "prd-hash", "qa-hash", 5);

        // 3. Two contributors submit solutions
        platform.submitSolution(bountyId, contributorA, 100, "commit-a");
        platform.submitSolution(bountyId, contributorB, 101, "commit-b");
        assertEq(platform.solutionCount(bountyId), 2);

        // 4. Oracle accepts contributor A's solution (index 0)
        uint256 balBefore = contributorA.balance;
        platform.acceptSolution(bountyId, 0);
        assertEq(contributorA.balance - balBefore, 2 ether);

        // 5. Bounty is closed
        (, , , , , , , , , BountyPlatform.BountyStatus status, , ) = platform.bounties(bountyId);
        assertEq(uint8(status), uint8(BountyPlatform.BountyStatus.Closed));

        // 6. Update leaderboard
        leaderboard.recordBountyCompleted(contributorA, maintainer, 2 ether);
        Leaderboard.Score memory cs = leaderboard.getScore(contributorA, 0);
        assertEq(cs.totalBounties, 1);
        assertEq(cs.totalPayout, 2 ether);
        assertEq(cs.reputation, 10);

        Leaderboard.Score memory ms = leaderboard.getScore(maintainer, 1);
        assertEq(ms.totalBounties, 1);
        assertEq(ms.reputation, 5);
    }
}
