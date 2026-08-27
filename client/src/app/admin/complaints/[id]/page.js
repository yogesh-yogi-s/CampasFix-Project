'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, HardDrive, ShieldAlert, Award, Send, Settings, User, Trash2 } from 'lucide-react';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import AppShell from '../../../../components/AppShell';
import StatusTimeline from '../../../../components/StatusTimeline';
import api from '../../../../services/api';
import { COMPLAINT_CATEGORIES, COMPLAINT_PRIORITIES, resolveAttachmentUrl } from '../../../../lib/constants';

export default function AdminComplaintDetailsPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const { id } = params;
  const router = useRouter();
  const [complaint, setComplaint] = useState(null);
  const [logs, setLogs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState('');
  const [priorityLoading, setPriorityLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchDetails = async () => {
    try {
      const response = await api.get(`/complaints/${id}`);
      setComplaint(response.data.complaint);
      setLogs(response.data.logs || []);
      
      setSelectedDeptId(response.data.complaint.assigned_to?.id || '');
      setSelectedPriority(response.data.complaint.priority || 'Low');
      setSelectedStatus(response.data.complaint.status || 'Submitted');
      setSelectedCategory(response.data.complaint.category || '');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch ticket particulars.');
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data.departments || []);
    } catch (err) {
      console.error('Error loading departments:', err);
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      await Promise.all([fetchDetails(), fetchDepartments()]);
      setLoading(false);
    };
    loadAll();
  }, [id]);

  const handleAssignDept = async (e) => {
    const deptId = e.target.value;
    setSelectedDeptId(deptId);
    if (!deptId) return;

    setAssignLoading(true);
    try {
      await api.put(`/admin/complaints/${id}/assign`, { departmentId: deptId });
      await fetchDetails();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to assign department.');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleUpdatePriority = async (e) => {
    const prio = e.target.value;
    setSelectedPriority(prio);
    setPriorityLoading(true);
    try {
      await api.put(`/admin/complaints/${id}/priority`, { priority: prio });
      await fetchDetails();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update priority.');
    } finally {
      setPriorityLoading(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedStatus) return;

    setStatusLoading(true);
    try {
      await api.put(`/admin/complaints/${id}/status`, {
        status: selectedStatus,
        comment: statusComment,
        resolutionNote: selectedStatus === 'Resolved' ? resolutionNote : undefined
      });
      setStatusComment('');
      setResolutionNote('');
      await fetchDetails();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status.');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleUpdateCategory = async (e) => {
    const category = e.target.value;
    setSelectedCategory(category);
    if (!category) return;

    setAssignLoading(true);
    try {
      await api.put(`/admin/complaints/${id}/category`, { category });
      await fetchDetails();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update category.');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Permanently delete this complaint and all audit logs?')) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/admin/complaints/${id}`);
      router.push('/admin/complaints');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete complaint.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'Critical': return 'bg-rose-500/10 text-rose-400 border-rose-900/35';
      case 'High': return 'bg-amber-500/10 text-amber-505 border-amber-900/35';
      case 'Medium': return 'bg-indigo-500/10 text-indigo-400 border-indigo-900/35';
      default: return 'bg-slate-800 text-slate-450 border-slate-700/50';
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Resolved': return 'bg-emerald-500/10 text-emerald-450 border-emerald-990/30';
      case 'Closed': return 'bg-slate-800 text-slate-500 border-slate-700/40';
      case 'In Progress': return 'bg-sky-500/10 text-sky-400 border-sky-900/30';
      case 'Assigned': return 'bg-indigo-500/10 text-indigo-400 border-indigo-900/30';
      case 'Under Review': return 'bg-yellow-500/10 text-yellow-450 border-yellow-905/30';
      case 'Reopened': return 'bg-purple-500/10 text-purple-400 border-purple-900/30';
      default: return 'bg-slate-900 text-slate-400 border-slate-800';
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <AppShell>
          <div className="p-12 text-center text-xs text-slate-550 font-mono">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-800 border-t-teal-400 mx-auto mb-2"></div>
            Decrypting transaction log...
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (error || !complaint) {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <AppShell>
          <div className="max-w-md mx-auto p-6 bg-slate-900 border border-slate-800 text-center rounded-xl space-y-4">
            <ShieldAlert className="h-10 w-10 text-rose-500 mx-auto animate-pulse" />
            <h3 className="font-bold text-white text-sm">Security Clear Denied</h3>
            <p className="text-xs text-slate-400">{error || 'Ticket not found or authorization failed.'}</p>
            <button onClick={() => router.back()} className="text-xs text-teal-400 underline">Close Terminal Interface</button>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AppShell>
        <div className="max-w-5xl mx-auto space-y-6 font-sans text-slate-205">
          {/* Top Bar Header */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()} 
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-909 text-slate-405 hover:text-slate-200"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <p className="text-[10px] text-slate-500 font-mono">INCIDENT ID KEY: {complaint.id}</p>
              <h1 className="text-lg sm:text-xl font-bold text-white mt-0.5">{complaint.title}</h1>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Details Box */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description Body */}
              <div className="bg-slate-909 border border-slate-900 p-6 rounded-xl shadow-md space-y-4">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-550">Body Transcript</span>
                <p className="text-slate-350 text-sm whitespace-pre-wrap leading-relaxed">{complaint.description}</p>
                
                {complaint.attachments && complaint.attachments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
                    <span className="text-[11px] font-mono text-slate-500 block">SUPPORTING FILE:</span>
                    {complaint.attachments.map((url, idx) => (
                      <a 
                        key={idx}
                        href={resolveAttachmentUrl(url)}
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-slate-950 border border-slate-850 hover:border-slate-700 text-xs text-teal-400 group transition-all"
                      >
                        <HardDrive className="h-3.5 w-3.5" />
                        <span>Download Attachment ({url.split('/').pop()})</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Timeline logs */}
              <div className="bg-slate-900 border border-slate-900/80 p-6 rounded-xl shadow-md space-y-4">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-550 block mb-6">Status Log & Audit History</span>
                <StatusTimeline logs={logs} />
              </div>
            </div>

            {/* Side Operations Box */}
            <div className="space-y-6">
              {/* Triage Controls Panel */}
              <div className="bg-slate-900 border border-slate-900/80 p-5 rounded-xl shadow-md space-y-4">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-550 flex items-center gap-1.5">
                  <Settings className="h-4 w-4 text-teal-400" />
                  Console Settings
                </span>

                <div className="space-y-4">
                  {/* Reporter details */}
                  <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-850 font-mono text-[11px] space-y-1.5">
                    <span className="text-slate-500 uppercase tracking-widest text-[9px] block">Reporter Profile</span>
                    <div className="flex gap-1.5 items-center">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-slate-200 font-semibold">{complaint.student?.name}</span>
                    </div>
                    <span className="text-slate-450 block truncate">{complaint.student?.email}</span>
                    <span className="text-[10px] text-slate-500 block pt-1 border-t border-slate-900">Site: {complaint.location}</span>
                  </div>

                  {/* Priority Select */}
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 font-mono">
                      Priority Level
                    </label>
                    <select
                      value={selectedPriority}
                      onChange={handleUpdatePriority}
                      disabled={priorityLoading}
                      className="w-full px-3 py-1.8 bg-slate-950 text-slate-300 border border-slate-850 rounded-lg text-xs focus:outline-none focus:border-teal-500 min-h-[32px] appearance-none"
                    >
                      {COMPLAINT_PRIORITIES.map((priority) => (
                        <option key={priority} value={priority}>{priority}</option>
                      ))}
                    </select>
                  </div>

                  {/* Department Select */}
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-505 mb-1.5 font-mono">
                      Assigned Department Desk
                    </label>
                    <select
                      value={selectedDeptId}
                      onChange={handleAssignDept}
                      disabled={assignLoading}
                      className="w-full px-3 py-1.8 bg-slate-950 text-slate-300 border border-slate-850 rounded-lg text-xs focus:outline-none focus:border-teal-500 min-h-[32px] appearance-none"
                    >
                      <option value="">-- Unassigned --</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Category Select */}
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-505 mb-1.5 font-mono">
                      Complaint Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={handleUpdateCategory}
                      disabled={assignLoading}
                      className="w-full px-3 py-1.8 bg-slate-950 text-slate-300 border border-slate-850 rounded-lg text-xs focus:outline-none focus:border-teal-500 min-h-[32px] appearance-none"
                    >
                      {COMPLAINT_CATEGORIES.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Status Update Transition form */}
              <div className="bg-slate-900 border border-slate-900/80 p-5 rounded-xl shadow-md space-y-4">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-550 block">Pipeline Status Transfer</span>
                <form onSubmit={handleUpdateStatus} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 font-mono">
                      Next Workflow Status
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full px-3 py-1.8 bg-slate-950 text-slate-350 border border-slate-850 rounded-lg text-xs focus:outline-none focus:border-teal-500 min-h-[32px] appearance-none"
                    >
                      <option value="Under Review">Under Review</option>
                      <option value="Assigned">Assigned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                      <option value="Reopened">Reopened</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 font-mono">
                      Comment / Log Details
                    </label>
                    <textarea
                      rows="3"
                      value={statusComment}
                      onChange={(e) => setStatusComment(e.target.value)}
                      placeholder="Audit log description of change..."
                      className="w-full px-3 py-2 bg-slate-950 text-slate-300 border border-slate-850 rounded-lg text-xs focus:outline-none focus:border-teal-500"
                      required
                    />
                  </div>

                  {selectedStatus === 'Resolved' && (
                    <div className="space-y-1.5 bg-slate-955/50 border border-emerald-900/25 p-3 rounded-lg animate-in slide-in-from-top-1.5 duration-200">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-emerald-450 font-mono">
                        Resolution Note for Student
                      </label>
                      <textarea
                        rows="2"
                        value={resolutionNote}
                        onChange={(e) => setResolutionNote(e.target.value)}
                        placeholder="Detail the work carried out to fix it..."
                        className="w-full px-3 py-2 bg-slate-950 text-slate-300 border border-slate-850 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={statusLoading || !statusComment.trim() || (selectedStatus === 'Resolved' && !resolutionNote.trim())}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-450 hover:to-indigo-550 text-white font-semibold rounded-lg text-xs font-mono shadow-md disabled:opacity-50"
                  >
                    {statusLoading ? 'Updating Pipeline...' : 'LOG PIPELINE CHANGE'}
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>

              {/* Resolution Summary if already rated */}
              {complaint.rating && (
                <div className="bg-slate-905 border border-amber-900/15 p-5 rounded-xl shadow-md space-y-3 font-mono text-xs">
                  <div className="flex gap-2 items-center text-amber-500">
                    <Award className="h-5 w-5" />
                    <span className="font-bold uppercase tracking-wider text-[10px]">Student Feedback logged</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Rating Stars:</span>
                    <span className="text-amber-500 font-semibold">{complaint.rating} / 5</span>
                  </div>
                </div>
              )}

              <div className="bg-slate-900 border border-rose-900/25 p-5 rounded-xl shadow-md">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-950 border border-rose-900/40 hover:bg-rose-950/20 text-xs font-semibold rounded-lg font-mono text-rose-400 transition-all disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {deleteLoading ? 'Deleting...' : 'DELETE COMPLAINT'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
