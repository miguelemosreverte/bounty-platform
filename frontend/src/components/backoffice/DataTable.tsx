'use client';

interface Column<T> {
  key: string;
  header: string;
  render: (row: T, index: number) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  'data-testid'?: string;
}

export function DataTable<T>({ columns, data, emptyMessage = 'No data', ...props }: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="wsj-card p-8 text-center" data-testid={props['data-testid']}>
        <p className="text-sm font-sans text-[var(--color-wsj-muted)]">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="wsj-card overflow-hidden" data-testid={props['data-testid']}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-[var(--color-wsj-rule)]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-[10px] font-sans uppercase tracking-[0.12em] text-[var(--color-wsj-muted)] font-semibold ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr
                key={i}
                className="border-b border-[var(--color-wsj-rule)]/50 last:border-0 hover:bg-[var(--color-wsj-highlight)] transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 font-sans ${col.className || ''}`}>
                    {col.render(row, i)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
