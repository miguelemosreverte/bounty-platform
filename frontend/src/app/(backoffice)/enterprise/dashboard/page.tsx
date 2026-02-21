'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Bounty } from '@/lib/api';
import { weiToEth, timeAgo } from '@/lib/utils';
import { StatCard } from '@/components/backoffice/StatCard';

/* ── Simulated enterprise data types ──────────────────── */
interface Dependency {
  name: string;
  version: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  covered: boolean;
  lastAudit: number;
}

interface ShieldProgram {
  status: 'active' | 'pending' | 'inactive';
  tier: string;
  startDate: number;
  renewalDate: number;
  coveredRepos: number;
  totalRepos: number;
}

/* ── Simulated dependencies ───────────────────────────── */
function generateDependencies(): Dependency[] {
  const now = Math.floor(Date.now() / 1000);
  return [
    { name: '@openzeppelin/contracts', version: '5.0.1', severity: 'critical', covered: true, lastAudit: now - 86400 * 3 },
    { name: 'solmate', version: '6.7.0', severity: 'critical', covered: true, lastAudit: now - 86400 * 7 },
    { name: 'forge-std', version: '1.7.5', severity: 'high', covered: true, lastAudit: now - 86400 * 14 },
    { name: 'go-ethereum', version: '1.13.14', severity: 'critical', covered: true, lastAudit: now - 86400 * 5 },
    { name: 'chi', version: '5.0.12', severity: 'medium', covered: false, lastAudit: 0 },
    { name: 'wagmi', version: '2.5.7', severity: 'high', covered: true, lastAudit: now - 86400 * 10 },
    { name: 'viem', version: '2.7.14', severity: 'high', covered: false, lastAudit: 0 },
    { name: 'next', version: '15.1.0', severity: 'medium', covered: true, lastAudit: now - 86400 * 2 },
    { name: 'tailwindcss', version: '4.0.0', severity: 'low', covered: true, lastAudit: now - 86400 * 21 },
    { name: '@rainbow-me/rainbowkit', version: '2.0.5', severity: 'medium', covered: false, lastAudit: 0 },
    { name: 'ethers', version: '6.11.0', severity: 'high', covered: true, lastAudit: now - 86400 * 8 },
    { name: 'godotenv', version: '1.5.1', severity: 'low', covered: false, lastAudit: 0 },
  ];
}

function getShieldProgram(): ShieldProgram {
  const now = Math.floor(Date.now() / 1000);
  return {
    status: 'active',
    tier: 'Professional',
    startDate: now - 86400 * 90,
    renewalDate: now + 86400 * 275,
    coveredRepos: 3,
    totalRepos: 5,
  };
}

