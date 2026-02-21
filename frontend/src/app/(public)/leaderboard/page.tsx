'use client';

import { useEffect, useState } from 'react';
import { api, type LeaderboardEntry } from '@/lib/api';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import { Skeleton } from '@/components/Skeleton';
import { useWeb3Ready } from '@/providers/Web3Provider';
import { useAccountSafe } from '@/hooks/useWalletActivity';

const roleFilters = ['all', 'contributor', 'maintainer'] as const;
type RoleFilter = typeof roleFilters[number];

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');

  const web3Ready = useWeb3Ready();
  const { address } = useAccountSafe();

  useEffect(() => {
    api.getLeaderboard()
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8 pt-4">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Leaderboard</h1>
        <p className="text-gray-400">
          Rankings based on completed bounties, payouts, and reputation scores.
        </p>
      </div>

      {/* Role filter pills */}
      <div className="flex gap-2 mb-6">
        {roleFilters.map(f => (
          <button
            key={f}
            onClick={() => setRoleFilter(f)}
            data-testid={`leaderboard-filter-${f}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300 ${
              roleFilter === f
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-gray-400 border border-white/[0.06] hover:border-white/10 hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'all' ? '' : 's'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Rank</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Address</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Bounties</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Total Payout</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Reputation</th>
              </tr>
            </thead>
            <tbody>
              <Skeleton variant="table-row" count={5} />
            </tbody>
          </table>
        </div>
      ) : (
        <LeaderboardTable
          entries={entries}
          filter={roleFilter}
          highlightAddress={web3Ready && address ? address : undefined}
        />
      )}
    </div>
  );
}
