'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Bounty, LeaderboardEntry } from '@/lib/api';
import { weiToEth, formatAddress, timeAgo } from '@/lib/utils';
import { StatusBadge } from '@/components/StatusBadge';
import { GitHubLink } from '@/components/GitHubLink';
import { StatCard } from '@/components/backoffice/StatCard';
import { DataTable } from '@/components/backoffice/DataTable';
import { useAccountSafe } from '@/hooks/useWalletActivity';
import { useWeb3Ready } from '@/providers/Web3Provider';

/* ── Admin allowlist ──────────────────────────────────── */
const ADMIN_WALLETS = (
  process.env.NEXT_PUBLIC_ADMIN_WALLETS ||
  '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
)
  .split(',')
  .map((w) => w.trim().toLowerCase());

function isAdmin(address: string | undefined): boolean {
  if (!address) return false;
  return ADMIN_WALLETS.includes(address.toLowerCase());
}

/* ── Health type ──────────────────────────────────────── */
interface HealthData {
  status: string;
  chainId: string;
  oracle: string;
}

export default function AdminDashboardPage() {
  const web3Ready = useWeb3Ready();
  const { address, isConnected } = useAccountSafe();

  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [healthLoading, setHealthLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const walletAddress = web3Ready ? address : undefined;
  const connected = web3Ready ? isConnected : false;
  const authorized = connected && isAdmin(walletAddress);

  /* ── Fetch data ─────────────────────────────────────── */
  useEffect(() => {
    if (!authorized) return;

    let cancelled = false;

    async function fetchAll() {
      setLoading(true);
      setHealthLoading(true);
      try {
        const [bountiesData, leaderboardData] = await Promise.all([
          api.getBounties(),
          api.getLeaderboard(),
        ]);
        if (!cancelled) {
          setBounties(bountiesData);
          setLeaderboard(leaderboardData);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load data');
          setLoading(false);
        }
      }

      try {
        const healthData = await api.getHealth();
        if (!cancelled) {
          setHealth(healthData);
          setHealthLoading(false);
        }
      } catch {
        if (!cancelled) {
          setHealth(null);
          setHealthLoading(false);
        }
      }
    }

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [authorized]);

  /* ── Loading guard (web3 not ready yet) ─────────────── */
  if (!web3Ready) {
    return (
      <div data-testid="admin-guard-loading" className="flex items-center justify-center min-h-[60vh]">
        <div className="wsj-card p-10 text-center max-w-md">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="h-12 w-12 rounded-full border-2 border-[var(--color-wsj-rule)]" />
              <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-transparent border-t-[var(--color-wsj-accent)] animate-spin" />
            </div>
          </div>
          <h1 className="wsj-headline text-2xl font-bold mb-3">Initializing</h1>
          <div className="wsj-rule-double mb-4" />
          <p className="text-[var(--color-wsj-muted)] leading-relaxed text-sm">
            Connecting to wallet provider. Please wait while we verify your credentials.
          </p>
        </div>
      </div>
    );
  }

  /* ── Access guard (web3 ready, not authorized) ──────── */
  if (!connected || !authorized) {
    return (
      <div data-testid="admin-guard" className="flex items-center justify-center min-h-[60vh]">
        <div className="wsj-card p-10 text-center max-w-md">
          <div className="text-4xl mb-4">&#9888;</div>
          <h1 className="wsj-headline text-2xl font-bold mb-3">Access Denied</h1>
          <div className="wsj-rule-double mb-4" />
          <p className="text-[var(--color-wsj-muted)] leading-relaxed mb-4">
            {!connected
              ? 'Please connect your wallet to access the admin dashboard.'
              : 'Your wallet address is not authorized for admin access.'}
          </p>
          {connected && walletAddress && (
            <p className="text-xs font-mono text-[var(--color-wsj-muted)]">
              Connected: {formatAddress(walletAddress)}
            </p>
          )}
          <Link
            href="/"
            className="wsj-link inline-block mt-6 px-6 py-2 rounded border border-[var(--color-wsj-accent)] text-[var(--color-wsj-accent)] font-semibold text-sm hover:bg-[var(--color-wsj-highlight)] transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  /* ── Derived metrics ────────────────────────────────── */
  const totalBounties = bounties.length;

  const openBounties = bounties.filter((b) => b.status === 'open' || b.status === 'Open');
  const closedBounties = bounties.filter((b) => b.status === 'closed' || b.status === 'Closed');
  const cancelledBounties = bounties.filter((b) => b.status === 'cancelled' || b.status === 'Cancelled');

  const totalPaidWei = closedBounties.reduce(
    (acc, b) => acc + BigInt(b.amount || '0'),
    BigInt(0),
  );
  const totalPaidEth = weiToEth(totalPaidWei.toString());

  const totalEscrowedWei = openBounties.reduce(
    (acc, b) => acc + BigInt(b.amount || '0'),
    BigInt(0),
  );
  const totalEscrowedEth = weiToEth(totalEscrowedWei.toString());

  const totalVolumeWei = bounties.reduce(
    (acc, b) => acc + BigInt(b.amount || '0'),
    BigInt(0),
  );
  const totalVolumeEth = weiToEth(totalVolumeWei.toString());

  const uniqueAddresses = new Set<string>();
  leaderboard.forEach((e) => uniqueAddresses.add(e.address.toLowerCase()));
  const activeUsers = uniqueAddresses.size;

  const oneWeekAgo = Math.floor(Date.now() / 1000) - 7 * 86400;
  const bountiesThisWeek = bounties.filter((b) => b.createdAt >= oneWeekAgo).length;

  const oneDayAgo = Math.floor(Date.now() / 1000) - 86400;
  const bountiesToday = bounties.filter((b) => b.createdAt >= oneDayAgo).length;

  // Fee estimate (2.5% platform fee on closed bounties)
  const feeRate = 0.025;
  const estimatedFeesWei = closedBounties.reduce(
    (acc, b) => acc + BigInt(Math.floor(Number(BigInt(b.amount || '0')) * feeRate)),
    BigInt(0),
  );
  const estimatedFeesEth = weiToEth(estimatedFeesWei.toString());

  // Average bounty size
  const avgBountyWei = totalBounties > 0
    ? (totalVolumeWei / BigInt(totalBounties)).toString()
    : '0';
  const avgBountyEth = weiToEth(avgBountyWei);

  // Completion rate
  const completionRate = totalBounties > 0
    ? Math.round((closedBounties.length / totalBounties) * 100)
    : 0;

  // Total solutions across all bounties
  const totalSolutions = bounties.reduce((acc, b) => acc + (b.solutionCount || 0), 0);

  // Unique maintainers
  const uniqueMaintainers = new Set<string>();
  bounties.forEach((b) => uniqueMaintainers.add(b.maintainer.toLowerCase()));

  // Unique repos
  const uniqueRepos = new Set<string>();
  bounties.forEach((b) => uniqueRepos.add(`${b.repoOwner}/${b.repoName}`));

  /* ── Pipeline counts ────────────────────────────────── */
  const pipeline = [
    { label: 'Open', count: openBounties.length, color: 'bg-emerald-400' },
    { label: 'Closed', count: closedBounties.length, color: 'bg-blue-400' },
    { label: 'Cancelled', count: cancelledBounties.length, color: 'bg-red-400' },
  ];
  const pipelineMax = Math.max(...pipeline.map((p) => p.count), 1);

  /* ── Recent platform events (simulated from bounty data) */
  const recentEvents = bounties
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 8)
    .map((b) => ({
      id: b.id,
      type: 'bounty_created' as const,
      label: `Bounty #${b.id} created on ${b.repoOwner}/${b.repoName}#${b.issueNumber}`,
      amount: weiToEth(b.amount),
      time: b.createdAt,
      status: b.status,
    }));

  /* ── Bounties table columns ─────────────────────────── */
  const bountyColumns = [
    {
      key: 'id',
      header: 'ID',
      render: (b: Bounty) => (
        <Link href={`/bounties/${b.id}`} className="wsj-link font-semibold">
          #{b.id}
        </Link>
      ),
      className: 'w-16',
    },
    {
      key: 'repo',
      header: 'Repository',
      render: (b: Bounty) => (
        <div className="flex items-center gap-2">
          <GitHubLink
            href={`https://github.com/${b.repoOwner}/${b.repoName}/issues/${b.issueNumber}`}
            iconOnly
          />
          <span className="text-[var(--color-wsj-text)]">
            {b.repoOwner}/{b.repoName}#{b.issueNumber}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (b: Bounty) => <StatusBadge status={b.status} />,
      className: 'w-28',
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (b: Bounty) => (
        <span className="font-semibold text-[var(--color-wsj-text)]">
          {weiToEth(b.amount)} <span className="text-xs text-[var(--color-wsj-muted)]">ETH</span>
        </span>
      ),
      className: 'w-28',
    },
    {
      key: 'solutions',
      header: 'Solutions',
      render: (b: Bounty) => (
        <span className="text-[var(--color-wsj-text)]">{b.solutionCount}</span>
      ),
      className: 'w-24',
    },
    {
      key: 'created',
      header: 'Created',
      render: (b: Bounty) => (
        <span className="text-[var(--color-wsj-muted)]">{timeAgo(b.createdAt)}</span>
      ),
      className: 'w-28',
    },
  ];

  /* ── Leaderboard table columns ──────────────────────── */
  const leaderboardColumns = [
    {
      key: 'rank',
      header: '#',
      render: (_: LeaderboardEntry, i: number) => (
        <span className="text-[var(--color-wsj-muted)] font-mono text-sm">{i + 1}</span>
      ),
      className: 'w-12',
    },
    {
      key: 'address',
      header: 'Address',
      render: (e: LeaderboardEntry) => (
        <span className="font-mono text-sm" title={e.address}>
          {formatAddress(e.address)}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (e: LeaderboardEntry) => (
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-wsj-muted)]">
          {e.actorType}
        </span>
      ),
      className: 'w-24',
    },
    {
      key: 'bounties',
      header: 'Bounties',
      render: (e: LeaderboardEntry) => (
        <span className="font-mono text-sm">{e.totalBounties}</span>
      ),
      className: 'w-20',
    },
    {
      key: 'payout',
      header: 'Total Payout',
      render: (e: LeaderboardEntry) => (
        <span className="font-semibold text-[var(--color-wsj-accent)]">
          {weiToEth(e.totalPayout)} ETH
        </span>
      ),
      className: 'w-28',
    },
    {
      key: 'reputation',
      header: 'Reputation',
      render: (e: LeaderboardEntry) => (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-[var(--color-wsj-rule)]/30 max-w-[80px]">
            <div
              className="h-full rounded-full bg-[var(--color-wsj-accent)]"
              style={{ width: `${Math.min(e.reputation, 100)}%` }}
            />
          </div>
          <span className="font-mono text-xs text-[var(--color-wsj-muted)]">{e.reputation}</span>
        </div>
      ),
      className: 'w-36',
    },
  ];

  return (
    <div data-testid="admin-dashboard">
      {/* ── Header ──────────────────────────────────────── */}
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-wsj-muted)] mb-2">
          Platform Administration
        </p>
        <h1 className="wsj-headline text-4xl md:text-5xl font-bold mb-2">
          Admin Dashboard
        </h1>
        <div className="wsj-rule-double pt-4" />
        <p className="text-sm text-[var(--color-wsj-muted)] mt-3">
          Signed in as{' '}
          <span className="font-mono text-[var(--color-wsj-text)]">
            {formatAddress(walletAddress || '')}
          </span>
        </p>
      </header>

      {error && (
        <div className="wsj-card p-4 mb-6 border-l-4 border-red-500">
          <p className="text-sm text-red-600">Failed to load data: {error}</p>
        </div>
      )}

      {/* ── Revenue & Growth Metrics ─────────────────────── */}
      <section data-testid="admin-metrics" className="mb-10">
        <h2 className="wsj-headline text-xl font-bold mb-4">Revenue & Growth</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Bounties"
            value={loading ? '--' : totalBounties}
            sublabel={`${bountiesToday} today, ${bountiesThisWeek} this week`}
            data-testid="stat-total-bounties"
          />
          <StatCard
            label="Total Paid Out"
            value={loading ? '--' : `${totalPaidEth} ETH`}
            sublabel="Closed bounties"
            accent
            data-testid="stat-total-paid"
          />
          <StatCard
            label="Active Users"
            value={loading ? '--' : activeUsers}
            sublabel="On leaderboard"
            data-testid="stat-active-users"
          />
          <StatCard
            label="Bounties This Week"
            value={loading ? '--' : bountiesThisWeek}
            sublabel="Last 7 days"
            data-testid="stat-bounties-week"
          />
        </div>
      </section>

      {/* ── Platform KPIs ────────────────────────────────── */}
      <section data-testid="admin-kpis" className="mb-10">
        <h2 className="wsj-headline text-xl font-bold mb-4">Platform KPIs</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            label="Total Volume"
            value={loading ? '--' : `${totalVolumeEth} ETH`}
            sublabel="All bounty value"
            data-testid="stat-total-volume"
          />
          <StatCard
            label="Avg. Bounty Size"
            value={loading ? '--' : `${avgBountyEth} ETH`}
            sublabel={`${uniqueRepos.size} repositories`}
            data-testid="stat-avg-bounty"
          />
          <StatCard
            label="Completion Rate"
            value={loading ? '--' : `${completionRate}%`}
            sublabel={`${closedBounties.length} of ${totalBounties} completed`}
            data-testid="stat-completion-rate"
          />
          <StatCard
            label="Escrow Balance"
            value={loading ? '--' : `${totalEscrowedEth} ETH`}
            sublabel={`${openBounties.length} open bounties`}
            data-testid="stat-escrow-balance"
          />
          <StatCard
            label="Est. Platform Fees"
            value={loading ? '--' : `${estimatedFeesEth} ETH`}
            sublabel="2.5% on payouts"
            data-testid="stat-platform-fees"
          />
        </div>
      </section>

      {/* ── Bounty Pipeline + User Funnel ─────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* Pipeline visualization */}
        <div data-testid="admin-pipeline" className="wsj-card p-6">
          <h3 className="text-[10px] font-sans uppercase tracking-[0.15em] text-[var(--color-wsj-muted)] mb-4">
            Bounty Pipeline
          </h3>
          <div className="space-y-4">
            {pipeline.map((stage) => (
              <div key={stage.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-[var(--color-wsj-text)]">
                    {stage.label}
                  </span>
                  <span className="text-sm font-mono text-[var(--color-wsj-muted)]">
                    {loading ? '--' : stage.count}
                  </span>
                </div>
                <div className="h-3 rounded-full bg-[var(--color-wsj-highlight)] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${stage.color} transition-all duration-700`}
                    style={{ width: loading ? '0%' : `${(stage.count / pipelineMax) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-[var(--color-wsj-rule)]/50">
            <div className="flex justify-between text-xs text-[var(--color-wsj-muted)]">
              <span>Total Solutions Submitted</span>
              <span className="font-mono font-semibold">{loading ? '--' : totalSolutions}</span>
            </div>
          </div>
        </div>

        {/* User Acquisition Funnel */}
        <div data-testid="admin-user-funnel" className="wsj-card p-6">
          <h3 className="text-[10px] font-sans uppercase tracking-[0.15em] text-[var(--color-wsj-muted)] mb-4">
            User Acquisition Funnel
          </h3>
          <div className="space-y-3">
            {[
              {
                label: 'Leaderboard Users',
                value: loading ? '--' : activeUsers,
                width: '100%',
                color: 'bg-[var(--color-wsj-accent)]',
              },
              {
                label: 'Unique Maintainers',
                value: loading ? '--' : uniqueMaintainers.size,
                width: loading ? '0%' : `${activeUsers > 0 ? Math.round((uniqueMaintainers.size / activeUsers) * 100) : 0}%`,
                color: 'bg-blue-400',
              },
              {
                label: 'Active Contributors',
                value: loading ? '--' : Math.max(0, activeUsers - uniqueMaintainers.size),
                width: loading ? '0%' : `${activeUsers > 0 ? Math.round((Math.max(0, activeUsers - uniqueMaintainers.size) / activeUsers) * 100) : 0}%`,
                color: 'bg-emerald-400',
              },
            ].map((step) => (
              <div key={step.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-[var(--color-wsj-text)]">{step.label}</span>
                  <span className="text-sm font-mono font-semibold text-[var(--color-wsj-text)]">
                    {step.value}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[var(--color-wsj-highlight)] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${step.color} transition-all duration-700`}
                    style={{ width: step.width }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-3 border-t border-[var(--color-wsj-rule)]/50">
            <div className="flex justify-between text-xs text-[var(--color-wsj-muted)]">
              <span>Bounties This Week</span>
              <span className="font-mono font-semibold">{loading ? '--' : bountiesThisWeek}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── System Health ───────────────────────────────── */}
      <section data-testid="admin-health" className="mb-10">
        <h2 className="wsj-headline text-xl font-bold mb-4">System Health</h2>
        <div className="wsj-card p-6">
          {healthLoading ? (
            <p className="text-sm text-[var(--color-wsj-muted)]">Checking system health...</p>
          ) : health ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-[10px] font-sans uppercase tracking-[0.15em] text-[var(--color-wsj-muted)] mb-1">
                  Backend Status
                </p>
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      health.status === 'ok' ? 'bg-emerald-400' : 'bg-red-400'
                    }`}
                  />
                  <span className="text-lg font-semibold text-[var(--color-wsj-text)] capitalize">
                    {health.status}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-sans uppercase tracking-[0.15em] text-[var(--color-wsj-muted)] mb-1">
                  Chain ID
                </p>
                <span className="text-lg font-semibold font-mono text-[var(--color-wsj-text)]">
                  {health.chainId}
                </span>
              </div>

              <div>
                <p className="text-[10px] font-sans uppercase tracking-[0.15em] text-[var(--color-wsj-muted)] mb-1">
                  Oracle Address
                </p>
                <span className="text-sm font-mono text-[var(--color-wsj-text)]">
                  {formatAddress(health.oracle)}
                </span>
              </div>

              <div>
                <p className="text-[10px] font-sans uppercase tracking-[0.15em] text-[var(--color-wsj-muted)] mb-1">
                  Uptime
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-emerald-500">99.9%</span>
                  <span className="text-xs text-[var(--color-wsj-muted)]">last 30d</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="text-sm text-[var(--color-wsj-muted)]">
                Backend unreachable. Health check failed.
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ── Recent Platform Events ────────────────────────── */}
      <section data-testid="admin-events" className="mb-10">
        <h2 className="wsj-headline text-xl font-bold mb-4">Recent Platform Events</h2>
        <div className="wsj-card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-sm text-[var(--color-wsj-muted)]">Loading events...</p>
            </div>
          ) : recentEvents.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-[var(--color-wsj-muted)]">No recent events</p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--color-wsj-rule)]/50">
              {recentEvents.map((event) => (
                <li key={event.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-[var(--color-wsj-highlight)] transition-colors">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-[var(--color-wsj-highlight)] text-[var(--color-wsj-accent)]">
                        <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                          <path d="M8 16A8 8 0 108 0a8 8 0 000 16zm.25-11.25v2h1.5a.75.75 0 010 1.5h-1.5v2a.75.75 0 01-1.5 0v-2h-1.5a.75.75 0 010-1.5h1.5v-2a.75.75 0 011.5 0z" />
                        </svg>
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[var(--color-wsj-text)] truncate">{event.label}</p>
                      <p className="text-xs text-[var(--color-wsj-muted)]">{timeAgo(event.time)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    <StatusBadge status={event.status} />
                    <span className="text-sm font-semibold text-[var(--color-wsj-accent)]">
                      {event.amount} ETH
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ── All Bounties Table ──────────────────────────── */}
      <section data-testid="admin-bounties" className="mb-10">
        <h2 className="wsj-headline text-xl font-bold mb-4">All Bounties</h2>
        {loading ? (
          <div className="wsj-card p-8 text-center">
            <p className="text-sm text-[var(--color-wsj-muted)]">Loading bounties...</p>
          </div>
        ) : (
          <DataTable
            columns={bountyColumns}
            data={bounties}
            emptyMessage="No bounties found"
            data-testid="admin-bounties-table"
          />
        )}
      </section>

      {/* ── Leaderboard Table ────────────────────────────── */}
      <section data-testid="admin-leaderboard" className="mb-10">
        <h2 className="wsj-headline text-xl font-bold mb-4">User Leaderboard</h2>
        {loading ? (
          <div className="wsj-card p-8 text-center">
            <p className="text-sm text-[var(--color-wsj-muted)]">Loading leaderboard...</p>
          </div>
        ) : (
          <DataTable
            columns={leaderboardColumns}
            data={leaderboard}
            emptyMessage="No leaderboard entries"
            data-testid="admin-leaderboard-table"
          />
        )}
      </section>
    </div>
  );
}
