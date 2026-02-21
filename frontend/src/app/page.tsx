'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { api, type Bounty } from '@/lib/api';
import { weiToEth } from '@/lib/utils';

/* ──────────────────────────────────────────────────────────────────────── */
/*  Inline SVG icons                                                       */
/* ──────────────────────────────────────────────────────────────────────── */

function CodeBracketIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.25 6.75L22.5 12l-5.25 5.25M6.75 17.25L1.5 12l5.25-5.25" />
    </svg>
  );
}

function GitBranchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 3v12" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="6" r="3" />
      <path d="M18 9a9 9 0 01-9 9" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Role card configuration                                                */
/* ──────────────────────────────────────────────────────────────────────── */

interface RoleCard {
  testId: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  cta: string;
  href: string;
  accentFrom: string;
  accentTo: string;
  glowColor: string;
}

const ROLES: RoleCard[] = [
  {
    testId: 'landing-card-developer',
    title: 'For Developers',
    icon: <CodeBracketIcon className="w-8 h-8" />,
    description: 'Find bounties, submit solutions, get paid in ETH',
    cta: 'Explore Bounties \u2192',
    href: '/developer',
    accentFrom: 'from-emerald-400',
    accentTo: 'to-teal-300',
    glowColor: 'rgba(16, 185, 129, 0.15)',
  },
  {
    testId: 'landing-card-maintainer',
    title: 'For Maintainers',
    icon: <GitBranchIcon className="w-8 h-8" />,
    description: 'Post bounties on issues, AI reviews solutions, auto-payout',
    cta: 'Start Posting \u2192',
    href: '/maintainer',
    accentFrom: 'from-blue-400',
    accentTo: 'to-cyan-300',
    glowColor: 'rgba(59, 130, 246, 0.15)',
  },
  {
    testId: 'landing-card-enterprise',
    title: 'For Enterprise',
    icon: <ShieldIcon className="w-8 h-8" />,
    description: 'Secure your dependencies with automated bounty programs',
    cta: 'Learn More \u2192',
    href: '/enterprise',
    accentFrom: 'from-purple-400',
    accentTo: 'to-violet-300',
    glowColor: 'rgba(139, 92, 246, 0.15)',
  },
];

