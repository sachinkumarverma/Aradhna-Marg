import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, Server, Database, Clock, ShieldCheck, Settings, CheckCircle2 } from 'lucide-react';

export function AdminSystemHealth() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <div className="space-y-6 flex flex-col min-h-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-orange-50 flex items-center justify-center">
            <Activity className="w-6 h-6 text-saffron" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-wide text-slate-900 flex items-center gap-2 uppercase">
              <Activity className="w-6 h-6 text-saffron" />
              SYSTEM HEALTH
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Real-time status of backend services and database connections
            </p>
          </div>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`flex items-center gap-2 px-4 py-2 bg-saffron text-white rounded-md font-medium hover:bg-golden transition-colors disabled:cursor-not-allowed ${isRefreshing ? 'opacity-80' : ''}`}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          REFRESH
        </button>
      </div>

      {/* Service Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* API Server */}
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-md border border-blue-100 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-blue-50 flex items-center justify-center">
                <Server className="w-5 h-5 text-blue-500" />
              </div>
              <h3 className="font-bold text-slate-800">API Server</h3>
            </div>
            <ShieldCheck className="w-6 h-6 text-green-500" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Status</p>
            <p className="font-bold text-slate-900">Online & Healthy</p>
          </div>
        </div>

        {/* Database (Supabase) */}
        <div className="bg-gradient-to-br from-green-50 to-white rounded-md border border-green-100 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-green-50 flex items-center justify-center">
                <Database className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="font-bold text-slate-800">Database (Supabase)</h3>
            </div>
            <ShieldCheck className="w-6 h-6 text-green-500" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Status</p>
            <p className="font-bold text-slate-900">Connected</p>
          </div>
        </div>

        {/* Server Uptime */}
        <div className="bg-gradient-to-br from-purple-50 to-white rounded-md border border-purple-100 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-purple-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-500" />
              </div>
              <h3 className="font-bold text-slate-800">Server Uptime</h3>
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Duration</p>
            <p className="font-bold text-slate-900">0d 3h 24m 19s</p>
          </div>
        </div>
      </div>

      {/* System Metrics */}
      <div className="bg-gradient-to-br from-gray-50 to-white rounded-md border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center">
            <Settings className="w-5 h-5 text-slate-600" />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">System Metrics</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-slate-500 mb-1">API Version</p>
            <p className="font-semibold text-slate-900">1.0.0</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Server Time</p>
            <p className="font-semibold text-slate-900">{currentTime}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Background Jobs</p>
            <div className="flex items-center gap-1.5 text-green-600 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              Active
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Search Index</p>
            <div className="flex items-center gap-1.5 text-green-600 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              Healthy
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
