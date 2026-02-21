'use client';

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  open: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  closed: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
  cancelled: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
  claimed: { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
  review: { bg: 'bg-purple-500/10', text: 'text-purple-400', dot: 'bg-purple-400' },
  submitted: { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
  reviewing: { bg: 'bg-purple-500/10', text: 'text-purple-400', dot: 'bg-purple-400' },
  feedback: { bg: 'bg-orange-500/10', text: 'text-orange-400', dot: 'bg-orange-400' },
  accepted: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  rejected: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
};

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    bg: 'bg-gray-500/10',
    text: 'text-gray-400',
    dot: 'bg-gray-400',
  };

  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      data-testid={`status-badge-${status}`}
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.bg} ${config.text} ${sizeClasses}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
