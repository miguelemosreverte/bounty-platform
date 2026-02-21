'use client';

import Link from 'next/link';
import type { Bounty } from '@/lib/api';
import { StatusBadge } from './StatusBadge';

function weiToEth(wei: string): string {
  const num = BigInt(wei);
  const eth = Number(num) / 1e18;
  return eth.toFixed(4);
}

export function BountyCard({ bounty }: { bounty: Bounty }) {
  const complexityPercent = (bounty.estimatedComplexity / 10) * 100;

  return (
    <Link href={`/bounties/${bounty.id}`} className="block group">
      <div className="glass glass-hover rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-mono text-gray-500">#{bounty.id}</span>
              <StatusBadge status={bounty.status} />
            </div>
            <h3 className="text-base font-semibold text-white group-hover:text-emerald-400 transition-colors duration-300 truncate">
              {bounty.repoOwner}/{bounty.repoName}
              <span className="text-gray-500 font-normal"> #{bounty.issueNumber}</span>
            </h3>
          </div>

          <div className="text-right shrink-0">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-white">{weiToEth(bounty.amount)}</span>
              <span className="text-sm font-medium text-emerald-400">ETH</span>
            </div>
          </div>
        </div>

        {/* Complexity bar */}
        <div className="mt-4 mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-500">Complexity</span>
            <span className="text-xs font-mono text-gray-400">{bounty.estimatedComplexity}/10</span>
          </div>
          <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
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

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              {'\u2691'} {bounty.solutionCount} solution{bounty.solutionCount !== 1 ? 's' : ''}
            </span>
            <span className="font-mono">
              {bounty.maintainer.slice(0, 6)}...{bounty.maintainer.slice(-4)}
            </span>
          </div>
          <span className="text-emerald-400/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-xs">
            View details {'\u2192'}
          </span>
        </div>
      </div>
    </Link>
  );
}
