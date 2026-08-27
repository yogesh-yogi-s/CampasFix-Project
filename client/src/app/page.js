'use client';

import Link from 'next/link';
import { ArrowRight, Shield, Award, Calendar, CheckSquare } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden select-none">
      {/* Background radial glow */}
      <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full bg-gradient-to-r from-teal-500/10 to-indigo-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full bg-gradient-to-r from-indigo-500/10 to-teal-500/10 blur-[120px] pointer-events-none"></div>

      {/* Main Header / Title Bar */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-slate-900 bg-slate-900/40 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold bg-gradient-to-r from-teal-400 to-indigo-500 bg-clip-text text-transparent tracking-wider">
            CampusFix
          </span>
          <span className="text-[10px] bg-slate-800 text-teal-400 font-mono px-1.5 py-0.5 rounded border border-teal-950">
            Console Active
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link 
            href="/login" 
            className="text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors"
          >
            Terminal Login
          </Link>
        </div>
      </header>

      {/* Main Page Area */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto px-6 py-12 text-center relative z-10">
        <span className="text-xs uppercase bg-teal-950/40 border border-teal-900 text-teal-400 px-3.5 py-1 rounded-full font-mono font-semibold tracking-widest animate-pulse mb-6">
          System Overview
        </span>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-6 leading-tight">
          Transparent, Fast College <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-indigo-500 bg-clip-text text-transparent">
            Issue Resolution Pipeline
          </span>
        </h1>

        <p className="max-w-2xl text-slate-400 text-sm sm:text-base leading-relaxed mb-10">
          CampusFix bridges the gap between student issues and facilities departments.
          Report classrooms, laboratories, hostels, Wi-Fi, transportation, or cleaning issues,
          and track progress through an immutable audit trail in real time.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md mb-16">
          <Link
            href="/register"
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-450 hover:to-indigo-550 text-white font-semibold rounded-xl text-sm transition-all shadow-xl active:scale-[0.98]"
          >
            Create Student Ticket
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-slate-200 font-semibold rounded-xl text-sm transition-all active:scale-[0.98]"
          >
            Access Core Dashboard
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full">
          <div className="bg-slate-900/60 border border-slate-900 p-5 rounded-xl text-left hover:border-slate-800 transition-all group">
            <CheckSquare className="h-6 w-6 text-teal-400 mb-3 group-hover:scale-110 transition-transform" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono mb-1">Audit Timelines</h4>
            <p className="text-[11px] text-slate-500 leading-normal">Full timeline trace of reviews, assignments, and status updates.</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-900 p-5 rounded-xl text-left hover:border-slate-800 transition-all group">
            <Shield className="h-6 w-6 text-indigo-400 mb-3 group-hover:scale-110 transition-transform" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono mb-1">Role Security</h4>
            <p className="text-[11px] text-slate-500 leading-normal">Granular role separation between students, department staff, and admins.</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-900 p-5 rounded-xl text-left hover:border-slate-800 transition-all group">
            <Calendar className="h-6 w-6 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono mb-1">Live updates</h4>
            <p className="text-[11px] text-slate-500 leading-normal">In-app notifications pushed through Socket.IO real-time subscriptions.</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-900 p-5 rounded-xl text-left hover:border-slate-800 transition-all group">
            <Award className="h-6 w-6 text-amber-400 mb-3 group-hover:scale-110 transition-transform" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono mb-1">Resolution Ratings</h4>
            <p className="text-[11px] text-slate-500 leading-normal">Close loop by letting students review and rate actions before closing.</p>
          </div>
        </div>
      </main>

      {/* Console Bottom Bar */}
      <footer className="h-10 border-t border-slate-900/80 px-6 flex items-center justify-between text-[11px] text-slate-650 bg-slate-950 font-mono z-10">
        <span>CampusFix Console v1.0.0</span>
        <span>SYSTEM LEVEL: SECURE</span>
      </footer>
    </div>
  );
}
