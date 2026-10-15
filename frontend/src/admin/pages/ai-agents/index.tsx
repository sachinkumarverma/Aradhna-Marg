import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bot, Shield, Calendar, Activity, Sparkles } from 'lucide-react';
import { AgentRunsSection } from '@admin/features/agents/AgentRunsSection';
import { AdminProposals } from '@admin/pages/proposals';

export interface AdminAIAgentsProps {
  defaultTab?: 'overview' | 'runs' | 'proposals';
}

export const AdminAIAgents: React.FC<AdminAIAgentsProps> = ({ defaultTab = 'overview' }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab') as 'overview' | 'runs' | 'proposals' | null;

  const [activeTab, setActiveTab] = useState<'overview' | 'runs' | 'proposals'>(
    urlTab && ['overview', 'runs', 'proposals'].includes(urlTab) ? urlTab : defaultTab
  );

  useEffect(() => {
    if (urlTab && ['overview', 'runs', 'proposals'].includes(urlTab) && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  const handleTabChange = (tab: 'overview' | 'runs' | 'proposals') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="space-y-6 flex flex-col flex-1 pb-8 w-full max-w-full min-w-0">
      {/* Header & Governance Architecture Banner */}
      <div className="space-y-4">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold tracking-wide text-slate-900 flex items-center gap-2 uppercase truncate">
            <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-saffron shrink-0" />
            <span className="truncate">AI AGENTS & GOVERNANCE</span>
          </h1>
          <p className="hidden sm:block text-sm text-gray-500 mt-1">
            Autonomous monitoring for editorial quality, SEO gaps, and system integrity.
          </p>
        </div>

        {/* Mental Model / Governance Notice */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-md p-4 flex items-center gap-3 shadow-2xs">
          <div className="p-2 bg-amber-100 rounded-md text-amber-800 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider bg-amber-200/80 text-amber-950 px-2 py-0.5 rounded">
                Human-Reviewed Execution
              </span>
              <span className="text-xs font-semibold text-amber-900">Tier 1–5 Governance Enforced</span>
            </div>
            <p className="text-xs text-amber-950/80 mt-1">
              Agents operate strictly in read and analyze mode. Discovered issues generate staged proposals for your
              review. No published content is modified until you click Approve.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide gap-1 sm:gap-2">
        {[
          { id: 'overview', label: 'Agents Overview', icon: Calendar },
          { id: 'runs', label: 'Activity & Audit Logs', icon: Activity },
          { id: 'proposals', label: 'Needs Review', icon: Sparkles }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabChange(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold uppercase border-b-2 transition-colors shrink-0 ${
              activeTab === tab.id
                ? 'border-saffron text-saffron'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <AgentRunsSection
          subView="overview"
          onNavigateToProposals={() => handleTabChange('proposals')}
          onNavigateToRuns={() => handleTabChange('runs')}
        />
      )}

      {activeTab === 'runs' && (
        <AgentRunsSection subView="runs" onNavigateToProposals={() => handleTabChange('proposals')} />
      )}

      {activeTab === 'proposals' && <AdminProposals showHeader={false} />}
    </div>
  );
};
