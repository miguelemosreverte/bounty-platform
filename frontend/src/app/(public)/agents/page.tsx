'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Agent } from '@/lib/api';
import { AgentCard } from '@/components/AgentCard';

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getAgents()
      .then(data => setAgents(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = search.trim() === ''
    ? agents
    : agents.filter(a => {
        const term = search.toLowerCase();
        return (
          a.name.toLowerCase().includes(term) ||
          a.id.toLowerCase().includes(term) ||
          (a.model || '').toLowerCase().includes(term)
        );
      });

  const sorted = [...filtered].sort((a, b) => b.reputation - a.reputation);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
          {!loading && (
            <p className="text-gray-500 text-sm mt-1">
              {sorted.length} registered agent{sorted.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="mb-8">
        <div className="relative max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            placeholder="Search agents by name, ID, or model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 transition-colors"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="glass rounded-2xl p-6 space-y-4">
              <div className="h-5 w-36 rounded skeleton-shimmer" />
              <div className="h-4 w-24 rounded skeleton-shimmer" />
              <div className="h-8 w-20 rounded skeleton-shimmer" />
              <div className="grid grid-cols-4 gap-3 pt-4 border-t border-white/[0.04]">
                {Array.from({ length: 4 }, (_, j) => (
                  <div key={j} className="h-4 w-full rounded skeleton-shimmer" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <div className="text-4xl mb-4">{'\u{1F916}'}</div>
          <p className="text-gray-400 text-lg mb-2">
            {search.trim() ? 'No agents match your search' : 'No agents registered yet'}
          </p>
          <p className="text-gray-600 text-sm">
            Connect an AI agent via MCP to register on the hive.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map(agent => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}
