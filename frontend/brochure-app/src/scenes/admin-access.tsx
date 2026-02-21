import type { Story } from './types';
import { DEPLOYER } from '../data/fixtures';
import AdminPage from '@/app/(backoffice)/admin/page';

export const adminAccess: Story = {
  id: 'admin-access',
  title: 'Admin Dashboard',
  description: 'The deployer wallet unlocks the full admin dashboard — revealing platform revenue, KPIs, bounty pipeline status, system health, and the complete bounty and leaderboard tables.',
  steps: [
    {
      label: 'Admin dashboard overview — revenue, KPIs, and pipeline status',
      durationMs: 5000,
      component: AdminPage,
      layout: 'backoffice',
      scrollPercent: 0,
      mockState: { pathname: '/admin', walletConnected: true, walletAddress: DEPLOYER, role: 'admin' },
    },
    {
      label: 'System health, recent events, and the full bounties table',
      durationMs: 5000,
      component: AdminPage,
      layout: 'backoffice',
      scrollPercent: 55,
      mockState: { pathname: '/admin', walletConnected: true, walletAddress: DEPLOYER, role: 'admin' },
    },
    {
      label: 'All bounties data table and user leaderboard',
      durationMs: 5000,
      component: AdminPage,
      layout: 'backoffice',
      scrollPercent: 100,
      mockState: { pathname: '/admin', walletConnected: true, walletAddress: DEPLOYER, role: 'admin' },
    },
  ],
};
