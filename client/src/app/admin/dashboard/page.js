'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BarChart3, 
  Clock, 
  AlertOctagon, 
  ExternalLink,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AppShell from '../../../components/AppShell';
import api from '../../../services/api';

// Simple bar chart component built directly using SVGs/React to guarantee 0 SSR issues and ultra-responsive layout
function SimpleBarChart({ data = [] }) {
  if (data.length === 0) return <div className="text-[11px] text-slate-500 font-mono">No data to parse.</div>;
  const maxVal = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="space-y-3 font-mono text-xs">
      {data.map((item, idx) => {
        const percent = (item.value / maxVal) * 100;
        return (
          <div key={idx} className="space-y-1">
            <div className="flex justify-between text-slate-400">
              <span className="truncate max-w-[150px]">{item.name}</span>
              <span className="font-semibold text-teal-400">{item.value} ({((item.value / data.reduce((a,c) => a + c.value, 0)) * 100).toFixed(0)}%)</span>
            </div>
            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
              <div 
                className="h-full bg-gradient-to-r from-teal-450 to-indigo-500 rounded-full transition-all duration-500" 
                style={{ width: `${percent}%` }}
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    setRefreshing(true);
    try {
      const statsRes = await api.get('/admin/stats');
      const complaintsRes = await api.get('/admin/complaints');
      setStats(statsRes.data.stats);
      setComplaints(complaintsRes.data.complaints || []);
    } catch (err) {
      console.error('Error fetching admin dashboard metrics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'Critical': return 'bg-rose-500/10 text-rose-400 border-rose-900/35';
      case 'High': return 'bg-amber-500/10 text-amber-500 border-amber-900/35';
      case 'Medium': return 'bg-indigo-500/10 text-indigo-400 border-indigo-900/35';
      default: return 'bg-slate-800 text-slate-450 border-slate-700/50';
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Resolved': return 'bg-emerald-500/10 text-emerald-400 border-emerald-990/30';
      case 'Closed': return 'bg-slate-800 text-slate-500 border-slate-700/40';
      case 'In Progress': return 'bg-sky-500/10 text-sky-400 border-sky-900/30';
      case 'Assigned': return 'bg-indigo-500/10 text-indigo-400 border-indigo-900/30';
      case 'Under Review': return 'bg-yellow-500/10 text-yellow-450 border-yellow-905/30';
      case 'Reopened': return 'bg-purple-500/10 text-purple-400 border-purple-900/30';
      default: return 'bg-slate-900 text-slate-400 border-slate-800';
    }
  };

  // Process category stats into chart array
  const categoryChartData = stats?.categoryCounts 
    ? Object.keys(stats.categoryCounts).map(k => ({ name: k, value: stats.categoryCounts[k] }))
    : [];

  const statusChartData = stats?.statusCounts
    ? Object.keys(stats.statusCounts).map(k => ({ name: k, value: stats.statusCounts[k] }))
    : [];

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AppShell>
        <div className="space-y-6 max-w-6xl mx-auto font-sans text-slate-200">
          
          {/* Header section with loading */}
          <div className="flex justify-between items-center bg-slate-900 border border-slate-800/80 p-5 rounded-2xl shadow-xl">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">Security & Triage Console</h1>
              <p className="text-xs text-slate-400 mt-1">Real-time college complaint metrics, department loading, and ticket assignments.</p>
            </div>
            
            <button 
              onClick={loadData}
              disabled={refreshing}
              className="p-2 border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 rounded-lg transition-transform active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-550 font-mono">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-800 border-t-teal-400 mx-auto mb-2"></div>
              Aggregating active stats database...
            </div>
          ) : (
            <>
              {/* KPIs Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-900/80 p-4 rounded-xl shadow-md">
                  <div className="flex justify-between items-center text-slate-500">
                    <span className="text-[11px] font-mono font-semibold uppercase tracking-wider">Total Filed</span>
                    <FolderOpen className="h-4 w-4 text-indigo-400" />
                  </div>
                  <p className="text-2xl font-bold mt-2 text-white">{stats?.total || 0}</p>
                </div>

                <div className="bg-slate-900 border border-slate-900/80 p-4 rounded-xl shadow-md">
                  <div className="flex justify-between items-center text-slate-500">
                    <span className="text-[11px] font-mono font-semibold uppercase tracking-wider">Unassigned</span>
                    <AlertOctagon className="h-4 w-4 text-rose-400 animate-pulse" />
                  </div>
                  <p className="text-2xl font-bold mt-2 text-rose-455">
                    {complaints.filter(c => !c.assigned_to).length}
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-900/80 p-4 rounded-xl shadow-md">
                  <div className="flex justify-between items-center text-slate-500">
                    <span className="text-[11px] font-mono font-semibold uppercase tracking-wider">In Progress</span>
                    <Clock className="h-4 w-4 text-sky-400" />
                  </div>
                  <p className="text-2xl font-bold mt-2 text-white">
                    {complaints.filter(c => c.status === 'Assigned' || c.status === 'In Progress').length}
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-900/80 p-4 rounded-xl shadow-md">
                  <div className="flex justify-between items-center text-slate-500">
                    <span className="text-[11px] font-mono font-semibold uppercase tracking-wider">Avg Resolution</span>
                    <Clock className="h-4 w-4 text-emerald-450" />
                  </div>
                  <p className="text-2xl font-bold mt-2 text-emerald-450">{stats?.averageResolutionTimeHours || 0}h</p>
                </div>
              </div>

              {/* Charts grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tickets by Category */}
                <div className="bg-slate-900 border border-slate-900/80 p-5 rounded-2xl shadow-md">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-350 mb-5 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-teal-400" />
                    LOAD BY CATEGORY
                  </h3>
                  <SimpleBarChart data={categoryChartData} />
                </div>

                {/* Tickets by Status */}
                <div className="bg-slate-900 border border-slate-900/80 p-5 rounded-2xl shadow-md">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-350 mb-5 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-indigo-400" />
                    LOAD BY STATUS
                  </h3>
                  <SimpleBarChart data={statusChartData} />
                </div>
              </div>

              {/* Triage Queue Table */}
              <div className="bg-slate-900 border border-slate-900/80 rounded-2xl shadow-md overflow-hidden flex flex-col min-w-0">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-350">Unified Triage Queue</h3>
                  <span className="text-[10px] text-slate-500 font-mono">Real-time Live Synced ({complaints.length} tickets total)</span>
                </div>

                <div className="overflow-x-auto">
                  {complaints.length === 0 ? (
                    <div className="p-12 text-center text-xs text-slate-500 font-mono">
                      No complaints registered in the database.
                    </div>
                  ) : (
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-805/45 text-slate-450 uppercase font-mono font-semibold bg-slate-950/20">
                          <th className="px-5 py-3">Student & Title</th>
                          <th className="px-5 py-3">Category</th>
                          <th className="px-5 py-3">Location</th>
                          <th className="px-5 py-3">Priority</th>
                          <th className="px-5 py-3">Department Target</th>
                          <th className="px-5 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {complaints.map((item) => (
                          <tr 
                            key={item.id}
                            className="hover:bg-slate-800/25 transition-colors cursor-pointer group"
                            onClick={() => router.push(`/admin/complaints/${item.id}`)}
                          >
                            <td className="px-5 py-3.5">
                              <span className="font-semibold text-slate-200 group-hover:text-teal-400 transition-colors block text-sm max-w-[220px] truncate">{item.title}</span>
                              <span className="text-[10px] text-slate-500 font-mono">BY: {item.student?.name || item.student_id?.name} ({item.student?.email || item.student_id?.email})</span>
                            </td>
                            <td className="px-5 py-3.5 text-slate-400 font-mono font-medium">{item.category}</td>
                            <td className="px-5 py-3.5 text-slate-450 font-mono font-medium">{item.location}</td>
                            <td className="px-5 py-3.5">
                              <span className={`px-2 py-0.5 rounded border text-[10px] font-mono leading-none ${getPriorityStyle(item.priority)}`}>
                                {item.priority}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-slate-405 font-mono text-[11px]">
                              {item.assigned_to?.name ? (
                                <span className="text-teal-450 font-semibold">{item.assigned_to.name}</span>
                              ) : (
                                <span className="text-rose-455 animate-pulse inline-flex items-center gap-1">Unassigned</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <span className={`px-2 py-0.5 rounded border text-[10px] font-mono ${getStatusStyle(item.status)}`}>
                                  {item.status}
                                </span>
                                <ExternalLink className="h-3.5 w-3.5 text-slate-600 group-hover:text-slate-400" />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}

        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
