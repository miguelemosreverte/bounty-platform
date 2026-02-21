// Anvil deterministic addresses
export const DEPLOYER = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';  // admin + maintainer
export const CONTRIBUTOR1 = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';  // developer
export const CONTRIBUTOR2 = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';  // developer
export const AI_AGENT = '0x90F79bf6EB2c4f870365E785982E1f101E93b906';

const now = Math.floor(Date.now() / 1000);
const day = 86400;

export interface Bounty {
  id: number;
  maintainer: string;
  repoOwner: string;
  repoName: string;
  issueNumber: number;
  prdHash: string;
  qaHash: string;
  amount: string;
  estimatedComplexity: number;
  status: string;
  solutionCount: number;
  createdAt: number;
  closedAt: number;
}

export interface Solution {
  id: number;
  bountyId: number;
  contributor: string;
  prNumber: number;
  commitHash: string;
  score: number;
  status: string;
  submittedAt: number;
}

export interface LeaderboardEntry {
  address: string;
  actorType: string;
  totalBounties: number;
  totalPayout: string;
  reputation: number;
}

export const bounties: Bounty[] = [
  {
    id: 1, maintainer: DEPLOYER,
    repoOwner: 'miguelemosreverte', repoName: 'playground-01', issueNumber: 12,
    prdHash: 'QmX7b3...abc', qaHash: 'QmY8c4...def',
    amount: '2500000000000000000', estimatedComplexity: 7,
    status: 'open', solutionCount: 2, createdAt: now - 5 * day, closedAt: 0,
  },
  {
    id: 2, maintainer: DEPLOYER,
    repoOwner: 'miguelemosreverte', repoName: 'playground-01', issueNumber: 8,
    prdHash: 'QmA1b2...ghi', qaHash: 'QmB2c3...jkl',
    amount: '1000000000000000000', estimatedComplexity: 4,
    status: 'closed', solutionCount: 3, createdAt: now - 12 * day, closedAt: now - 3 * day,
  },
  {
    id: 3, maintainer: DEPLOYER,
    repoOwner: 'gitbusters', repoName: 'core', issueNumber: 45,
    prdHash: 'QmC3d4...mno', qaHash: '',
    amount: '500000000000000000', estimatedComplexity: 3,
    status: 'open', solutionCount: 1, createdAt: now - 2 * day, closedAt: 0,
  },
  {
    id: 4, maintainer: DEPLOYER,
    repoOwner: 'gitbusters', repoName: 'core', issueNumber: 51,
    prdHash: 'QmD4e5...pqr', qaHash: 'QmE5f6...stu',
    amount: '750000000000000000', estimatedComplexity: 5,
    status: 'closed', solutionCount: 2, createdAt: now - 20 * day, closedAt: now - 14 * day,
  },
  {
    id: 5, maintainer: DEPLOYER,
    repoOwner: 'miguelemosreverte', repoName: 'playground-01', issueNumber: 15,
    prdHash: '', qaHash: '',
    amount: '150000000000000000', estimatedComplexity: 2,
    status: 'open', solutionCount: 0, createdAt: now - 1 * day, closedAt: 0,
  },
  {
    id: 6, maintainer: DEPLOYER,
    repoOwner: 'gitbusters', repoName: 'core', issueNumber: 62,
    prdHash: 'QmF6g7...vwx', qaHash: 'QmG7h8...yza',
    amount: '2000000000000000000', estimatedComplexity: 8,
    status: 'open', solutionCount: 1, createdAt: now - 3 * day, closedAt: 0,
  },
  {
    id: 7, maintainer: DEPLOYER,
    repoOwner: 'miguelemosreverte', repoName: 'playground-01', issueNumber: 3,
    prdHash: 'QmH8i9...bcd', qaHash: 'QmI9j0...efg',
    amount: '50000000000000000', estimatedComplexity: 2,
    status: 'cancelled', solutionCount: 0, createdAt: now - 30 * day, closedAt: now - 25 * day,
  },
  {
    id: 8, maintainer: DEPLOYER,
    repoOwner: 'gitbusters', repoName: 'core', issueNumber: 78,
    prdHash: 'QmJ0k1...hij', qaHash: 'QmK1l2...klm',
    amount: '1200000000000000000', estimatedComplexity: 6,
    status: 'closed', solutionCount: 4, createdAt: now - 15 * day, closedAt: now - 7 * day,
  },
];

