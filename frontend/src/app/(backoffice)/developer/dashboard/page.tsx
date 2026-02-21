'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useWalletActivity, useAccountSafe } from '@/hooks/useWalletActivity';
import { useWeb3Ready } from '@/providers/Web3Provider';
import { StatCard } from '@/components/backoffice/StatCard';
import { DataTable } from '@/components/backoffice/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { GitHubLink } from '@/components/GitHubLink';
import { api } from '@/lib/api';
import type { Bounty, Solution } from '@/lib/utils';
import {
  weiToEth,
  formatAddress,
  timeAgo,
  githubIssueUrl,
  githubPrUrl,
  githubRepoUrl,
} from '@/lib/utils';

export default function DeveloperDashboardPage() {
  const web3Ready = useWeb3Ready();
  const walletData = useWalletActivity();

  // Available bounties state (fetched independently)
  const [availableBounties, setAvailableBounties] = useState<Bounty[]>([]);
  const [bountiesLoading, setBountiesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .getBounties()
      .then((all) => {
        if (!cancelled) {
          const open = all.filter((b) => b.status === 'open' || b.status === 'Open');
          setAvailableBounties(open);
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setBountiesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ---- Derived metrics (must be before any conditional returns to satisfy Rules of Hooks) ----
  const activeSubmissions = walletData.mySubmissions.filter(
    ({ solution }) => solution.status !== 'accepted' && solution.status !== 'rejected',
  );

  const totalSubmissions = walletData.solutionsSubmitted;
  const acceptedCount = walletData.mySubmissions.filter(
    ({ solution }) => solution.status === 'accepted',
  ).length;
  const rejectedCount = walletData.mySubmissions.filter(
    ({ solution }) => solution.status === 'rejected',
  ).length;
  const successRate =
    totalSubmissions > 0 ? Math.round((acceptedCount / totalSubmissions) * 100) : 0;

  // Earnings breakdown
  const totalEarningsEth = weiToEth(walletData.totalEarnings.toString());

  // Repos contributed to
  const contributedRepos = useMemo(() => {
    const repoMap = new Map<string, { owner: string; name: string; count: number; earned: bigint }>();
    walletData.mySubmissions.forEach(({ bounty, solution }) => {
      const key = `${bounty.repoOwner}/${bounty.repoName}`;
      const existing = repoMap.get(key);
      if (existing) {
        existing.count += 1;
        if (solution.status === 'accepted') {
          existing.earned += BigInt(bounty.amount || '0');
        }
      } else {
        repoMap.set(key, {
          owner: bounty.repoOwner,
          name: bounty.repoName,
          count: 1,
          earned: solution.status === 'accepted' ? BigInt(bounty.amount || '0') : 0n,
        });
      }
    });
    return Array.from(repoMap.values()).sort((a, b) => b.count - a.count);
  }, [walletData.mySubmissions]);

  // Skills derived from repo types (simulated from repo names)
  const skills = useMemo(() => {
    const skillSet = new Set<string>();
    walletData.mySubmissions.forEach(({ bounty }) => {
      // Infer skills from repo context
      const name = bounty.repoName.toLowerCase();
      if (name.includes('frontend') || name.includes('ui') || name.includes('web')) skillSet.add('Frontend');
      if (name.includes('backend') || name.includes('api') || name.includes('server')) skillSet.add('Backend');
      if (name.includes('contract') || name.includes('sol') || name.includes('eth')) skillSet.add('Smart Contracts');
      if (name.includes('test') || name.includes('qa')) skillSet.add('Testing');
      if (name.includes('doc')) skillSet.add('Documentation');
    });
    if (skillSet.size === 0 && walletData.mySubmissions.length > 0) {
      skillSet.add('Full Stack');
    }
    return Array.from(skillSet);
  }, [walletData.mySubmissions]);

  // Payout history (from accepted submissions)
  const payoutHistory = useMemo(() => {
    return walletData.mySubmissions
      .filter(({ solution }) => solution.status === 'accepted')
      .sort((a, b) => b.solution.submittedAt - a.solution.submittedAt)
      .map(({ bounty, solution }) => ({
        bountyId: bounty.id,
        repo: `${bounty.repoOwner}/${bounty.repoName}`,
        issue: bounty.issueNumber,
        amount: weiToEth(bounty.amount),
        date: solution.submittedAt,
        repoOwner: bounty.repoOwner,
        repoName: bounty.repoName,
      }));
  }, [walletData.mySubmissions]);

  // Average score
  const scoredSubmissions = walletData.mySubmissions.filter(({ solution }) => solution.score > 0);
  const avgScore = scoredSubmissions.length > 0
    ? Math.round(scoredSubmissions.reduce((acc, { solution }) => acc + solution.score, 0) / scoredSubmissions.length)
    : 0;

  // Bounties sorted by amount for "Quick Claim" recommendations
  const topBounties = useMemo(() => {
    return availableBounties
      .slice()
      .sort((a, b) => Number(BigInt(b.amount || '0') - BigInt(a.amount || '0')))
      .slice(0, 5);
  }, [availableBounties]);

  // ---- Submissions table columns --------------------------------------------
  const submissionColumns = [
    {
      key: 'bounty',
      header: 'Bounty',
      render: (row: { bounty: Bounty; solution: Solution }) => (
        <Link
          href={`/bounties/${row.bounty.id}`}
          className="wsj-link font-semibold text-sm"
        >
          #{row.bounty.issueNumber}: {row.bounty.repoOwner}/{row.bounty.repoName}
        </Link>
      ),
    },
    {
      key: 'repo',
      header: 'Repository',
      render: (row: { bounty: Bounty; solution: Solution }) => (
        <GitHubLink
          href={githubRepoUrl(row.bounty.repoOwner, row.bounty.repoName)}
          label={`${row.bounty.repoOwner}/${row.bounty.repoName}`}
        />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: { bounty: Bounty; solution: Solution }) => (
        <StatusBadge status={row.solution.status} />
      ),
    },
    {
      key: 'score',
      header: 'Score',
      render: (row: { bounty: Bounty; solution: Solution }) => (
        <span className="font-mono text-sm text-[var(--color-wsj-text)]">
          {row.solution.score > 0 ? row.solution.score : '--'}
        </span>
      ),
      className: 'w-20',
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (row: { bounty: Bounty; solution: Solution }) => (
        <span className="font-sans text-sm text-[var(--color-wsj-text)]">
          {weiToEth(row.bounty.amount)} ETH
        </span>
      ),
    },
    {
      key: 'submitted',
      header: 'Submitted',
      render: (row: { bounty: Bounty; solution: Solution }) => (
        <span className="font-sans text-sm text-[var(--color-wsj-muted)]">
          {timeAgo(row.solution.submittedAt)}
        </span>
      ),
    },
  ];

  // ---- Wallet not connected ------------------------------------------------
  if (!web3Ready || !walletData.isConnected) {
    return (
      <article className="max-w-3xl" data-testid="dev-dashboard-connect">
        <header className="mb-10">
          <h1 className="wsj-headline text-4xl md:text-5xl mb-4">
            Connect Your Wallet
          </h1>
          <div className="wsj-rule-double mb-6" />
          <p className="font-[family-name:var(--font-body-serif)] text-lg text-[var(--color-wsj-muted)] leading-relaxed max-w-2xl">
            To view your developer dashboard -- including earnings, submissions, and
            available bounties -- please connect your wallet using the button in the
            top bar. Your on-chain activity will be loaded automatically once connected.
          </p>
        </header>

        <div className="wsj-card p-8 text-center">
          <p className="font-[family-name:var(--font-headline)] text-2xl text-[var(--color-wsj-text)] mb-3">
            Why connect?
          </p>
          <ul className="font-[family-name:var(--font-body-serif)] text-[var(--color-wsj-muted)] text-left max-w-md mx-auto space-y-2 mb-6">
            <li>Track your submitted pull requests and their review status</li>
            <li>See total earnings paid out from accepted bounties</li>
            <li>Monitor your success rate across all submissions</li>
            <li>Discover new open bounties ready for contribution</li>
          </ul>
          <Link
            href="/bounties"
            className="wsj-link font-[family-name:var(--font-body-serif)] font-semibold"
          >
            Or browse bounties without connecting
          </Link>
        </div>
      </article>
    );
  }

  // ---- Loading state --------------------------------------------------------
  if (walletData.loading) {
    return (
      <article className="max-w-5xl" data-testid="dev-dashboard-loading">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-wsj-muted)] mb-2">
            Developer Dashboard
          </p>
          <h1 className="wsj-headline text-3xl md:text-4xl mb-2">
            Loading your activity...
          </h1>
          <div className="wsj-rule-double" />
        </header>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="wsj-stat-card">
              <div className="h-3 w-20 rounded skeleton-shimmer mb-3" />
              <div className="h-7 w-16 rounded skeleton-shimmer" />
            </div>
          ))}
        </div>
      </article>
    );
  }

  // ---- Connected dashboard --------------------------------------------------
  return (
    <article className="max-w-5xl" data-testid="dev-dashboard">
      {/* ---- Header ---- */}
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-wsj-muted)] mb-2">
          Developer Dashboard
        </p>
        <h1 className="wsj-headline text-3xl md:text-4xl mb-1">
          Welcome back, {formatAddress(walletData.address || '')}
        </h1>
        <p className="font-[family-name:var(--font-body-serif)] text-[var(--color-wsj-muted)]">
          Your contributions and earnings at a glance.
        </p>
        <div className="wsj-rule-double mt-4" />
      </header>

      {/* ---- Summary Bar ---- */}
      <section
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
        data-testid="dev-dashboard-summary"
      >
        <StatCard
          label="Total Earned"
          value={`${totalEarningsEth} ETH`}
          sublabel={`${acceptedCount} accepted bounties`}
          accent
          data-testid="stat-total-earned"
        />
        <StatCard
          label="Active Submissions"
          value={activeSubmissions.length}
          sublabel="in review"
          data-testid="stat-active-submissions"
        />
        <StatCard
          label="Success Rate"
          value={`${successRate}%`}
          sublabel={`${acceptedCount} of ${totalSubmissions} accepted`}
          data-testid="stat-success-rate"
        />
        <StatCard
          label="Total Submissions"
          value={totalSubmissions}
          sublabel={rejectedCount > 0 ? `${rejectedCount} rejected` : undefined}
          data-testid="stat-total-submissions"
        />
      </section>

      {/* ---- Skills & Expertise + Impact ---- */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* Skills Tags */}
        <div className="wsj-card p-6" data-testid="dev-skills">
          <h3 className="text-[10px] font-sans uppercase tracking-[0.15em] text-[var(--color-wsj-muted)] mb-4">
            Skills & Expertise
          </h3>
          {skills.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-4">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--color-wsj-highlight)] text-[var(--color-wsj-accent)] border border-[var(--color-wsj-accent)]/20"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-wsj-muted)] mb-4">
              Skills will appear here as you contribute to bounties.
            </p>
          )}
          <div className="pt-3 border-t border-[var(--color-wsj-rule)]/50">
            <div className="flex justify-between text-xs text-[var(--color-wsj-muted)]">
              <span>Average QA Score</span>
              <span className="font-mono font-semibold text-[var(--color-wsj-text)]">
                {avgScore > 0 ? `${avgScore}/100` : '--'}
              </span>
            </div>
          </div>
        </div>

        {/* Your Impact */}
        <div className="wsj-card p-6" data-testid="dev-impact">
          <h3 className="text-[10px] font-sans uppercase tracking-[0.15em] text-[var(--color-wsj-muted)] mb-4">
            Your Impact
          </h3>
          {contributedRepos.length > 0 ? (
            <ul className="space-y-3">
              {contributedRepos.slice(0, 5).map((repo) => (
                <li key={`${repo.owner}/${repo.name}`} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <GitHubLink
                      href={githubRepoUrl(repo.owner, repo.name)}
                      iconOnly
                    />
                    <span className="text-sm font-semibold text-[var(--color-wsj-text)] truncate">
                      {repo.owner}/{repo.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <span className="text-xs text-[var(--color-wsj-muted)]">
                      {repo.count} PR{repo.count !== 1 ? 's' : ''}
                    </span>
                    {repo.earned > 0n && (
                      <span className="text-xs font-semibold text-[var(--color-wsj-accent)]">
                        {weiToEth(repo.earned.toString())} ETH
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--color-wsj-muted)]">
              Repos you contribute to will appear here.
            </p>
          )}
        </div>
      </section>

      {/* ---- Active Submissions with Progress ---- */}
      {activeSubmissions.length > 0 && (
        <section className="mb-10" data-testid="dev-active-submissions">
          <h2 className="font-[family-name:var(--font-headline)] text-2xl text-[var(--color-wsj-text)] mb-4">
            Active Submissions
          </h2>
          <div className="space-y-3">
            {activeSubmissions.map(({ bounty, solution }) => {
              // Progress bar: submitted = 33%, in review = 66%, accepted = 100%
              const progressMap: Record<string, number> = {
                submitted: 33,
                reviewing: 66,
                pending: 50,
              };
              const progress = progressMap[solution.status] || 33;

              return (
                <div key={`${bounty.id}-${solution.id}`} className="wsj-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Link
                      href={`/bounties/${bounty.id}`}
                      className="wsj-link text-sm font-semibold"
                    >
                      {bounty.repoOwner}/{bounty.repoName} #{bounty.issueNumber}
                    </Link>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={solution.status} />
                      <span className="text-sm font-semibold text-[var(--color-wsj-accent)]">
                        {weiToEth(bounty.amount)} ETH
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-[var(--color-wsj-highlight)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--color-wsj-accent)] transition-all duration-700"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-[var(--color-wsj-muted)] shrink-0 w-8 text-right">
                      {progress}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-[var(--color-wsj-muted)]">
                      Submitted {timeAgo(solution.submittedAt)}
                    </span>
                    {solution.score > 0 && (
                      <span className="text-xs text-[var(--color-wsj-muted)]">
                        Score: <span className="font-mono font-semibold">{solution.score}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ---- Payout History ---- */}
      <section className="mb-10" data-testid="dev-payout-history">
        <h2 className="font-[family-name:var(--font-headline)] text-2xl text-[var(--color-wsj-text)] mb-4">
          Payout History
        </h2>
        {payoutHistory.length > 0 ? (
          <div className="wsj-card overflow-hidden">
            <ul className="divide-y divide-[var(--color-wsj-rule)]/50">
              {payoutHistory.map((payout) => (
                <li
                  key={payout.bountyId}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-[var(--color-wsj-highlight)] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="flex-shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-full bg-emerald-500/10 text-emerald-500">
                      <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" fill="none" />
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--color-wsj-text)] truncate">
                        {payout.repo}#{payout.issue}
                      </p>
                      <p className="text-xs text-[var(--color-wsj-muted)]">
                        {timeAgo(payout.date)}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-emerald-500 ml-4 shrink-0">
                    +{payout.amount} ETH
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="wsj-card p-8 text-center">
            <p className="text-sm text-[var(--color-wsj-muted)]">
              No payouts yet. Accepted bounties will show here.
            </p>
          </div>
        )}
      </section>

      {/* ---- Your Submissions Table ---- */}
      <section className="mb-10">
        <h2 className="font-[family-name:var(--font-headline)] text-2xl text-[var(--color-wsj-text)] mb-4">
          All Submissions
        </h2>
        <DataTable
          columns={submissionColumns}
          data={walletData.mySubmissions}
          emptyMessage="You haven't submitted any solutions yet. Browse open bounties to get started."
          data-testid="dev-submissions-table"
        />
      </section>

      {/* ---- Quick-Claim Bounties ---- */}
      <section className="mb-8" data-testid="dev-available-bounties">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h2 className="font-[family-name:var(--font-headline)] text-2xl text-[var(--color-wsj-text)]">
              Quick-Claim Bounties
            </h2>
            <p className="text-sm text-[var(--color-wsj-muted)] mt-1">
              Top open bounties sorted by reward value
            </p>
          </div>
          <Link href="/bounties" className="wsj-link text-sm font-semibold">
            View all bounties &rarr;
          </Link>
        </div>

        {bountiesLoading ? (
          <div className="wsj-card p-6">
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-5 w-full rounded skeleton-shimmer" />
              ))}
            </div>
          </div>
        ) : topBounties.length === 0 ? (
          <div className="wsj-card p-8 text-center">
            <p className="text-sm font-sans text-[var(--color-wsj-muted)]">
              No open bounties right now. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topBounties.map((bounty) => (
              <Link
                key={bounty.id}
                href={`/bounties/${bounty.id}`}
                className="wsj-card wsj-card-hover p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <StatusBadge status={bounty.status} />
                    {bounty.solutionCount > 0 && (
                      <span className="text-xs text-[var(--color-wsj-muted)]">
                        {bounty.solutionCount} submission{bounty.solutionCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <p className="font-sans text-sm font-semibold text-[var(--color-wsj-text)] mb-1">
                    {bounty.repoOwner}/{bounty.repoName}
                  </p>
                  <p className="font-sans text-xs text-[var(--color-wsj-muted)]">
                    Issue #{bounty.issueNumber} &middot; {timeAgo(bounty.createdAt)}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[var(--color-wsj-rule)]/50 flex items-center justify-between">
                  <span className="text-lg font-bold text-[var(--color-wsj-accent)]">
                    {weiToEth(bounty.amount)} ETH
                  </span>
                  <span className="text-xs font-semibold text-[var(--color-wsj-accent)]">
                    Claim &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </article>
  );
}
