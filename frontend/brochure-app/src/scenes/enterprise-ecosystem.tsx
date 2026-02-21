import type { Story } from './types';
import BountiesPage from '@/app/(public)/bounties/page';
import BountyDetailPage from '@/app/(public)/bounties/[id]/page';
import LeaderboardPage from '@/app/(public)/leaderboard/page';

export const enterpriseEcosystem: Story = {
  id: 'enterprise-ecosystem',
  title: 'Ecosystem Exploration',
  description: 'An enterprise evaluator explores the broader bounty ecosystem — browsing active and completed bounties, inspecting resolution quality, and reviewing the leaderboard to assess contributor depth.',
  steps: [
    {
      label: 'Browse the full bounty marketplace',
      durationMs: 5000,
      component: BountiesPage,
      layout: 'public',
      mockState: { pathname: '/bounties', walletConnected: false, role: 'public' },
    },
    {
      label: 'Filter for active (open) bounties',
      durationMs: 5000,
      component: BountiesPage,
      layout: 'public',
      mockState: { pathname: '/bounties', searchParams: { status: 'open' }, walletConnected: false, role: 'public' },
    },
    {
      label: 'Review completed (closed) bounties for resolution quality',
      durationMs: 5000,
      component: BountiesPage,
      layout: 'public',
      mockState: { pathname: '/bounties', searchParams: { status: 'closed' }, walletConnected: false, role: 'public' },
    },
    {
      label: 'Inspect a completed bounty in detail to assess quality standards',
      durationMs: 5000,
      component: BountyDetailPage,
      layout: 'public',
      mockState: { pathname: '/bounties/8', params: { id: '8' }, walletConnected: false, role: 'public' },
    },
    {
      label: 'View the ecosystem leaderboard to evaluate contributor depth',
      durationMs: 5000,
      component: LeaderboardPage,
      layout: 'public',
      mockState: { pathname: '/leaderboard', walletConnected: false, role: 'public' },
    },
  ],
};
