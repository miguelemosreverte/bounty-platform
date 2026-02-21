import type { Story } from './types';
import LandingPage from '@/app/page';
import EnterpriseOverview from '@/app/(backoffice)/enterprise/page';
import EnterpriseDashboard from '@/app/(backoffice)/enterprise/dashboard/page';

export const enterpriseShield: Story = {
  id: 'enterprise-shield',
  title: 'Shield Program Discovery',
  description: 'An enterprise visitor discovers GitBusters Shield — reviewing the program overview, comparing pricing tiers, exploring features, and previewing the dependency coverage dashboard.',
  steps: [
    {
      label: 'Discover the enterprise offering from the landing page',
      durationMs: 5000,
      component: LandingPage,
      layout: 'none',
      scrollPercent: 0,
      mockState: { pathname: '/', walletConnected: false, role: 'public' },
    },
    {
      label: 'Enter the GitBusters Shield overview',
      durationMs: 5000,
      component: EnterpriseOverview,
      layout: 'backoffice',
      scrollPercent: 0,
      mockState: { pathname: '/enterprise', walletConnected: false, role: 'enterprise' },
    },
    {
      label: 'Scroll to pricing tiers and feature comparison',
      durationMs: 5000,
      component: EnterpriseOverview,
      layout: 'backoffice',
      scrollPercent: 50,
      mockState: { pathname: '/enterprise', walletConnected: false, role: 'enterprise' },
    },
    {
      label: 'Explore Shield features and the enterprise call to action',
      durationMs: 4000,
      component: EnterpriseOverview,
      layout: 'backoffice',
      scrollPercent: 100,
      mockState: { pathname: '/enterprise', walletConnected: false, role: 'enterprise' },
    },
    {
      label: 'Preview the dependency coverage dashboard',
      durationMs: 5000,
      component: EnterpriseDashboard,
      layout: 'backoffice',
      scrollPercent: 0,
      mockState: { pathname: '/enterprise/dashboard', walletConnected: true, walletAddress: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', role: 'enterprise' },
    },
  ],
};
