/**
 * Shared utility functions for the GitBusters frontend.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

/** Convert wei string to human-readable ETH string */
export function weiToEth(wei: string): string {
  if (!wei || wei === '0') return '0';
  const n = Number(BigInt(wei)) / 1e18;
  if (n >= 1) return n.toFixed(2);
  if (n >= 0.01) return n.toFixed(3);
  return n.toFixed(4);
}

/** Truncate an address: 0x3C44CdDd...FA4293BC */
export function formatAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr || '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

/** Human-readable relative time: "3 days ago", "just now" */
export function timeAgo(unix: number): string {
  if (!unix || unix === 0) return '';
  const seconds = Math.floor(Date.now() / 1000) - unix;
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(unix);
}

/** Format unix timestamp to readable date */
export function formatDate(unix: number): string {
  if (!unix || unix === 0) return '';
  return new Date(unix * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ---- GitHub URL builders ----

export function githubRepoUrl(owner: string, repo: string): string {
  return `https://github.com/${owner}/${repo}`;
}

export function githubIssueUrl(owner: string, repo: string, num: number): string {
  return `https://github.com/${owner}/${repo}/issues/${num}`;
}

export function githubPrUrl(owner: string, repo: string, num: number): string {
  return `https://github.com/${owner}/${repo}/pull/${num}`;
}

export function githubCommitUrl(owner: string, repo: string, sha: string): string {
  return `https://github.com/${owner}/${repo}/commit/${sha}`;
}

// ---- API fetch helpers ----

export async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ---- Types (re-export from api.ts for backward compat) ----

export type {
  Bounty,
  Solution,
  LeaderboardEntry,
  Task,
  Submission,
  Agent,
  TokenTransfer,
} from '@/lib/api';

export interface HealthResponse {
  status: string;
  chainId: string;
  oracle: string;
}
