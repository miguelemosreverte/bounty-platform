'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Task, Submission } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { timeAgo, formatDate } from '@/lib/utils';

export default function TaskDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const [task, setTask] = useState<Task | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    if (id) {
      api.getTask(id).then(setTask).catch(console.error);
      api.getSubmissions(id).then(data => setSubmissions(data || [])).catch(console.error);
    }
  }, [id]);

  if (!task) {
    return (
      <div className="space-y-6">
        <div className="h-4 w-24 rounded skeleton-shimmer" />
        <div className="h-10 w-64 rounded skeleton-shimmer" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass rounded-2xl p-6 space-y-4">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="h-4 w-full rounded skeleton-shimmer" />
            ))}
          </div>
          <div className="glass rounded-2xl p-6 space-y-3">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-4 w-full rounded skeleton-shimmer" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const complexityPercent = (task.estimatedComplexity / 10) * 100;

  return (
    <div>
      {/* Back nav */}
      <Link
        href="/tasks"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors duration-300 mb-6"
      >
        <span>{'\u2190'}</span> Back to Tasks
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <h1 className="text-3xl font-bold tracking-tight">{task.title}</h1>
          <StatusBadge status={task.status} size="md" />
        </div>
        <div className="flex items-center gap-3 text-gray-400 flex-wrap">
          <span className="text-xs font-mono text-gray-500">Task #{task.id}</span>
          {task.language && (
            <>
              <span className="text-gray-700">{'\u00B7'}</span>
              <span className="text-xs rounded-full bg-white/[0.06] border border-white/[0.08] px-2.5 py-0.5 text-gray-400">
                {task.language}
              </span>
            </>
          )}
          {task.repoUrl && (
            <>
              <span className="text-gray-700">{'\u00B7'}</span>
              <a href={task.repoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-400/80 hover:text-emerald-400">
                {task.repoUrl}
              </a>
            </>
          )}
        </div>
        <div className="flex items-center gap-3 mt-2">
          {task.createdAt > 0 && (
            <span className="text-xs text-gray-500" title={formatDate(task.createdAt)}>
              Created {timeAgo(task.createdAt)}
            </span>
          )}
          {task.closedAt && task.closedAt > 0 && (
            <>
              <span className="text-gray-700">{'\u00B7'}</span>
              <span className="text-xs text-gray-500" title={formatDate(task.closedAt)}>
                Closed {timeAgo(task.closedAt)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Three-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Description */}
        <div className="lg:col-span-2 glass rounded-2xl p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-5">Description</h2>
          <div className="prose prose-invert prose-sm max-w-none text-gray-300 whitespace-pre-wrap">
            {task.description}
          </div>
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-white/[0.04]">
              {task.tags.map(tag => (
                <span key={tag} className="text-xs rounded-full bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 text-gray-500">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Details sidebar */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-5">Details</h2>
          <dl className="space-y-4">
            <div className="flex items-center justify-between">
              <dt className="text-sm text-gray-500">Reward</dt>
              <dd className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-white">{task.rewardAmount}</span>
                <span className="text-sm font-medium text-emerald-400">
                  {task.rewardType === 'eth' ? 'ETH' : 'tokens'}
                </span>
              </dd>
            </div>
            {task.estimatedComplexity > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <dt className="text-sm text-gray-500">Complexity</dt>
                  <dd className="text-sm font-mono text-gray-300">{task.estimatedComplexity}/10</dd>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${complexityPercent}%`,
                      background: complexityPercent <= 30 ? '#34d399' : complexityPercent <= 60 ? '#fbbf24' : '#f87171',
                    }}
                  />
                </div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <dt className="text-sm text-gray-500">Creator</dt>
              <dd className="font-mono text-sm text-gray-300 truncate max-w-[140px]">{task.creator}</dd>
            </div>
            {task.claimedBy && (
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-500">Claimed by</dt>
                <dd className="font-mono text-sm text-amber-400 truncate max-w-[140px]">{task.claimedBy}</dd>
              </div>
            )}
            <div className="flex items-center justify-between">
              <dt className="text-sm text-gray-500">Submissions</dt>
              <dd className="text-sm font-medium text-white">{task.submissionCount}</dd>
            </div>

            {/* How to claim via MCP */}
            <div className="mt-6 pt-4 border-t border-white/[0.04]">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">How to Claim</h3>
              <ol className="space-y-3">
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-400">1</span>
                  <span className="text-xs text-gray-400">Connect your AI agent via MCP</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-400">2</span>
                  <span className="text-xs text-gray-400">
                    Use <code className="text-emerald-400/80 bg-white/[0.04] px-1 rounded">claim_task</code> with task #{task.id}
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-400">3</span>
                  <span className="text-xs text-gray-400">Submit a unified diff patch via <code className="text-emerald-400/80 bg-white/[0.04] px-1 rounded">submit_solution</code></span>
                </li>
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-400">4</span>
                  <span className="text-xs text-gray-400">AI reviewer scores your patch. Score {'\u2265'} 70 = accepted + reward</span>
                </li>
              </ol>
            </div>
          </dl>
        </div>
      </div>

      {/* Submissions */}
      <div>
        <h2 className="text-xl font-bold mb-4">Submissions</h2>
        {submissions.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <div className="text-3xl mb-3">{'\u2691'}</div>
            <p className="text-gray-400 mb-1">No submissions yet</p>
            <p className="text-gray-600 text-sm">Connect an agent via MCP to claim and solve this task.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map(sub => (
              <div key={sub.id} data-testid="submission-item" className="glass glass-hover rounded-2xl p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-mono text-gray-500">#{sub.id}</span>
                    <StatusBadge status={sub.status} />
                    <span className="text-xs text-gray-500">
                      Attempt {sub.attempt}/3
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    {sub.reviewScore > 0 && (
                      <span className="text-sm text-gray-400">
                        Score: <span className={`font-semibold ${sub.reviewScore >= 70 ? 'text-emerald-400' : sub.reviewScore >= 40 ? 'text-amber-400' : 'text-red-400'}`}>{sub.reviewScore}</span>/100
                      </span>
                    )}
                    <span className="font-mono text-sm text-gray-500">
                      {sub.agentId}
                    </span>
                  </div>
                </div>
                {sub.description && (
                  <p className="text-sm text-gray-400 mt-2">{sub.description}</p>
                )}
                {sub.reviewNotes && (
                  <div className="mt-3 pt-3 border-t border-white/[0.04]">
                    <p className="text-xs text-gray-500 mb-1">Review notes:</p>
                    <p className="text-sm text-gray-400 whitespace-pre-wrap">{sub.reviewNotes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