export const solutions: Record<number, Solution[]> = {
  1: [
    { id: 1, bountyId: 1, contributor: CONTRIBUTOR1, prNumber: 14, commitHash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2', score: 87, status: 'submitted', submittedAt: now - 2 * day },
    { id: 2, bountyId: 1, contributor: AI_AGENT, prNumber: 15, commitHash: 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3', score: 72, status: 'submitted', submittedAt: now - 1 * day },
  ],
  2: [
    { id: 3, bountyId: 2, contributor: CONTRIBUTOR1, prNumber: 10, commitHash: 'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4', score: 95, status: 'accepted', submittedAt: now - 8 * day },
    { id: 4, bountyId: 2, contributor: CONTRIBUTOR2, prNumber: 11, commitHash: 'd4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5', score: 68, status: 'rejected', submittedAt: now - 7 * day },
    { id: 5, bountyId: 2, contributor: AI_AGENT, prNumber: 9, commitHash: 'e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6', score: 45, status: 'rejected', submittedAt: now - 9 * day },
  ],
  3: [
    { id: 6, bountyId: 3, contributor: CONTRIBUTOR2, prNumber: 47, commitHash: 'f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1', score: 82, status: 'submitted', submittedAt: now - 1 * day },
  ],
  4: [
    { id: 7, bountyId: 4, contributor: CONTRIBUTOR1, prNumber: 53, commitHash: 'a7b8c9d0e1f2a7b8c9d0e1f2a7b8c9d0e1f2a7b8', score: 91, status: 'accepted', submittedAt: now - 16 * day },
    { id: 8, bountyId: 4, contributor: CONTRIBUTOR2, prNumber: 52, commitHash: 'b8c9d0e1f2a7b8c9d0e1f2a7b8c9d0e1f2a7b8c9', score: 56, status: 'rejected', submittedAt: now - 17 * day },
  ],
  6: [
    { id: 9, bountyId: 6, contributor: CONTRIBUTOR1, prNumber: 64, commitHash: 'c9d0e1f2a7b8c9d0e1f2a7b8c9d0e1f2a7b8c9d0', score: 78, status: 'submitted', submittedAt: now - 1 * day },
  ],
  8: [
    { id: 10, bountyId: 8, contributor: CONTRIBUTOR1, prNumber: 80, commitHash: 'd0e1f2a7b8c9d0e1f2a7b8c9d0e1f2a7b8c9d0e1', score: 98, status: 'accepted', submittedAt: now - 10 * day },
    { id: 11, bountyId: 8, contributor: CONTRIBUTOR2, prNumber: 79, commitHash: 'e1f2a7b8c9d0e1f2a7b8c9d0e1f2a7b8c9d0e1f2', score: 73, status: 'rejected', submittedAt: now - 11 * day },
    { id: 12, bountyId: 8, contributor: AI_AGENT, prNumber: 81, commitHash: 'f2a7b8c9d0e1f2a7b8c9d0e1f2a7b8c9d0e1f2a7', score: 88, status: 'rejected', submittedAt: now - 9 * day },
    { id: 13, bountyId: 8, contributor: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', prNumber: 82, commitHash: 'a3b4c5d6e7f8a3b4c5d6e7f8a3b4c5d6e7f8a3b4', score: 61, status: 'rejected', submittedAt: now - 8 * day },
  ],
};

export const leaderboard: LeaderboardEntry[] = [
  { address: CONTRIBUTOR1, actorType: 'developer', totalBounties: 4, totalPayout: '4450000000000000000', reputation: 92 },
  { address: DEPLOYER, actorType: 'maintainer', totalBounties: 8, totalPayout: '0', reputation: 88 },
  { address: AI_AGENT, actorType: 'ai-agent', totalBounties: 3, totalPayout: '0', reputation: 75 },
  { address: CONTRIBUTOR2, actorType: 'developer', totalBounties: 2, totalPayout: '0', reputation: 62 },
  { address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', actorType: 'developer', totalBounties: 1, totalPayout: '0', reputation: 35 },
  { address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc', actorType: 'maintainer', totalBounties: 2, totalPayout: '0', reputation: 45 },
];

export const health = {
  status: 'ok',
  chainId: '31337',
  oracle: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
};

export const addresses = {
  bountyPlatform: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  leaderboard: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  oracle: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
};
