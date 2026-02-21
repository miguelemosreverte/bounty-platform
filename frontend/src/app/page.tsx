'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { api, type Bounty } from '@/lib/api';
import { BountyCard } from '@/components/BountyCard';
import { Skeleton } from '@/components/Skeleton';

export default function Home() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [health, setHealth] = useState<{ status: string; chainId: string; oracle: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getHealth().then(setHealth).catch(() => setError('Backend not reachable')),
      api.getBounties().then(setBounties).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const openBounties = bounties.filter(b => b.status === 'open');
  const closedBounties = bounties.filter(b => b.status === 'closed');
  const totalPaid = closedBounties.reduce((sum, b) => sum + Number(BigInt(b.amount)) / 1e18, 0);

  return (
    <div>
      {/* Hero */}
      <div className="mb-12 pt-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-10">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot" />
                Live on Chain
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                GitBusters
              </span>{' '}
              AI Bounty System
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl leading-relaxed">
              A blockchain-powered bounty system for open source development.
              Anyone &#8212; human or bot &#8212; can contribute and get paid in ETH.
            </p>
          </div>
          <div className="relative shrink-0">
            <div className="absolute -inset-4 bg-emerald-500/10 rounded-full blur-2xl" />
            <Image
              src="/mascot.jpeg"
              alt="GitBusters mascot"
              width={160}
              height={160}
              className="relative rounded-2xl shadow-2xl shadow-emerald-500/20 border border-white/10"
              priority
            />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl bg-red-500/5 border border-red-500/20 p-4 mb-8 flex items-center gap-3">
          <span className="text-red-400 text-lg">{'\u26A0'}</span>
          <div>
            <p className="text-red-400 text-sm font-medium">{error}</p>
            <p className="text-red-400/60 text-xs mt-0.5">Make sure Anvil and the Go backend are running.</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] text-lg">
              {'\u25C8'}
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Total Bounties</span>
          </div>
          <div className="text-3xl font-bold text-white">{bounties.length}</div>
        </div>
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-lg text-emerald-400">
              {'\u25C6'}
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Open Bounties</span>
          </div>
          <div className="text-3xl font-bold text-emerald-400">{openBounties.length}</div>
        </div>
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-lg text-blue-400">
              {'\u039E'}
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Total Paid</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {totalPaid.toFixed(2)} <span className="text-base text-gray-500 font-normal">ETH</span>
          </div>
        </div>
      </div>

      {/* System Status */}
      {health && (
        <div className="glass rounded-2xl p-6 mb-12">
          <div className="flex items-center gap-2 mb-4">
            <span className="h-2 w-2 rounded-full bg-emerald-400 pulse-dot" />
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">System Status</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <div className="text-lg font-bold text-emerald-400 capitalize">{health.status}</div>
              <div className="text-xs text-gray-500 mt-0.5">Backend</div>
            </div>
            <div>
              <div className="text-lg font-bold text-white">Chain {health.chainId}</div>
              <div className="text-xs text-gray-500 mt-0.5">Network</div>
            </div>
            <div>
              <div className="font-mono text-sm text-gray-300">{health.oracle.slice(0, 10)}...</div>
              <div className="text-xs text-gray-500 mt-0.5">Oracle Address</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Bounties */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Recent Bounties</h2>
        <Link
          href="/bounties"
          className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors duration-300 flex items-center gap-1"
        >
          View all <span>{'\u2192'}</span>
        </Link>
      </div>

      {loading ? (
        <Skeleton variant="card" count={3} />
      ) : bounties.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <Image
            src="/mascot.jpeg"
            alt="GitBusters mascot"
            width={80}
            height={80}
            className="mx-auto rounded-xl mb-4 opacity-60"
          />
          <p className="text-gray-400 text-lg mb-2">No bounties yet</p>
          <p className="text-gray-600 text-sm">
            Label a GitHub issue with &quot;bounty&quot; to get started.
          </p>
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
