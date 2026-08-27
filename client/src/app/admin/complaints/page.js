'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, ChevronRight, AlertCircle, RefreshCw, Calendar } from 'lucide-react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AppShell from '../../../components/AppShell';
import api from '../../../services/api';
import { COMPLAINT_CATEGORIES, COMPLAINT_PRIORITIES } from '../../../lib/constants';

export default function AdminComplaintsList() {
  const router = useRouter();
  const [complaints, setComplaints] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeptId, setBulkDeptId] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const [compRes, deptRes] = await Promise.all([
        api.get('/admin/complaints', { params }),
        api.get('/departments')
      ]);
      setComplaints(compRes.data.complaints || []);
      setDepartments(deptRes.data.departments || []);
      setSelectedIds([]);
    } catch (err) {
      console.error('Error fetching admin complaint database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateFrom, dateTo]);

  useEffect(() => {
    let result = [...complaints];

    if (statusFilter !== 'All') {
      result = result.filter(c => c.status === statusFilter);
    }
    if (deptFilter !== 'All') {
      result = result.filter(c => c.assigned_to?.id === deptFilter);
    }
    if (categoryFilter !== 'All') {
      result = result.filter(c => c.category === categoryFilter);
    }
    if (priorityFilter !== 'All') {
      result = result.filter(c => c.priority === priorityFilter);
    }

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(c =>
        c.title?.toLowerCase().includes(term) ||
        c.student?.name?.toLowerCase().includes(term) ||
        c.student_id?.name?.toLowerCase().includes(term) ||
        c.student?.email?.toLowerCase().includes(term) ||
        c.student_id?.email?.toLowerCase().includes(term) ||
        c.location?.toLowerCase().includes(term) ||
        c.category?.toLowerCase().includes(term)
      );
    }

    if (sortOrder === 'newest') {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else {
      result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }

    setFiltered(result);
  }, [complaints, statusFilter, deptFilter, categoryFilter, priorityFilter, searchTerm, sortOrder]);

  const studentName = (item) => item.student?.name || item.student_id?.name || 'Unknown';
  const assignedName = (item) => item.assigned_to?.name;

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = filtered.map((c) => c.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...visibleIds])]);
    }
  };

  const handleBulkAssign = async () => {
    if (!bulkDeptId || selectedIds.length === 0) return;
    setBulkLoading(true);
    try {
      await api.put('/admin/complaints/bulk-assign', {
        complaintIds: selectedIds,
        departmentId: bulkDeptId
      });
      setBulkDeptId('');
      await loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Bulk assignment failed.');
    } finally {
      setBulkLoading(false);
    }
  };

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
      case 'Resolved': return 'bg-emerald-500/10 text-emerald-450 border-emerald-990/30';
      case 'Closed': return 'bg-slate-805 text-slate-500 border-slate-700/40';
      case 'In Progress': return 'bg-sky-500/10 text-sky-400 border-sky-900/30';
      case 'Assigned': return 'bg-indigo-500/10 text-indigo-400 border-indigo-900/30';
      case 'Under Review': return 'bg-yellow-500/10 text-yellow-450 border-yellow-905/30';
      case 'Reopened': return 'bg-purple-500/10 text-purple-400 border-purple-900/30';
      default: return 'bg-slate-900 text-slate-400 border-slate-800';
    }
  };

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((c) => selectedIds.includes(c.id));

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AppShell>
        <div className="space-y-6 max-w-6xl mx-auto font-sans text-slate-200">
          <div className="flex justify-between items-center bg-slate-900 border border-slate-800/80 p-5 rounded-2xl shadow-xl">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Unified Complaints Directory</h1>
              <p className="text-xs text-slate-400 mt-1">Advanced triaging, search, date range, and bulk department assignment.</p>
            </div>
            <button
              onClick={loadData}
              className="p-2 border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 rounded-lg"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-900 border border-slate-800/80 rounded-xl shadow-md">
            <div className="relative md:col-span-2">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search students, titles, locations..."
                className="w-full pl-9 pr-4 py-2 bg-slate-950 text-slate-200 border border-slate-800 rounded-lg text-xs focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Filter className="h-4 w-4" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 text-slate-300 border border-slate-800 rounded-lg text-xs focus:outline-none focus:border-teal-500 appearance-none min-h-[32px]"
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

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Filter className="h-4 w-4" />
              </div>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 text-slate-300 border border-slate-800 rounded-lg text-xs focus:outline-none focus:border-teal-500 appearance-none min-h-[32px]"
              >
                <option value="All">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Filter className="h-4 w-4" />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 text-slate-300 border border-slate-800 rounded-lg text-xs focus:outline-none focus:border-teal-500 appearance-none min-h-[32px]"
              >
                <option value="All">All Categories</option>
                {COMPLAINT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Filter className="h-4 w-4" />
              </div>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 text-slate-300 border border-slate-800 rounded-lg text-xs focus:outline-none focus:border-teal-500 appearance-none min-h-[32px]"
              >
                <option value="All">All Priorities</option>
                {COMPLAINT_PRIORITIES.map((prio) => (
                  <option key={prio} value={prio}>{prio}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Calendar className="h-4 w-4" />
              </div>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 text-slate-300 border border-slate-800 rounded-lg text-xs focus:outline-none focus:border-teal-500 min-h-[32px]"
                title="From date"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Calendar className="h-4 w-4" />
              </div>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 text-slate-300 border border-slate-800 rounded-lg text-xs focus:outline-none focus:border-teal-500 min-h-[32px]"
                title="To date"
              />
            </div>

            <div className="relative md:col-span-2">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 text-slate-300 border border-slate-800 rounded-lg text-xs focus:outline-none focus:border-teal-500 appearance-none min-h-[32px]"
              >
                <option value="newest">Sort: Newest first</option>
                <option value="oldest">Sort: Oldest first</option>
              </select>
            </div>
          </div>

          {selectedIds.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center p-4 bg-indigo-950/30 border border-indigo-900/40 rounded-xl">
              <span className="text-xs font-mono text-indigo-300">{selectedIds.length} selected</span>
              <select
                value={bulkDeptId}
                onChange={(e) => setBulkDeptId(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-950 text-slate-300 border border-slate-800 rounded-lg text-xs focus:outline-none focus:border-teal-500"
              >
                <option value="">Assign to department...</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleBulkAssign}
                disabled={!bulkDeptId || bulkLoading}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg disabled:opacity-50"
              >
                {bulkLoading ? 'Assigning...' : 'Bulk Assign'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="px-3 py-2 text-xs text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg"
              >
                Clear
              </button>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-900/80 rounded-xl overflow-hidden shadow-md">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-550 font-mono">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-850 border-t-teal-400 mx-auto mb-2"></div>
                Retrieving active directory...
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
                      <th className="px-4 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={toggleSelectAllVisible}
                          className="rounded border-slate-700"
                          aria-label="Select all visible"
                        />
                      </th>
                      <th className="px-5 py-3">Incident Reference</th>
                      <th className="px-5 py-3">Category / Site</th>
                      <th className="px-5 py-3">Priority</th>
                      <th className="px-5 py-3">Assigned Desk</th>
                      <th className="px-5 py-3 text-right">Pipeline Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {filtered.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-800/25 transition-colors group"
                      >
                        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(item.id)}
                            onChange={() => toggleSelect(item.id)}
                            className="rounded border-slate-700"
                            aria-label={`Select ${item.title}`}
                          />
                        </td>
                        <td
                          className="px-5 py-3.5 cursor-pointer"
                          onClick={() => router.push(`/admin/complaints/${item.id}`)}
                        >
                          <span className="font-semibold text-slate-205 group-hover:text-teal-400 transition-colors block text-sm max-w-[280px] truncate">{item.title}</span>
                          <div className="flex gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                            <span>ID: {item.id.slice(0, 8)}</span>
                            <span>•</span>
                            <span>BY: {studentName(item)}</span>
                          </div>
                        </td>
                        <td
                          className="px-5 py-3.5 cursor-pointer"
                          onClick={() => router.push(`/admin/complaints/${item.id}`)}
                        >
                          <span className="text-slate-400 font-mono block">{item.location}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{item.category}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2 py-0.5 rounded border text-[10px] font-mono leading-none ${getPriorityStyle(item.priority)}`}>
                            {item.priority}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {assignedName(item) ? (
                            <span className="text-teal-400 font-mono font-semibold">{assignedName(item)}</span>
                          ) : (
                            <span className="text-rose-500 font-mono animate-pulse">Unassigned</span>
                          )}
                        </td>
                        <td
                          className="px-5 py-3.5 text-right cursor-pointer"
                          onClick={() => router.push(`/admin/complaints/${item.id}`)}
                        >
                          <div className="flex items-center justify-end gap-2">
                            <span className={`px-2 py-0.5 rounded border text-[10px] font-mono ${getStatusStyle(item.status)}`}>
                              {item.status}
                            </span>
                            <ChevronRight className="h-4 w-4 text-slate-650 group-hover:text-slate-400 transition-colors" />
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
