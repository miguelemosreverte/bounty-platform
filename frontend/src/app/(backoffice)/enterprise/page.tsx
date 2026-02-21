'use client';

import Link from 'next/link';

/* ── Pricing tiers ──────────────────────────────────── */
const tiers = [
  {
    name: 'Startup',
    price: '$500',
    period: '/mo',
    features: [
      'Up to 50 dependencies monitored',
      'Community-sourced bounties',
      'Monthly vulnerability digest',
      'Email support',
    ],
    highlight: false,
  },
  {
    name: 'Growth',
    price: '$2,000',
    period: '/mo',
    features: [
      'Up to 200 dependencies monitored',
      'Priority bounties with faster SLA',
      'Weekly vulnerability digest',
      'Dedicated Slack channel',
      'Custom bounty templates',
    ],
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: '$5,000',
    period: '/mo',
    features: [
      'Unlimited dependencies monitored',
      'Dedicated support engineer',
      '24-hour critical-fix SLA',
      'Custom integration & SSO',
      'Audit-ready compliance reports',
      'On-call escalation path',
    ],
    highlight: false,
  },
];

export default function EnterpriseOverviewPage() {
  return (
    <div data-testid="enterprise-overview">
      {/* ── Editorial header ──────────────────────────── */}
      <header className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-wsj-muted)] mb-2">
          For Enterprises
        </p>
        <h1 className="wsj-headline text-4xl md:text-5xl font-bold mb-4">
          Open Source Infrastructure Insurance
        </h1>
        <div className="wsj-rule-double pt-4" />
        <p className="text-lg text-[var(--color-wsj-muted)] max-w-2xl mt-4 leading-relaxed">
          Your products depend on open source. GitBusters Shield ensures the
          libraries you rely on stay maintained, secure, and up to date&mdash;backed
          by funded bounties and a global contributor network.
        </p>
      </header>

      {/* ── What is GitBusters Shield ─────────────────── */}
      <section className="mb-12">
        <h2 className="wsj-headline text-2xl font-bold mb-4">
          What is GitBusters Shield?
        </h2>
        <div className="wsj-rule-double pt-4 mb-6" />
        <div className="wsj-card p-6 space-y-4">
          <p className="text-[var(--color-wsj-text)] leading-relaxed">
            GitBusters Shield is a corporate sponsorship program that proactively
            funds maintenance, security fixes, and feature requests across the open
            source dependencies your organization uses every day.
          </p>
          <p className="text-[var(--color-wsj-text)] leading-relaxed">
            Instead of waiting for volunteers, Shield places bounties on critical
            issues in your dependency tree. Our network of vetted
            contributors&mdash;human and AI&mdash;competes to deliver high-quality
            patches, reviewed and scored by automated QA agents before merging.
          </p>
          <p className="text-[var(--color-wsj-text)] leading-relaxed">
            Think of it as an insurance policy for your software supply chain:
            continuous monitoring, rapid response, and full transparency via
            on-chain settlement.
          </p>
        </div>
      </section>

      {/* ── How Shield Works ──────────────────────────── */}
      <section className="mb-12">
        <h2 className="wsj-headline text-2xl font-bold mb-4">How Shield Works</h2>
        <div className="wsj-rule-double pt-4 mb-6" />
        <ol className="space-y-5">
          {[
            {
              title: 'Dependency Scan',
              desc: 'We index your dependency manifests (package.json, go.mod, Cargo.toml, etc.) to build a live map of your open source surface area.',
            },
            {
              title: 'Risk Monitoring',
              desc: 'Our agents continuously monitor advisories, stale maintainers, and critical issues across your tracked libraries.',
            },
            {
              title: 'Automated Bounties',
              desc: 'When a risk is detected, Shield auto-creates funded bounties targeting the issue, routed to qualified contributors.',
            },
            {
              title: 'Settlement & Reporting',
              desc: 'Fixes are reviewed, merged, and paid out on-chain. You receive compliance-ready reports for your security team.',
            },
          ].map((step, i) => (
            <li key={i} className="flex gap-4 items-start">
              <span className="wsj-headline text-2xl font-bold text-[var(--color-wsj-accent)] w-8 shrink-0">
                {i + 1}.
              </span>
              <div>
                <h3 className="font-semibold text-[var(--color-wsj-text)] text-lg">
                  {step.title}
                </h3>
                <p className="text-[var(--color-wsj-muted)] leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Pricing Tiers ─────────────────────────────── */}
      <section className="mb-12">
        <h2 className="wsj-headline text-2xl font-bold mb-4">Pricing</h2>
        <div className="wsj-rule-double pt-4 mb-6" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map(tier => (
            <div
              key={tier.name}
              className={`wsj-card p-6 flex flex-col ${
                tier.highlight
                  ? 'border-[var(--color-wsj-accent)] border-2 relative'
                  : ''
              }`}
            >
              {tier.highlight && (
                <span className="absolute -top-3 left-4 wsj-accent-bg text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded">
                  Most Popular
                </span>
              )}
              <h3 className="wsj-headline text-xl font-bold mb-1">{tier.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="wsj-headline text-3xl font-bold">{tier.price}</span>
                <span className="text-[var(--color-wsj-muted)] text-sm">
                  {tier.period}
                </span>
              </div>
              <ul className="space-y-2 flex-1 mb-6">
                {tier.features.map((feat, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-[var(--color-wsj-text)]"
                  >
                    <span className="text-[var(--color-wsj-accent)] mt-0.5 shrink-0">
                      &#10003;
                    </span>
                    {feat}
                  </li>
                ))}
              </ul>
              <Link
                href="/enterprise/dashboard"
                className={`block text-center py-2.5 rounded font-semibold text-sm transition-opacity ${
                  tier.highlight
                    ? 'wsj-accent-bg text-white hover:opacity-90'
                    : 'border border-[var(--color-wsj-accent)] text-[var(--color-wsj-accent)] hover:bg-[var(--color-wsj-highlight)]'
                }`}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────── */}
      <section className="text-center py-8">
        <div className="wsj-rule-double pt-6 mb-6" />
        <h2 className="wsj-headline text-2xl font-bold mb-3">
          Secure Your Supply Chain Today
        </h2>
        <p className="text-[var(--color-wsj-muted)] mb-6 max-w-lg mx-auto">
          Talk to our team about how GitBusters Shield can reduce your open source
          risk exposure.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/enterprise/dashboard"
            className="wsj-link inline-block wsj-accent-bg px-8 py-3 rounded text-white font-semibold text-lg no-underline hover:no-underline hover:opacity-90 transition-opacity"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  );
}
