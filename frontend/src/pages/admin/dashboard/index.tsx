import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Music2, PlaySquare, BrainCircuit, Activity, FileText } from 'lucide-react';
import { StatCard } from '../../../components/admin/StatCard';
import { apiClient } from '../../../api/client';

export const AdminDashboard: React.FC = () => {
  // Mocking the API fetch for UI Foundation
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      // In production, configure interceptors to inject JWT token
      // const res = await apiClient.get('/admin/dashboard/stats', { headers: { Authorization: 'Bearer ...' }});
      // return res.data.data;
      return {
        totalBhajans: 12450,
        published: 12000,
        draft: 450,
        pendingAi: 12,
        failedAi: 0,
        totalCategories: 15,
        totalGods: 24,
        todayViews: 24500,
        monthViews: 850000
      };
    }
  });

  if (isLoading) return <div>Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Platform overview and automation status</p>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Views (Today)" 
          value={new Intl.NumberFormat('en-IN').format(stats?.todayViews || 0)}
          icon={Activity}
          trend={{ value: 12, isPositive: true }}
          colorClassName="bg-blue-100 text-blue-600"
        />
        <StatCard 
          title="Total Bhajans" 
          value={new Intl.NumberFormat('en-IN').format(stats?.totalBhajans || 0)}
          icon={Music2}
          colorClassName="bg-saffron/20 text-saffron"
        />
        <StatCard 
          title="Published Bhajans" 
          value={new Intl.NumberFormat('en-IN').format(stats?.published || 0)}
          icon={FileText}
          colorClassName="bg-green-100 text-green-600"
        />
        <StatCard 
          title="Pending AI Processing" 
          value={stats?.pendingAi || 0}
          icon={BrainCircuit}
          colorClassName="bg-purple-100 text-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Activity Table Mock */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Recent Automation Activity</h3>
          </div>
          <div className="p-0">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 font-medium">Event</th>
                  <th className="px-5 py-3 font-medium">Target</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-5 py-3">YouTube Import</td>
                  <td className="px-5 py-3 font-medium text-gray-900">Hanuman Chalisa Fast</td>
                  <td className="px-5 py-3"><span className="text-green-600 bg-green-50 px-2 py-1 rounded-md text-xs font-medium">Success</span></td>
                  <td className="px-5 py-3 text-gray-500">2 mins ago</td>
                </tr>
                <tr>
                  <td className="px-5 py-3">AI Metadata Gen</td>
                  <td className="px-5 py-3 font-medium text-gray-900">Shiv Tandav Stotram</td>
                  <td className="px-5 py-3"><span className="text-green-600 bg-green-50 px-2 py-1 rounded-md text-xs font-medium">Success</span></td>
                  <td className="px-5 py-3 text-gray-500">15 mins ago</td>
                </tr>
                <tr>
                  <td className="px-5 py-3">PDF Generation</td>
                  <td className="px-5 py-3 font-medium text-gray-900">Achyutam Keshavam</td>
                  <td className="px-5 py-3"><span className="text-yellow-600 bg-yellow-50 px-2 py-1 rounded-md text-xs font-medium">Queued</span></td>
                  <td className="px-5 py-3 text-gray-500">1 hour ago</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* YouTube Sync Status Module */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4">YouTube Automation</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm">Status</span>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-green-500"></span> Active
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm">Last Sync</span>
              <span className="text-sm font-medium text-gray-900">Today, 06:00 AM</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm">Next Scheduled</span>
              <span className="text-sm font-medium text-gray-900">Today, 12:00 PM</span>
            </div>

            <hr className="border-gray-100" />

            <button className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2.5 rounded-lg text-sm font-medium transition-colors border border-gray-200">
              <PlaySquare className="w-4 h-4 text-red-500" />
              Force Incremental Sync
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
