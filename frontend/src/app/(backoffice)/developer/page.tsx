'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, type Bounty } from '@/lib/api';
import { weiToEth } from '@/lib/utils';

interface Stats {
  openBounties: number;
  totalPaidOut: string;
  avgBountySize: string;
}

function computeStats(bounties: Bounty[]): Stats {
  const open = bounties.filter((b) => b.status === 'open' || b.status === 'Open');
  const closed = bounties.filter((b) => b.status === 'closed' || b.status === 'Closed' || b.status === 'paid' || b.status === 'Paid');

  const totalPaidWei = closed.reduce((sum, b) => sum + BigInt(b.amount || '0'), BigInt(0));

  const allAmounts = bounties.map((b) => BigInt(b.amount || '0'));
  const avgWei =
    allAmounts.length > 0
      ? allAmounts.reduce((sum, a) => sum + a, BigInt(0)) / BigInt(allAmounts.length)
      : BigInt(0);

  return {
    openBounties: open.length,
    totalPaidOut: weiToEth(totalPaidWei.toString()),
    avgBountySize: weiToEth(avgWei.toString()),
  };
}

const steps = [
  {
    number: 1,
    title: 'Find a Bounty',
    description:
      'Browse open bounties across GitHub repositories. Each bounty is backed by a smart contract escrow, so funds are guaranteed.',
  },
  {
    number: 2,
    title: 'Submit a PR',
    description:
      'Fork the repo, write your solution, and open a pull request. Our automated QA agent scores your submission against the acceptance criteria.',
  },
  {
    number: 3,
    title: 'Get Paid',
    description:
      'Once your PR is accepted and merged, the escrowed funds are released directly to your wallet. No invoices, no delays.',
  },
];

export default function DeveloperOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getBounties()
      .then((bounties) => {
        if (!cancelled) {
          setStats(computeStats(bounties));
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message ?? 'Failed to load stats');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <article data-testid="developer-overview" className="max-w-4xl">
      {/* ── Editorial Header ─────────────────────────────── */}
      <header className="mb-10">
        <h1 className="wsj-headline text-4xl md:text-5xl mb-4">
          How to Earn with GitBusters
        </h1>
        <p className="font-[family-name:var(--font-body-serif)] text-lg text-[var(--color-wsj-muted)] leading-relaxed max-w-2xl">
          Open source contributors earn crypto by solving real issues. Every bounty is
          escrowed on-chain -- submit a pull request, pass automated QA, and get paid
          instantly.
        </p>
      </header>

      <div className="wsj-rule-double mb-10" />

      {/* ── 3-Step Process ───────────────────────────────── */}
      <section className="mb-12">
        <h2 className="font-[family-name:var(--font-headline)] text-2xl text-[var(--color-wsj-text)] mb-6">
          Three Steps to Your First Payout
        </h2>

        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className="wsj-card p-6">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-wsj-accent)] text-white font-[family-name:var(--font-headline)] text-lg font-bold mb-4">
                {step.number}
              </span>
              <h3 className="font-[family-name:var(--font-headline)] text-xl text-[var(--color-wsj-text)] mb-2">
                {step.title}
              </h3>
              <p className="font-[family-name:var(--font-body-serif)] text-sm text-[var(--color-wsj-muted)] leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Live Stats ───────────────────────────────────── */}
      <section className="mb-12">
        <h2 className="font-[family-name:var(--font-headline)] text-2xl text-[var(--color-wsj-text)] mb-6">
          Platform at a Glance
        </h2>

        {error && (
          <p className="font-[family-name:var(--font-body-serif)] text-sm text-red-600 mb-4">
            Unable to load live stats: {error}
          </p>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          <div className="wsj-card p-6 text-center">
            <p className="font-[family-name:var(--font-body-serif)] text-sm text-[var(--color-wsj-muted)] uppercase tracking-wide mb-1">
              Open Bounties
            </p>
            {loading ? (
              <span className="block h-9 w-16 mx-auto rounded skeleton-shimmer" />
            ) : (
              <p className="font-[family-name:var(--font-headline)] text-3xl text-[var(--color-wsj-text)]">
                {stats?.openBounties ?? 0}
              </p>
            )}
          </div>

          <div className="wsj-card p-6 text-center">
            <p className="font-[family-name:var(--font-body-serif)] text-sm text-[var(--color-wsj-muted)] uppercase tracking-wide mb-1">
              Total Paid Out
            </p>
            {loading ? (
              <span className="block h-9 w-24 mx-auto rounded skeleton-shimmer" />
            ) : (
              <p className="font-[family-name:var(--font-headline)] text-3xl text-[var(--color-wsj-text)]">
                {stats?.totalPaidOut ?? '0'} <span className="text-lg">ETH</span>
              </p>
            )}
          </div>

          <div className="wsj-card p-6 text-center">
            <p className="font-[family-name:var(--font-body-serif)] text-sm text-[var(--color-wsj-muted)] uppercase tracking-wide mb-1">
              Avg Bounty Size
            </p>
            {loading ? (
              <span className="block h-9 w-24 mx-auto rounded skeleton-shimmer" />
            ) : (
              <p className="font-[family-name:var(--font-headline)] text-3xl text-[var(--color-wsj-text)]">
                {stats?.avgBountySize ?? '0'} <span className="text-lg">ETH</span>
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="wsj-rule-double mb-10" />

      {/* ── Call to Action ───────────────────────────────── */}
      <section className="mb-8">
        <div className="wsj-card p-8 text-center">
          <h2 className="font-[family-name:var(--font-headline)] text-2xl text-[var(--color-wsj-text)] mb-3">
            Ready to Start Earning?
          </h2>
          <p className="font-[family-name:var(--font-body-serif)] text-[var(--color-wsj-muted)] mb-6 max-w-lg mx-auto">
            Connect your wallet to track submissions and payouts, or browse the
            available bounties right away.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/developer/dashboard"
              className="inline-block px-6 py-3 rounded bg-[var(--color-wsj-accent)] text-white font-[family-name:var(--font-body-serif)] font-semibold hover:bg-[var(--color-wsj-accent-hover)] transition-colors"
            >
              Connect Wallet to Start
            </Link>
            <Link
              href="/bounties"
              className="wsj-link inline-block px-6 py-3 rounded border border-[var(--color-wsj-accent)] font-[family-name:var(--font-body-serif)] font-semibold hover:bg-[var(--color-wsj-highlight)] transition-colors"
            >
              Browse Bounties
            </Link>
          </div>
        </div>
      </section>
    </article>
  );
}
