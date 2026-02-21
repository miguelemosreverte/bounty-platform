'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Bounty } from '@/lib/api';
import { weiToEth } from '@/lib/utils';

export default function MaintainerOverviewPage() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBounties()
      .then(setBounties)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  /* ── Derived stats ────────────────────────────────── */
  const completedBounties = bounties.filter(b => b.status === 'closed');
  const completedCount = completedBounties.length;

  const totalPaidWei = completedBounties.reduce(
    (acc, b) => acc + BigInt(b.amount || '0'),
    BigInt(0),
  );
  const totalPaidEth = weiToEth(totalPaidWei.toString());

  // Average resolution time (seconds) for bounties that have closedAt
  const resolved = completedBounties.filter(b => b.closedAt > 0 && b.createdAt > 0);
  const avgResolutionSec =
    resolved.length > 0
      ? resolved.reduce((sum, b) => sum + (b.closedAt - b.createdAt), 0) / resolved.length
      : 0;
  const avgResolutionHours = Math.round(avgResolutionSec / 3600);

  /* ── How-it-works steps ───────────────────────────── */
  const steps = [
    {
      number: '1',
      title: 'Label the Issue',
      description:
        'Add the "bounty" label to any GitHub issue. The platform picks it up automatically.',
    },
    {
      number: '2',
      title: 'AI Generates a PRD',
      description:
        'Our AI agent drafts a Product Requirements Document so contributors know exactly what to build.',
    },
    {
      number: '3',
      title: 'Contributors Solve',
      description:
        'Human developers and AI agents alike submit pull requests against the issue.',
    },
    {
      number: '4',
      title: 'Automated Review',
      description:
        'QA and code-review agents score each submission against the PRD, ensuring quality.',
    },
    {
      number: '5',
      title: 'Pay on Completion',
      description:
        'The winning contributor is paid from escrow. Smart-contract settlement, no middlemen.',
    },
  ];

  return (
    <div data-testid="maintainer-overview">
      {/* ── Editorial header ──────────────────────────── */}
      <header className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-wsj-muted)] mb-2">
          For Maintainers
        </p>
        <h1 className="wsj-headline text-4xl md:text-5xl font-bold mb-4">
          Accelerate Your Open Source with Bounties
        </h1>
        <div className="wsj-rule-double pt-4" />
        <p className="text-lg text-[var(--color-wsj-muted)] max-w-2xl mt-4 leading-relaxed">
          Turn stale issues into funded tasks. GitBusters connects your repository
          with a global pool of contributors&mdash;human and AI&mdash;who compete to
          deliver quality code, fast.
        </p>
      </header>

      {/* ── Live stats ────────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        <div className="wsj-card p-5">
          <p className="text-xs uppercase tracking-wider text-[var(--color-wsj-muted)] mb-1">
            Completed Bounties
          </p>
          <p className="wsj-headline text-3xl font-bold">
            {loading ? '--' : completedCount}
          </p>
        </div>

        <div className="wsj-card p-5">
          <p className="text-xs uppercase tracking-wider text-[var(--color-wsj-muted)] mb-1">
            Total Paid Out
          </p>
          <p className="wsj-headline text-3xl font-bold">
            {loading ? '--' : `${totalPaidEth} ETH`}
          </p>
        </div>

        <div className="wsj-card p-5">
          <p className="text-xs uppercase tracking-wider text-[var(--color-wsj-muted)] mb-1">
            Avg. Resolution Time
          </p>
          <p className="wsj-headline text-3xl font-bold">
            {loading
              ? '--'
              : avgResolutionHours > 0
                ? `${avgResolutionHours}h`
                : 'N/A'}
          </p>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────── */}
      <section className="mb-12">
        <h2 className="wsj-headline text-2xl font-bold mb-6">How It Works</h2>
        <div className="wsj-rule-double pt-4 mb-6" />

        <ol className="space-y-6">
          {steps.map(step => (
            <li key={step.number} className="flex gap-4 items-start">
              <span className="wsj-headline text-2xl font-bold text-[var(--color-wsj-accent)] w-8 shrink-0">
                {step.number}.
              </span>
              <div>
                <h3 className="font-semibold text-[var(--color-wsj-text)] text-lg">
                  {step.title}
                </h3>
                <p className="text-[var(--color-wsj-muted)] leading-relaxed">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Fee Structure ─────────────────────────────── */}
      <section className="mb-12">
        <div className="wsj-card p-6" style={{ background: 'var(--color-wsj-highlight)' }}>
          <h2 className="wsj-headline text-xl font-bold mb-2">
            Transparent Fee Structure
          </h2>
          <p className="text-lg text-[var(--color-wsj-text)] font-semibold mb-1">
            5% creation premium &mdash; contributors receive 100%
          </p>
          <p className="text-[var(--color-wsj-muted)] text-sm leading-relaxed">
            When you fund a bounty, a 5% platform fee is applied at creation time.
            The full bounty amount is held in escrow and paid out entirely to the
            winning contributor. No hidden fees, no deductions on payout.
          </p>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────── */}
      <section className="text-center py-8">
        <div className="wsj-rule-double pt-6 mb-6" />
        <h2 className="wsj-headline text-2xl font-bold mb-3">
          Ready to Fund Your First Bounty?
        </h2>
        <p className="text-[var(--color-wsj-muted)] mb-6 max-w-lg mx-auto">
          Connect your wallet and start turning open issues into funded, trackable
          tasks in minutes.
        </p>
        <Link
          href="/maintainer/dashboard"
          className="wsj-link inline-block wsj-accent-bg px-8 py-3 rounded text-white font-semibold text-lg no-underline hover:no-underline hover:opacity-90 transition-opacity"
        >
          Connect Wallet to Get Started
        </Link>
      </section>
    </div>
  );
}