/* ──────────────────────────────────────────────────────────────────────── */
/*  Page component                                                         */
/* ──────────────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    api
      .getBounties()
      .then(setBounties)
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  const openBounties = bounties.filter((b) => b.status === 'open');
  const closedBounties = bounties.filter((b) => b.status === 'closed');
  const totalPaid = closedBounties.reduce(
    (sum, b) => sum + Number(BigInt(b.amount)) / 1e18,
    0,
  );

  return (
    <div className="relative min-h-screen flex flex-col items-center overflow-hidden">
      {/* ================================================================ */}
      {/* HERO                                                             */}
      {/* ================================================================ */}
      <section className="w-full flex flex-col items-center pt-20 pb-10 px-4 sm:px-6">
        {/* Mascot */}
        <div className="relative mb-8">
          <div className="absolute -inset-6 bg-emerald-500/15 rounded-full blur-3xl" />
          <Image
            src="/mascot.jpeg"
            alt="GitBusters mascot"
            width={140}
            height={140}
            className="relative rounded-2xl shadow-2xl shadow-emerald-500/20 border border-white/10"
            priority
          />
        </div>

        {/* Title */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-center mb-5">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
            GitBusters
          </span>
        </h1>

        {/* Tagline */}
        <p className="text-lg sm:text-xl text-gray-400 text-center max-w-xl leading-relaxed mb-4">
          Blockchain-powered bounty system for open source
        </p>

        {/* Live badge */}
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 text-xs font-medium text-emerald-400 mb-12">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot" />
          Live on Chain
        </span>

        {/* Connect Wallet CTA (top-level) */}
        <div className="mb-16" data-testid="landing-connect-wallet">
          <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-6 py-3 text-emerald-400 font-medium text-sm cursor-pointer hover:bg-emerald-500/20 transition-colors duration-200">
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M17 8h1a2 2 0 012 2v6a2 2 0 01-2 2H2a2 2 0 01-2-2v-6a2 2 0 012-2h1V6a7 7 0 0114 0v2zM3 10v6h14v-6H3zm6-4v4h2V6a5 5 0 00-10 0v2h1V6a4 4 0 018 0z" />
            </svg>
            Connect Wallet to Get Started
          </div>
          <p className="text-gray-600 text-xs text-center mt-2">
            Use the wallet button in the top-right corner
          </p>
        </div>
      </section>

      {/* ================================================================ */}
      {/* ROLE CARDS                                                       */}
      {/* ================================================================ */}
      <section className="w-full max-w-5xl px-4 sm:px-6 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ROLES.map((role) => (
            <Link
              key={role.testId}
              href={role.href}
              data-testid={role.testId}
              className="group relative"
            >
              {/* Hover glow */}
              <div
                className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
                style={{ background: role.glowColor }}
              />

              <div className="glass glass-hover relative rounded-2xl p-8 h-full flex flex-col items-center text-center transition-all duration-300 group-hover:translate-y-[-4px]">
                {/* Icon */}
                <div
                  className={`flex items-center justify-center w-16 h-16 rounded-2xl mb-6 bg-gradient-to-br ${role.accentFrom} ${role.accentTo} text-white/90 shadow-lg`}
                >
                  {role.icon}
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-white mb-3">
                  {role.title}
                </h2>

                {/* Description */}
                <p className="text-sm text-gray-400 leading-relaxed mb-6 flex-1">
                  {role.description}
                </p>

                {/* CTA */}
                <span
                  className={`text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r ${role.accentFrom} ${role.accentTo} group-hover:brightness-125 transition-all duration-300`}
                >
                  {role.cta}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ================================================================ */}
      {/* LIVE STATS                                                       */}
      {/* ================================================================ */}
      <section className="w-full max-w-5xl px-4 sm:px-6 mb-16">
        <h2 className="text-xs font-medium uppercase tracking-widest text-gray-500 text-center mb-6">
          Platform Stats
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Bounties */}
          <div className="glass rounded-2xl p-6 text-center">
            <div className="text-3xl font-bold text-white mb-1">
              {statsLoading ? (
                <span className="inline-block w-12 h-8 rounded skeleton-shimmer" />
              ) : (
                bounties.length
              )}
            </div>
            <div className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Total Bounties
            </div>
          </div>

          {/* Open Bounties */}
          <div className="glass rounded-2xl p-6 text-center">
            <div className="text-3xl font-bold text-emerald-400 mb-1">
              {statsLoading ? (
                <span className="inline-block w-12 h-8 rounded skeleton-shimmer" />
              ) : (
                openBounties.length
              )}
            </div>
            <div className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Open Bounties
            </div>
          </div>

          {/* Total Paid */}
          <div className="glass rounded-2xl p-6 text-center">
            <div className="text-3xl font-bold text-white mb-1">
              {statsLoading ? (
                <span className="inline-block w-16 h-8 rounded skeleton-shimmer" />
              ) : (
                <>
                  {weiToEth(
                    closedBounties
                      .reduce((sum, b) => sum + BigInt(b.amount), 0n)
                      .toString(),
                  )}{' '}
                  <span className="text-sm text-emerald-400 font-normal">
                    ETH
                  </span>
                </>
              )}
            </div>
            <div className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Total Paid
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* QUICK LINKS                                                      */}
      {/* ================================================================ */}
      <section className="w-full max-w-5xl px-4 sm:px-6 mb-20">
        <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
          <Link
            href="/bounties"
            className="hover:text-emerald-400 transition-colors duration-200"
          >
            Browse All Bounties
          </Link>
          <span className="h-4 w-px bg-white/10" />
          <Link
            href="/leaderboard"
            className="hover:text-emerald-400 transition-colors duration-200"
          >
            Leaderboard
          </Link>
        </div>
      </section>

      {/* ================================================================ */}
      {/* FOOTER TAGLINE                                                   */}
      {/* ================================================================ */}
      <footer className="w-full text-center pb-10 px-4">
        <p className="text-xs text-gray-600">
          Built on Ethereum &middot; Powered by smart contracts &middot; Open
          source
        </p>
      </footer>
    </div>
  );
}
