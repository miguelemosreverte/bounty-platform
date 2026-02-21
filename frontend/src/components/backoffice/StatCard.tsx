interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  accent?: boolean;
  'data-testid'?: string;
}

export function StatCard({ label, value, sublabel, accent, ...props }: StatCardProps) {
  return (
    <div className="wsj-stat-card" data-testid={props['data-testid']}>
      <div className="text-[10px] font-sans uppercase tracking-[0.15em] text-[var(--color-wsj-muted)] mb-2">
        {label}
      </div>
      <div
        className={`text-2xl font-bold font-sans ${
          accent ? 'text-[var(--color-wsj-accent)]' : 'text-[var(--color-wsj-text)]'
        }`}
      >
        {value}
      </div>
      {sublabel && (
        <div className="text-xs font-sans text-[var(--color-wsj-muted)] mt-1">{sublabel}</div>
      )}
    </div>
  );
}
