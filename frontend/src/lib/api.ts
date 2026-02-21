const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

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

async function fetchAPI<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  getBounties: () => fetchAPI<Bounty[]>('/api/bounties'),
  getBounty: (id: number) => fetchAPI<Bounty>(`/api/bounties/${id}`),
  getSolutions: (bountyId: number) => fetchAPI<Solution[]>(`/api/bounties/${bountyId}/solutions`),
  getLeaderboard: () => fetchAPI<LeaderboardEntry[]>('/api/leaderboard'),
  getHealth: () => fetchAPI<{ status: string; chainId: string; oracle: string }>('/api/health'),
  getAddresses: () => fetchAPI<{ bountyPlatform: string; leaderboard: string; oracle: string }>('/api/addresses'),
};
