'use client';

import Link from 'next/link';
import { useWalletActivity } from '@/hooks/useWalletActivity';
import { useWeb3Ready } from '@/providers/Web3Provider';
import { weiToEth, timeAgo, githubIssueUrl, type Bounty } from '@/lib/utils';
import { StatusBadge } from '@/components/StatusBadge';
import { GitHubLink } from '@/components/GitHubLink';
import { DataTable } from '@/components/backoffice/DataTable';

export default function MaintainerBountiesPage() {
  const web3Ready = useWeb3Ready();
  const walletData = useWalletActivity();

  if (!web3Ready || !walletData.isConnected) {
    return (
      <div data-testid="maint-bounties-connect" className="max-w-lg mx-auto py-16 text-center">
        <h1 className="wsj-headline text-2xl font-bold mb-4">My Bounties</h1>
        <div className="wsj-card p-8">
          <p className="text-[var(--color-wsj-muted)] font-sans text-sm mb-4">
            Connect your wallet to manage your bounties.
          </p>
          <Link href="/maintainer" className="wsj-link font-sans text-sm">
            Back to Overview
          </Link>
        </div>
      </div>
    );
  }

  const bounties = walletData.myBounties;

  return (
    <div data-testid="maint-bounties">
      <div className="mb-6">
        <h1 className="wsj-headline text-2xl font-bold mb-1">My Bounties</h1>
        <p className="text-sm font-sans text-[var(--color-wsj-muted)]">
          {bounties.length} bounties created by your wallet
        </p>
      </div>

      <div className="wsj-rule-double mb-6" />

      {walletData.loading ? (
        <div className="wsj-card p-8 text-center">
          <div className="animate-pulse text-[var(--color-wsj-muted)] font-sans text-sm">
            Loading your bounties...
          </div>
        </div>
      ) : (
        <DataTable
          data-testid="maint-bounties-table"
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
                <GitHubLink
                  href={githubIssueUrl(b.repoOwner, b.repoName, b.issueNumber)}
                  label={`${b.repoOwner}/${b.repoName} #${b.issueNumber}`}
                />
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (b: Bounty) => <StatusBadge status={b.status} />,
            },
            {
              key: 'amount',
              header: 'Amount',
              render: (b: Bounty) => (
                <span className="font-mono font-semibold">{weiToEth(b.amount)} ETH</span>
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
              header: 'Created',
              render: (b: Bounty) => (
                <span className="text-[var(--color-wsj-muted)]">{timeAgo(b.createdAt)}</span>
              ),
            },
          ]}
          data={bounties}
          emptyMessage="You haven't created any bounties yet. Label a GitHub issue with 'bounty' to get started."
        />
      )}
    </div>
  );
}
