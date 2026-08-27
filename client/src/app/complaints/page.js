'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Filter, ArrowUpDown, ChevronRight, PlusCircle, AlertCircle } from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute';
import AppShell from '../../components/AppShell';
import api from '../../services/api';

export default function StudentComplaintsList() {
  const router = useRouter();
  const [complaints, setComplaints] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter and Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest'); // or 'oldest'

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await api.get('/complaints/mine');
        setComplaints(response.data.complaints || []);
      } catch (err) {
        console.error('Error fetching complaints history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchComplaints();
  }, []);

  useEffect(() => {
    let result = [...complaints];

    // Status filter
    if (statusFilter !== 'All') {
      result = result.filter(c => c.status === statusFilter);
    }

    // Search filter
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.title.toLowerCase().includes(term) || 
        c.location.toLowerCase().includes(term) ||
        c.category.toLowerCase().includes(term)
      );
    }

    // Sort order
    if (sortOrder === 'newest') {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else {
      result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }

    setFiltered(result);
  }, [complaints, statusFilter, searchTerm, sortOrder]);

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'Critical': return 'bg-rose-500/10 text-rose-500 border-rose-900/30';
      case 'High': return 'bg-amber-500/10 text-amber-500 border-amber-900/30';
      case 'Medium': return 'bg-indigo-500/10 text-indigo-400 border-indigo-900/30';
      default: return 'bg-slate-800 text-slate-400 border-slate-700/50';
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Resolved': return 'bg-emerald-500/10 text-emerald-450 border-emerald-990/30';
      case 'Closed': return 'bg-slate-800 text-slate-500 border-slate-700/40';
      case 'In Progress': return 'bg-sky-500/10 text-sky-400 border-sky-900/30';
      case 'Assigned': return 'bg-indigo-500/10 text-indigo-400 border-indigo-900/30';
      case 'Under Review': return 'bg-yellow-500/10 text-yellow-450 border-yellow-900/30';
      case 'Reopened': return 'bg-purple-500/10 text-purple-400 border-purple-900/30';
      default: return 'bg-slate-900 text-slate-400 border-slate-800';
    }
  };

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <AppShell>
        <div className="space-y-6 max-w-6xl mx-auto font-sans text-slate-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Your Incident Log</h1>
              <p className="text-xs text-slate-400 mt-1">Review the status history and details of all tickets submitted by you.</p>
            </div>
            <Link 
              href="/complaints/new"
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-450 hover:to-indigo-550 text-white font-semibold rounded-lg text-sm shadow-md transition-all font-mono"
            >
              <PlusCircle className="h-4 w-4" />
              NEW COMPLAINT
            </Link>
          </div>

          {/* Search and Filters panel */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-900 border border-slate-800/80 rounded-xl shadow-md">
            {/* Search Input */}
            <div className="md:col-span-2 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, location, category..."
                className="w-full pl-9 pr-4 py-2 bg-slate-950 text-slate-205 border border-slate-800 rounded-lg text-xs leading-normal focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Status Select */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Filter className="h-4 w-4" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-1.9 bg-slate-955 text-slate-300 border border-slate-850 rounded-lg text-xs focus:outline-none focus:border-teal-500 appearance-none min-h-[32px]"
              >
                <option value="All">All Statuses</option>
                <option value="Submitted">Submitted</option>
                <option value="Under Review">Under Review</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
                <option value="Reopened">Reopened</option>
              </select>
            </div>

            {/* Sort Toggle */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <ArrowUpDown className="h-4 w-4" />
              </div>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full pl-9 pr-4 py-1.9 bg-slate-955 text-slate-350 border border-slate-850 rounded-lg text-xs focus:outline-none focus:border-teal-500 appearance-none min-h-[32px]"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="oldest">Sort: Oldest First</option>
              </select>
            </div>
          </div>

          {/* Table log list */}
          <div className="bg-slate-900 border border-slate-900/80 rounded-xl overflow-hidden shadow-md">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-500 font-mono">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-850 border-t-teal-400 mx-auto mb-2"></div>
                Loading complaints...
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500 font-mono space-y-2">
                <AlertCircle className="h-8 w-8 text-slate-700 mx-auto" />
                <p>No complaints match your filters or search criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-805/45 text-slate-450 uppercase font-mono font-semibold bg-slate-950/20">
                      <th className="px-5 py-3">Reference/Info</th>
                      <th className="px-5 py-3">Location</th>
                      <th className="px-5 py-3">Priority</th>
                      <th className="px-5 py-3">Assignee</th>
                      <th className="px-5 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {filtered.map((item) => (
                      <tr 
                        key={item.id}
                        className="hover:bg-slate-800/25 transition-colors cursor-pointer group"
                        onClick={() => router.push(`/complaints/${item.id}`)}
                      >
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-slate-205 group-hover:text-teal-400 transition-colors block text-sm max-w-[280px] truncate">{item.title}</span>
                          <div className="flex gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                            <span>ID: {item.id.slice(0, 8)}</span>
                            <span>•</span>
                            <span>{item.category}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-400 font-mono font-medium">{item.location}</td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2 py-0.5 rounded border text-[10px] font-mono leading-none ${getPriorityStyle(item.priority)}`}>
                            {item.priority}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-400 font-mono text-[11px]">
                          {item.assigned_to?.name || 'Unassigned'}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className={`px-2 py-0.5 rounded border text-[10px] font-mono ${getStatusStyle(item.status)}`}>
                              {item.status}
                            </span>
                            <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
