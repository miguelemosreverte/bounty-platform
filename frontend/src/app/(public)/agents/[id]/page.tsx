'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Agent } from '@/lib/api';
import { timeAgo, formatDate } from '@/lib/utils';

const tierColors: Record<string, string> = {
  trade: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
  bronze: 'text-amber-600 bg-amber-600/10 border-amber-600/20',
  silver: 'text-gray-300 bg-gray-300/10 border-gray-300/20',
  gold: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
};

export default function AgentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [agent, setAgent] = useState<Agent | null>(null);

  useEffect(() => {
    if (id) {
      api.getAgent(id).then(setAgent).catch(console.error);
    }
  }, [id]);

  if (!agent) {
    return (
      <div className="space-y-6">
        <div className="h-4 w-24 rounded skeleton-shimmer" />
        <div className="h-10 w-48 rounded skeleton-shimmer" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="glass rounded-2xl p-6 h-24 skeleton-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  const tierClass = tierColors[agent.tier] || tierColors.trade;

  const stats = [
    { label: 'Token Balance', value: agent.tokenBalance, accent: true },
    { label: 'Tasks Completed', value: agent.tasksCompleted },
    { label: 'Tasks Failed', value: agent.tasksFailed },
    { label: 'Success Rate', value: `${Math.round(agent.successRate * 100)}%` },
    { label: 'Reputation', value: agent.reputation },
    { label: 'Total Earned', value: agent.totalEarned },
    { label: 'Total Spent', value: agent.totalSpent },
  ];

  return (
    <div>
      {/* Back nav */}
      <Link
        href="/agents"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors duration-300 mb-6"
      >
        <span>{'\u2190'}</span> Back to Agents
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold tracking-tight">{agent.name}</h1>
          <span className={`text-xs rounded-full px-3 py-1 font-medium uppercase tracking-wider border ${tierClass}`}>
            {agent.tier}
          </span>
          <span className={`text-xs rounded-full px-2.5 py-0.5 font-medium ${
            agent.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-400'
          }`}>
            {agent.status}
          </span>
        </div>
        <p className="text-sm text-gray-500 font-mono">{agent.id}</p>
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
          {agent.model && <span>Model: {agent.model}</span>}
          <span>Career: {agent.careerPath}</span>
          <span>Source: {agent.source}</span>
        </div>
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
          <span title={formatDate(agent.registeredAt)}>Registered {timeAgo(agent.registeredAt)}</span>
          <span className="text-gray-700">{'\u00B7'}</span>
          <span title={formatDate(agent.lastActiveAt)}>Last active {timeAgo(agent.lastActiveAt)}</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
        {stats.map(stat => (
          <div key={stat.label} className="glass rounded-2xl p-5">
            <div className={`text-2xl font-bold mb-1 ${stat.accent ? 'text-emerald-400' : 'text-white'}`}>
              {stat.value}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
