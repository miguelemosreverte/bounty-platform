'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useWalletActivity } from '@/hooks/useWalletActivity';
import { useWeb3Ready } from '@/providers/Web3Provider';
import { api } from '@/lib/api';
import type { Solution } from '@/lib/api';
import { weiToEth, formatAddress, timeAgo, githubIssueUrl, githubPrUrl } from '@/lib/utils';
import { StatCard } from '@/components/backoffice/StatCard';
import { DataTable } from '@/components/backoffice/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { GitHubLink } from '@/components/GitHubLink';

interface RecentSolution extends Solution {
  bountyId: number;
  repoOwner: string;
  repoName: string;
}

export default function MaintainerDashboardPage() {
  const web3Ready = useWeb3Ready();
  const walletData = useWalletActivity();
  const [recentSolutions, setRecentSolutions] = useState<RecentSolution[]>([]);
  const [solutionsLoading, setSolutionsLoading] = useState(false);

  /* ── Fetch solutions for all owned bounties ─────────── */
  useEffect(() => {
    if (!walletData.isConnected || walletData.myBounties.length === 0) {
      setRecentSolutions([]);
      return;
    }

    let cancelled = false;

    async function fetchSolutions() {
      setSolutionsLoading(true);
      const allSolutions: RecentSolution[] = [];

      for (const bounty of walletData.myBounties) {
        try {
          const solutions = await api.getSolutions(bounty.id);
          for (const sol of solutions) {
            allSolutions.push({
              ...sol,
              bountyId: bounty.id,
              repoOwner: bounty.repoOwner,
              repoName: bounty.repoName,
            });
          }
        } catch {
          // Skip bounties whose solutions endpoint fails
        }
      }

      if (!cancelled) {
        // Sort by submittedAt descending, take top 10
        allSolutions.sort((a, b) => b.submittedAt - a.submittedAt);
        setRecentSolutions(allSolutions.slice(0, 10));
        setSolutionsLoading(false);
      }
    }

    fetchSolutions();
    return () => {
      cancelled = true;
    };
  }, [walletData.isConnected, walletData.myBounties]);

  /* ── Derived stats ──────────────────────────────────── */
  const activeBounties = walletData.myBounties.filter(
    (b) => b.status === 'open' || b.status === 'Open',
  );
  const closedBounties = walletData.myBounties.filter(
    (b) => b.status === 'closed' || b.status === 'Closed',
  );
  const cancelledBounties = walletData.myBounties.filter(
    (b) => b.status === 'cancelled' || b.status === 'Cancelled',
  );

  const totalSpentWei = walletData.myBounties.reduce(
    (acc, b) => acc + BigInt(b.amount || '0'),
    0n,
  );

  const closedSpentWei = closedBounties.reduce(
    (acc, b) => acc + BigInt(b.amount || '0'),
    0n,
  );

  const escrowedWei = activeBounties.reduce(
    (acc, b) => acc + BigInt(b.amount || '0'),
    0n,
  );

  const totalSolutions = walletData.myBounties.reduce(
    (acc, b) => acc + (b.solutionCount || 0),
    0,
  );

  // Average bounty cost
  const avgBountyWei = walletData.myBounties.length > 0
    ? (totalSpentWei / BigInt(walletData.myBounties.length)).toString()
    : '0';

  // Completion rate
  const completionRate = walletData.myBounties.length > 0
    ? Math.round((closedBounties.length / walletData.myBounties.length) * 100)
    : 0;

  // Average solutions per bounty
  const avgSolutions = walletData.myBounties.length > 0
    ? (totalSolutions / walletData.myBounties.length).toFixed(1)
    : '0';

  // Pipeline data
  const pipeline = [
    { label: 'Open', count: activeBounties.length, color: 'bg-emerald-400', textColor: 'text-emerald-500' },
    { label: 'In Review', count: activeBounties.filter((b) => b.solutionCount > 0).length, color: 'bg-amber-400', textColor: 'text-amber-500' },
    { label: 'Closed', count: closedBounties.length, color: 'bg-blue-400', textColor: 'text-blue-500' },
    { label: 'Cancelled', count: cancelledBounties.length, color: 'bg-red-400', textColor: 'text-red-400' },
  ];
  const pipelineTotal = Math.max(pipeline.reduce((s, p) => s + p.count, 0), 1);

  // Unique contributors who submitted to your bounties
  const uniqueContributors = useMemo(() => {
    const set = new Set<string>();
    recentSolutions.forEach((s) => set.add(s.contributor.toLowerCase()));
    return set.size;
  }, [recentSolutions]);

  // Repository breakdown
  const repoBreakdown = useMemo(() => {
    const map = new Map<string, { owner: string; name: string; total: number; open: number; closed: number; spent: bigint }>();
    walletData.myBounties.forEach((b) => {
      const key = `${b.repoOwner}/${b.repoName}`;
      const existing = map.get(key);
      if (existing) {
        existing.total += 1;
        if (b.status === 'open' || b.status === 'Open') existing.open += 1;
        if (b.status === 'closed' || b.status === 'Closed') existing.closed += 1;
        existing.spent += BigInt(b.amount || '0');
      } else {
        map.set(key, {
          owner: b.repoOwner,
          name: b.repoName,
          total: 1,
          open: (b.status === 'open' || b.status === 'Open') ? 1 : 0,
          closed: (b.status === 'closed' || b.status === 'Closed') ? 1 : 0,
          spent: BigInt(b.amount || '0'),
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [walletData.myBounties]);

  // AI Agent activity (simulated -- agents run on bounties with solutions)
  const agentActivity = useMemo(() => {
    const agents = ['PRD Agent', 'Estimator Agent', 'QA Agent', 'Reviewer Agent'];
    const activities: { agent: string; bountyId: number; repo: string; action: string; time: number }[] = [];

    walletData.myBounties
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 6)
      .forEach((b) => {
        // PRD and Estimator run on creation
        activities.push({
          agent: agents[0],
          bountyId: b.id,
          repo: `${b.repoOwner}/${b.repoName}`,
          action: 'Generated PRD document',
          time: b.createdAt,
        });
        if (b.estimatedComplexity > 0) {
          activities.push({
            agent: agents[1],
            bountyId: b.id,
            repo: `${b.repoOwner}/${b.repoName}`,
            action: `Estimated complexity: ${b.estimatedComplexity}/10`,
            time: b.createdAt + 5,
          });
        }
        // QA and Reviewer run when there are solutions
        if (b.solutionCount > 0) {
          activities.push({
            agent: agents[2],
            bountyId: b.id,
            repo: `${b.repoOwner}/${b.repoName}`,
            action: `Ran QA checks on ${b.solutionCount} solution${b.solutionCount !== 1 ? 's' : ''}`,
            time: b.createdAt + 120,
          });
          activities.push({
            agent: agents[3],
            bountyId: b.id,
            repo: `${b.repoOwner}/${b.repoName}`,
            action: `Reviewed ${b.solutionCount} submission${b.solutionCount !== 1 ? 's' : ''}`,
            time: b.createdAt + 180,
          });
        }
      });

    return activities.sort((a, b) => b.time - a.time).slice(0, 8);
  }, [walletData.myBounties]);

  /* ── Not connected state ────────────────────────────── */
  if (!web3Ready || !walletData.isConnected) {
    return (
      <div data-testid="maint-dashboard-connect">
        <header className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-wsj-muted)] mb-2">
            Maintainer Dashboard
          </p>
          <h1 className="wsj-headline text-4xl md:text-5xl font-bold mb-4">
            Connect Your Wallet
          </h1>
          <div className="wsj-rule-double pt-4" />
          <p className="text-lg text-[var(--color-wsj-muted)] max-w-2xl mt-4 leading-relaxed">
            Connect your wallet to view your bounties, track submissions, and
            manage payouts. Your on-chain activity will appear here automatically.
          </p>
        </header>

        <div className="wsj-card p-12 text-center">
          <div className="text-5xl mb-4 opacity-20">&#x1f512;</div>
          <h2 className="wsj-headline text-xl font-bold mb-2">
            Wallet Required
          </h2>
          <p className="text-[var(--color-wsj-muted)] mb-6 max-w-md mx-auto">
            This dashboard displays data tied to your connected wallet address.
            Please connect a wallet to continue.
          </p>
          <Link
            href="/maintainer"
            className="wsj-link text-sm font-semibold"
          >
            &larr; Back to Maintainer Overview
          </Link>
        </div>
      </div>
    );
  }

  /* ── Bounty table columns ───────────────────────────── */
  const bountyColumns = [
    {
      key: 'id',
      header: 'ID',
      render: (row: typeof walletData.myBounties[number]) => (
        <Link href={`/maintainer/bounties/${row.id}`} className="wsj-link font-mono text-sm">
          #{row.id}
        </Link>
      ),
      className: 'w-16',
    },
    {
      key: 'repository',
      header: 'Repository',
      render: (row: typeof walletData.myBounties[number]) => (
        <GitHubLink
          href={githubIssueUrl(row.repoOwner, row.repoName, row.issueNumber)}
          label={`${row.repoOwner}/${row.repoName}#${row.issueNumber}`}
        />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: typeof walletData.myBounties[number]) => (
        <StatusBadge status={row.status} />
      ),
      className: 'w-28',
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (row: typeof walletData.myBounties[number]) => (
        <span className="font-mono text-sm">
          {weiToEth(row.amount)} ETH
        </span>
      ),
      className: 'w-28',
    },
    {
      key: 'solutions',
      header: 'Solutions',
      render: (row: typeof walletData.myBounties[number]) => (
        <span className="font-mono text-sm">{row.solutionCount}</span>
      ),
      className: 'w-24',
    },
    {
      key: 'created',
      header: 'Created',
      render: (row: typeof walletData.myBounties[number]) => (
        <span className="text-sm text-[var(--color-wsj-muted)]">
          {timeAgo(row.createdAt)}
        </span>
      ),
      className: 'w-28',
    },
  ];

  /* ── Solutions table columns ────────────────────────── */
  const solutionColumns = [
    {
      key: 'bountyId',
      header: 'Bounty',
      render: (row: RecentSolution) => (
        <Link href={`/maintainer/bounties/${row.bountyId}`} className="wsj-link font-mono text-sm">
          #{row.bountyId}
        </Link>
      ),
      className: 'w-20',
    },
    {
      key: 'contributor',
      header: 'Contributor',
      render: (row: RecentSolution) => (
        <span className="font-mono text-sm" title={row.contributor}>
          {formatAddress(row.contributor)}
        </span>
      ),
    },
    {
      key: 'prNumber',
      header: 'PR',
      render: (row: RecentSolution) => (
        <GitHubLink
          href={githubPrUrl(row.repoOwner, row.repoName, row.prNumber)}
          label={`#${row.prNumber}`}
        />
      ),
      className: 'w-20',
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: RecentSolution) => (
        <StatusBadge status={row.status} />
      ),
      className: 'w-28',
    },
    {
      key: 'score',
      header: 'Score',
      render: (row: RecentSolution) => (
        <span className="font-mono text-sm">
          {row.score > 0 ? row.score : '--'}
        </span>
      ),
      className: 'w-20',
    },
  ];

  /* ── Connected dashboard ────────────────────────────── */
  return (
    <div data-testid="maint-dashboard">
      {/* ── Header ──────────────────────────────────────── */}
      <header className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-wsj-muted)] mb-2">
          Maintainer Dashboard
        </p>
        <h1 className="wsj-headline text-4xl md:text-5xl font-bold mb-4">
          Your Bounty Operations
        </h1>
        <div className="wsj-rule-double pt-4" />
        <p className="text-sm text-[var(--color-wsj-muted)] mt-4 font-mono">
          {walletData.address}
        </p>
      </header>

      {/* ── Summary stat cards ──────────────────────────── */}
      <section
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
        data-testid="maint-dashboard-summary"
      >
        <StatCard
          label="Bounties Created"
          value={walletData.loading ? '--' : walletData.bountiesCreated}
          sublabel={`${completionRate}% completion rate`}
          data-testid="stat-bounties-created"
        />
        <StatCard
          label="Active Bounties"
          value={walletData.loading ? '--' : activeBounties.length}
          sublabel={`${escrowedWei > 0n ? weiToEth(escrowedWei.toString()) : '0'} ETH escrowed`}
          accent={activeBounties.length > 0}
          data-testid="stat-active-bounties"
        />
        <StatCard
          label="Total Invested"
          value={walletData.loading ? '--' : `${weiToEth(totalSpentWei.toString())} ETH`}
          sublabel={`Avg ${weiToEth(avgBountyWei)} per bounty`}
          data-testid="stat-total-spent"
        />
        <StatCard
          label="Solutions Received"
          value={walletData.loading ? '--' : totalSolutions}
          sublabel={`${avgSolutions} avg per bounty`}
          data-testid="stat-solutions-received"
        />
      </section>

      {/* ── Bounty Lifecycle Pipeline + Cost Analysis ────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* Pipeline Visualization */}
        <div className="wsj-card p-6" data-testid="maint-pipeline">
          <h3 className="text-[10px] font-sans uppercase tracking-[0.15em] text-[var(--color-wsj-muted)] mb-5">
            Bounty Lifecycle Pipeline
          </h3>
          {/* Horizontal pipeline bar */}
          <div className="h-6 rounded-full overflow-hidden flex mb-4 bg-[var(--color-wsj-highlight)]">
            {pipeline.filter((s) => s.count > 0).map((stage) => (
              <div
                key={stage.label}
                className={`${stage.color} transition-all duration-700 relative group`}
                style={{ width: `${(stage.count / pipelineTotal) * 100}%`, minWidth: stage.count > 0 ? '20px' : '0' }}
                title={`${stage.label}: ${stage.count}`}
              />
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {pipeline.map((stage) => (
              <div key={stage.label} className="text-center">
                <div className={`text-xl font-bold font-mono ${stage.textColor}`}>
                  {walletData.loading ? '--' : stage.count}
                </div>
                <div className="text-[10px] font-sans uppercase tracking-wider text-[var(--color-wsj-muted)] mt-0.5">
                  {stage.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cost Analysis */}
        <div className="wsj-card p-6" data-testid="maint-cost-analysis">
          <h3 className="text-[10px] font-sans uppercase tracking-[0.15em] text-[var(--color-wsj-muted)] mb-5">
            Cost Analysis
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-wsj-text)]">Total Invested</span>
              <span className="text-lg font-bold font-mono text-[var(--color-wsj-text)]">
                {walletData.loading ? '--' : `${weiToEth(totalSpentWei.toString())} ETH`}
              </span>
            </div>
            <div className="h-px bg-[var(--color-wsj-rule)]/50" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-wsj-muted)]">Paid Out (closed)</span>
              <span className="text-sm font-mono text-emerald-500">
                {walletData.loading ? '--' : `${weiToEth(closedSpentWei.toString())} ETH`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-wsj-muted)]">Currently Escrowed</span>
              <span className="text-sm font-mono text-amber-500">
                {walletData.loading ? '--' : `${weiToEth(escrowedWei.toString())} ETH`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-wsj-muted)]">Avg. Bounty Cost</span>
              <span className="text-sm font-mono text-[var(--color-wsj-text)]">
                {walletData.loading ? '--' : `${weiToEth(avgBountyWei)} ETH`}
              </span>
            </div>
            <div className="h-px bg-[var(--color-wsj-rule)]/50" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[var(--color-wsj-text)]">ROI (solutions per ETH)</span>
              <span className="text-sm font-bold font-mono text-[var(--color-wsj-accent)]">
                {walletData.loading
                  ? '--'
                  : totalSpentWei > 0n
                    ? (totalSolutions / Number(weiToEth(totalSpentWei.toString()))).toFixed(1)
                    : '0'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── AI Agent Activity Feed ────────────────────────── */}
      <section className="mb-10" data-testid="maint-agent-activity">
        <h2 className="wsj-headline text-2xl font-bold mb-2">AI Agent Activity</h2>
        <div className="wsj-rule-double pt-4 mb-6" />

        {walletData.loading ? (
          <div className="wsj-card p-8 text-center">
            <p className="text-sm text-[var(--color-wsj-muted)] animate-pulse">Loading agent activity...</p>
          </div>
        ) : agentActivity.length === 0 ? (
          <div className="wsj-card p-8 text-center">
            <p className="text-sm text-[var(--color-wsj-muted)]">
              No agent activity yet. Agents run automatically on your bounties.
            </p>
          </div>
        ) : (
          <div className="wsj-card overflow-hidden">
            <ul className="divide-y divide-[var(--color-wsj-rule)]/50">
              {agentActivity.map((act, i) => {
                const agentColors: Record<string, string> = {
                  'PRD Agent': 'bg-blue-500/10 text-blue-500',
                  'Estimator Agent': 'bg-amber-500/10 text-amber-500',
                  'QA Agent': 'bg-emerald-500/10 text-emerald-500',
                  'Reviewer Agent': 'bg-purple-500/10 text-purple-500',
                };
                const colorClass = agentColors[act.agent] || 'bg-gray-500/10 text-gray-500';

                return (
                  <li key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-[var(--color-wsj-highlight)] transition-colors">
                    <span className={`shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold ${colorClass}`}>
                      {act.agent.split(' ')[0][0]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-[var(--color-wsj-text)]">
                          {act.agent}
                        </span>
                        <span className="text-xs text-[var(--color-wsj-muted)]">
                          on {act.repo} #{act.bountyId}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--color-wsj-muted)] truncate">
                        {act.action}
                      </p>
                    </div>
                    <span className="text-xs text-[var(--color-wsj-muted)] shrink-0">
                      {timeAgo(act.time)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      {/* ── Repository Health Scores ──────────────────────── */}
      <section className="mb-10" data-testid="maint-repo-health">
        <h2 className="wsj-headline text-2xl font-bold mb-2">Repository Health</h2>
        <div className="wsj-rule-double pt-4 mb-6" />

        {walletData.loading ? (
          <div className="wsj-card p-8 text-center">
            <p className="text-sm text-[var(--color-wsj-muted)] animate-pulse">Loading repositories...</p>
          </div>
        ) : repoBreakdown.length === 0 ? (
          <div className="wsj-card p-8 text-center">
            <p className="text-sm text-[var(--color-wsj-muted)]">
              Create bounties to see repository health scores.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {repoBreakdown.map((repo) => {
              const healthScore = repo.total > 0
                ? Math.min(100, Math.round((repo.closed / repo.total) * 80 + (repo.total > 2 ? 20 : repo.total * 10)))
                : 0;
              const healthColor = healthScore >= 70 ? 'text-emerald-500' : healthScore >= 40 ? 'text-amber-500' : 'text-red-400';
              const barColor = healthScore >= 70 ? 'bg-emerald-400' : healthScore >= 40 ? 'bg-amber-400' : 'bg-red-400';

              return (
                <div key={`${repo.owner}/${repo.name}`} className="wsj-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <GitHubLink
                      href={`https://github.com/${repo.owner}/${repo.name}`}
                      label={`${repo.owner}/${repo.name}`}
                    />
                    <span className={`text-lg font-bold font-mono ${healthColor}`}>
                      {healthScore}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--color-wsj-highlight)] overflow-hidden mb-3">
                    <div
                      className={`h-full rounded-full ${barColor} transition-all duration-700`}
                      style={{ width: `${healthScore}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-xs font-mono font-semibold text-[var(--color-wsj-text)]">{repo.total}</div>
                      <div className="text-[9px] uppercase tracking-wider text-[var(--color-wsj-muted)]">Total</div>
                    </div>
                    <div>
                      <div className="text-xs font-mono font-semibold text-emerald-500">{repo.open}</div>
                      <div className="text-[9px] uppercase tracking-wider text-[var(--color-wsj-muted)]">Open</div>
                    </div>
                    <div>
                      <div className="text-xs font-mono font-semibold text-[var(--color-wsj-accent)]">{weiToEth(repo.spent.toString())}</div>
                      <div className="text-[9px] uppercase tracking-wider text-[var(--color-wsj-muted)]">ETH</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Your Bounties table ─────────────────────────── */}
      <section className="mb-12">
        <h2 className="wsj-headline text-2xl font-bold mb-2">Your Bounties</h2>
        <div className="wsj-rule-double pt-4 mb-6" />

        {walletData.loading ? (
          <div className="wsj-card p-8 text-center">
            <p className="text-sm text-[var(--color-wsj-muted)] animate-pulse">
              Loading bounties...
            </p>
          </div>
        ) : (
          <DataTable
            columns={bountyColumns}
            data={walletData.myBounties}
            emptyMessage="You haven't created any bounties yet. Label a GitHub issue with 'bounty' to get started."
            data-testid="maint-bounties-table"
          />
        )}
      </section>

      {/* ── Recent Contributor Activity ───────────────────── */}
      <section className="mb-12">
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="wsj-headline text-2xl font-bold">
            Recent Contributor Activity
          </h2>
          {uniqueContributors > 0 && (
            <span className="text-xs text-[var(--color-wsj-muted)]">
              {uniqueContributors} unique contributor{uniqueContributors !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="wsj-rule-double pt-4 mb-6" />

        {walletData.loading || solutionsLoading ? (
          <div className="wsj-card p-8 text-center">
            <p className="text-sm text-[var(--color-wsj-muted)] animate-pulse">
              Loading solutions...
            </p>
          </div>
        ) : (
          <div data-testid="maint-solutions">
            <DataTable
              columns={solutionColumns}
              data={recentSolutions}
              emptyMessage="No solutions have been submitted to your bounties yet."
            />
            {recentSolutions.length > 0 && (
              <p className="text-xs text-[var(--color-wsj-muted)] mt-3 text-right">
                Showing up to 10 most recent solutions
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
