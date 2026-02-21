'use client';

import { useState } from 'react';
import type { LeaderboardEntry } from '@/lib/api';
import { weiToEth, formatAddress } from '@/lib/utils';

const medals: Record<number, string> = {
  0: '\uD83E\uDD47',
  1: '\uD83E\uDD48',
  2: '\uD83E\uDD49',
};

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  filter?: 'all' | 'contributor' | 'maintainer';
  highlightAddress?: string;
}

export function LeaderboardTable({
  entries,
  filter = 'all',
  highlightAddress,
}: LeaderboardTableProps) {
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);

  const filtered = filter === 'all'
    ? entries
    : entries.filter(e => e.actorType === filter);

  function handleCopy(address: string) {
    navigator.clipboard.writeText(address).then(() => {
      setCopiedAddr(address);
      setTimeout(() => setCopiedAddr(null), 2000);
    });
  }

  const isHighlighted = (addr: string) =>
    highlightAddress && addr.toLowerCase() === highlightAddress.toLowerCase();

  if (filtered.length === 0) {
    return (
      <div className="glass rounded-2xl p-16 text-center">
        <div className="text-4xl mb-4">{'\uD83C\uDFC6'}</div>
        <p className="text-gray-400 text-lg mb-1">No entries yet</p>
        <p className="text-gray-600 text-sm">
          {filter !== 'all'
            ? `No ${filter}s on the leaderboard yet. Try a different filter.`
            : 'Complete bounties to appear on the leaderboard.'}
        </p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl overflow-hidden" data-testid="leaderboard-table">
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
            {filtered.map((entry, i) => {
              const highlighted = isHighlighted(entry.address);
              return (
                <tr
                  key={`${entry.address}-${entry.actorType}`}
                  data-testid={`leaderboard-row-${i}`}
                  className={`border-b border-white/[0.03] transition-all duration-300 hover:bg-white/[0.03] ${
                    highlighted
                      ? 'bg-emerald-500/[0.06] border-l-2 border-l-emerald-400 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]'
                      : i < 3
                        ? 'bg-white/[0.02]'
                        : ''
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
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(entry.address)}
                        className="relative group font-mono text-sm text-gray-300 hover:text-emerald-400 transition-colors cursor-pointer"
                        title="Click to copy address"
                      >
                        {formatAddress(entry.address)}
                        {/* Tooltip */}
                        <span className={`absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-xs whitespace-nowrap transition-all duration-200 ${
                          copiedAddr === entry.address
                            ? 'opacity-100 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'opacity-0 group-hover:opacity-100 bg-gray-800 text-gray-300 border border-white/10'
                        }`}>
                          {copiedAddr === entry.address ? 'Copied!' : 'Click to copy'}
                        </span>
                      </button>
                      {highlighted && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          You
                        </span>
                      )}
                    </div>
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
