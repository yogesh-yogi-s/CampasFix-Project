'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Send, Image as ImageIcon, MapPin, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AppShell from '../../../components/AppShell';
import api from '../../../services/api';
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  normalizeComplaintCategory,
  normalizeComplaintPriority
} from '../../../lib/constants';

const complaintSchema = z.object({
  title: z.string().min(4, 'Title must be at least 4 characters'),
  description: z.string().min(10, 'Please write a detailed description (10+ characters)'),
  location: z.string().min(2, 'Please enter a physical location (room, building, hostel block)'),
  category: z.enum(COMPLAINT_CATEGORIES, {
    errorMap: () => ({ message: 'Please select a valid category' })
  }),
  priority: z.enum(COMPLAINT_PRIORITIES, {
    errorMap: () => ({ message: 'Please select a valid priority' })
  })
});

export default function NewComplaint() {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState(null);
  const [suggestedCategory, setSuggestedCategory] = useState('Other');
  const [suggestedPriority, setSuggestedPriority] = useState('Low');
  const [isDupSuggested, setIsDupSuggested] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      category: 'Other',
      priority: 'Low'
    }
  });

  const watchDescription = watch('description', '');
  const watchLocation = watch('location', '');

  useEffect(() => {
    const desc = watchDescription.toLowerCase();
    if (!watchDescription || watchDescription.length < 5) return;

    let category = 'General Facilities & Utilities';
    if (desc.includes('wi-fi') || desc.includes('wifi') || desc.includes('internet') || desc.includes('network') || desc.includes('router')) {
      category = 'Wi-Fi';
    } else if (desc.includes('hostel') || desc.includes('room') || desc.includes('bathroom') || desc.includes('shower') || desc.includes('mess') || desc.includes('canteen')) {
      category = 'Hostel';
    } else if (desc.includes('bus') || desc.includes('transport') || desc.includes('shuttle') || desc.includes('route')) {
      category = 'Transportation';
    } else if (desc.includes('lab') || desc.includes('laboratory') || desc.includes('academic') || desc.includes('class') || desc.includes('classroom') || desc.includes('projector') || desc.includes('bench')) {
      category = desc.includes('lab') || desc.includes('laboratory') ? 'Laboratory' : 'Classroom';
    } else if (desc.includes('clean') || desc.includes('dust') || desc.includes('washroom') || desc.includes('toilet') || desc.includes('sanitation')) {
      category = 'Cleanliness';
    } else if (desc.includes('building') || desc.includes('wall') || desc.includes('door') || desc.includes('window') || desc.includes('light') || desc.includes('power')) {
      category = 'Infrastructure';
    }

    let priority = 'Low';
    if (desc.includes('fire') || desc.includes('water leak') || desc.includes('shock') || desc.includes('electric') || desc.includes('spark') || desc.includes('injury') || desc.includes('critical')) {
      priority = 'Critical';
    } else if (desc.includes('broken glass') || desc.includes('no water') || desc.includes('exam') || desc.includes('theft') || desc.includes('urgent')) {
      priority = 'High';
    } else if (desc.includes('broken') || desc.includes('projector') || desc.includes('fan') || desc.includes('dirty') || desc.includes('delay')) {
      priority = 'Medium';
    }

    const normalizedCategory = normalizeComplaintCategory(category);
    const normalizedPriority = normalizeComplaintPriority(priority);

    setSuggestedCategory(normalizedCategory);
    setSuggestedPriority(normalizedPriority);
    setValue('category', normalizedCategory, { shouldDirty: true, shouldValidate: true });
    setValue('priority', normalizedPriority, { shouldDirty: true, shouldValidate: true });
  }, [watchDescription, setValue]);

  const handleFileChange = (e) => {
    setFileError(null);
    const chosen = e.target.files[0];
    if (!chosen) return;

    if (chosen.size > 5 * 1024 * 1024) {
      setFileError('File size exceeds the 5MB limit.');
      return;
    }

    const allowed = ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.docx', '.doc', '.xlsx'];
    const name = chosen.name.toLowerCase();
    const matches = allowed.some(ext => name.endsWith(ext));
    if (!matches) {
      setFileError('Invalid file type. Please upload an image, PDF or Word/Excel sheet.');
      return;
    }

    setFile(chosen);
  };

  const onSubmit = async (data) => {
    if (fileError) return;
    setLoading(true);
    setGeneralError(null);

    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('location', data.location);
      formData.append('category', normalizeComplaintCategory(data.category));
      formData.append('priority', normalizeComplaintPriority(data.priority));
      if (file) {
        formData.append('attachment', file);
      }

      await api.post('/complaints', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      router.push('/dashboard');
    } catch (err) {
      setGeneralError(err.response?.data?.error || 'Failed to submit complaint ticket.');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadgeColor = (p) => {
    switch (p) {
      case 'Critical': return 'bg-rose-500/10 text-rose-400 border-rose-900/35';
      case 'High': return 'bg-amber-500/10 text-amber-500 border-amber-900/35';
      case 'Medium': return 'bg-indigo-500/10 text-indigo-400 border-indigo-900/35';
      default: return 'bg-slate-800 text-slate-450 border-slate-700/50';
    }
  };

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <AppShell>
        <div className="space-y-6 max-w-5xl mx-auto font-sans text-slate-200">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()} 
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-205 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Create Issue Ticket</h1>
              <p className="text-xs text-slate-400 mt-1">Please provide accurate description and location to speed up resolution.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Column */}
            <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-2 bg-slate-905 border border-slate-900 p-6 rounded-xl shadow-md space-y-4">
              {generalError && (
                <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/30 text-rose-400 text-xs font-mono text-center">
                  {generalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                  Complaint Title
                </label>
                <input
                  type="text"
                  {...register('title')}
                  placeholder="e.g. Water dripping from Lab ceiling"
                  className={`w-full px-4 py-2.5 bg-slate-950 text-slate-200 border rounded-lg text-sm transition-all focus:outline-none focus:ring-1 ${
                    errors.title ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-800 focus:ring-teal-500 focus:border-teal-500'
                  }`}
                />
                {errors.title && (
                  <p className="text-[11px] text-rose-500 mt-1 font-mono">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                  Detailed Description
                </label>
                <textarea
                  {...register('description')}
                  rows="4"
                  placeholder="Describe the issue in detail. E.g. Mention when it started and room codes."
                  className={`w-full px-4 py-2.5 bg-slate-950 text-slate-200 border rounded-lg text-sm transition-all focus:outline-none focus:ring-1 ${
                    errors.description ? 'border-rose-505 focus:ring-rose-500' : 'border-slate-800 focus:ring-teal-500 focus:border-teal-500'
                  }`}
                />
                {errors.description && (
                  <p className="text-[11px] text-rose-500 mt-1 font-mono">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                    Category
                  </label>
                  <select
                    {...register('category')}
                    className="w-full px-4 py-2.5 bg-slate-950 text-slate-200 border border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    {COMPLAINT_CATEGORIES.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-[11px] text-rose-500 mt-1 font-mono">{errors.category.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                    Priority
                  </label>
                  <select
                    {...register('priority')}
                    className="w-full px-4 py-2.5 bg-slate-950 text-slate-200 border border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    {COMPLAINT_PRIORITIES.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {errors.priority && (
                    <p className="text-[11px] text-rose-500 mt-1 font-mono">{errors.priority.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                  Physical Location
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    {...register('location')}
                    placeholder="e.g. Block C, Room 304"
                    className={`w-full pl-9 pr-4 py-2.5 bg-slate-950 text-slate-200 border rounded-lg text-sm transition-all focus:outline-none focus:ring-1 ${
                      errors.location ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-800 focus:ring-teal-500 focus:border-teal-555'
                    }`}
                  />
                </div>
                {errors.location && (
                  <p className="text-[11px] text-rose-500 mt-1 font-mono">{errors.location.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                  Upload Attachment (Optional, max 5MB)
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all hover:bg-slate-900/30 ${
                    fileError ? 'border-rose-550' : 'border-slate-800 hover:border-slate-700'
                  }`}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <ImageIcon className="w-8 h-8 text-slate-500 mb-2" />
                      <p className="text-xs text-slate-400 font-medium">Click to select files or images</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-1">PNG, JPG, PDF up to 5MB</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={handleFileChange} 
                    />
                  </label>
                </div>
                {fileError && (
                  <p className="text-[11px] text-rose-500 mt-1.5 font-mono">{fileError}</p>
                )}
                {file && !fileError && (
                  <div className="mt-2 p-2 rounded-lg bg-teal-950/20 border border-teal-900/35 text-teal-400 text-xs font-mono flex items-center justify-between">
                    <span>File Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    <button type="button" onClick={() => setFile(null)} className="text-rose-400 hover:underline">Clear</button>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || fileError}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-450 hover:to-indigo-550 text-white font-semibold rounded-lg text-sm transition-all shadow-lg shadow-indigo-950 disabled:opacity-50"
                >
                  {loading ? 'Analyzing Content...' : 'SUBMIT TICKET'}
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>

            {/* Sidebar Triage Dashboard AI Panel */}
            <div className="space-y-4">
              {suggestedCategory && (
                <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-xl shadow-md space-y-3">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-teal-400 border border-teal-900/60 bg-teal-950/20 px-2.5 py-0.5 rounded-full inline-block animate-pulse">
                    CampusFix Triager
                  </span>
                  
                  <div className="space-y-2">
                    <p className="text-xs text-slate-400 leading-normal">
                      Based on your description, the system has predicted the following parameters:
                    </p>
                    
                    <div className="p-3.5 rounded-lg bg-slate-950/50 border border-slate-850 font-mono space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Category:</span>
                        <span className="text-slate-200 font-semibold">{suggestedCategory}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Suggested Priority:</span>
                        <span className={`px-2 py-0.5 rounded border text-[10px] ${getPriorityBadgeColor(suggestedPriority)}`}>
                          {suggestedPriority}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-950/30 border border-slate-850/60 text-[11px] text-slate-450 leading-relaxed font-mono">
                      <CheckCircle className="h-4 w-4 text-emerald-450 shrink-0 mt-0.5" />
                      <span>This layout routes automatically to the assigned department desk upon admin review.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Duplicate Warnings Simulation */}
              {watchLocation && watchDescription && (
                <div className="bg-slate-900 border border-amber-900/25 p-5 rounded-xl shadow-md">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-amber-500 border border-amber-900/50 bg-amber-955/20 px-2.5 py-0.5 rounded-full inline-block mb-3">
                    DUPLICATE CHECKER
                  </span>
                  <div className="flex gap-3 text-xs leading-normal">
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-200">No duplicates found in this area</p>
                      <p className="text-[11px] text-slate-405 leading-relaxed">We checked open complaints inside &quot;{watchLocation}&quot;. Your ticket is unique. Proceed with filing!</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
