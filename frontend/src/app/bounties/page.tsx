'use client';

import { useEffect, useState } from 'react';
import { api, type Bounty } from '@/lib/api';
import { BountyCard } from '@/components/BountyCard';

export default function BountiesPage() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    api.getBounties().then(setBounties).catch(console.error);
  }, []);

  const filtered = filter === 'all' ? bounties : bounties.filter(b => b.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Bounties</h1>
        <div className="flex gap-2">
          {['all', 'open', 'closed', 'cancelled'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                filter === f
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-900 text-gray-400 hover:text-white'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-12 text-center text-gray-500">
          {filter === 'all'
            ? 'No bounties yet. Label a GitHub issue with "bounty" to create one.'
            : `No ${filter} bounties.`}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(bounty => (
            <BountyCard key={bounty.id} bounty={bounty} />
          ))}
        </div>
      )}
    </div>
  );
}
