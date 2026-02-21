import type { Story } from './types';
import BountiesPage from '@/app/(public)/bounties/page';
import BountyDetailPage from '@/app/(public)/bounties/[id]/page';

export const developerDeepDive: Story = {
  id: 'developer-bounty-deep-dive',
  title: 'Bounty Deep Dive',
  description: 'A developer examines bounties in detail — filtering for open opportunities, reviewing reward amounts, complexity ratings, linked GitHub issues, and comparing different bounties.',
  steps: [
    {
      label: 'Browse the full bounty marketplace',
      durationMs: 5000,
      component: BountiesPage,
      layout: 'public',
      mockState: { pathname: '/bounties', walletConnected: false, role: 'public' },
    },
    {
      label: 'Filter bounties to show only open opportunities',
      durationMs: 5000,
      component: BountiesPage,
      layout: 'public',
      mockState: { pathname: '/bounties', searchParams: { status: 'open' }, walletConnected: false, role: 'public' },
    },
    {
      label: 'Select a high-value bounty for deep inspection',
      durationMs: 5000,
      component: BountyDetailPage,
      layout: 'public',
      mockState: { pathname: '/bounties/1', params: { id: '1' }, walletConnected: false, role: 'public' },
    },
    {
      label: 'Compare with a different bounty — a complex open-source core issue',
      durationMs: 5000,
      component: BountyDetailPage,
      layout: 'public',
      mockState: { pathname: '/bounties/6', params: { id: '6' }, walletConnected: false, role: 'public' },
    },
  ],
};
