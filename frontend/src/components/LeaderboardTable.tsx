'use client';

import type { LeaderboardEntry } from '@/lib/api';

function weiToEth(wei: string): string {
  const num = BigInt(wei);
  const eth = Number(num) / 1e18;
  return eth.toFixed(4);
}

const medals: Record<number, string> = {
  0: '\uD83E\uDD47',
  1: '\uD83E\uDD48',
  2: '\uD83E\uDD49',
};

export function LeaderboardTable({ entries }: { entries: LeaderboardEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="glass rounded-2xl p-16 text-center">
        <div className="text-4xl mb-4">{'\uD83C\uDFC6'}</div>
        <p className="text-gray-400 text-lg mb-1">No entries yet</p>
        <p className="text-gray-600 text-sm">Complete bounties to appear on the leaderboard.</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Rank</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Address</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Type</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Bounties</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Total Payout</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Reputation</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => (
              <tr
                key={`${entry.address}-${entry.actorType}`}
                className={`border-b border-white/[0.03] transition-all duration-300 hover:bg-white/[0.03] ${
                  i < 3 ? 'bg-white/[0.02]' : ''
                }`}
              >
                <td className="px-6 py-4">
                  {i < 3 ? (
                    <span className="text-lg">{medals[i]}</span>
                  ) : (
                    <span className="text-sm font-medium text-gray-400">{i + 1}</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="font-mono text-sm text-gray-300">
                    {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    entry.actorType === 'bot'
                      ? 'bg-purple-500/10 text-purple-400'
                      : 'bg-blue-500/10 text-blue-400'
                  }`}>
                    {entry.actorType === 'bot' ? '\u2699 ' : '\u2022 '}
                    {entry.actorType}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-white">{entry.totalBounties}</td>
                <td className="px-6 py-4">
                  <span className="font-mono text-sm text-white">{weiToEth(entry.totalPayout)}</span>
                  <span className="text-xs text-emerald-400/70 ml-1">ETH</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 text-sm font-semibold ${
                    entry.reputation >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {entry.reputation >= 0 ? '\u25B2' : '\u25BC'}
                    {Math.abs(entry.reputation)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
