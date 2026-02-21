import type { Story } from './types';
import { DEPLOYER } from '../data/fixtures';
import AdminPage from '@/app/(backoffice)/admin/page';
import BountiesPage from '@/app/(public)/bounties/page';
import BountyDetailPage from '@/app/(public)/bounties/[id]/page';
import LeaderboardPage from '@/app/(public)/leaderboard/page';

export const adminOperations: Story = {
  id: 'admin-operations',
  title: 'Operational Monitoring',
  description: 'The admin monitors platform operations — reviewing detailed bounty activity, inspecting individual bounty resolution quality, and tracking contributor reputation across the ecosystem.',
  steps: [
    {
      label: 'Admin dashboard — bounty pipeline and user acquisition funnel',
      durationMs: 5000,
      component: AdminPage,
      layout: 'backoffice',
      scrollPercent: 30,
      mockState: { pathname: '/admin', walletConnected: true, walletAddress: DEPLOYER, role: 'admin' },
    },
    {
      label: 'Monitor the public bounty ecosystem — closed bounties',
      durationMs: 5000,
      component: BountiesPage,
      layout: 'public',
      mockState: { pathname: '/bounties', searchParams: { status: 'closed' }, walletConnected: true, walletAddress: DEPLOYER, role: 'public' },
    },
    {
      label: 'Inspect a closed bounty for resolution quality assurance',
      durationMs: 5000,
      component: BountyDetailPage,
      layout: 'public',
      mockState: { pathname: '/bounties/4', params: { id: '4' }, walletConnected: true, walletAddress: DEPLOYER, role: 'public' },
    },
    {
      label: 'Monitor ecosystem-wide leaderboard and contributor reputation',
      durationMs: 5000,
      component: LeaderboardPage,
      layout: 'public',
      mockState: { pathname: '/leaderboard', walletConnected: true, walletAddress: DEPLOYER, role: 'public' },
    },
  ],
};
