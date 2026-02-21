'use client';

import Link from 'next/link';
import type { Bounty } from '@/lib/api';

function weiToEth(wei: string): string {
  const num = BigInt(wei);
  const eth = Number(num) / 1e18;
  return eth.toFixed(4);
}

function statusColor(status: string): string {
  switch (status) {
    case 'open': return 'bg-green-500/20 text-green-400';
    case 'closed': return 'bg-blue-500/20 text-blue-400';
    case 'cancelled': return 'bg-red-500/20 text-red-400';
    default: return 'bg-gray-500/20 text-gray-400';
  }
}

export function BountyCard({ bounty }: { bounty: Bounty }) {
  return (
    <Link href={`/bounties/${bounty.id}`} className="block">
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-6 hover:border-gray-600 transition">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm text-gray-500">#{bounty.id}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(bounty.status)}`}>
                {bounty.status}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-white">
              {bounty.repoOwner}/{bounty.repoName} #{bounty.issueNumber}
            </h3>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{weiToEth(bounty.amount)} ETH</div>
            <div className="text-sm text-gray-500">Complexity: {bounty.estimatedComplexity}/10</div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
          <span>{bounty.solutionCount} solution{bounty.solutionCount !== 1 ? 's' : ''}</span>
          <span>Maintainer: {bounty.maintainer.slice(0, 6)}...{bounty.maintainer.slice(-4)}</span>
        </div>
      </div>
    </Link>
  );
}
