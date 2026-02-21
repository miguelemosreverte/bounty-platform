'use client';

import { useEffect, useState } from 'react';
import { api, type LeaderboardEntry } from '@/lib/api';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import { Skeleton } from '@/components/Skeleton';

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

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
        <LeaderboardTable entries={entries} />
      )}
    </div>
  );
}
