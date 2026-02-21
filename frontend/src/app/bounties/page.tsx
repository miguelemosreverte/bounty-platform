'use client';

import { useEffect, useState } from 'react';
import { api, type Bounty } from '@/lib/api';
import { BountyCard } from '@/components/BountyCard';
import { Skeleton } from '@/components/Skeleton';

const filters = ['all', 'open', 'closed', 'cancelled'] as const;

export default function BountiesPage() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBounties()
      .then(setBounties)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? bounties : bounties.filter(b => b.status === filter);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bounties</h1>
          {!loading && (
            <p className="text-gray-500 text-sm mt-1">
              {filtered.length} {filter === 'all' ? 'total' : filter} bounties
            </p>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex gap-2">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300 ${
                filter === f
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-gray-400 border border-white/[0.06] hover:border-white/10 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="glass rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-4 w-12 rounded-full skeleton-shimmer" />
                <div className="h-5 w-16 rounded-full skeleton-shimmer" />
              </div>
              <div className="h-5 w-48 rounded skeleton-shimmer" />
              <div className="h-8 w-28 rounded skeleton-shimmer" />
              <div className="h-1 w-full rounded-full skeleton-shimmer" />
              <div className="flex gap-4">
                <div className="h-3 w-20 rounded skeleton-shimmer" />
                <div className="h-3 w-32 rounded skeleton-shimmer" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <div className="text-4xl mb-4">{'\u2205'}</div>
          <p className="text-gray-400 text-lg mb-2">
            {filter === 'all'
              ? 'No bounties yet'
              : `No ${filter} bounties`}
          </p>
          <p className="text-gray-600 text-sm">
            {filter === 'all'
              ? 'Label a GitHub issue with "bounty" to create one.'
              : 'Try a different filter to see more bounties.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(bounty => (
            <BountyCard key={bounty.id} bounty={bounty} />
          ))}
        </div>
      )}
    </div>
  );
}
