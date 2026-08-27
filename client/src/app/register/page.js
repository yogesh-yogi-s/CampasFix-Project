'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { UserPlus, ArrowLeft } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export default function RegisterPage() {
  const { register: registerUser, loading } = useAuthStore();
  const router = useRouter();
  const [generalError, setGeneralError] = useState(null);
  const [success, setSuccess] = useState(false);

  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (data) => {
    setGeneralError(null);
    try {
      await registerUser(data.name, data.email, data.password);
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setGeneralError(err.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 font-sans text-slate-100 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-teal-500/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <span className="text-sm font-semibold uppercase font-mono tracking-widest bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent">
            CampusFix Console
          </span>
          <h2 className="text-2xl font-bold mt-2 text-white">Create Account</h2>
          <p className="text-xs text-slate-400 mt-1">Register to start filing campus complaints</p>
        </div>

        {generalError && (
          <div className="p-3 mb-4 rounded-lg bg-rose-950/20 border border-rose-900/30 text-rose-400 text-xs font-mono text-center">
            {generalError}
          </div>
        )}

        {success && (
          <div className="p-3 mb-4 rounded-lg bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 text-xs font-mono text-center">
            Registration successful! Redirecting to login...
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
              Full Name
            </label>
            <input
              type="text"
              {...register('name')}
              placeholder="e.g. Jane Doe"
              className={`w-full px-4 py-2.5 bg-slate-950 text-slate-200 border rounded-lg text-sm transition-all focus:outline-none focus:ring-1 ${
                errors.name 
                  ? 'border-rose-500 focus:ring-rose-500' 
                  : 'border-slate-800 focus:ring-teal-500 focus:border-teal-500'
              }`}
            />
            {errors.name && (
              <p className="text-[11px] text-rose-500 mt-1 font-mono">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
              Email Address
            </label>
            <input
              type="email"
              {...register('email')}
              placeholder="e.g. student@college.edu"
              className={`w-full px-4 py-2.5 bg-slate-950 text-slate-200 border rounded-lg text-sm transition-all focus:outline-none focus:ring-1 ${
                errors.email 
                  ? 'border-rose-500 focus:ring-rose-500' 
                  : 'border-slate-800 focus:ring-teal-500 focus:border-teal-500'
              }`}
            />
            {errors.email && (
              <p className="text-[11px] text-rose-500 mt-1 font-mono">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
              Password
            </label>
            <input
              type="password"
              {...register('password')}
              placeholder="•••••••• (6+ characters)"
              className={`w-full px-4 py-2.5 bg-slate-950 text-slate-200 border rounded-lg text-sm transition-all focus:outline-none focus:ring-1 ${
                errors.password 
                  ? 'border-rose-500 focus:ring-rose-500' 
                  : 'border-slate-800 focus:ring-teal-500 focus:border-teal-500'
              }`}
            />
            {errors.password && (
              <p className="text-[11px] text-rose-500 mt-1 font-mono">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-semibold rounded-lg text-sm transition-all shadow-lg active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Register'}
            <UserPlus className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-6 text-center border-t border-slate-800/80 pt-4">
          <p className="text-xs text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="text-teal-400 font-semibold hover:underline inline-flex items-center gap-0.5">
              <ArrowLeft className="h-3 w-3 mr-0.5" /> Sign in instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
