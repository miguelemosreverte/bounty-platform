import type { Story } from './types';
import { DEPLOYER } from '../data/fixtures';
import MaintainerOverview from '@/app/(backoffice)/maintainer/page';
import MaintainerDashboard from '@/app/(backoffice)/maintainer/dashboard/page';
import MaintainerBounties from '@/app/(backoffice)/maintainer/bounties/page';

export const maintainerDashboardStory: Story = {
  id: 'maintainer-dashboard',
  title: 'Dashboard & Management',
  description: 'A maintainer connects their deployer wallet and accesses the full management dashboard — reviewing bounty creation stats, monitoring incoming solutions, managing the bounty lifecycle.',
  steps: [
    {
      label: 'Connect wallet as the bounty-creating maintainer',
      durationMs: 4000,
      component: MaintainerOverview,
      layout: 'backoffice',
      scrollPercent: 0,
      mockState: { pathname: '/maintainer', walletConnected: true, walletAddress: DEPLOYER, role: 'maintainer' },
    },
    {
      label: 'Navigate to the maintainer dashboard — stat cards at the top',
      durationMs: 5000,
      component: MaintainerDashboard,
      layout: 'backoffice',
      scrollPercent: 0,
      mockState: { pathname: '/maintainer/dashboard', walletConnected: true, walletAddress: DEPLOYER, role: 'maintainer' },
    },
    {
      label: 'Scroll to the bounties table with lifecycle status',
      durationMs: 5000,
      component: MaintainerDashboard,
      layout: 'backoffice',
      scrollPercent: 45,
      mockState: { pathname: '/maintainer/dashboard', walletConnected: true, walletAddress: DEPLOYER, role: 'maintainer' },
    },
    {
      label: 'Review incoming solutions from contributors',
      durationMs: 5000,
      component: MaintainerDashboard,
      layout: 'backoffice',
      scrollPercent: 85,
      mockState: { pathname: '/maintainer/dashboard', walletConnected: true, walletAddress: DEPLOYER, role: 'maintainer' },
    },
    {
      label: 'Navigate to the dedicated bounty management page',
      durationMs: 4000,
      component: MaintainerBounties,
      layout: 'backoffice',
      scrollPercent: 0,
      mockState: { pathname: '/maintainer/bounties', walletConnected: true, walletAddress: DEPLOYER, role: 'maintainer' },
    },
  ],
};
