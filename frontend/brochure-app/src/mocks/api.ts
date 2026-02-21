import { bounties, solutions, leaderboard, health, addresses } from '../data/fixtures';
import type { Bounty, Solution, LeaderboardEntry } from '../data/fixtures';

export type { Bounty, Solution, LeaderboardEntry };

export const api = {
  getBounties: () => Promise.resolve(bounties),
  getBounty: (id: number) => Promise.resolve(bounties.find(b => b.id === id)!),
  getSolutions: (bountyId: number) => Promise.resolve(solutions[bountyId] || []),
  getLeaderboard: () => Promise.resolve(leaderboard),
  getHealth: () => Promise.resolve(health),
  getAddresses: () => Promise.resolve(addresses),
};
