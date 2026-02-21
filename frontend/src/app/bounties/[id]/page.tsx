'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, type Bounty, type Solution } from '@/lib/api';

function weiToEth(wei: string): string {
  const num = BigInt(wei);
  const eth = Number(num) / 1e18;
  return eth.toFixed(4);
}

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    open: 'bg-green-500/20 text-green-400',
    closed: 'bg-blue-500/20 text-blue-400',
    cancelled: 'bg-red-500/20 text-red-400',
    submitted: 'bg-yellow-500/20 text-yellow-400',
    accepted: 'bg-green-500/20 text-green-400',
    rejected: 'bg-red-500/20 text-red-400',
  };
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${colors[status] || 'bg-gray-500/20 text-gray-400'}`}>
      {status}
    </span>
  );
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
    return <div className="text-gray-500">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <h1 className="text-3xl font-bold">Bounty #{bounty.id}</h1>
          {statusBadge(bounty.status)}
        </div>
        <p className="text-gray-400">
          {bounty.repoOwner}/{bounty.repoName} &middot; Issue #{bounty.issueNumber}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="rounded-lg bg-gray-900 border border-gray-800 p-6">
          <h2 className="text-sm font-medium text-gray-400 mb-4">Details</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-gray-500">Amount</dt>
              <dd className="font-bold text-white">{weiToEth(bounty.amount)} ETH</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Complexity</dt>
              <dd className="text-white">{bounty.estimatedComplexity}/10</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Maintainer</dt>
              <dd className="font-mono text-sm text-gray-300">
                {bounty.maintainer.slice(0, 8)}...{bounty.maintainer.slice(-6)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Solutions</dt>
              <dd className="text-white">{bounty.solutionCount}</dd>
            </div>
            {bounty.prdHash && (
              <div className="flex justify-between">
                <dt className="text-gray-500">PRD Hash</dt>
                <dd className="font-mono text-sm text-gray-300">{bounty.prdHash}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="rounded-lg bg-gray-900 border border-gray-800 p-6">
          <h2 className="text-sm font-medium text-gray-400 mb-4">How to Claim</h2>
          <ol className="space-y-3 text-sm text-gray-300 list-decimal list-inside">
            <li>Open a PR that fixes issue #{bounty.issueNumber}</li>
            <li>Include <code className="bg-gray-800 px-1 rounded">Fixes #{bounty.issueNumber}</code> in the PR body</li>
            <li>Include <code className="bg-gray-800 px-1 rounded">{'<!-- bounty-wallet: 0x... -->'}</code></li>
            <li>Once merged, the bounty is paid automatically</li>
          </ol>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4">Solutions</h2>
      {solutions.length === 0 ? (
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-8 text-center text-gray-500">
          No solutions submitted yet.
        </div>
      ) : (
        <div className="space-y-3">
          {solutions.map(sol => (
            <div key={sol.id} className="rounded-lg border border-gray-800 bg-gray-900 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">Solution #{sol.id}</span>
                  {statusBadge(sol.status)}
                  <span className="text-sm text-gray-400">PR #{sol.prNumber}</span>
                </div>
                <div className="flex items-center gap-4">
                  {sol.score > 0 && (
                    <span className="text-sm text-gray-400">Score: {sol.score}/100</span>
                  )}
                  <span className="font-mono text-sm text-gray-500">
                    {sol.contributor.slice(0, 6)}...{sol.contributor.slice(-4)}
                  </span>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Commit: <code className="bg-gray-800 px-1 rounded">{sol.commitHash.slice(0, 8)}</code>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
