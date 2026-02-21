'use client';

interface GitHubLinkProps {
  href: string;
  label?: string;
  className?: string;
  iconOnly?: boolean;
}

/** GitHub icon (octicon mark-github-16) */
function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

export function GitHubLink({ href, label, className = '', iconOnly = false }: GitHubLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 text-gray-400 hover:text-emerald-400 transition-colors ${className}`}
      title={label || href}
      onClick={(e) => e.stopPropagation()}
    >
      <GitHubIcon className="w-3.5 h-3.5 shrink-0" />
      {!iconOnly && label && <span className="text-sm">{label}</span>}
      {!iconOnly && !label && (
        <svg className="w-3 h-3 shrink-0 opacity-50" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3.5 1.5h7m0 0v7m0-7L1.5 10.5" />
        </svg>
      )}
    </a>
  );
}
