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
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-2xl font-bold tracking-wide text-slate-900 flex items-center gap-2 uppercase truncate">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-saffron shrink-0" />
            <span className="truncate">SYSTEM HEALTH</span>
          </h1>
          <p className="hidden sm:block text-sm text-slate-500 mt-1">
            Real-time status of backend services and database connections
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-saffron text-white rounded-md text-xs sm:text-sm font-semibold hover:bg-golden transition-colors shadow-sm disabled:cursor-not-allowed shrink-0 ${isRefreshing ? 'opacity-80' : ''}`}
        >
          <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>REFRESH</span>
        </button>
      </div>

      {/* Service Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-6">
        {/* API Server */}
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-md border border-blue-100 p-4 sm:p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
                <Server className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
              </div>
              <h3 className="font-bold text-sm sm:text-base text-slate-800">API Server</h3>
            </div>
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-slate-500 mb-0.5 sm:mb-1">Status</p>
            <p className="font-bold text-sm sm:text-base text-slate-900">Online & Healthy</p>
          </div>
        </div>

        {/* Database (Supabase) */}
        <div className="bg-gradient-to-br from-green-50 to-white rounded-md border border-green-100 p-4 sm:p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md bg-green-50 flex items-center justify-center shrink-0">
                <Database className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
              </div>
              <h3 className="font-bold text-sm sm:text-base text-slate-800">Database (Supabase)</h3>
            </div>
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-slate-500 mb-0.5 sm:mb-1">Status</p>
            <p className="font-bold text-sm sm:text-base text-slate-900">Connected</p>
          </div>
        </div>

        {/* Server Uptime */}
        <div className="bg-gradient-to-br from-purple-50 to-white rounded-md border border-purple-100 p-4 sm:p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md bg-purple-50 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
              </div>
              <h3 className="font-bold text-sm sm:text-base text-slate-800">Server Uptime</h3>
            </div>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-slate-500 mb-0.5 sm:mb-1">Duration</p>
            <p className="font-bold text-sm sm:text-base text-slate-900">0d 3h 24m 19s</p>
          </div>
        </div>
      </div>

      {/* System Metrics */}
      <div className="bg-gradient-to-br from-gray-50 to-white rounded-md border border-gray-200 p-4 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-6">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm sm:text-lg">System Metrics</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div>
            <p className="text-xs sm:text-sm text-slate-500 mb-0.5 sm:mb-1">API Version</p>
            <p className="font-semibold text-sm sm:text-base text-slate-900">1.0.0</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-slate-500 mb-0.5 sm:mb-1">Server Time</p>
            <p className="font-semibold text-sm sm:text-base text-slate-900">{currentTime}</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-slate-500 mb-0.5 sm:mb-1">Background Jobs</p>
            <div className="flex items-center gap-1.5 text-green-600 font-semibold text-xs sm:text-sm">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Active
            </div>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-slate-500 mb-0.5 sm:mb-1">Search Index</p>
            <div className="flex items-center gap-1.5 text-green-600 font-semibold text-xs sm:text-sm">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Healthy
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
