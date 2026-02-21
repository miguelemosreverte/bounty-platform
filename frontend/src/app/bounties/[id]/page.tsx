'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api, type Bounty, type Solution } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';

function weiToEth(wei: string): string {
  const num = BigInt(wei);
  const eth = Number(num) / 1e18;
  return eth.toFixed(4);
}

export default function BountyDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [solutions, setSolutions] = useState<Solution[]>([]);

  useEffect(() => {
    if (id) {
      api.getBounty(id).then(setBounty).catch(console.error);
      api.getSolutions(id).then(setSolutions).catch(console.error);
    }
  }, [id]);

  if (!bounty) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="h-4 w-24 rounded skeleton-shimmer" />
        <div className="h-10 w-64 rounded skeleton-shimmer" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass rounded-2xl p-6 space-y-4">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-20 rounded skeleton-shimmer" />
                <div className="h-4 w-32 rounded skeleton-shimmer" />
              </div>
            ))}
          </div>
          <div className="glass rounded-2xl p-6 space-y-3">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-4 w-full rounded skeleton-shimmer" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const complexityPercent = (bounty.estimatedComplexity / 10) * 100;

  return (
    <div>
      {/* Back nav */}
      <Link
        href="/bounties"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors duration-300 mb-6"
      >
        <span>{'\u2190'}</span> Back to Bounties
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <h1 className="text-3xl font-bold tracking-tight">Bounty #{bounty.id}</h1>
          <StatusBadge status={bounty.status} size="md" />
        </div>
        <p className="text-gray-400 flex items-center gap-2">
          <span className="font-mono text-sm">
            {bounty.repoOwner}/{bounty.repoName}
          </span>
          <span className="text-gray-600">{'\u00B7'}</span>
          <span className="text-sm">Issue #{bounty.issueNumber}</span>
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* Details */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-5">Details</h2>
          <dl className="space-y-4">
            <div className="flex items-center justify-between">
              <dt className="text-sm text-gray-500">Amount</dt>
              <dd className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-white">{weiToEth(bounty.amount)}</span>
                <span className="text-sm font-medium text-emerald-400">ETH</span>
              </dd>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <dt className="text-sm text-gray-500">Complexity</dt>
                <dd className="text-sm font-mono text-gray-300">{bounty.estimatedComplexity}/10</dd>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${complexityPercent}%`,
                    background: complexityPercent <= 30
                      ? '#34d399'
                      : complexityPercent <= 60
                      ? '#fbbf24'
                      : '#f87171',
                  }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm text-gray-500">Maintainer</dt>
              <dd className="font-mono text-sm text-gray-300">
                {bounty.maintainer.slice(0, 8)}...{bounty.maintainer.slice(-6)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm text-gray-500">Solutions</dt>
              <dd className="text-sm font-medium text-white">{bounty.solutionCount}</dd>
            </div>
            {bounty.prdHash && (
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-500">PRD Hash</dt>
                <dd className="font-mono text-xs text-gray-400 truncate max-w-[200px]">{bounty.prdHash}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* How to Claim */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-5">How to Claim</h2>
          <ol className="space-y-4">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-bold text-emerald-400">1</span>
              <span className="text-sm text-gray-300 leading-relaxed">
                Open a PR that fixes issue #{bounty.issueNumber}
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-bold text-emerald-400">2</span>
              <span className="text-sm text-gray-300 leading-relaxed">
                Include{' '}
                <code className="rounded-md bg-white/[0.06] px-2 py-0.5 font-mono text-xs text-emerald-400">
                  Fixes #{bounty.issueNumber}
                </code>{' '}
                in the PR body
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-bold text-emerald-400">3</span>
              <span className="text-sm text-gray-300 leading-relaxed">
                Include your wallet address:{' '}
                <code className="rounded-md bg-white/[0.06] px-2 py-0.5 font-mono text-xs text-gray-400 break-all">
                  {'<!-- bounty-wallet: 0x... -->'}
                </code>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-bold text-emerald-400">4</span>
              <span className="text-sm text-gray-300 leading-relaxed">
                Once merged, the bounty is paid automatically
              </span>
            </li>
          </ol>
        </div>
      </div>

      {/* Solutions */}
      <div>
        <h2 className="text-xl font-bold mb-4">Solutions</h2>
        {solutions.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <div className="text-3xl mb-3">{'\u2691'}</div>
            <p className="text-gray-400 mb-1">No solutions submitted yet</p>
            <p className="text-gray-600 text-sm">Be the first to submit a PR and claim this bounty.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {solutions.map(sol => (
              <div key={sol.id} className="glass glass-hover rounded-2xl p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-mono text-gray-500">#{sol.id}</span>
                    <StatusBadge status={sol.status} />
                    <span className="text-sm text-gray-400">PR #{sol.prNumber}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    {sol.score > 0 && (
                      <span className="text-sm text-gray-400">
                        Score: <span className="font-semibold text-white">{sol.score}</span>/100
                      </span>
                    )}
                    <span className="font-mono text-sm text-gray-500">
                      {sol.contributor.slice(0, 6)}...{sol.contributor.slice(-4)}
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/[0.04]">
                  <span className="text-xs text-gray-500">
                    Commit:{' '}
                    <code className="rounded-md bg-white/[0.06] px-2 py-0.5 font-mono text-xs text-gray-400">
                      {sol.commitHash.slice(0, 8)}
                    </code>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
