import type { Story } from './types';
import LandingPage from '@/app/page';
import DeveloperOverview from '@/app/(backoffice)/developer/page';
import DeveloperBounties from '@/app/(backoffice)/developer/bounties/page';
import BountiesPage from '@/app/(public)/bounties/page';
import BountyDetailPage from '@/app/(public)/bounties/[id]/page';
import LeaderboardPage from '@/app/(public)/leaderboard/page';

export const developerDiscovery: Story = {
  id: 'developer-discovery',
  title: 'Discovery & Exploration',
  description: 'A new developer discovers the platform, explores the developer overview, browses available bounties, and dives into bounty details — all without connecting a wallet.',
  steps: [
    {
      label: 'Discover GitBusters and choose the developer path',
      durationMs: 5000,
      component: LandingPage,
      layout: 'none',
      scrollPercent: 0,
      mockState: { pathname: '/', walletConnected: false, role: 'public' },
    },
    {
      label: 'Explore the WSJ-styled developer overview with live stats',
      durationMs: 5000,
      component: DeveloperOverview,
      layout: 'backoffice',
      scrollPercent: 0,
      mockState: { pathname: '/developer', walletConnected: false, role: 'developer' },
    },
    {
      label: 'Browse developer bounties in the back-office sidebar',
      durationMs: 4000,
      component: DeveloperBounties,
      layout: 'backoffice',
      scrollPercent: 0,
      mockState: { pathname: '/developer/bounties', walletConnected: false, role: 'developer' },
    },
    {
      label: 'Browse public bounties listing',
      durationMs: 4000,
      component: BountiesPage,
      layout: 'public',
      scrollPercent: 0,
      mockState: { pathname: '/bounties', walletConnected: false, role: 'public' },
    },
    {
      label: 'Open a specific bounty to inspect reward, complexity, and solutions',
      durationMs: 5000,
      component: BountyDetailPage,
      layout: 'public',
      scrollPercent: 0,
      mockState: { pathname: '/bounties/1', params: { id: '1' }, walletConnected: false, role: 'public' },
    },
    {
      label: 'Check the contributor leaderboard for ecosystem activity',
      durationMs: 4000,
      component: LeaderboardPage,
      layout: 'public',
      scrollPercent: 0,
      mockState: { pathname: '/leaderboard', walletConnected: false, role: 'public' },
    },
  ],
};
