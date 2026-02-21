'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { apiFetch, type Bounty, type Solution } from '@/lib/utils';
import { useWeb3Ready } from '@/providers/Web3Provider';

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
  const web3Ready = useWeb3Ready();
  const account = useAccountSafe();
  const address = web3Ready ? account.address : undefined;
  const isConnected = web3Ready ? account.isConnected : false;
  const [myBounties, setMyBounties] = useState<Bounty[]>([]);
  const [mySubmissions, setMySubmissions] = useState<{ bounty: Bounty; solution: Solution }[]>([]);
  const [totalEarnings, setTotalEarnings] = useState<bigint>(0n);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address || !isConnected) {
      setMyBounties([]);
      setMySubmissions([]);
      setTotalEarnings(0n);
      return;
    }

    async function fetchActivity() {
      setLoading(true);
      try {
        const bounties = await apiFetch<Bounty[]>('/api/bounties');
        const addrLower = address!.toLowerCase();

        // Bounties created by this wallet (maintainer)
        const created = bounties.filter(
          (b) => b.maintainer.toLowerCase() === addrLower
        );
        setMyBounties(created);

        // Solutions submitted by this wallet (contributor)
        const submissions: { bounty: Bounty; solution: Solution }[] = [];
        let earnings = 0n;

        for (const bounty of bounties) {
          try {
            const solutions = await apiFetch<Solution[]>(
              `/api/bounties/${bounty.id}/solutions`
            );
            for (const sol of solutions) {
              if (sol.contributor.toLowerCase() === addrLower) {
                submissions.push({ bounty, solution: sol });
                if (sol.status === 'accepted' && bounty.status === 'closed') {
                  // The bounty amount is 0 after payout, so we use the original
                  // For now, track via leaderboard data instead
                }
              }
            }
          } catch {
            // Skip bounties with no solutions endpoint
          }
        }

        setMySubmissions(submissions);

        // Get earnings from leaderboard
        try {
          const leaderboard = await apiFetch<{ address: string; totalPayout: string }[]>(
            '/api/leaderboard'
          );
          const entry = leaderboard.find(
            (e) => e.address.toLowerCase() === addrLower
          );
          if (entry) {
            earnings = BigInt(entry.totalPayout);
          }
        } catch {
          // Leaderboard may not be available
        }

        setTotalEarnings(earnings);
      } catch (err) {
        console.error('Failed to fetch wallet activity:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchActivity();
  }, [address, isConnected]);

  return {
    address,
    isConnected,
    myBounties,
    mySubmissions,
    totalEarnings,
    bountiesCreated: myBounties.length,
    solutionsSubmitted: mySubmissions.length,
    loading,
  };
}

/** Safe wrapper that only calls useAccount when providers are available */
export function useAccountSafe() {
  try {
    return useAccount();
  } catch {
    return { address: undefined, isConnected: false };
  }
}
