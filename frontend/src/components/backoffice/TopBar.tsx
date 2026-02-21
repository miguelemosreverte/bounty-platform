'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWeb3Ready } from '@/providers/Web3Provider';

interface TopBarProps {
  currentRole: 'developer' | 'maintainer' | 'enterprise' | 'admin';
  roles?: ('developer' | 'maintainer' | 'enterprise')[];
}

const roleLabels: Record<string, string> = {
  developer: 'Developer',
  maintainer: 'Maintainer',
  enterprise: 'Enterprise',
  admin: 'Admin',
};

export function TopBar({ currentRole, roles = [] }: TopBarProps) {
  const web3Ready = useWeb3Ready();

  return (
    <header
      data-testid="backoffice-topbar"
      className="sticky top-0 z-40 flex items-center justify-between h-14 px-5 bg-white border-b border-[var(--color-wsj-rule)]"
    >
      {/* Left: Logo + Breadcrumb */}
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 group" data-testid="topbar-logo">
          <Image
            src="/mascot.jpeg"
            alt="GitBusters"
            width={28}
            height={28}
            className="rounded transition-transform group-hover:scale-110"
          />
          <span className="text-sm font-bold font-sans text-[var(--color-wsj-text)]">
            Git<span className="text-[var(--color-wsj-accent)]">Busters</span>
          </span>
        </Link>

        <span className="text-[var(--color-wsj-rule)] text-lg font-light">/</span>

        {/* Role switcher */}
        {roles.length > 1 ? (
          <div className="relative" data-testid="backoffice-role-switcher">
            <select
              value={currentRole}
              onChange={(e) => {
                window.location.href = `/${e.target.value}/dashboard`;
              }}
              className="appearance-none bg-transparent text-sm font-sans font-semibold text-[var(--color-wsj-text)] cursor-pointer pr-5 focus:outline-none"
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {roleLabels[r]}
                </option>
              ))}
            </select>
            <svg
              className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--color-wsj-muted)] pointer-events-none"
              viewBox="0 0 12 12"
              fill="currentColor"
            >
              <path d="M3 4.5L6 7.5 9 4.5" />
            </svg>
          </div>
        ) : (
          <span className="text-sm font-sans font-semibold text-[var(--color-wsj-text)]">
            {roleLabels[currentRole]}
          </span>
        )}
      </div>

      {/* Right: Quick links + Wallet */}
      <div className="flex items-center gap-4">
        <Link
          href="/bounties"
          className="text-xs font-sans text-[var(--color-wsj-muted)] hover:text-[var(--color-wsj-accent)] transition-colors"
        >
          Browse Bounties
        </Link>
        <Link
          href="/leaderboard"
          className="text-xs font-sans text-[var(--color-wsj-muted)] hover:text-[var(--color-wsj-accent)] transition-colors"
        >
          Leaderboard
        </Link>
        {web3Ready && <ConnectButton />}
      </div>
    </header>
  );
}
