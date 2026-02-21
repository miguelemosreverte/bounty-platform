// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Leaderboard {
    enum ActorType { Contributor, Maintainer, Plugin }

    struct Score {
        uint256 totalBounties;
        uint256 totalPayout;
        int256 reputation;
    }

    address public owner;
    mapping(address => mapping(uint8 => Score)) public scores;

    event ReputationUpdated(address indexed actor, uint8 actorType, int256 newReputation);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not oracle");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function recordBountyCompleted(
        address contributor,
        address maintainer,
        uint256 payoutAmount
    ) external onlyOwner {
        Score storage cs = scores[contributor][uint8(ActorType.Contributor)];
        cs.totalBounties++;
        cs.totalPayout += payoutAmount;
        cs.reputation += 10;
        emit ReputationUpdated(contributor, uint8(ActorType.Contributor), cs.reputation);

        Score storage ms = scores[maintainer][uint8(ActorType.Maintainer)];
        ms.totalBounties++;
        ms.totalPayout += payoutAmount;
        ms.reputation += 5;
        emit ReputationUpdated(maintainer, uint8(ActorType.Maintainer), ms.reputation);
    }

    function penalize(address actor, uint8 actorType, int256 amount) external onlyOwner {
        scores[actor][actorType].reputation -= amount;
        emit ReputationUpdated(actor, actorType, scores[actor][actorType].reputation);
    }

    function getScore(address actor, uint8 actorType) external view returns (Score memory) {
        return scores[actor][actorType];
    }
}
