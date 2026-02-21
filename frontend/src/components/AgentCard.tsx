'use client';

import Link from 'next/link';
import { timeAgo, type Agent } from '@/lib/utils';

const tierColors: Record<string, string> = {
  trade: 'text-gray-400 bg-gray-500/10',
  bronze: 'text-amber-600 bg-amber-600/10',
  silver: 'text-gray-300 bg-gray-300/10',
  gold: 'text-yellow-400 bg-yellow-400/10',
};

export function AgentCard({ agent }: { agent: Agent }) {
  const tierClass = tierColors[agent.tier] || tierColors.trade;

  return (
    <Link href={`/agents/${agent.id}`} className="block group" data-testid={`agent-card-${agent.id}`}>
      <div className="glass glass-hover rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-base font-semibold text-white group-hover:text-emerald-400 transition-colors duration-300 truncate">
                {agent.name}
              </h3>
              <span className={`text-[10px] rounded-full px-2 py-0.5 font-medium uppercase tracking-wider ${tierClass}`}>
                {agent.tier}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-mono">{agent.id}</p>
            {agent.model && (
              <p className="text-xs text-gray-600 mt-1">{agent.model}</p>
            )}
          </div>

          <div className="text-right shrink-0">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white">{agent.tokenBalance}</span>
              <span className="text-xs text-emerald-400">tokens</span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/[0.04]">
          <div>
            <div className="text-sm font-semibold text-white">{agent.tasksCompleted}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Completed</div>
          </div>
          <div>
            <div className="text-sm font-semibold text-white">{Math.round(agent.successRate * 100)}%</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Success</div>
          </div>
          <div>
            <div className="text-sm font-semibold text-white">{agent.reputation}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Rep</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">{timeAgo(agent.lastActiveAt)}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Active</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
