import { useContext, useEffect, useState } from 'react';
import { NavigationContext } from './next-navigation';
import { bounties, solutions, leaderboard, DEPLOYER, CONTRIBUTOR1 } from '../data/fixtures';
import type { Bounty, Solution } from '../data/fixtures';

interface WalletActivity {
  address: string | undefined;
  isConnected: boolean;
  myBounties: Bounty[];
  mySubmissions: { bounty: Bounty; solution: Solution }[];
  totalEarnings: bigint;
  bountiesCreated: number;
  solutionsSubmitted: number;
  loading: boolean;
}

export function useWalletActivity(): WalletActivity {
  const state = useContext(NavigationContext);
  const address = state.walletConnected ? state.walletAddress : undefined;
  const isConnected = state.walletConnected;

  if (!address || !isConnected) {
    return {
      address: undefined,
      isConnected: false,
      myBounties: [],
      mySubmissions: [],
      totalEarnings: 0n,
      bountiesCreated: 0,
      solutionsSubmitted: 0,
      loading: false,
    };
  }

  const addrLower = address.toLowerCase();

  // Bounties created by this wallet
  const myBounties = bounties.filter(b => b.maintainer.toLowerCase() === addrLower);

  // Solutions submitted by this wallet
  const mySubmissions: { bounty: Bounty; solution: Solution }[] = [];
  for (const bounty of bounties) {
    const sols = solutions[bounty.id] || [];
    for (const sol of sols) {
      if (sol.contributor.toLowerCase() === addrLower) {
        mySubmissions.push({ bounty, solution: sol });
      }
    }
  }

  // Earnings from leaderboard
  const entry = leaderboard.find(e => e.address.toLowerCase() === addrLower);
  const totalEarnings = entry ? BigInt(entry.totalPayout) : 0n;

  return {
    address,
    isConnected: true,
    myBounties,
    mySubmissions,
    totalEarnings,
    bountiesCreated: myBounties.length,
    solutionsSubmitted: mySubmissions.length,
    loading: false,
  };
}

export function useAccountSafe() {
  const state = useContext(NavigationContext);
  if (state.walletConnected && state.walletAddress) {
    return { address: state.walletAddress as `0x${string}`, isConnected: true };
  }
  return { address: undefined, isConnected: false };
}