export default function EnterpriseDashboardPage() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);

  const dependencies = useMemo(() => generateDependencies(), []);
  const shield = useMemo(() => getShieldProgram(), []);

  useEffect(() => {
    let cancelled = false;
    api.getBounties()
      .then((data) => {
        if (!cancelled) setBounties(data);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  /* ── Derived metrics ────────────────────────────────── */
  const coveredDeps = dependencies.filter((d) => d.covered);
  const coveragePercent = Math.round((coveredDeps.length / dependencies.length) * 100);

  const criticalDeps = dependencies.filter((d) => d.severity === 'critical');
  const criticalCovered = criticalDeps.filter((d) => d.covered);
  const criticalCoveragePercent = criticalDeps.length > 0
    ? Math.round((criticalCovered.length / criticalDeps.length) * 100)
    : 0;

  // Security posture score (weighted by severity)
  const severityWeight: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
  const maxScore = dependencies.reduce((s, d) => s + severityWeight[d.severity], 0);
  const coveredScore = coveredDeps.reduce((s, d) => s + severityWeight[d.severity], 0);
  const securityPosture = maxScore > 0 ? Math.round((coveredScore / maxScore) * 100) : 0;

  // Budget data
  const totalBountyValue = bounties.reduce((acc, b) => acc + BigInt(b.amount || '0'), 0n);
  const closedBountyValue = bounties
    .filter((b) => b.status === 'closed' || b.status === 'Closed')
    .reduce((acc, b) => acc + BigInt(b.amount || '0'), 0n);
  const openBountyValue = bounties
    .filter((b) => b.status === 'open' || b.status === 'Open')
    .reduce((acc, b) => acc + BigInt(b.amount || '0'), 0n);

  // Monthly budget simulation (based on total / 6 months)
  const monthlyBudgetEth = 5.0; // Simulated monthly budget
  const monthlySpentEth = Number(weiToEth(totalBountyValue.toString())) / 6;
  const budgetUtilization = Math.min(100, Math.round((monthlySpentEth / monthlyBudgetEth) * 100));

  // SLA compliance
  const now = Math.floor(Date.now() / 1000);
  const slaTargetDays = 7;
  const bountiesWithSolutions = bounties.filter((b) => b.solutionCount > 0);
  const slaCompliant = bountiesWithSolutions.length > 0 ? bountiesWithSolutions.length : 0;
  const slaTotal = bounties.length;
  const slaPercent = slaTotal > 0 ? Math.round((slaCompliant / slaTotal) * 100) : 100;

  // Severity distribution for heat map
  const severityGroups = {
    critical: dependencies.filter((d) => d.severity === 'critical'),
    high: dependencies.filter((d) => d.severity === 'high'),
    medium: dependencies.filter((d) => d.severity === 'medium'),
    low: dependencies.filter((d) => d.severity === 'low'),
  };

  // Days until renewal
  const daysUntilRenewal = Math.max(0, Math.floor((shield.renewalDate - now) / 86400));

  return (
    <div data-testid="enterprise-dashboard">
      {/* ── Editorial Header ─────────────────────────────── */}
      <header className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-wsj-muted)] mb-2">
          Enterprise Shield
        </p>
        <h1 className="wsj-headline text-4xl md:text-5xl font-bold mb-4">
          Security Command Center
        </h1>
        <div className="wsj-rule-double pt-4" />
      </header>

      {/* ── Shield Program Status Banner ──────────────────── */}
      <section className="mb-10" data-testid="enterprise-shield-status">
        <div className="wsj-card p-6 border-l-4 border-[var(--color-wsj-accent)]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-[var(--color-wsj-accent)]/10 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-wsj-accent)" strokeWidth="1.5" className="w-6 h-6">
                    <path d="M12 2l8 4v6c0 5.25-3.5 10-8 11.5C7.5 22 4 17.25 4 12V6l8-4z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-[var(--color-wsj-text)]">
                    Shield {shield.tier}
                  </h3>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    shield.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : shield.status === 'pending'
                        ? 'bg-amber-500/10 text-amber-500'
                        : 'bg-red-500/10 text-red-400'
                  }`}>
                    {shield.status}
                  </span>
                </div>
                <p className="text-sm text-[var(--color-wsj-muted)]">
                  {shield.coveredRepos} of {shield.totalRepos} repositories covered &middot; Renews in {daysUntilRenewal} days
                </p>
              </div>
            </div>
            <Link
              href="/enterprise"
              className="wsj-link text-sm font-semibold shrink-0"
            >
              Manage Plan &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ── Top-line Metrics ──────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10" data-testid="enterprise-metrics">
        <StatCard
          label="Security Posture"
          value={`${securityPosture}%`}
          sublabel="Weighted coverage score"
          accent
          data-testid="stat-security-posture"
        />
        <StatCard
          label="Dependency Coverage"
          value={`${coveredDeps.length}/${dependencies.length}`}
          sublabel={`${coveragePercent}% covered`}
          data-testid="stat-dep-coverage"
        />
        <StatCard
          label="Critical Coverage"
          value={`${criticalCoveragePercent}%`}
          sublabel={`${criticalCovered.length} of ${criticalDeps.length} critical deps`}
          data-testid="stat-critical-coverage"
        />
        <StatCard
          label="SLA Compliance"
          value={`${slaPercent}%`}
          sublabel={`${slaTargetDays}-day response target`}
          data-testid="stat-sla-compliance"
        />
      </section>

      {/* ── Security Posture + Budget ─────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* Security Posture Gauge */}
        <div className="wsj-card p-6" data-testid="enterprise-posture-gauge">
          <h3 className="text-[10px] font-sans uppercase tracking-[0.15em] text-[var(--color-wsj-muted)] mb-5">
            Security Posture Score
          </h3>
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <svg viewBox="0 0 120 120" className="w-32 h-32">
                {/* Background circle */}
                <circle cx="60" cy="60" r="52" fill="none" stroke="var(--color-wsj-rule)" strokeWidth="8" opacity="0.3" />
                {/* Progress arc */}
                <circle
                  cx="60" cy="60" r="52"
                  fill="none"
                  stroke="var(--color-wsj-accent)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(securityPosture / 100) * 327} 327`}
                  transform="rotate(-90 60 60)"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold font-mono text-[var(--color-wsj-text)]">{securityPosture}</span>
                <span className="text-[10px] uppercase tracking-wider text-[var(--color-wsj-muted)]">Score</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-bold font-mono text-emerald-500">{coveredDeps.length}</div>
              <div className="text-[10px] uppercase tracking-wider text-[var(--color-wsj-muted)]">Covered</div>
            </div>
            <div>
              <div className="text-lg font-bold font-mono text-red-400">{dependencies.length - coveredDeps.length}</div>
              <div className="text-[10px] uppercase tracking-wider text-[var(--color-wsj-muted)]">Uncovered</div>
            </div>
          </div>
        </div>

        {/* Budget Utilization */}
        <div className="wsj-card p-6" data-testid="enterprise-budget">
          <h3 className="text-[10px] font-sans uppercase tracking-[0.15em] text-[var(--color-wsj-muted)] mb-5">
            Budget Utilization & Burn Rate
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-[var(--color-wsj-text)]">Monthly Budget</span>
                <span className="text-sm font-mono font-semibold text-[var(--color-wsj-text)]">{monthlyBudgetEth.toFixed(1)} ETH</span>
              </div>
              <div className="h-3 rounded-full bg-[var(--color-wsj-highlight)] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    budgetUtilization > 90 ? 'bg-red-400' : budgetUtilization > 70 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${budgetUtilization}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-[var(--color-wsj-muted)]">{budgetUtilization}% utilized</span>
                <span className="text-xs text-[var(--color-wsj-muted)]">{monthlySpentEth.toFixed(2)} ETH spent</span>
              </div>
            </div>
            <div className="h-px bg-[var(--color-wsj-rule)]/50" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-wsj-muted)]">Total Allocated</span>
              <span className="text-sm font-mono text-[var(--color-wsj-text)]">
                {loading ? '--' : `${weiToEth(totalBountyValue.toString())} ETH`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-wsj-muted)]">Paid Out</span>
              <span className="text-sm font-mono text-emerald-500">
                {loading ? '--' : `${weiToEth(closedBountyValue.toString())} ETH`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-wsj-muted)]">In Escrow</span>
              <span className="text-sm font-mono text-amber-500">
                {loading ? '--' : `${weiToEth(openBountyValue.toString())} ETH`}
              </span>
            </div>
            <div className="h-px bg-[var(--color-wsj-rule)]/50" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[var(--color-wsj-text)]">Avg. Cost per Fix</span>
              <span className="text-sm font-bold font-mono text-[var(--color-wsj-accent)]">
                {loading || bounties.length === 0
                  ? '--'
                  : `${weiToEth((totalBountyValue / BigInt(bounties.length)).toString())} ETH`}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Critical Issues Heat Map ──────────────────────── */}
      <section className="mb-10" data-testid="enterprise-heatmap">
        <h2 className="wsj-headline text-xl font-bold mb-4">Dependency Risk Heat Map</h2>
        <div className="wsj-card p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(Object.entries(severityGroups) as [string, Dependency[]][]).map(([severity, deps]) => {
              const covered = deps.filter((d) => d.covered).length;
              const colors: Record<string, { bg: string; border: string; text: string; badge: string }> = {
                critical: { bg: 'bg-red-500/5', border: 'border-red-400/30', text: 'text-red-500', badge: 'bg-red-500/10 text-red-500' },
                high: { bg: 'bg-amber-500/5', border: 'border-amber-400/30', text: 'text-amber-500', badge: 'bg-amber-500/10 text-amber-500' },
                medium: { bg: 'bg-blue-500/5', border: 'border-blue-400/30', text: 'text-blue-500', badge: 'bg-blue-500/10 text-blue-500' },
                low: { bg: 'bg-emerald-500/5', border: 'border-emerald-400/30', text: 'text-emerald-500', badge: 'bg-emerald-500/10 text-emerald-500' },
              };
              const c = colors[severity];

              return (
                <div key={severity} className={`rounded-lg border ${c.border} ${c.bg} p-4`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${c.text}`}>
                      {severity}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.badge}`}>
                      {covered}/{deps.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {deps.map((dep) => (
                      <div key={dep.name} className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full shrink-0 ${dep.covered ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        <span className="text-xs text-[var(--color-wsj-text)] truncate flex-1">
                          {dep.name}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--color-wsj-muted)]">
                          {dep.version}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SLA Compliance Dashboard ──────────────────────── */}
      <section className="mb-10" data-testid="enterprise-sla">
        <h2 className="wsj-headline text-xl font-bold mb-4">SLA Compliance</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="wsj-card p-5 text-center">
            <div className="text-[10px] font-sans uppercase tracking-[0.15em] text-[var(--color-wsj-muted)] mb-2">
              Response Time SLA
            </div>
            <div className={`text-3xl font-bold font-mono ${slaPercent >= 90 ? 'text-emerald-500' : slaPercent >= 70 ? 'text-amber-500' : 'text-red-400'}`}>
              {slaPercent}%
            </div>
            <div className="text-xs text-[var(--color-wsj-muted)] mt-1">
              Target: {slaTargetDays}-day first response
            </div>
            <div className="h-2 rounded-full bg-[var(--color-wsj-highlight)] overflow-hidden mt-3">
              <div
                className={`h-full rounded-full transition-all duration-700 ${slaPercent >= 90 ? 'bg-emerald-400' : slaPercent >= 70 ? 'bg-amber-400' : 'bg-red-400'}`}
                style={{ width: `${slaPercent}%` }}
              />
            </div>
          </div>

          <div className="wsj-card p-5 text-center">
            <div className="text-[10px] font-sans uppercase tracking-[0.15em] text-[var(--color-wsj-muted)] mb-2">
              Resolution Rate
            </div>
            <div className="text-3xl font-bold font-mono text-[var(--color-wsj-accent)]">
              {loading ? '--' : bounties.length > 0
                ? `${Math.round((bounties.filter((b) => b.status === 'closed' || b.status === 'Closed').length / bounties.length) * 100)}%`
                : '0%'}
            </div>
            <div className="text-xs text-[var(--color-wsj-muted)] mt-1">
              Bounties resolved to completion
            </div>
            <div className="h-2 rounded-full bg-[var(--color-wsj-highlight)] overflow-hidden mt-3">
              <div
                className="h-full rounded-full bg-[var(--color-wsj-accent)] transition-all duration-700"
                style={{
                  width: loading || bounties.length === 0
                    ? '0%'
                    : `${Math.round((bounties.filter((b) => b.status === 'closed' || b.status === 'Closed').length / bounties.length) * 100)}%`,
                }}
              />
            </div>
          </div>

          <div className="wsj-card p-5 text-center">
            <div className="text-[10px] font-sans uppercase tracking-[0.15em] text-[var(--color-wsj-muted)] mb-2">
              Active Bounties
            </div>
            <div className="text-3xl font-bold font-mono text-emerald-500">
              {loading ? '--' : bounties.filter((b) => b.status === 'open' || b.status === 'Open').length}
            </div>
            <div className="text-xs text-[var(--color-wsj-muted)] mt-1">
              Currently being worked on
            </div>
            <div className="h-2 rounded-full bg-[var(--color-wsj-highlight)] overflow-hidden mt-3">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all duration-700"
                style={{
                  width: loading || bounties.length === 0
                    ? '0%'
                    : `${Math.round((bounties.filter((b) => b.status === 'open' || b.status === 'Open').length / bounties.length) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Dependency Coverage Map ───────────────────────── */}
      <section className="mb-10" data-testid="enterprise-deps-table">
        <h2 className="wsj-headline text-xl font-bold mb-4">Full Dependency Coverage Map</h2>
        <div className="wsj-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-[var(--color-wsj-rule)]">
                  <th className="px-4 py-3 text-left text-[10px] font-sans uppercase tracking-[0.12em] text-[var(--color-wsj-muted)] font-semibold">
                    Package
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-sans uppercase tracking-[0.12em] text-[var(--color-wsj-muted)] font-semibold w-20">
                    Version
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-sans uppercase tracking-[0.12em] text-[var(--color-wsj-muted)] font-semibold w-24">
                    Severity
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-sans uppercase tracking-[0.12em] text-[var(--color-wsj-muted)] font-semibold w-24">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-sans uppercase tracking-[0.12em] text-[var(--color-wsj-muted)] font-semibold w-28">
                    Last Audit
                  </th>
                </tr>
              </thead>
              <tbody>
                {dependencies.map((dep) => {
                  const sevColors: Record<string, string> = {
                    critical: 'bg-red-500/10 text-red-500',
                    high: 'bg-amber-500/10 text-amber-500',
                    medium: 'bg-blue-500/10 text-blue-500',
                    low: 'bg-emerald-500/10 text-emerald-500',
                  };

                  return (
                    <tr
                      key={dep.name}
                      className="border-b border-[var(--color-wsj-rule)]/50 last:border-0 hover:bg-[var(--color-wsj-highlight)] transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-sm text-[var(--color-wsj-text)]">
                        {dep.name}
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-[var(--color-wsj-muted)]">
                        {dep.version}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${sevColors[dep.severity]}`}>
                          {dep.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${dep.covered ? 'bg-emerald-400' : 'bg-red-400'}`} />
                          <span className="text-xs text-[var(--color-wsj-text)]">
                            {dep.covered ? 'Covered' : 'Uncovered'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--color-wsj-muted)]">
                        {dep.lastAudit > 0 ? timeAgo(dep.lastAudit) : 'Never'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="text-center py-8">
        <div className="wsj-rule-double pt-6 mb-6" />
        <h2 className="wsj-headline text-2xl font-bold mb-3">
          Strengthen Your Coverage
        </h2>
        <p className="text-[var(--color-wsj-muted)] mb-6 max-w-lg mx-auto">
          {dependencies.length - coveredDeps.length} dependencies remain uncovered. Upgrade your
          Shield plan to protect your entire supply chain.
        </p>
        <Link
          href="/enterprise"
          className="wsj-link inline-block wsj-accent-bg px-8 py-3 rounded text-white font-semibold text-lg no-underline hover:no-underline hover:opacity-90 transition-opacity"
        >
          Manage Shield Program
        </Link>
      </section>
    </div>
  );
}
