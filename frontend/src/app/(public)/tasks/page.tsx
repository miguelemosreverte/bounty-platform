'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Task } from '@/lib/api';
import { TaskCard } from '@/components/TaskCard';

const statusFilters = ['all', 'open', 'claimed', 'review', 'closed'] as const;

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    api.getTasks({ limit: 100 })
      .then(data => setTasks(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Filter by status
  const statusFiltered = filter === 'all'
    ? tasks
    : tasks.filter(t => t.status === filter);

  // Search by title or language
  const searched = search.trim() === ''
    ? statusFiltered
    : statusFiltered.filter(t => {
        const term = search.toLowerCase();
        return (
          t.title.toLowerCase().includes(term) ||
          (t.language || '').toLowerCase().includes(term) ||
          (t.tags || []).some(tag => tag.toLowerCase().includes(term))
        );
      });

  // Sort
  const sorted = [...searched].sort((a, b) => {
    switch (sort) {
      case 'oldest':
        return a.createdAt - b.createdAt;
      case 'highest':
        return Number(b.rewardAmount) - Number(a.rewardAmount);
      case 'complex':
        return b.estimatedComplexity - a.estimatedComplexity;
      case 'submissions':
        return b.submissionCount - a.submissionCount;
      case 'newest':
      default:
        return b.createdAt - a.createdAt;
    }
  });

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'highest', label: 'Highest Reward' },
    { value: 'complex', label: 'Most Complex' },
    { value: 'submissions', label: 'Most Submissions' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          {!loading && (
            <p className="text-gray-500 text-sm mt-1">
              {sorted.length} {filter === 'all' ? 'total' : filter} task{sorted.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Search & Sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            placeholder="Search by title, language, or tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="tasks-search"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 transition-colors"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          data-testid="tasks-sort"
          className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 focus:outline-none focus:border-emerald-500/50 cursor-pointer appearance-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239ca3af' d='M3 4.5L6 7.5 9 4.5'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
            paddingRight: '36px',
          }}
        >
          {sortOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {statusFilters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            data-testid={`tasks-filter-${f}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300 ${
              filter === f
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-gray-400 border border-white/[0.06] hover:border-white/10 hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="glass rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-4 w-12 rounded-full skeleton-shimmer" />
                <div className="h-5 w-16 rounded-full skeleton-shimmer" />
              </div>
              <div className="h-5 w-48 rounded skeleton-shimmer" />
              <div className="h-8 w-28 rounded skeleton-shimmer" />
              <div className="h-1 w-full rounded-full skeleton-shimmer" />
            </div>
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <div className="text-4xl mb-4">{'\u2205'}</div>
          <p className="text-gray-400 text-lg mb-2">
            {search.trim()
              ? 'No tasks match your search'
              : filter === 'all'
                ? 'No tasks yet'
                : `No ${filter} tasks`}
          </p>
          <p className="text-gray-600 text-sm">
            {search.trim()
              ? 'Try a different search term or clear your filters.'
              : 'Create a task via the API or connect an MCP agent.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
