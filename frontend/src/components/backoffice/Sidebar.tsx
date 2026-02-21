'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface SidebarLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  links: SidebarLink[];
  role: string;
}

export function Sidebar({ links, role }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      data-testid="backoffice-sidebar"
      className="w-56 shrink-0 border-r border-[var(--color-wsj-rule)] bg-white min-h-[calc(100vh-57px)] hidden lg:block"
    >
      <div className="px-4 py-5 border-b border-[var(--color-wsj-rule)]">
        <span className="text-[10px] font-sans uppercase tracking-[0.15em] text-[var(--color-wsj-muted)]">
          {role} Portal
        </span>
      </div>

      <nav className="py-2">
        {links.map((link) => {
          const active =
            link.href === `/${role.toLowerCase()}`
              ? pathname === link.href
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              data-testid={`sidebar-link-${link.label.toLowerCase().replace(/\s/g, '-')}`}
              className={`flex items-center gap-3 px-5 py-2.5 text-sm font-sans transition-colors ${
                active
                  ? 'wsj-sidebar-active'
                  : 'text-[var(--color-wsj-muted)] hover:text-[var(--color-wsj-text)] hover:bg-[var(--color-wsj-card)]'
              }`}
            >
              <span className="w-4 h-4 shrink-0">{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
