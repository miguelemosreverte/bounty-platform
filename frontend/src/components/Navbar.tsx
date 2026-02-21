'use client';

import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function Navbar() {
  return (
    <nav className="border-b border-gray-800 bg-gray-950 px-6 py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold text-white">
            Bounty Platform
          </Link>
          <div className="flex gap-6">
            <Link href="/bounties" className="text-gray-400 hover:text-white transition">
              Bounties
            </Link>
            <Link href="/leaderboard" className="text-gray-400 hover:text-white transition">
              Leaderboard
            </Link>
          </div>
        </div>
        <ConnectButton />
      </div>
    </nav>
  );
}
