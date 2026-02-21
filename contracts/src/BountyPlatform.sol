// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BountyPlatform {
    enum BountyStatus { Open, Closed, Cancelled }
    enum SolutionStatus { Submitted, Accepted, Rejected }

    struct Bounty {
        uint256 id;
        address maintainer;
        string repoOwner;
        string repoName;
        uint256 issueNumber;
        string prdHash;
        string qaHash;
        uint256 amount;
        uint256 estimatedComplexity;
        BountyStatus status;
        uint256 createdAt;
        uint256 closedAt;
    }

    struct Solution {
        uint256 id;
        uint256 bountyId;
        address contributor;
        uint256 prNumber;
        string commitHash;
        uint8 score;
        SolutionStatus status;
        uint256 submittedAt;
    }

    address public owner;
    uint256 public nextBountyId;
    uint256 public nextSolutionId;

    mapping(uint256 => Bounty) public bounties;
    mapping(uint256 => Solution[]) internal _solutions;
    mapping(bytes32 => uint256) public issueToBounty;

    event BountyCreated(
        uint256 indexed bountyId,
        address indexed maintainer,
        string repoOwner,
        string repoName,
        uint256 issueNumber,
        uint256 amount
    );
    event SolutionSubmitted(
        uint256 indexed bountyId,
        uint256 indexed solutionId,
        address indexed contributor,
        uint256 prNumber
    );
    event SolutionAccepted(
        uint256 indexed bountyId,
        uint256 indexed solutionId,
        address indexed contributor,
        uint256 payout
    );
    event BountyCancelled(uint256 indexed bountyId);
    event BountyMetadataUpdated(
        uint256 indexed bountyId,
        string prdHash,
        string qaHash,
        uint256 estimatedComplexity
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not oracle");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function createBounty(
        string calldata repoOwner,
        string calldata repoName,
        uint256 issueNumber
    ) external payable returns (uint256) {
        require(msg.value > 0, "Must fund bounty");
        bytes32 key = keccak256(abi.encodePacked(repoOwner, repoName, issueNumber));
        require(issueToBounty[key] == 0, "Bounty exists");

        uint256 id = ++nextBountyId;
        bounties[id] = Bounty({
            id: id,
            maintainer: msg.sender,
            repoOwner: repoOwner,
            repoName: repoName,
            issueNumber: issueNumber,
            prdHash: "",
            qaHash: "",
            amount: msg.value,
            estimatedComplexity: 0,
            status: BountyStatus.Open,
            createdAt: block.timestamp,
            closedAt: 0
        });
        issueToBounty[key] = id;
        emit BountyCreated(id, msg.sender, repoOwner, repoName, issueNumber, msg.value);
        return id;
    }

    function updateBountyMetadata(
        uint256 bountyId,
        string calldata prdHash,
        string calldata qaHash,
        uint256 estimatedComplexity
    ) external onlyOwner {
        Bounty storage b = bounties[bountyId];
        require(b.id != 0, "Not found");
        b.prdHash = prdHash;
        b.qaHash = qaHash;
        b.estimatedComplexity = estimatedComplexity;
        emit BountyMetadataUpdated(bountyId, prdHash, qaHash, estimatedComplexity);
    }

    function submitSolution(
        uint256 bountyId,
        address contributor,
        uint256 prNumber,
        string calldata commitHash
    ) external onlyOwner returns (uint256) {
        Bounty storage b = bounties[bountyId];
        require(b.status == BountyStatus.Open, "Not open");

        uint256 sid = ++nextSolutionId;
        _solutions[bountyId].push(Solution({
            id: sid,
            bountyId: bountyId,
            contributor: contributor,
            prNumber: prNumber,
            commitHash: commitHash,
            score: 0,
            status: SolutionStatus.Submitted,
            submittedAt: block.timestamp
        }));
        emit SolutionSubmitted(bountyId, sid, contributor, prNumber);
        return sid;
    }

    function acceptSolution(uint256 bountyId, uint256 solutionIndex) external onlyOwner {
        Bounty storage b = bounties[bountyId];
        require(b.status == BountyStatus.Open, "Not open");
        require(solutionIndex < _solutions[bountyId].length, "Bad index");
        Solution storage s = _solutions[bountyId][solutionIndex];
        require(s.status == SolutionStatus.Submitted, "Bad status");

        s.status = SolutionStatus.Accepted;
        b.status = BountyStatus.Closed;
        b.closedAt = block.timestamp;

        uint256 payout = b.amount;
        b.amount = 0;

        (bool ok, ) = s.contributor.call{value: payout}("");
        require(ok, "Transfer failed");

        emit SolutionAccepted(bountyId, s.id, s.contributor, payout);
    }

    function cancelBounty(uint256 bountyId) external {
        Bounty storage b = bounties[bountyId];
        require(msg.sender == b.maintainer || msg.sender == owner, "Unauthorized");
        require(b.status == BountyStatus.Open, "Not open");

        b.status = BountyStatus.Cancelled;
        uint256 refund = b.amount;
        b.amount = 0;

        (bool ok, ) = b.maintainer.call{value: refund}("");
        require(ok, "Refund failed");

        emit BountyCancelled(bountyId);
    }

    function solutionCount(uint256 bountyId) external view returns (uint256) {
        return _solutions[bountyId].length;
    }

    function getSolution(uint256 bountyId, uint256 index) external view returns (Solution memory) {
        require(index < _solutions[bountyId].length, "Bad index");
        return _solutions[bountyId][index];
    }

    receive() external payable {}
}
