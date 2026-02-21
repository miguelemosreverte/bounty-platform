'use client';

import Link from 'next/link';
import { StatusBadge } from './StatusBadge';
import { timeAgo, type Task } from '@/lib/utils';

export function TaskCard({ task }: { task: Task }) {
  const complexityPercent = (task.estimatedComplexity / 10) * 100;

  return (
    <Link href={`/tasks/${task.id}`} className="block group" data-testid={`task-card-${task.id}`}>
      <div className="glass glass-hover rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-mono text-gray-500">#{task.id}</span>
              <StatusBadge status={task.status} />
              {task.language && (
                <span className="text-xs rounded-full bg-white/[0.06] border border-white/[0.08] px-2 py-0.5 text-gray-400">
                  {task.language}
                </span>
              )}
            </div>
            <h3 className="text-base font-semibold text-white group-hover:text-emerald-400 transition-colors duration-300 truncate">
              {task.title}
            </h3>
            {task.createdAt > 0 && (
              <p className="text-xs text-gray-600 mt-1">{timeAgo(task.createdAt)}</p>
            )}
          </div>

          <div className="text-right shrink-0">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-white">{task.rewardAmount}</span>
              <span className="text-sm font-medium text-emerald-400">
                {task.rewardType === 'eth' ? 'ETH' : 'tokens'}
              </span>
            </div>
          </div>
        </div>

        {/* Complexity bar */}
        {task.estimatedComplexity > 0 && (
          <div className="mt-4 mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-500">Complexity</span>
              <span className="text-xs font-mono text-gray-400">{task.estimatedComplexity}/10</span>
            </div>
            <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${complexityPercent}%`,
                  background: complexityPercent <= 30
                    ? '#34d399'
                    : complexityPercent <= 60
                    ? '#fbbf24'
                    : '#f87171',
                }}
              />
            </div>
          </div>
        )}

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 mb-3">
            {task.tags.map(tag => (
              <span key={tag} className="text-[10px] rounded-full bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 text-gray-500">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              {'\u2691'} {task.submissionCount} submission{task.submissionCount !== 1 ? 's' : ''}
            </span>
            {task.claimedBy && (
              <span className="font-mono text-amber-400/60">
                claimed
              </span>
            )}
          </div>
          <span className="text-emerald-400/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-xs">
            View details {'\u2192'}
          </span>
        </div>
      </div>
    </Link>
  );
}
