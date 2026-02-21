'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, type Bounty } from '@/lib/api';
import { BountyCard } from '@/components/BountyCard';

export default function Home() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [health, setHealth] = useState<{ status: string; chainId: string; oracle: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getHealth().then(setHealth).catch(() => setError('Backend not reachable'));
    api.getBounties().then(setBounties).catch(() => {});
  }, []);

  const openBounties = bounties.filter(b => b.status === 'open');
  const closedBounties = bounties.filter(b => b.status === 'closed');

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Bounty Platform</h1>
        <p className="text-gray-400 text-lg max-w-2xl">
          A blockchain-powered bounty system for open source development.
          Anyone — human or bot — can contribute and get paid.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 mb-8 text-red-400">
          {error}. Make sure Anvil and the Go backend are running.
        </div>
      )}

      {health && (
        <div className="rounded-lg bg-gray-900 border border-gray-800 p-6 mb-8">
          <h2 className="text-sm font-medium text-gray-400 mb-3">System Status</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold text-green-400">{health.status}</div>
              <div className="text-sm text-gray-500">Backend</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{health.chainId}</div>
              <div className="text-sm text-gray-500">Chain ID</div>
            </div>
            <div>
              <div className="text-sm font-mono text-gray-300">{health.oracle.slice(0, 10)}...</div>
              <div className="text-sm text-gray-500">Oracle</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6 mb-12">
        <div className="rounded-lg bg-gray-900 border border-gray-800 p-6">
          <div className="text-3xl font-bold text-white">{bounties.length}</div>
          <div className="text-sm text-gray-500">Total Bounties</div>
        </div>
        <div className="rounded-lg bg-gray-900 border border-gray-800 p-6">
          <div className="text-3xl font-bold text-green-400">{openBounties.length}</div>
          <div className="text-sm text-gray-500">Open Bounties</div>
        </div>
        <div className="rounded-lg bg-gray-900 border border-gray-800 p-6">
          <div className="text-3xl font-bold text-blue-400">{closedBounties.length}</div>
          <div className="text-sm text-gray-500">Completed</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Recent Bounties</h2>
        <Link href="/bounties" className="text-blue-400 hover:text-blue-300 transition">
          View all &rarr;
        </Link>
      </div>

      {bounties.length === 0 ? (
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-12 text-center text-gray-500">
          No bounties yet. Label a GitHub issue with &quot;bounty&quot; to get started.
        </div>
      ) : (
        <div className="space-y-4">
          {bounties.slice(0, 5).map(bounty => (
            <BountyCard key={bounty.id} bounty={bounty} />
          ))}
        </div>
      )}
    </div>
  );
}
