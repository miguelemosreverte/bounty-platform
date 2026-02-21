'use client';

interface SkeletonProps {
  variant: 'card' | 'table-row' | 'text';
  count?: number;
}

function SkeletonCard() {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-3">
            <div className="h-4 w-12 rounded-full skeleton-shimmer" />
            <div className="h-5 w-16 rounded-full skeleton-shimmer" />
          </div>
          <div className="h-5 w-64 rounded skeleton-shimmer" />
        </div>
        <div className="text-right space-y-2">
          <div className="h-7 w-24 rounded skeleton-shimmer" />
          <div className="h-3 w-20 rounded skeleton-shimmer" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-4">
        <div className="h-3 w-24 rounded skeleton-shimmer" />
        <div className="h-3 w-32 rounded skeleton-shimmer" />
      </div>
    </div>
  );
}

function SkeletonTableRow() {
  return (
    <tr>
      <td className="px-6 py-4"><div className="h-4 w-8 rounded skeleton-shimmer" /></td>
      <td className="px-6 py-4"><div className="h-4 w-28 rounded skeleton-shimmer" /></td>
      <td className="px-6 py-4"><div className="h-5 w-14 rounded-full skeleton-shimmer" /></td>
      <td className="px-6 py-4"><div className="h-4 w-8 rounded skeleton-shimmer" /></td>
      <td className="px-6 py-4"><div className="h-4 w-24 rounded skeleton-shimmer" /></td>
      <td className="px-6 py-4"><div className="h-4 w-12 rounded skeleton-shimmer" /></td>
    </tr>
  );
}

function SkeletonText() {
  return <div className="h-4 w-full rounded skeleton-shimmer" />;
}

export function Skeleton({ variant, count = 1 }: SkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  switch (variant) {
    case 'card':
      return (
        <div className="space-y-4">
          {items.map(i => (
            <SkeletonCard key={i} />
          ))}
        </div>
      );
    case 'table-row':
      return (
        <>
          {items.map(i => (
            <SkeletonTableRow key={i} />
          ))}
        </>
      );
    case 'text':
      return (
        <div className="space-y-2">
          {items.map(i => (
            <SkeletonText key={i} />
          ))}
        </div>
      );
  }
}
