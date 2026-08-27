'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, HardDrive, Star, RefreshCcw, ShieldAlert, CheckCircle, Trash2 } from 'lucide-react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AppShell from '../../../components/AppShell';
import StatusTimeline from '../../../components/StatusTimeline';
import api from '../../../services/api';
import { resolveAttachmentUrl } from '../../../lib/constants';

export default function ComplaintDetailsPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const { id } = params;
  const router = useRouter();
  const [complaint, setComplaint] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Forms inputs
  const [rating, setRating] = useState(0);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [reopenComment, setReopenComment] = useState('');
  const [reopenLoading, setReopenLoading] = useState(false);
  const [showReopenForm, setShowReopenForm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchDetails = async () => {
    try {
      const response = await api.get(`/complaints/${id}`);
      setComplaint(response.data.complaint);
      setLogs(response.data.logs || []);
      if (response.data.complaint.rating) {
        setRating(response.data.complaint.rating);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch ticket particulars.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleRate = async (stars) => {
    setRatingLoading(true);
    try {
      await api.post(`/complaints/${id}/rate`, { rating: stars });
      setRating(stars);
      fetchDetails(); // Reload timeline
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit rating.');
    } finally {
      setRatingLoading(false);
    }
  };

  const handleReopen = async (e) => {
    e.preventDefault();
    if (!reopenComment.trim()) return;
    setReopenLoading(true);
    try {
      await api.post(`/complaints/${id}/reopen`, { comment: reopenComment });
      setReopenComment('');
      setShowReopenForm(false);
      fetchDetails(); // Reload page
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reopen ticket.');
    } finally {
      setReopenLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this complaint? This cannot be undone.')) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/complaints/${id}`);
      router.push('/complaints');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete complaint.');
    } finally {
      setDeleteLoading(false);
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
      <ProtectedRoute allowedRoles={['student']}>
        <AppShell>
          <div className="p-12 text-center text-xs text-slate-500 font-mono">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-800 border-t-teal-400 mx-auto mb-2"></div>
            Loading ticket logs...
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (error || !complaint) {
    return (
      <ProtectedRoute allowedRoles={['student']}>
        <AppShell>
          <div className="max-w-md mx-auto p-6 bg-slate-900 border border-slate-800 text-center rounded-xl space-y-4">
            <ShieldAlert className="h-10 w-10 text-rose-500 mx-auto" />
            <h3 className="font-bold text-white text-sm">Error Loading Ticket</h3>
            <p className="text-xs text-slate-400">{error || 'Ticket not found or authorization failed.'}</p>
            <button onClick={() => router.back()} className="text-xs text-teal-400 underline">Go Back</button>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <AppShell>
        <div className="max-w-5xl mx-auto space-y-6 font-sans text-slate-205">
          {/* Top Bar Header */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-909 text-slate-400 hover:text-slate-200"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <p className="text-[10px] text-slate-500 font-mono">Ticket Reference ID: {complaint.id}</p>
              <h1 className="text-lg sm:text-xl font-bold text-white mt-0.5">{complaint.title}</h1>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Details Box */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description Body */}
              <div className="bg-slate-900 border border-slate-900/80 p-6 rounded-xl shadow-md space-y-4">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">Description</span>
                <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{complaint.description}</p>
                
                {complaint.attachments && complaint.attachments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
                    <span className="text-[11px] font-mono text-slate-500 block">SUPPORTING EVIDENCE:</span>
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
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 block mb-6">Status Log & Audit History</span>
                <StatusTimeline logs={logs} />
              </div>
            </div>

            {/* Side Operations Box */}
            <div className="space-y-6">
              {/* Metadata Panel */}
              <div className="bg-slate-900 border border-slate-900/80 p-5 rounded-xl shadow-md space-y-4">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">Ticket Details</span>
                
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between border-b border-slate-805/50 pb-2">
                    <span className="text-slate-500">Current Status:</span>
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${getStatusStyle(complaint.status)}`}>
                      {complaint.status}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-slate-805/50 pb-2">
                    <span className="text-slate-500">Category Tag:</span>
                    <span className="text-slate-300 font-semibold text-right max-w-[150px] truncate">{complaint.category}</span>
                  </div>

                  <div className="flex justify-between border-b border-slate-805/50 pb-2">
                    <span className="text-slate-500">Priority Level:</span>
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${getPriorityStyle(complaint.priority)}`}>
                      {complaint.priority}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-slate-805/50 pb-2">
                    <span className="text-slate-500">Assigned Team:</span>
                    <span className="text-slate-305 font-semibold">{complaint.assigned_to?.name || 'Waiting Triage'}</span>
                  </div>

                  <div className="flex justify-between pb-1">
                    <span className="text-slate-500">Reported Site:</span>
                    <span className="text-slate-300 font-semibold">{complaint.location}</span>
                  </div>
                </div>
              </div>

              {/* Feedback Actions panel (Rate or Reopen) */}
              {complaint.status === 'Resolved' && (
                <div className="bg-slate-900 border border-emerald-900/20 p-5 rounded-xl shadow-md space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-450" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">Ticket Resolution</span>
                  </div>
                  
                  <div className="space-y-3">
                    {complaint.resolution_note && (
                      <div className="p-3 bg-slate-950/65 rounded-lg border border-slate-850 text-xs">
                        <span className="text-[10px] font-mono text-slate-500 block mb-1">REPORTER RESOLUTION NOTE:</span>
                        <p className="text-slate-300">{complaint.resolution_note}</p>
                      </div>
                    )}

                    {/* Stars Selector */}
                    <div>
                      <p className="text-xs text-slate-400 mb-2 leading-relaxed">
                        Are you satisfied with the department resolution? Rate it to close the ticket:
                      </p>
                      <div className="flex gap-2.5">
                        {[1, 2, 3, 4, 5].map((stars) => (
                          <button
                            key={stars}
                            type="button"
                            disabled={ratingLoading}
                            onClick={() => handleRate(stars)}
                            className={`p-1.5 rounded transition-transform active:scale-95 ${
                              stars <= rating ? 'text-amber-450 hover:scale-105' : 'text-slate-700 hover:text-slate-500'
                            }`}
                          >
                            <Star className="h-5 w-5 fill-current" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Delete (only while still Submitted) */}
              {complaint.status === 'Submitted' && (
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
                  <p className="text-[10px] text-slate-500 font-mono mt-2 text-center">
                    Only available before admin review begins.
                  </p>
                </div>
              )}

              {/* Reopen Action Panel */}
              {(complaint.status === 'Resolved' || complaint.status === 'Closed') && (
                <div className="bg-slate-905 border border-slate-900 p-5 rounded-xl shadow-md">
                  {!showReopenForm ? (
                    <button
                      onClick={() => setShowReopenForm(true)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-950 border border-slate-850 hover:border-slate-700 text-xs font-semibold rounded-lg font-mono text-rose-400 transition-all hover:bg-rose-955/10"
                    >
                      <RefreshCcw className="h-3.5 w-3.5" />
                      REOPEN COMPLAINT
                    </button>
                  ) : (
                    <form onSubmit={handleReopen} className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                          Reopen Reason
                        </label>
                        <textarea
                          rows="3"
                          value={reopenComment}
                          onChange={(e) => setReopenComment(e.target.value)}
                          placeholder="State why the issue is still unresolved..."
                          className="w-full px-3 py-2 bg-slate-950 text-slate-300 border border-slate-850 rounded-lg text-xs focus:outline-none focus:border-rose-500"
                          required
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={reopenLoading || !reopenComment.trim()}
                          className="flex-1 py-1.9 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg text-xs transition-colors"
                        >
                          {reopenLoading ? 'Reopening...' : 'Confirm Reopen'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowReopenForm(false)}
                          className="px-3 py-1.9 bg-slate-950 border border-slate-850 text-slate-400 rounded-lg text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
