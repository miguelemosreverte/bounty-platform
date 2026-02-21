import type { Story } from './types';
import LandingPage from '@/app/page';
import MaintainerOverview from '@/app/(backoffice)/maintainer/page';
import BountiesPage from '@/app/(public)/bounties/page';

export const maintainerOnboarding: Story = {
  id: 'maintainer-onboarding',
  title: 'Onboarding & Overview',
  description: 'A maintainer discovers GitBusters, learns about the bounty lifecycle, reviews the fee structure and AI agent capabilities, and explores the public bounty ecosystem before signing up.',
  steps: [
    {
      label: 'Discover GitBusters and choose the maintainer path',
      durationMs: 5000,
      component: LandingPage,
      layout: 'none',
      scrollPercent: 0,
      mockState: { pathname: '/', walletConnected: false, role: 'public' },
    },
    {
      label: 'Review the maintainer overview with lifecycle explanation',
      durationMs: 5000,
      component: MaintainerOverview,
      layout: 'backoffice',
      scrollPercent: 0,
      mockState: { pathname: '/maintainer', walletConnected: false, role: 'maintainer' },
    },
    {
      label: 'Learn about the 5% creation premium and fee structure',
      durationMs: 5000,
      component: MaintainerOverview,
      layout: 'backoffice',
      scrollPercent: 45,
      mockState: { pathname: '/maintainer', walletConnected: false, role: 'maintainer' },
    },
    {
      label: 'Explore platform features and the call to action',
      durationMs: 4000,
      component: MaintainerOverview,
      layout: 'backoffice',
      scrollPercent: 100,
      mockState: { pathname: '/maintainer', walletConnected: false, role: 'maintainer' },
    },
    {
      label: 'Browse the public bounty ecosystem as context',
      durationMs: 4000,
      component: BountiesPage,
      layout: 'public',
      scrollPercent: 0,
      mockState: { pathname: '/bounties', walletConnected: false, role: 'public' },
    },
  ],
};
