'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import type { Bounty } from '@/lib/utils';
import { BountyCard } from '@/components/BountyCard';
import { Skeleton } from '@/components/Skeleton';
import { SearchSort } from '@/components/SearchSort';
import { useWeb3Ready } from '@/providers/Web3Provider';
import { useAccountSafe } from '@/hooks/useWalletActivity';

const statusFilters = ['all', 'open', 'closed', 'cancelled'] as const;

type RoleTab = 'all' | 'created' | 'submissions';

export default function BountiesPage() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';
  const initialRole = (searchParams.get('role') as RoleTab) || 'all';

  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [filter, setFilter] = useState<string>(initialStatus);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [roleTab, setRoleTab] = useState<RoleTab>(initialRole);

  const web3Ready = useWeb3Ready();
  const { address } = useAccountSafe();

  useEffect(() => {
    api.getBounties()
      .then(setBounties)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Apply role-based filtering
  let roleBounties = bounties;
  if (web3Ready && address) {
    if (roleTab === 'created') {
      roleBounties = bounties.filter(
        b => b.maintainer.toLowerCase() === address.toLowerCase()
      );
    }
    // 'submissions' tab: MVP shows all (no per-bounty solution fetch yet)
  }

  // Apply status filter
  const statusFiltered = filter === 'all'
    ? roleBounties
    : roleBounties.filter(b => b.status === filter);

  // Apply search
  const searched = search.trim() === ''
    ? statusFiltered
    : statusFiltered.filter(b => {
        const term = search.toLowerCase();
        return (
          b.repoOwner.toLowerCase().includes(term) ||
          b.repoName.toLowerCase().includes(term) ||
          b.issueNumber.toString().includes(term)
        );
      });

  // Apply sort
  const sorted = [...searched].sort((a, b) => {
    switch (sort) {
      case 'oldest':
        return a.createdAt - b.createdAt;
      case 'highest':
        return Number(BigInt(b.amount) - BigInt(a.amount));
      case 'complex':
        return b.estimatedComplexity - a.estimatedComplexity;
      case 'solutions':
        return b.solutionCount - a.solutionCount;
      case 'newest':
      default:
        return b.createdAt - a.createdAt;
    }
  });

  const roleTabs: { key: RoleTab; label: string }[] = [
    { key: 'all', label: 'All Bounties' },
    { key: 'created', label: 'Created by Me' },
    { key: 'submissions', label: 'My Submissions' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bounties</h1>
          {!loading && (
            <p className="text-gray-500 text-sm mt-1">
              {sorted.length} {filter === 'all' ? 'total' : filter} bounties
            </p>
          )}
        </div>
      </div>

      {/* Search & Sort */}
      <div className="mb-4">
        <SearchSort
          search={search}
          onSearchChange={setSearch}
          sort={sort}
          onSortChange={setSort}
        />
      </div>

      {/* Role tabs (when wallet connected) */}
      {web3Ready && address && (
        <div className="flex gap-2 mb-4">
          {roleTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setRoleTab(tab.key)}
              data-testid={`bounties-role-${tab.key}`}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300 ${
                roleTab === tab.key
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-gray-400 border border-white/[0.06] hover:border-white/10 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Status filter pills */}
      <div className="flex gap-2 mb-8">
        {statusFilters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            data-testid={`bounties-filter-${f}`}
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
      ) : sorted.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <div className="text-4xl mb-4">{'\u2205'}</div>
          <p className="text-gray-400 text-lg mb-2">
            {search.trim()
              ? 'No bounties match your search'
              : filter === 'all'
                ? 'No bounties yet'
                : `No ${filter} bounties`}
          </p>
          <p className="text-gray-600 text-sm">
            {search.trim()
              ? 'Try a different search term or clear your filters.'
              : filter === 'all'
                ? 'Label a GitHub issue with "bounty" to create one.'
                : 'Try a different filter to see more bounties.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map(bounty => (
            <BountyCard key={bounty.id} bounty={bounty} />
          ))}
        </div>
      )}
    </div>
  );
}
