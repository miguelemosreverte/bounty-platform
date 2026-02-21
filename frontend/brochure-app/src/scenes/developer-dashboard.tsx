import type { Story } from './types';
import { CONTRIBUTOR1 } from '../data/fixtures';
import DeveloperOverview from '@/app/(backoffice)/developer/page';
import DeveloperDashboard from '@/app/(backoffice)/developer/dashboard/page';
import DeveloperBounties from '@/app/(backoffice)/developer/bounties/page';
import LeaderboardPage from '@/app/(public)/leaderboard/page';

export const developerDashboard: Story = {
  id: 'developer-dashboard',
  title: 'Connected Dashboard',
  description: 'A developer connects their Ethereum wallet and accesses the personalized dashboard — tracking earnings, submission history, success rates, and available bounties matched to their profile.',
  steps: [
    {
      label: 'Connect an Ethereum wallet on the developer overview',
      durationMs: 4000,
      component: DeveloperOverview,
      layout: 'backoffice',
      scrollPercent: 0,
      mockState: { pathname: '/developer', walletConnected: true, walletAddress: CONTRIBUTOR1, role: 'developer' },
    },
    {
      label: 'Navigate to the personalized developer dashboard',
      durationMs: 5000,
      component: DeveloperDashboard,
      layout: 'backoffice',
      scrollPercent: 0,
      mockState: { pathname: '/developer/dashboard', walletConnected: true, walletAddress: CONTRIBUTOR1, role: 'developer' },
    },
    {
      label: 'Scroll to the submission history table',
      durationMs: 5000,
      component: DeveloperDashboard,
      layout: 'backoffice',
      scrollPercent: 50,
      mockState: { pathname: '/developer/dashboard', walletConnected: true, walletAddress: CONTRIBUTOR1, role: 'developer' },
    },
    {
      label: 'Browse available bounties surfaced by the platform',
      durationMs: 4000,
      component: DeveloperBounties,
      layout: 'backoffice',
      scrollPercent: 0,
      mockState: { pathname: '/developer/bounties', walletConnected: true, walletAddress: CONTRIBUTOR1, role: 'developer' },
    },
    {
      label: 'Check leaderboard standing while connected',
      durationMs: 4000,
      component: LeaderboardPage,
      layout: 'public',
      scrollPercent: 0,
      mockState: { pathname: '/leaderboard', walletConnected: true, walletAddress: CONTRIBUTOR1, role: 'public' },
    },
  ],
};
