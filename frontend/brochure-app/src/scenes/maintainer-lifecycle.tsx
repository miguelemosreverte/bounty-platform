import type { Story } from './types';
import { DEPLOYER } from '../data/fixtures';
import BountiesPage from '@/app/(public)/bounties/page';
import BountyDetailPage from '@/app/(public)/bounties/[id]/page';
import LeaderboardPage from '@/app/(public)/leaderboard/page';

export const maintainerLifecycle: Story = {
  id: 'maintainer-lifecycle',
  title: 'Bounty Lifecycle View',
  description: 'A maintainer reviews their bounty lifecycle — filtering by created bounties, checking closed resolutions, drilling into solution details, and monitoring their leaderboard position.',
  steps: [
    {
      label: 'View all bounties with wallet connected',
      durationMs: 5000,
      component: BountiesPage,
      layout: 'public',
      mockState: { pathname: '/bounties', walletConnected: true, walletAddress: DEPLOYER, role: 'public' },
    },
    {
      label: 'Filter bounties by "Created by me"',
      durationMs: 5000,
      component: BountiesPage,
      layout: 'public',
      mockState: { pathname: '/bounties', searchParams: { role: 'created' }, walletConnected: true, walletAddress: DEPLOYER, role: 'public' },
    },
    {
      label: 'Review closed bounties for completed resolutions',
      durationMs: 5000,
      component: BountiesPage,
      layout: 'public',
      mockState: { pathname: '/bounties', searchParams: { status: 'closed' }, walletConnected: true, walletAddress: DEPLOYER, role: 'public' },
    },
    {
      label: 'Drill into a closed bounty to review solution details',
      durationMs: 5000,
      component: BountyDetailPage,
      layout: 'public',
      mockState: { pathname: '/bounties/2', params: { id: '2' }, walletConnected: true, walletAddress: DEPLOYER, role: 'public' },
    },
    {
      label: 'Check maintainer ranking on the leaderboard',
      durationMs: 5000,
      component: LeaderboardPage,
      layout: 'public',
      mockState: { pathname: '/leaderboard', walletConnected: true, walletAddress: DEPLOYER, role: 'public' },
    },
  ],
};
