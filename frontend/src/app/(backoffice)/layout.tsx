'use client';

import { usePathname } from 'next/navigation';
import { TopBar } from '@/components/backoffice/TopBar';
import { Sidebar, type SidebarLink } from '@/components/backoffice/Sidebar';
import { useWalletActivity } from '@/hooks/useWalletActivity';
import { useWeb3Ready } from '@/providers/Web3Provider';

/* ── SVG micro-icons ───────────────────────────────── */
const icons = {
  overview: (
    <svg viewBox="0 0 16 16" fill="currentColor"><path d="M1 2.5A1.5 1.5 0 012.5 1h3A1.5 1.5 0 017 2.5v3A1.5 1.5 0 015.5 7h-3A1.5 1.5 0 011 5.5v-3zm8 0A1.5 1.5 0 0110.5 1h3A1.5 1.5 0 0115 2.5v3A1.5 1.5 0 0113.5 7h-3A1.5 1.5 0 019 5.5v-3zm-8 8A1.5 1.5 0 012.5 9h3A1.5 1.5 0 017 10.5v3A1.5 1.5 0 015.5 15h-3A1.5 1.5 0 011 13.5v-3zm8 0A1.5 1.5 0 0110.5 9h3a1.5 1.5 0 011.5 1.5v3a1.5 1.5 0 01-1.5 1.5h-3A1.5 1.5 0 019 13.5v-3z"/></svg>
  ),
  dashboard: (
    <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"/></svg>
  ),
  bounties: (
    <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 16A8 8 0 108 0a8 8 0 000 16zm.25-11.25v2h1.5a.75.75 0 010 1.5h-1.5v2a.75.75 0 01-1.5 0v-2h-1.5a.75.75 0 010-1.5h1.5v-2a.75.75 0 011.5 0z"/></svg>
  ),
  shield: (
    <svg viewBox="0 0 16 16" fill="currentColor"><path d="M5.338 1.59a61.44 61.44 0 00-2.837.856.481.481 0 00-.328.39c-.554 4.157.726 7.19 2.253 9.188a10.725 10.725 0 002.287 2.233c.346.244.652.42.893.533.12.057.218.095.293.118a.55.55 0 00.101.025.615.615 0 00.1-.025c.076-.023.174-.061.294-.118.24-.113.547-.29.893-.533a10.726 10.726 0 002.287-2.233c1.527-1.997 2.807-5.031 2.253-9.188a.48.48 0 00-.328-.39c-.651-.213-1.75-.56-2.837-.855C9.552 1.29 8.531 1.067 8 1.067c-.531 0-1.552.223-2.662.524zM8 0c.727 0 1.867.27 2.778.525a61.327 61.327 0 012.906.876 1.48 1.48 0 011.012 1.21c.564 4.261-.69 7.556-2.368 9.756a11.726 11.726 0 01-2.498 2.44 6.876 6.876 0 01-1.052.626 2.49 2.49 0 01-.41.169 1.607 1.607 0 01-.368.063 1.607 1.607 0 01-.368-.063 2.49 2.49 0 01-.41-.17 6.876 6.876 0 01-1.052-.625 11.726 11.726 0 01-2.498-2.44C2.012 10.228.76 6.933 1.322 2.67a1.48 1.48 0 011.012-1.21c.674-.22 1.789-.573 2.906-.876C6.133.27 7.273 0 8 0z"/></svg>
  ),
  admin: (
    <svg viewBox="0 0 16 16" fill="currentColor"><path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 01-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 01.872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 012.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 012.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 01.872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 01-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 01-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 110-5.86 2.929 2.929 0 010 5.858z"/></svg>
  ),
};

/* ── Per-role sidebar nav ──────────────────────────── */
const developerLinks: SidebarLink[] = [
  { href: '/developer', label: 'Overview', icon: icons.overview },
  { href: '/developer/dashboard', label: 'Dashboard', icon: icons.dashboard },
  { href: '/developer/bounties', label: 'Bounties', icon: icons.bounties },
];

const maintainerLinks: SidebarLink[] = [
  { href: '/maintainer', label: 'Overview', icon: icons.overview },
  { href: '/maintainer/dashboard', label: 'Dashboard', icon: icons.dashboard },
  { href: '/maintainer/bounties', label: 'My Bounties', icon: icons.bounties },
];

const enterpriseLinks: SidebarLink[] = [
  { href: '/enterprise', label: 'Overview', icon: icons.overview },
  { href: '/enterprise/dashboard', label: 'Dashboard', icon: icons.shield },
];

const adminLinks: SidebarLink[] = [
  { href: '/admin', label: 'Dashboard', icon: icons.admin },
];

function detectRole(pathname: string): 'developer' | 'maintainer' | 'enterprise' | 'admin' {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/maintainer')) return 'maintainer';
  if (pathname.startsWith('/enterprise')) return 'enterprise';
  return 'developer';
}

function linksForRole(role: string): SidebarLink[] {
  switch (role) {
    case 'maintainer': return maintainerLinks;
    case 'enterprise': return enterpriseLinks;
    case 'admin': return adminLinks;
    default: return developerLinks;
  }
}

export default function BackofficeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const role = detectRole(pathname);

  /* Detect which roles this user has (for role switcher) */
  const web3Ready = useWeb3Ready();
  const walletData = useWalletActivity();
  const detectedRoles: ('developer' | 'maintainer' | 'enterprise')[] = [];
  if (web3Ready && walletData.isConnected) {
    if (walletData.solutionsSubmitted > 0) detectedRoles.push('developer');
    if (walletData.bountiesCreated > 0) detectedRoles.push('maintainer');
    /* If neither, default to both */
    if (detectedRoles.length === 0) {
      detectedRoles.push('developer', 'maintainer');
    }
  }

  return (
    <div className="wsj-theme min-h-screen flex flex-col">
      <TopBar
        currentRole={role}
        roles={detectedRoles.length > 1 ? detectedRoles : undefined}
      />
      <div className="flex flex-1">
        <Sidebar links={linksForRole(role)} role={role} />
        <main className="flex-1 p-6 lg:p-8 max-w-6xl">
          {children}
        </main>
      </div>
    </div>
  );
}
