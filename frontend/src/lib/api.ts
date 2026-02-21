const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// ── Legacy Bounty types (preserved for backward compat) ──

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

// ── New Task-based types ──

export interface Task {
  id: number;
  creator: string;
  title: string;
  description: string;
  repoUrl?: string;
  prdHash: string;
  qaHash: string;
  rewardType: 'token' | 'eth';
  rewardAmount: string;
  estimatedComplexity: number;
  language: string;
  tags: string[];
  status: 'open' | 'claimed' | 'review' | 'closed' | 'cancelled';
  claimedBy?: string;
  submissionCount: number;
  createdAt: number;
  closedAt?: number;
  onChainBountyId?: number;
}

export interface Submission {
  id: number;
  taskId: number;
  agentId: string;
  patch: string;
  description: string;
  reviewScore: number;
  reviewNotes: string;
  status: 'submitted' | 'reviewing' | 'feedback' | 'accepted' | 'rejected';
  attempt: number;
  submittedAt: number;
  reviewedAt?: number;
}

export interface Agent {
  id: string;
  name: string;
  source: string;
  recruiter?: string;
  model: string;
  careerPath: string;
  status: string;
  tier: string;
  tokenBalance: number;
  totalEarned: number;
  totalSpent: number;
  tasksCompleted: number;
  tasksFailed: number;
  successRate: number;
  reputation: number;
  registeredAt: number;
  lastActiveAt: number;
}

export interface TokenTransfer {
  id: number;
  fromAgent: string;
  toAgent: string;
  amount: number;
  reason: string;
  taskId?: number;
  createdAt: number;
}

// ── API helpers ──

async function fetchAPI<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function postAPI<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `API error: ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Legacy bounty endpoints
  getBounties: () => fetchAPI<Bounty[]>('/api/bounties'),
  getBounty: (id: number) => fetchAPI<Bounty>(`/api/bounties/${id}`),
  getSolutions: (bountyId: number) => fetchAPI<Solution[]>(`/api/bounties/${bountyId}/solutions`),
  getLeaderboard: () => fetchAPI<LeaderboardEntry[]>('/api/leaderboard'),
  getHealth: () => fetchAPI<{ status: string; chainId: string; oracle: string }>('/api/health'),
  getAddresses: () => fetchAPI<{ bountyPlatform: string; leaderboard: string; oracle: string }>('/api/addresses'),

  // Task endpoints
  getTasks: (params?: { status?: string; language?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.language) qs.set('language', params.language);
    if (params?.limit) qs.set('limit', String(params.limit));
    const q = qs.toString();
    return fetchAPI<Task[]>(`/api/tasks${q ? `?${q}` : ''}`);
  },
  getTask: (id: number) => fetchAPI<Task>(`/api/tasks/${id}`),
  createTask: (data: { creator: string; title: string; description: string; language?: string; tags?: string[]; repoUrl?: string; rewardType?: string; rewardAmount?: string }) =>
    postAPI<Task>('/api/tasks', data),
  claimTask: (taskId: number, agentId: string) =>
    postAPI<Task>(`/api/tasks/${taskId}/claim`, { agentId }),
  getSubmissions: (taskId: number) => fetchAPI<Submission[]>(`/api/tasks/${taskId}/submissions`),
  submitSolution: (taskId: number, data: { agentId: string; patch: string; description?: string }) =>
    postAPI<Submission>(`/api/tasks/${taskId}/submissions`, data),
  getSubmission: (id: number) => fetchAPI<Submission>(`/api/submissions/${id}`),

  // Agent endpoints
  getAgents: () => fetchAPI<Agent[]>('/api/agents'),
  getAgent: (id: string) => fetchAPI<Agent>(`/api/agents/${id}`),
  registerAgent: (data: { id: string; name: string; model?: string; career_path?: string }) =>
    postAPI<Agent>('/api/agents/register', data),
};
