'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  PlusCircle, 
  FileText, 
  Clock, 
  CheckCircle2, 
  ClipboardList, 
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute';
import AppShell from '../../components/AppShell';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    submitted: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0
  });

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await api.get('/complaints/mine');
        const list = response.data.complaints || [];
        setComplaints(list);
        
        // Count metrics
        const counts = { submitted: 0, inProgress: 0, resolved: 0, closed: 0 };
        list.forEach(c => {
          if (c.status === 'Submitted' || c.status === 'Under Review' || c.status === 'Reopened') {
            counts.submitted++;
          } else if (c.status === 'Assigned' || c.status === 'In Progress') {
            counts.inProgress++;
          } else if (c.status === 'Resolved') {
            counts.resolved++;
          } else if (c.status === 'Closed') {
            counts.closed++;
          }
        });
        setMetrics(counts);
      } catch (err) {
        console.error('Error fetching student complaints:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'Critical': return 'bg-rose-500/10 text-rose-455 border-rose-900/30';
      case 'High': return 'bg-amber-500/10 text-amber-450 border-amber-900/30';
      case 'Medium': return 'bg-indigo-500/10 text-indigo-400 border-indigo-900/30';
      default: return 'bg-slate-800 text-slate-400 border-slate-700/50';
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Resolved': return 'bg-emerald-500/10 text-emerald-400 border-emerald-900/30';
      case 'Closed': return 'bg-slate-800 text-slate-500 border-slate-700/40';
      case 'In Progress': return 'bg-sky-500/10 text-sky-400 border-sky-900/30';
      case 'Assigned': return 'bg-indigo-500/10 text-indigo-400 border-indigo-900/30';
      case 'Under Review': return 'bg-yellow-500/10 text-yellow-450 border-yellow-905/30';
      case 'Reopened': return 'bg-purple-500/10 text-purple-400 border-purple-900/30';
      default: return 'bg-slate-900 text-slate-400 border-slate-800';
    }
  };

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <AppShell>
        <div className="space-y-6 max-w-6xl mx-auto font-sans text-slate-200">
          {/* Welcome Jumbotron */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800/80 p-6 rounded-2xl shadow-xl">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Hello, {user?.name}</h1>
              <p className="text-xs text-slate-400 mt-1">Need something repaired or resolved? Submit a ticket and view its timeline below.</p>
            </div>
            <Link 
              href="/complaints/new"
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-450 hover:to-indigo-550 text-white font-semibold rounded-lg text-sm shadow-lg shadow-indigo-950 transition-all hover:scale-[1.01] active:scale-[0.99] font-mono"
            >
              <PlusCircle className="h-4 w-4" />
              FILE COMPLAINT
            </Link>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-900/80 p-4 rounded-xl shadow-md">
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider">Submitted</span>
                <FileText className="h-4 w-4 text-indigo-400" />
              </div>
              <p className="text-2xl font-bold mt-2 text-white">{metrics.submitted}</p>
            </div>

            <div className="bg-slate-900 border border-slate-900/80 p-4 rounded-xl shadow-md">
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider">In Progress</span>
                <Clock className="h-4 w-4 text-sky-400" />
              </div>
              <p className="text-2xl font-bold mt-2 text-white">{metrics.inProgress}</p>
            </div>

            <div className="bg-slate-900 border border-slate-900/80 p-4 rounded-xl shadow-md">
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider">Resolved</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold mt-2 text-white">{metrics.resolved}</p>
            </div>

            <div className="bg-slate-900 border border-slate-900/80 p-4 rounded-xl shadow-md">
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider">Closed</span>
                <ClipboardList className="h-4 w-4 text-slate-400 animate-pulse" />
              </div>
              <p className="text-2xl font-bold mt-2 text-white">{metrics.closed}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Problems Table */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-900/80 rounded-xl shadow-md flex flex-col min-w-0">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-350">Recent Tickets</h3>
                <Link href="/complaints" className="text-xs text-teal-400 hover:underline flex items-center font-mono">
                  View History <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto flex-1">
                {loading ? (
                  <div className="p-12 text-center text-xs text-slate-500 font-mono">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-800 border-t-teal-400 mx-auto mb-2"></div>
                    Retrieving tickets...
                  </div>
                ) : complaints.length === 0 ? (
                  <div className="p-12 text-center text-xs text-slate-500 font-mono">
                    <AlertCircle className="h-8 w-8 text-slate-700 mx-auto mb-2" />
                    You haven&apos;t filed any complaints yet.
                  </div>
                ) : (
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-805/45 text-slate-450 uppercase font-mono font-semibold bg-slate-950/20">
                        <th className="px-4 py-3">Topic</th>
                        <th className="px-4 py-3">Location</th>
                        <th className="px-4 py-3">Priority</th>
                        <th className="px-4 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {complaints.slice(0, 5).map((comp) => (
                        <tr 
                          key={comp.id}
                          className="hover:bg-slate-800/25 transition-colors cursor-pointer group"
                          onClick={() => router.push(`/complaints/${comp.id}`)}
                        >
                          <td className="px-4 py-3.5">
                            <span className="font-semibold text-slate-205 group-hover:text-teal-400 transition-colors block text-sm max-w-[180px] truncate">{comp.title}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{comp.category}</span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-400 font-mono font-medium">{comp.location}</td>
                          <td className="px-4 py-3.5">
                            <span className={`px-2 py-0.5 rounded border text-[10px] font-mono leading-none ${getPriorityStyle(comp.priority)}`}>
                              {comp.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <span className={`px-2 py-0.5 rounded border text-[10px] font-mono ${getStatusStyle(comp.status)}`}>
                              {comp.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Quick Tips or Action Box */}
            <div className="bg-slate-900 border border-slate-900/80 p-5 rounded-xl shadow-md flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500">Resource Desk</span>
                <h4 className="text-sm font-semibold text-white mt-1">CampusFix Operations Flow</h4>
                
                <div className="space-y-3 pt-2">
                  <div className="flex gap-3 text-xs leading-normal">
                    <span className="h-5 w-5 rounded-full bg-slate-950 border border-slate-850 flex items-center justify-center font-mono text-[10px] text-teal-400 shrink-0">1</span>
                    <span className="text-slate-400">File a complaint, details, location, and upload supporting photos.</span>
                  </div>
                  <div className="flex gap-3 text-xs leading-normal">
                    <span className="h-5 w-5 rounded-full bg-slate-950 border border-slate-850 flex items-center justify-center font-mono text-[10px] text-teal-400 shrink-0">2</span>
                    <span className="text-slate-400">Admin reviews and assigns to the right department team.</span>
                  </div>
                  <div className="flex gap-3 text-xs leading-normal">
                    <span className="h-5 w-5 rounded-full bg-slate-950 border border-slate-850 flex items-center justify-center font-mono text-[10px] text-teal-400 shrink-0">3</span>
                    <span className="text-slate-400">Watch the status update in real time; receive instant notifications.</span>
                  </div>
                  <div className="flex gap-3 text-xs leading-normal">
                    <span className="h-5 w-5 rounded-full bg-slate-950 border border-slate-850 flex items-center justify-center font-mono text-[10px] text-teal-400 shrink-0">4</span>
                    <span className="text-slate-400">Once resolved, give stars or reopen if unresolved.</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 border border-slate-850 rounded-xl bg-slate-950/20 text-xs font-mono flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-emerald-450 shrink-0" />
                <span className="text-slate-450">98% of Hostel utilities cleared within 24 hours this week.</span>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
