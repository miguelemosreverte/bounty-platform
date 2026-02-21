'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { weiToEth, timeAgo, githubIssueUrl, type Bounty } from '@/lib/utils';
import { StatusBadge } from '@/components/StatusBadge';
import { GitHubLink } from '@/components/GitHubLink';
import { DataTable } from '@/components/backoffice/DataTable';

export default function DeveloperBountiesPage() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<'newest' | 'highest' | 'complexity'>('newest');

  useEffect(() => {
    api.getBounties()
      .then(setBounties)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const openBounties = bounties.filter((b) => b.status === 'open');

  const sorted = [...openBounties].sort((a, b) => {
    switch (sort) {
      case 'highest':
        return Number(BigInt(b.amount) - BigInt(a.amount));
      case 'complexity':
        return a.estimatedComplexity - b.estimatedComplexity;
      default:
        return b.createdAt - a.createdAt;
    }
  });

  return (
    <div data-testid="dev-bounties">
      <div className="mb-6">
        <h1 className="wsj-headline text-2xl font-bold mb-1">Available Bounties</h1>
        <p className="text-sm font-sans text-[var(--color-wsj-muted)]">
          {openBounties.length} open bounties available for contribution
        </p>
      </div>

      <div className="wsj-rule-double mb-6" />

      {/* Sort controls */}
      <div className="flex items-center gap-2 mb-6 font-sans text-sm">
        <span className="text-[var(--color-wsj-muted)]">Sort by:</span>
        {(['newest', 'highest', 'complexity'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSort(s)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              sort === s
                ? 'bg-[var(--color-wsj-accent)] text-white'
                : 'text-[var(--color-wsj-muted)] hover:text-[var(--color-wsj-text)] border border-[var(--color-wsj-rule)]'
            }`}
          >
            {s === 'newest' ? 'Newest' : s === 'highest' ? 'Highest Reward' : 'Easiest First'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="wsj-card p-8 text-center">
          <div className="animate-pulse text-[var(--color-wsj-muted)] font-sans text-sm">
            Loading bounties...
          </div>
        </div>
      ) : (
        <DataTable
          data-testid="dev-bounties-table"
          columns={[
            {
              key: 'id',
              header: 'ID',
              render: (b: Bounty) => (
                <Link href={`/bounties/${b.id}`} className="wsj-link font-mono">
                  #{b.id}
                </Link>
              ),
              className: 'w-16',
            },
            {
              key: 'repo',
              header: 'Repository',
              render: (b: Bounty) => (
                <div>
                  <GitHubLink
                    href={githubIssueUrl(b.repoOwner, b.repoName, b.issueNumber)}
                    label={`${b.repoOwner}/${b.repoName} #${b.issueNumber}`}
                  />
                </div>
              ),
            },
            {
              key: 'amount',
              header: 'Reward',
              render: (b: Bounty) => (
                <span className="font-mono font-semibold text-[var(--color-wsj-accent)]">
                  {weiToEth(b.amount)} ETH
                </span>
              ),
            },
            {
              key: 'complexity',
              header: 'Complexity',
              render: (b: Bounty) => (
                <span className="font-mono">{b.estimatedComplexity}/10</span>
              ),
            },
            {
              key: 'solutions',
              header: 'Solutions',
              render: (b: Bounty) => (
                <span className="font-mono">{b.solutionCount}</span>
              ),
            },
            {
              key: 'created',
              header: 'Posted',
              render: (b: Bounty) => (
                <span className="text-[var(--color-wsj-muted)]">{timeAgo(b.createdAt)}</span>
              ),
            },
          ]}
          data={sorted}
          emptyMessage="No open bounties available right now. Check back soon!"
        />
      )}
    </div>
  );
}
