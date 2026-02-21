'use client';

import type { LeaderboardEntry } from '@/lib/api';

function weiToEth(wei: string): string {
  const num = BigInt(wei);
  const eth = Number(num) / 1e18;
  return eth.toFixed(4);
}

export function LeaderboardTable({ entries }: { entries: LeaderboardEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-12 text-center text-gray-500">
        No entries yet. Complete bounties to appear on the leaderboard.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-800">
      <table className="w-full text-left">
        <thead className="bg-gray-900">
          <tr>
            <th className="px-6 py-3 text-sm font-medium text-gray-400">Rank</th>
            <th className="px-6 py-3 text-sm font-medium text-gray-400">Address</th>
            <th className="px-6 py-3 text-sm font-medium text-gray-400">Type</th>
            <th className="px-6 py-3 text-sm font-medium text-gray-400">Bounties</th>
            <th className="px-6 py-3 text-sm font-medium text-gray-400">Total Payout</th>
            <th className="px-6 py-3 text-sm font-medium text-gray-400">Reputation</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800 bg-gray-950">
          {entries.map((entry, i) => (
            <tr key={`${entry.address}-${entry.actorType}`} className="hover:bg-gray-900 transition">
              <td className="px-6 py-4 text-white font-medium">{i + 1}</td>
              <td className="px-6 py-4 font-mono text-sm text-gray-300">
                {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
              </td>
              <td className="px-6 py-4">
                <span className="rounded-full bg-gray-800 px-2 py-1 text-xs text-gray-300">
                  {entry.actorType}
                </span>
              </td>
              <td className="px-6 py-4 text-white">{entry.totalBounties}</td>
              <td className="px-6 py-4 text-white">{weiToEth(entry.totalPayout)} ETH</td>
              <td className="px-6 py-4">
                <span className={entry.reputation >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {entry.reputation}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
