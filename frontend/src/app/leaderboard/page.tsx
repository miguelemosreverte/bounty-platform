'use client';

import { useEffect, useState } from 'react';
import { api, type LeaderboardEntry } from '@/lib/api';
import { LeaderboardTable } from '@/components/LeaderboardTable';

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    api.getLeaderboard().then(setEntries).catch(console.error);
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
        <p className="text-gray-400">
          Rankings based on completed bounties, payouts, and reputation scores.
        </p>
      </div>
      <LeaderboardTable entries={entries} />
    </div>
  );
}
